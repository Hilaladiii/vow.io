import {
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';

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
  @IsBoolean()
  isMerged: boolean;
}
