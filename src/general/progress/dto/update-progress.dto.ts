import { PartialType } from '@nestjs/mapped-types';
import { CreateProgressDto } from './create-progress.dto';

// PartialType membuat semua field jadi opsional,
// jadi tidak perlu tulis ulang validasi untuk update.
export class UpdateProgressDto extends PartialType(CreateProgressDto) {}
