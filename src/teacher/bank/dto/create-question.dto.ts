import { IsString, IsOptional } from 'class-validator';

export class CreateQuestionDto {
    @IsString() topik: string;
    @IsString() judul: string;
    @IsString() deskripsi: string;
    @IsOptional() @IsString() expect?: string;
    @IsOptional() @IsString() starter?: string;
    @IsOptional() @IsString() hint1?: string;
    @IsOptional() @IsString() hint2?: string;
    @IsOptional() @IsString() hint3?: string;
}