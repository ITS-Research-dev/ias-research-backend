import { IsString, IsOptional, IsUUID, IsBoolean } from 'class-validator';

export class CreateMaterialDto {
    @IsUUID()
    idClass: string;

    @IsString()
    judul: string;

    @IsString()
    subject: string;

    @IsOptional()
    @IsString()
    deskripsi?: string;

    @IsOptional()
    @IsBoolean()
    isActive?: boolean;
}
