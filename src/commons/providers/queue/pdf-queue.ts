import { Process, Processor } from '@nestjs/bull';
import { Injectable, NotFoundException } from '@nestjs/common';
import axios from 'axios';
import { Job } from 'bull';
import { PDFDocument, PDFImage, rgb, StandardFonts } from 'pdf-lib';
import { PrismaService } from 'src/modules/prisma/prisma.service';
import { S3Service } from 'src/modules/s3/s3.service';

@Injectable()
@Processor('pdf')
export class PdfQueue {
  constructor(
    private s3Service: S3Service,
    private prismaService: PrismaService,
  ) {}

  @Process('deffered-merging')
  async defferedMerging(job: Job) {
    const { envelopeId } = job.data;

    try {
      const envelope = await this.prismaService.envelope.findUnique({
        where: { id: envelopeId },
        include: {
          documents: {
            include: {
              fields: true,
            },
          },
        },
      });

      if (!envelope) throw new NotFoundException('Envelope not found');

      const finalPdf = await PDFDocument.create();
      const helveticaFont = await finalPdf.embedFont(StandardFonts.Helvetica);

      const pdfBuffer = await this.s3Service.getFileBuffer(
        envelope.documents.fileName,
      );

      const srcPdf = await PDFDocument.load(pdfBuffer);
      const copiedPages = await finalPdf.copyPages(
        srcPdf,
        srcPdf.getPageIndices(),
      );

      for (let i = 0; i < copiedPages.length; i++) {
        const page = copiedPages[i];
        const embeddedPage = finalPdf.addPage(page);
        const { height: pageHeight } = page.getSize();

        const fieldsOnPage = envelope.documents.fields.filter(
          (field) => field.pageNumber === i + 1,
        );

        for (const field of fieldsOnPage) {
          if (!field.value) continue;

          const pdfY = pageHeight - field.y - field.height;

          if (field.type === 'SIGNATURE') {
            const imageBuffer = await this.s3Service.getFileBuffer(field.value);

            let image: PDFImage;
            image = await finalPdf.embedPng(imageBuffer);

            const imageDimension = image.scale(1);
            const widthRasio = field.width / imageDimension.width;
            const heightRasio = field.height / imageDimension.height;

            const scaleFactor = Math.min(widthRasio, heightRasio);

            const drawWidth = imageDimension.width * scaleFactor;
            const drawHeight = imageDimension.height * scaleFactor;

            const centeredX = field.x + (field.width - drawWidth) / 2;
            const centeredY = pdfY + (field.height - drawHeight) / 2;

            embeddedPage.drawImage(image, {
              x: centeredX,
              y: centeredY,
              width: drawWidth,
              height: drawHeight,
            });
          }

          if (field.type === 'DATE' || field.type === 'TEXT') {
            const fontSize = 12;

            const textY = pdfY + (field.height - fontSize) / 2 + 2;

            embeddedPage.drawText(field.value, {
              x: field.x + 4,
              y: textY,
              size: fontSize,
              font: helveticaFont,
              color: rgb(0, 0, 0),
            });
          }
        }
      }

      const pdfBytes = await finalPdf.save();
      const buffer = Buffer.from(pdfBytes);

      const finalName = `Signed-${envelope.documents.fileName}`;
      const { url } = await this.s3Service.uploadBuffer(buffer, finalName);

      await this.prismaService.envelope.update({
        data: {
          status: 'COMPLETED',
          documents: {
            update: {
              fileKey: url,
            },
          },
        },
        where: {
          id: envelopeId,
        },
      });
    } catch (error) {
      console.log(error);
      throw error;
    }
  }
}
