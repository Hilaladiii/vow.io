import { Type } from 'class-transformer';
import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class EnvelopeSignDto {
  @IsNotEmpty()
  @IsNumber()
  @Type(() => Number)
  pageNumber: number;

  @IsNotEmpty()
  @IsNumber()
  @Type(() => Number)
  x: number;

  @IsNotEmpty()
  @IsNumber()
  @Type(() => Number)
  y: number;

  @IsNotEmpty()
  @IsNumber()
  @Type(() => Number)
  height: number;

  @IsNotEmpty()
  @IsNumber()
  @Type(() => Number)
  width: number;
}
