// dto/create-class.dto.ts
import { IsString, IsInt } from 'class-validator';

export class CreateClassDto {
  @IsString()
  title: string;

  @IsString()
  waliKelas: string;

  @IsInt()
  countTotal: number;
}