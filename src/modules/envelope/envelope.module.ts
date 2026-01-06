import { Module } from '@nestjs/common';
import { EnvelopeController } from './envelope.controller';
import { EnvelopeService } from './envelope.service';
import { SignerModule } from '../signer/signer.module';

@Module({
  imports: [SignerModule],
  controllers: [EnvelopeController],
  providers: [EnvelopeService],
})
export class EnvelopeModule {}
