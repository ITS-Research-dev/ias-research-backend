import { IsOptional, IsString, IsUUID, IsIn, IsDate, IsDateString } from 'class-validator';

export class CreateMaterialDto {
  @IsUUID()
  idClass: string;

  @IsString()
  title: string;

  @IsString()
  content: string;

  @IsString()
  description: string;

  @IsDateString()
  startDate: string;

  @IsIn(['active', 'inactive'])
  status: 'active' | 'inactive';
}
