import { IsEnum, IsNotEmpty, IsNumber, IsString } from 'class-validator';
import { FieldType } from 'generated/prisma/enums';

export class EnvelopeFieldDto {
  @IsNotEmpty()
  @IsString()
  signerId: string;

  @IsNotEmpty()
  @IsNumber()
  pageNumber: number;

  @IsNotEmpty()
  @IsEnum(FieldType)
  type: FieldType;

  @IsNotEmpty()
  @IsNumber()
  x: number;

  @IsNotEmpty()
  @IsNumber()
  y: number;
}
