import { Module } from '@nestjs/common';
import { Firebase } from './firebase';
import { ConfigModule, ConfigService } from '@nestjs/config';
import * as admin from 'firebase-admin';

const firebaseProvider = {
  provide: 'FIREBASE_APP',
  inject: [ConfigService],
  useFactory: (configService: ConfigService) => {
    const firebaseConfig = {
      type: configService.get<string>('TYPE'),
      project_id: configService.get<string>('PROJECT_ID'),
      private_key_id: configService.get<string>('PRIVATE_KEY_ID'),
      private_key: configService
        .get<string>('PRIVATE_KEY')
        .replace(/\\n/g, '\n'),
      client_email: configService.get<string>('CLIENT_EMAIL'),
      client_id: configService.get<string>('CLIENT_ID'),
      auth_uri: configService.get<string>('AUTH_URI'),
      token_uri: configService.get<string>('TOKEN_URI'),
      auth_provider_x509_cert_url: configService.get<string>(
        'AUTH_PROVIDER_X509_CERT_URL',
      ),
      client_x509_cert_url: configService.get<string>('CLIENT_X509_CERT_URL'),
      universe_domain: configService.get<string>('UNIVERSE_DOMAIN'),
    } as admin.ServiceAccount;

    console.log('firebaseConfig', firebaseConfig);
    return admin.initializeApp({
      credential: admin.credential.cert(firebaseConfig),
    });
  },
};

@Module({
  imports: [ConfigModule],
  providers: [Firebase, firebaseProvider],
  exports: [Firebase],
})
export class FirebaseModule {}
