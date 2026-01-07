import {
  Body,
  Controller,
  Get,
  Ip,
  Param,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { EnvelopeService } from './envelope.service';
import { Auth } from 'src/commons/decorators/auth.decorator';
import { GetCurrentUser } from 'src/commons/decorators/get-current-user.decorator';
import { Pagination } from 'src/commons/decorators/pagination.decorator';
import { PaginationResult } from 'src/commons/types/pagination.type';
import { EnvelopeSent } from './dto/envelope-sent.dto';
import { EnvelopeAddSignerDto } from './dto/envelope-add-signer.dto';
import { FileInterceptor } from '@nestjs/platform-express';

@Controller('envelopes')
export class EnvelopeController {
  constructor(private envelopeService: EnvelopeService) {}

  @Get()
  @Auth()
  async getAll(
    @GetCurrentUser('sub') userId: string,
    @Pagination() pagination: PaginationResult,
  ) {
    return await this.envelopeService.getAll({ userId, pagination });
  }

  @Post('/signers/:id')
  @Auth()
  async addSigners(
    @Param('id') envelopeId: string,
    @Body() body: EnvelopeAddSignerDto,
  ) {
    return await this.envelopeService.addSigners({ ...body, envelopeId });
  }

  @Post('/sent/:id')
  @Auth()
  async sent(
    @GetCurrentUser('sub') userId: string,
    @Param('id') envelopeId: string,
    @Body() body: EnvelopeSent,
    @Ip() ipAddress: string,
  ) {
    return await this.envelopeService.sent({
      userId,
      envelopeId,
      ipAddress,
      ...body,
    });
  }

  @Get(':envId/signers/:id')
  async getBySigner(
    @Param('envId') envelopeId: string,
    @Param('id') signerId: string,
    @Ip() ipAddress: string,
  ) {
    return await this.envelopeService.getBySigner({
      envelopeId,
      ipAddress,
      signerId,
    });
  }

  @Post(':envId/signers/:id')
  @UseInterceptors(FileInterceptor('signature'))
  async sign(
    @Param('envId') envelopeId: string,
    @Param('id') signerId: string,
    @Ip() ipAddress: string,
    @UploadedFile() signature: Express.Multer.File,
  ) {
    return await this.envelopeService.sign({
      envelopeId,
      signerId,
      ipAddress,
      value: signature,
    });
  }

  @Post('reminder/:id')
  @Auth()
  async reminder(@Param('id') envelopeId: string) {
    return await this.envelopeService.reminder(envelopeId);
  }
}
