import { Module } from '@nestjs/common';
import { DocumentService } from './document.service';
import { DocumentController } from './document.controller';
import { S3Module } from '../s3/s3.module';

@Module({
  imports: [S3Module],
  providers: [DocumentService],
  controllers: [DocumentController],
})
export class DocumentModule {}
