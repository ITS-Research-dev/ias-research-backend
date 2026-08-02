import { PartialType } from '@nestjs/mapped-types';
import { CreateTestDto } from './create-test.dto';

// PartialType membuat semua field jadi opsional,
// jadi tidak perlu tulis ulang validasi untuk update.
export class UpdateTestDto extends PartialType(CreateTestDto) {}
