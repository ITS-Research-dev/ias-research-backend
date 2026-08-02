import { Injectable, NotFoundException } from '@nestjs/common';
import { TopicRepository } from './topic.repository';
import { CreateTopicDto } from './dto/create-topic.dto';
import { UpdateTopicDto } from './dto/update-topic.dto';

@Injectable()
export class TopicService {
  constructor(private readonly topicRepository: TopicRepository) {}

  findAll() {
    return this.topicRepository.findAll();
  }

  async findOne(id: string) {
    const topic = await this.topicRepository.findById(id);
    if (!topic) {
      throw new NotFoundException(`Topic dengan id ${id} tidak ditemukan`);
    }
    return topic;
  }

  create(dto: CreateTopicDto) {
    return this.topicRepository.create(dto);
  }

  async update(id: string, dto: UpdateTopicDto) {
    await this.findOne(id); // pastikan data ada dulu sebelum update
    return this.topicRepository.update(id, dto);
  }

  async remove(id: string) {
    await this.findOne(id); // pastikan data ada dulu sebelum hapus
    return this.topicRepository.delete(id);
  }
}
