// dto/create-class-assign.dto.ts
import { IsUUID, IsEnum } from 'class-validator';
import { RoleState } from '../entities/role-state.enum';

export class CreateClassAssignDto {
  @IsUUID()
  idUser: string;

  @IsUUID()
  idClass: string;

  @IsEnum(RoleState)
  state: RoleState;
}