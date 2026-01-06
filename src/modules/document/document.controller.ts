import {
  Body,
  Controller,
  Get,
  HttpStatus,
  ParseFilePipeBuilder,
  Post,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import { Auth } from 'src/commons/decorators/auth.decorator';
import { GetCurrentUser } from 'src/commons/decorators/get-current-user.decorator';
import { DocumentService } from './document.service';
import { FilesInterceptor } from '@nestjs/platform-express';
import { UploadDocumentDto } from './dto/upload-document.dto';

@Controller('document')
export class DocumentController {
  constructor(private documentService: DocumentService) {}

  @Post('upload')
  @UseInterceptors(FilesInterceptor('files'))
  @Auth()
  async upload(
    @GetCurrentUser('sub') userId: string,
    @UploadedFiles(
      new ParseFilePipeBuilder()
        .addFileTypeValidator({
          fileType: 'application/pdf',
        })
        .build({
          fileIsRequired: true,
          errorHttpStatusCode: HttpStatus.UNPROCESSABLE_ENTITY,
        }),
    )
    files: Express.Multer.File[],
    @Body() { isMerged }: UploadDocumentDto,
  ) {
    if (isMerged) {
      const mergedFile = await this.documentService.merge(files);
      await this.documentService.upload(mergedFile, userId);
      return true;
    }

    if (files?.length > 1) {
      files.forEach(async (file) => {
        await this.documentService.upload(file, userId);
      });
      return true;
    }

    await this.documentService.upload(files[0], userId);
    return true;
  }
}
