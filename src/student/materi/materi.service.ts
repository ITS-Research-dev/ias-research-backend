import { Injectable, ForbiddenException } from '@nestjs/common';
import { TopicRepository } from '../../general/topic/topic.repository';

@Injectable()
export class MateriService {
    constructor(private readonly topicRepository: TopicRepository) {}

    async getMateriByClass(userClassId: string) {
        return this.topicRepository.findByClassId(userClassId);
    }

    async getMateriDetail(id: string) {
        return this.topicRepository.findById(id);
    }
}