import { PartialType } from '@nestjs/mapped-types';
import { CreateHintDto } from './create-hint.dto';

// PartialType membuat semua field jadi opsional,
// jadi tidak perlu tulis ulang validasi untuk update.
export class UpdateHintDto extends PartialType(CreateHintDto) {}
