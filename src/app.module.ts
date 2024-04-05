import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { FirebaseModule } from './firebase/firebase.module';
import { EmailModule } from './email/email.module';

@Module({
  imports: [FirebaseModule, EmailModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
