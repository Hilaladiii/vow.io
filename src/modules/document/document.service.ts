import { Injectable } from '@nestjs/common';
import { MinioService } from '../minio/minio.service';
import { PDFDocument } from 'pdf-lib';
import { IMetaOrder } from './interface';

@Injectable()
export class DocumentService {
  constructor(private minioService: MinioService) {}

  async upload(file: Express.Multer.File, userId: string) {
    await this.minioService.updateFile(
      file,
      file.originalname + userId,
      'documents',
    );
  }

  async merge(
    files: Express.Multer.File[],
    metaOrders: IMetaOrder[],
  ): Promise<Express.Multer.File> {
    try {
      const sortedFiles = files.sort((a, b) => {
        const orderA =
          metaOrders.find((meta) => meta.filename == a.originalname)?.order ??
          999;
        const orderB =
          metaOrders.find((meta) => meta.filename === b.originalname)?.order ??
          999;

        return orderA - orderB;
      });
      const mergedPdf = await PDFDocument.create();

      for (const file of sortedFiles) {
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
}
