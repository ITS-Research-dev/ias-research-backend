// dto/create-progress.dto.ts
import { IsUUID, IsInt } from 'class-validator';

export class CreateProgressDto {
  @IsUUID()
  idUser: string;

  @IsUUID()
  idTopic: string;

  @IsInt()
  maxCount: number;

  @IsInt()
  progressCount: number;
}