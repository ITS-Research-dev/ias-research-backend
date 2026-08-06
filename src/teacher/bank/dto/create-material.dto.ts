import { IsString, IsOptional } from 'class-validator';

export class CreateMaterialDto {
    @IsString()
    judul: string;

    @IsOptional()
    @IsString()
    cp?: string;

    @IsOptional()
    @IsString()
    kontenMarkdown?: string;
}