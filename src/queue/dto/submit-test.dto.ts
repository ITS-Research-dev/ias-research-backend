import { IsString, IsNotEmpty, IsUUID } from 'class-validator';

export class SubmitTestDto {
    @IsUUID()
    @IsNotEmpty()
    testId: string;

    @IsString()
    @IsNotEmpty()
    code: string;
}