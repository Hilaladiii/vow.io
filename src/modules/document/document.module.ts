import { Module } from '@nestjs/common';
import { DocumentService } from './document.service';
import { MinioModule } from '../minio/minio.module';
import { DocumentController } from './document.controller';

@Module({
  imports: [MinioModule],
  providers: [DocumentService],
  controllers: [DocumentController],
})
export class DocumentModule {}
