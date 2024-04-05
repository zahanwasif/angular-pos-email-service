import { Module } from '@nestjs/common';
import { Email } from './email';
import { EmailController } from './email.controller';

@Module({
  providers: [Email],
  controllers: [EmailController]
})
export class EmailModule {}
