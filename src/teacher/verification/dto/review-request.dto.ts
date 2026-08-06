import { IsIn, IsOptional, IsObject, ValidateNested, IsString } from 'class-validator';
import { Type } from 'class-transformer';

class ScoreDto {
    logika: number;
    fungsi: number;
    sintaks: number;
    dok: number;
    gaya: number;
    konsep: number;
}

export class ReviewRequestDto {
    @IsIn(['terima', 'koreksi'])
    decision: 'terima' | 'koreksi';

    @IsOptional()
    @IsObject()
    @ValidateNested()
    @Type(() => ScoreDto)
    finalScore?: ScoreDto;

    @IsOptional()
    @IsString()
    catatan?: string;
}