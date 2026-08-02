// dto/create-score.dto.ts
import { IsUUID, IsString, IsInt, IsBoolean, IsOptional } from 'class-validator';

export class CreateScoreDto {
  @IsUUID()
  idTest: string;

  @IsUUID()
  idUser: string;

  @IsString()
  level: string;

  @IsInt()
  averageScore: number;

  @IsBoolean()
  flagOverride: boolean;

  @IsString()
  aiScore: string;

  @IsString()
  aiSuggestion: string;

  @IsString()
  aiFinishTime: string;

  @IsString()
  uCode: string;

  @IsUUID()
  @IsOptional()
  overrideBy?: string;

  @IsString()
  @IsOptional()
  teacherScore?: string;

  @IsString()
  @IsOptional()
  teacherSuggestion?: string;
}