import { IsDefined, ValidateNested } from 'class-validator';
import { EnvelopeSignerDto } from './envelope-signer.dto';
import { Type } from 'class-transformer';

export class EnvelopeAddSignerDto {
  @IsDefined()
  @ValidateNested()
  @Type(() => Array<EnvelopeSignerDto>)
  signers: EnvelopeSignerDto[];
}
