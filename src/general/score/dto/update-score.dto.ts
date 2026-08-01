import { PartialType } from '@nestjs/mapped-types';
import { CreateScoreDto } from './create-score.dto';

// PartialType membuat semua field jadi opsional,
// jadi tidak perlu tulis ulang validasi untuk update.
export class UpdateScoreDto extends PartialType(CreateScoreDto) {}
