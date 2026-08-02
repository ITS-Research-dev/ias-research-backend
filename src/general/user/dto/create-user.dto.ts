import { IsString, IsUUID } from 'class-validator';

export class CreateUserDto {
  @IsUUID()
  idRole: string;

  @IsString()
  fullName: string;

  @IsString()
  uCredentials: string;

  @IsString()
  uPassword: string;
}