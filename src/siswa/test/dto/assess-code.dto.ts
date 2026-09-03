import { IsString, IsNotEmpty, IsNumber, IsOptional } from 'class-validator';

export class AssessCodeDto {
    @IsString()
    @IsOptional()
    testId?: string;

    @IsString()
    @IsNotEmpty()
    soal!: string;

    @IsString()
    @IsNotEmpty()
    expectedOutput!: string;

    @IsString()
    @IsNotEmpty()
    studentCode!: string;

    @IsNumber()
    @IsNotEmpty()
    hintUsage: number;
}

