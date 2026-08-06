import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class OllamaChatDto {
    @IsString()
    @IsNotEmpty()
    prompt!: string;

    @IsString()
    @IsOptional()
    systemContext?: string;
}
