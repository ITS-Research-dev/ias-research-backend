import { IsString, IsNotEmpty, IsNumber, IsUUID, IsOptional } from 'class-validator';

export class SubmitToQueueDto {
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
    hintUsage: number;

    @IsUUID()
    @IsNotEmpty()
    testId!: string;

    @IsString()
    @IsOptional()
    questionTitle?: string;
}
