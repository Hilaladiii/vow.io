import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  EnvelopeAddSignerRequest,
  EnvelopeSentRequest,
  EnvelopesGetBySignerRequest,
  EnvelopesGetRequest,
  EnvelopeSignRequest,
} from './type';
import { responsePaginate } from 'src/commons/utils/pagination';
import {
  generateOrderBy,
  searchContains,
} from 'src/commons/utils/prisma-helper';
import { EnvelopeWhereInput } from 'generated/prisma/models';
import { SignerService } from '../signer/signer.service';
import { S3Service } from '../s3/s3.service';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';

@Injectable()
export class EnvelopeService {
  constructor(
    private prismaService: PrismaService,
    private signerService: SignerService,
    private s3Service: S3Service,
    @InjectQueue('email') private emailQueue: Queue,
    @InjectQueue('pdf') private pdfQueue: Queue,
  ) {}

  async getAll({
    userId,
    pagination,
    subject,
    sortBy,
    sortOrder,
  }: EnvelopesGetRequest) {
    const whereClause: EnvelopeWhereInput = {
      userId,
      subject: searchContains(subject),
    };
    const orderByClause = generateOrderBy(sortBy, sortOrder);

    return responsePaginate(
      this.prismaService.envelope.count({
        where: whereClause,
      }),
      this.prismaService.envelope.findMany({
        where: whereClause,
        orderBy: orderByClause,
        skip: pagination.skip,
        take: pagination.itemsPerPage,
        include: {
          documents: true,
        },
      }),
      pagination,
    );
  }

  async addSigners({ envelopeId, signers }: EnvelopeAddSignerRequest) {
    const envelope = await this.prismaService.envelope.findUnique({
      where: { id: envelopeId },
    });

    if (!envelope) throw new BadRequestException('Invalid envelope id!');

    const payload = signers.map((signer) => {
      return {
        ...signer,
        envelopeId: envelope.id,
      };
    });

    await this.prismaService.signer.createMany({ data: payload });
  }

  async sent({
    userId,
    ipAddress,
    envelopeId,
    subject,
    description,
    fields,
  }: EnvelopeSentRequest) {
    const [user, { signers }] = await Promise.all([
      this.prismaService.user.findUnique({
        where: { id: userId },
      }),
      this.prismaService.envelope.findUnique({
        where: {
          id: envelopeId,
        },
        select: {
          signers: true,
        },
      }),
    ]);

    if (!user || signers.length === 0)
      throw new NotFoundException('User or signer not found');

    const transaction = this.prismaService.$transaction(async (tx) => {
      const envelope = await tx.envelope.update({
        data: {
          status: 'SENT',
          subject,
          auditLogs: {
            create: {
              action: 'SENT',
              user: user.username,
              ipAddress,
            },
          },
        },
        where: { id: envelopeId },
        select: {
          documents: {
            select: {
              id: true,
              fileName: true,
            },
          },
        },
      });

      const payloadField = fields.map((field) => {
        return {
          ...field,
          documentId: envelope.documents.id,
        };
      });

      await tx.field.createMany({
        data: payloadField,
      });

      return envelope;
    });
    const { fileName } = (await transaction).documents;
    const url = await this.s3Service.get(fileName);

    signers.map(async (signer) => {
      await this.emailQueue.add('send-envelope', {
        subject,
        description,
        email: signer.email,
        username: user.username,
        link: url,
      });
    });
  }

  async getBySigner({
    envelopeId,
    signerId,
    ipAddress,
  }: EnvelopesGetBySignerRequest) {
    const signer = await this.signerService.getById(signerId);

    return await this.prismaService.envelope.update({
      data: {
        auditLogs: {
          create: {
            user: `${signer.firstName} ${signer.lastName}`,
            action: 'VIEW',
            ipAddress,
          },
        },
      },
      where: {
        id: envelopeId,
      },
      include: {
        documents: true,
      },
    });
  }

  async sign({ signerId, envelopeId, value, ipAddress }: EnvelopeSignRequest) {
    const signer = await this.signerService.getById(signerId);
    const { url } = await this.s3Service.upload(value);

    this.prismaService.$transaction(async (tx) => {
      const envelope = await tx.envelope.update({
        data: {
          auditLogs: {
            create: {
              action: 'SIGNED',
              ipAddress,
              user: `${signer.firstName} ${signer.lastName}`,
            },
          },
        },
        where: {
          id: envelopeId,
        },
        include: {
          documents: {
            select: {
              fields: {
                where: {
                  type: 'SIGNATURE',
                },
              },
              fileKey: true,
            },
          },
        },
      });
      await tx.field.update({
        data: {
          value: url,
        },
        where: {
          id: envelope.documents.fields[0].id,
        },
      });
    });

    const { user, documents, subject } =
      await this.prismaService.envelope.findUnique({
        where: {
          id: envelopeId,
        },
        include: {
          documents: {
            select: {
              fields: true,
              fileName: true,
            },
          },
          user: {
            select: {
              email: true,
              username: true,
            },
          },
        },
      });

    const isComplete = documents.fields.every((field) => field.value !== null);

    if (isComplete) {
      await this.pdfQueue.add('deffered-merging', {
        envelopeId,
      });

      const url = await this.s3Service.get(documents.fileName);

      await this.emailQueue.add('complete-notification', {
        email: user.email,
        username: user.username,
        subject: subject,
        url: url,
      });
    }
  }

  async reminder(envelopeId: string) {
    const { documents, signers, subject } =
      await this.prismaService.envelope.findUnique({
        where: {
          id: envelopeId,
        },
        include: {
          documents: {
            select: {
              fileName: true,
            },
          },
          signers: true,
        },
      });
    const url = await this.s3Service.get(documents.fileName);

    signers.map(async (signer) => {
      await this.emailQueue.add('reminder', {
        username: `${signer.firstName} ${signer.lastName}`,
        email: signer.email,
        subject: subject,
        url: url,
      });
    });
  }
}
