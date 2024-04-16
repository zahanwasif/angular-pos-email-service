import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { Email } from './email';
import { EmailController } from './email.controller';
import { HandlebarsAdapter } from '@nestjs-modules/mailer/dist/adapters/handlebars.adapter';
import { MailerModule } from '@nestjs-modules/mailer';

@Module({
  imports: [
    ConfigModule,
    MailerModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        transport: {
          host: 'smtp.gmail.com',
          port: 465,
          secure: true,
          auth: {
            user: 'zahan.wasif@gmail.com',
            pass: 'xrowcdpztmpeazif',
          },
        },
        defaults: {
          from: '"ZAR POS" <zahan.wasif@gmail.com>',
        },
      }),
      inject: [ConfigModule],
    }),
  ],
  providers: [Email],
  controllers: [EmailController],
  exports: [Email],
})
export class EmailModule {}
