import { IsString, IsOptional, IsUUID, IsInt } from 'class-validator';

export class CreateQuestionDto {
    @IsUUID()
    idTopic: string;

    @IsString()
    judul: string;

    @IsString()
    soal: string;

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
}
