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
import { randomUUID } from 'node:crypto';
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
        token: randomUUID(),
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

    return this.prismaService.$transaction(async (tx) => {
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

      signers.map(async (signer) => {
        await this.emailQueue.add('send-envelope', {
          subject,
          description,
          email: signer.email,
          username: user.username,
          link: `http://127.0.0.1:3000/${envelopeId}/${signer.id}`,
        });
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

  async sign({
    signerId,
    envelopeId,
    fieldId,
    value,
    ipAddress,
  }: EnvelopeSignRequest) {
    const signer = await this.signerService.getById(signerId);

    let payload = typeof value === 'string' ? value : null;
    if (typeof value !== 'string') {
      const { url } = await this.s3Service.upload(value);
      payload = url;
    }

    this.prismaService.$transaction(async (tx) => {
      await tx.envelope.update({
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
      });
      await tx.field.update({
        data: {
          value: payload,
        },
        where: {
          id: fieldId,
        },
      });
    });

    const envelopeFields = await this.prismaService.envelope.findUnique({
      where: {
        id: envelopeId,
      },
      select: {
        documents: {
          select: {
            fields: true,
          },
        },
      },
    });

    const isComplete = envelopeFields.documents.fields.every(
      (field) => field.value !== null,
    );

    //do background task update pdf
    if (isComplete) {
    }
  }
}
