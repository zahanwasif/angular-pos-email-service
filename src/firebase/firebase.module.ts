import { Module } from '@nestjs/common';
import { Firebase } from './firebase';

@Module({
  exports: [Firebase],
})
export class FirebaseModule {}
