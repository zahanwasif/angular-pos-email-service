import { MailerService } from '@nestjs-modules/mailer';
import { Injectable } from '@nestjs/common';

@Injectable()
export class Email {
  constructor(private readonly mailerService: MailerService) {}

  sendEmail(summaryBuffer: Buffer, email: string, subject: string) {
    return this.mailerService.sendMail({
      to: email,
      subject: subject,
      from: 'noreply@zarpos.com',
      html: '<b>Welcome to ZAR POS</b>',
      attachments: [{ filename: 'summary.pdf', content: summaryBuffer }],
    });
  }
}
