// dto/create-test.dto.ts
import { IsUUID, IsString, IsInt } from 'class-validator';

export class CreateTestDto {
  @IsUUID()
  idTopic: string;

  @IsString()
  title: string;

  @IsString()
  question: string;

  @IsString()
  expOutput: string;

  @IsInt()
  maxTries: number;
}