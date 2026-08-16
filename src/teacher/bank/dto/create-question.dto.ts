import { IsString, IsOptional, IsUUID, IsInt, IsIn } from 'class-validator';

export class CreateQuestionDto {
  @IsUUID()
  materialId: string;

  @IsString()
  title: string;

  @IsString()
  description: string;

  @IsOptional()
  @IsString()
  expectedOutput?: string;

  @IsOptional()
  @IsInt()
  maxTries?: number = 3;

  @IsOptional()
  @IsString()
  hint1?: string;

  @IsOptional()
  @IsString()
  hint2?: string;

  @IsOptional()
  @IsString()
  hint3?: string;

  @IsIn(['active', 'inactive'])
  status: 'active' | 'inactive';
}
