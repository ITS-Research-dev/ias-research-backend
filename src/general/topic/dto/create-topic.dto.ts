// dto/create-topic.dto.ts
import { IsUUID, IsString, IsBoolean, IsDateString } from 'class-validator';

export class CreateTopicDto {
  @IsUUID()
  idClass: string;

  @IsString()
  title: string;

  @IsString()
  subject: string;
  
  @IsString()
  description: string;
  
  @IsDateString()
  startDate: string;

  @IsBoolean()
  isActive: boolean;
}