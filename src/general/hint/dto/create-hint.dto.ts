// dto/create-hint.dto.ts
import { IsUUID, IsString } from 'class-validator';

export class CreateHintDto {
  @IsUUID()
  idTest: string;

  @IsString()
  hint1: string;

  @IsString()
  hint2: string;

  @IsString()
  hint3: string;
}