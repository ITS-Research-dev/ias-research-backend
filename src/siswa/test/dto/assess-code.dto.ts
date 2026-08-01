import { IsString, IsNotEmpty } from 'class-validator';

export class AssessCodeDto {
    @IsString()
    @IsNotEmpty()
    soal!: string;

    @IsString()
    @IsNotEmpty()
    expectedOutput!: string;

    @IsString()
    @IsNotEmpty()
    studentCode!: string;
}
