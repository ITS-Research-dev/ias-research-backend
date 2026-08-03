import {
  Injectable,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { TopicRepository } from '../../general/topic/topic.repository';

@Injectable()
export class MateriService {
  constructor(private readonly topicRepository: TopicRepository) {}

  async getMateriByClass(userClassId: string) {
    return this.topicRepository.findByClassId(userClassId);
  }

  async getMateriDetail(id: string) {
    const topic = await this.topicRepository.findById(id);
    if (!topic) throw new NotFoundException(`Topic with id ${id} not found`);
    return { title: topic.title, description: topic.description, subject: topic.subject };
  }
}
