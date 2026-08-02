// dto/create-topic.dto.ts
import { IsUUID, IsString, IsBoolean } from 'class-validator';

export class CreateTopicDto {
  @IsUUID()
  idClass: string;

  @IsString()
  title: string;

  @IsString()
  subject: string;

  @IsBoolean()
  isActive: boolean;
}