import { Module } from '@nestjs/common';
import { EnvelopeController } from './envelope.controller';
import { EnvelopeService } from './envelope.service';
import { SignerModule } from '../signer/signer.module';
import { BullModule } from '@nestjs/bull';
import { S3Module } from '../s3/s3.module';

@Module({
  imports: [
    SignerModule,
    S3Module,
    BullModule.registerQueue({ name: 'email' }),
    BullModule.registerQueue({ name: 'pdf' }),
  ],
  controllers: [EnvelopeController],
  providers: [EnvelopeService],
})
export class EnvelopeModule {}
