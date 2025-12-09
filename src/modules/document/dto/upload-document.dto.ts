import {
  IsArray,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';

class SingleDocumentOrderDto {
  @IsNotEmpty()
  @IsString()
  filename: string;

  @IsNotEmpty()
  @IsInt()
  order: number;
}
export class UploadDocumentDto {
  @IsOptional()
  @Transform(({ value }) => {
    try {
      return JSON.parse(value);
    } catch (error) {
      return value;
    }
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SingleDocumentOrderDto)
  metaOrder: SingleDocumentOrderDto[];
}
