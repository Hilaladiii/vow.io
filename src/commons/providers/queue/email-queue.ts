import { Process, Processor } from '@nestjs/bull';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Job } from 'bull';
import * as nodemailer from 'nodemailer';
import { generateSignRequestEmail } from 'src/commons/utils/template-html';

@Injectable()
@Processor('email')
export class EmailQueue {
  constructor(private configService: ConfigService) {}

  @Process('send-envelope')
  async sendEnvelope(job: Job) {
    const { subject, username, email, description, link } = job.data;

    const transport = nodemailer.createTransport({
      host: this.configService.get('SMTP_HOST'),
      port: this.configService.get('SMTP_PORT'),
      secure: false,
      auth: {
        user: this.configService.get('SMTP_USER'),
        pass: this.configService.get('SMTP_PASS'),
      },
    });

    try {
      const emailTemplate = generateSignRequestEmail({
        username,
        link,
        documentTitle: subject,
        message: description,
      });
      await transport.sendMail({
        from: 'Vow.io',
        to: email,
        subject: subject,
        html: emailTemplate,
      });
    } catch (error) {
      console.log(error);
      throw error;
    }
  }
}
