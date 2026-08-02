import { PartialType } from '@nestjs/mapped-types';
import { CreateRoleDto } from './create-role.dto';

// PartialType membuat semua field jadi opsional,
// jadi tidak perlu tulis ulang validasi untuk update.
export class UpdateRoleDto extends PartialType(CreateRoleDto) {}
