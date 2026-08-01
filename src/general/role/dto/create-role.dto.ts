// dto/create-role.dto.ts
import { IsString } from 'class-validator';

export class CreateRoleDto {
  @IsString()
  description: string;
}