import { PartialType } from '@nestjs/mapped-types';
import { CreateTopicDto } from './create-topic.dto';

// PartialType membuat semua field jadi opsional,
// jadi tidak perlu tulis ulang validasi untuk update.
export class UpdateTopicDto extends PartialType(CreateTopicDto) {}
