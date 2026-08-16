import { IsOptional, IsString, IsIn, IsInt } from 'class-validator';

export class UpdateQuestionDto {
  @IsOptional()
  @IsString()
  title?: string;
  
  @IsOptional()
  @IsString()
  materialId?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  expectedOutput?: string;

  @IsOptional()
  @IsInt()
  maxTries?: number;

  @IsOptional()
  @IsString()
  hint1?: string;

  @IsOptional()
  @IsString()
  hint2?: string;

  @IsOptional()
  @IsString()
  hint3?: string;

  @IsOptional()
  @IsIn(['active', 'inactive'])
  status?: 'active' | 'inactive';
}