import { PartialType } from '@nestjs/mapped-types';
import { CreateClassDto } from './create-class.dto';

// PartialType membuat semua field jadi opsional,
// jadi tidak perlu tulis ulang validasi untuk update.
export class UpdateClassDto extends PartialType(CreateClassDto) {}
