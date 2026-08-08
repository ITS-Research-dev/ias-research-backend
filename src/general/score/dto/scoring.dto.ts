// dto/scoring.dto.ts
import { IsInt, Min, Max } from 'class-validator';

export class ScoringDto {
  @IsInt()
  @Min(0)
  @Max(100)
  fungsionalitas: number;

  @IsInt()
  @Min(0)
  @Max(100)
  logika: number;

  @IsInt()
  @Min(0)
  @Max(100)
  syntax: number;

  @IsInt()
  @Min(0)
  @Max(100)
  code_style: number;

  @IsInt()
  @Min(0)
  @Max(100)
  dokumentasi: number;

  @IsInt()
  @Min(0)
  @Max(100)
  konsep: number;
}