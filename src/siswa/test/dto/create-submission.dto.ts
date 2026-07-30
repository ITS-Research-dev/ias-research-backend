import { IsUUID, IsNotEmpty, IsString, IsIn } from 'class-validator';

export class CreateSubmissionDto {
    @IsUUID()
    @IsNotEmpty()
    testId!: string;

    @IsString()
    @IsNotEmpty()
    @IsIn(['python', 'javascript', 'java', 'cpp'])
    language!: string;

    @IsString()
    @IsNotEmpty()
    sourceCode!: string;
}
