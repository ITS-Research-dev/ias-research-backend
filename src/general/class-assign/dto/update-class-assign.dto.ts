import { PartialType } from '@nestjs/mapped-types';
import { CreateClassAssignDto } from './create-class-assign.dto';

// PartialType membuat semua field jadi opsional,
// jadi tidak perlu tulis ulang validasi untuk update.
export class UpdateClassAssignDto extends PartialType(CreateClassAssignDto) {}
