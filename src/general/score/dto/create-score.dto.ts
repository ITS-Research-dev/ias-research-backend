// dto/create-score.dto.ts
import {
  IsUUID,
  IsString,
  IsInt,
  IsBoolean,
  IsOptional,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ScoringDto } from './scoring.dto';

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

  @ValidateNested()
  @Type(() => ScoringDto)
  aiScore: ScoringDto;

  @IsString()
  aiSuggestion: string;

  @IsString()
  aiFinishTime: string;

  @IsString()
  uCode: string;

  @IsUUID()
  @IsOptional()
  overrideBy?: string;

  @ValidateNested()
  @Type(() => ScoringDto)
  @IsOptional()
  teacherScore?: ScoringDto;

  @IsString()
  @IsOptional()
  teacherSuggestion?: string;
}