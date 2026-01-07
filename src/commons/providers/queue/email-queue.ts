import { Process, Processor } from '@nestjs/bull';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Job } from 'bull';
import * as nodemailer from 'nodemailer';
import SMTPTransport from 'nodemailer/lib/smtp-transport';
import {
  generateCompleteEmail,
  generateReminderEmail,
  generateSignRequestEmail,
} from 'src/commons/utils/template-html';

@Injectable()
@Processor('email')
export class EmailQueue {
  private transport: nodemailer.Transporter<
    SMTPTransport.SentMessageInfo,
    SMTPTransport.Options
  >;

  constructor(private configService: ConfigService) {
    this.transport = nodemailer.createTransport({
      host: this.configService.get('SMTP_HOST'),
      port: this.configService.get('SMTP_PORT'),
      secure: false,
      auth: {
        user: this.configService.get('SMTP_USER'),
        pass: this.configService.get('SMTP_PASS'),
      },
    });
  }

  @Process('send-envelope')
  async sendEnvelope(job: Job) {
    const { subject, username, email, description, link } = job.data;

    try {
      const emailTemplate = generateSignRequestEmail({
        username,
        link,
        documentTitle: subject,
        message: description,
      });
      await this.transport.sendMail({
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

  @Process('complete-notification')
  async completeNotification(job: Job) {
    const { email, username, subject, url } = job.data;
    try {
      const emailTemplate = generateCompleteEmail({
        username,
        documentTitle: subject,
        downloadLink: url,
      });
      await this.transport.sendMail({
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

  @Process('reminder')
  async reminder(job: Job) {
    const { subject, url, username, email } = job.data;
    try {
      const emailTemplate = generateReminderEmail({
        username,
        link: url,
        documentTitle: subject,
      });

      await this.transport.sendMail({
        from: 'Vow.Io',
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
