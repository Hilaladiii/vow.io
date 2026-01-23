import { Module } from '@nestjs/common';
import { S3Service } from './s3.service';
import { EncryptionModule } from '../encryption/encryption.module';

@Module({
  imports: [EncryptionModule],
  providers: [S3Service],
  exports: [S3Service],
})
export class S3Module {}
