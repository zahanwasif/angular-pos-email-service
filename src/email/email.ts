import { MailerService } from '@nestjs-modules/mailer';
import { Injectable } from '@nestjs/common';

@Injectable()
export class Email {
  constructor(private readonly mailerService: MailerService) {}

  sendEmail(summaryBuffer: Buffer) {
    return this.mailerService.sendMail({
      to: 'zahan.wasif@gmail.com',
      subject: 'Testing Nest MailerModule ✔',
      html: '<b>Welcome to ZAR POS</b>',
      attachments: [{ filename: 'summary.pdf', content: summaryBuffer }],
    });
  }
}
