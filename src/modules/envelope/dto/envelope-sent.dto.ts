import { Type } from 'class-transformer';
import {
  IsDefined,
  IsNotEmpty,
  IsString,
  ValidateNested,
} from 'class-validator';
import { EnvelopeFieldDto } from './envelope-field.dto';

export class EnvelopeSent {
  @IsNotEmpty()
  @IsString()
  subject: string;

  @IsDefined()
  @ValidateNested()
  @Type(() => EnvelopeFieldDto)
  fields: EnvelopeFieldDto[];
}
