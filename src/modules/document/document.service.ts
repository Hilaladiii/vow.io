import { BadRequestException, Injectable } from '@nestjs/common';
import { PDFDocument } from 'pdf-lib';
import { S3Service } from '../s3/s3.service';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DocumentService {
  constructor(
    private s3Service: S3Service,
    private prismaService: PrismaService,
  ) {}

  async upload(file: Express.Multer.File, userId: string) {
    const { filename, url } = await this.s3Service.upload(file);
    await this.prismaService.envelope.create({
      data: {
        subject: `${filename}-Draft`,
        status: 'DRAFT',
        documents: {
          create: {
            fileName: filename,
            fileKey: url,
          },
        },
        userId,
      },
    });
  }

  async merge(files: Express.Multer.File[]): Promise<Express.Multer.File> {
    try {
      const mergedPdf = await PDFDocument.create();

      for (const file of files) {
        const srcDocument = await PDFDocument.load(file.buffer, {
          ignoreEncryption: true,
        });

        const copiedPages = await mergedPdf.copyPages(
          srcDocument,
          srcDocument.getPageIndices(),
        );

        copiedPages.forEach((page) => {
          mergedPdf.addPage(page);
        });
      }

      const pdfBytes = await mergedPdf.save();
      const buffer = Buffer.from(pdfBytes);

      const baseName = files[0].originalname.replace(/\.[^/.]+$/, '');
      const newFileName = `${baseName}_merged.pdf`;

      return {
        originalname: newFileName,
        buffer: buffer,
        mimetype: 'application/pdf',
        size: buffer.length,
      } as Express.Multer.File;
    } catch (error) {
      throw new Error('Failed merge PDF');
    }
  }

  async previewDocument(id: string) {
    const doc = await this.prismaService.document.findUnique({ where: { id } });
    if (!doc) throw new BadRequestException('Invalid document id');

    const buffer = await this.s3Service.getFileBuffer(doc.fileName);

    return { buffer, doc };
  }
}
