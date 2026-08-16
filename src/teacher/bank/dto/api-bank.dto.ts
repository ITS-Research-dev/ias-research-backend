import { IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';

export class QueryMaterialDto {
  @IsString()
  @IsNotEmpty()
  @IsUUID()
  idClass: string;
}

export class QueryQuestionDto {
  @IsString()
  @IsNotEmpty()
  @IsUUID()
  idClass: string;
}
