// progress.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { ProgressRepository } from './progress.repository';
import { CreateProgressDto } from './dto/create-progress.dto';
import { UpdateProgressDto } from './dto/update-progress.dto';
import { TopicRepository } from '../topic/topic.repository';

@Injectable()
export class ProgressService {
  constructor(
    private readonly progressRepository: ProgressRepository,
    private readonly topicRepository: TopicRepository,
  ) {}

  findAll() {
    return this.progressRepository.findAll();
  }

  async findOne(idUser: string, idTopic: string) {
    const progress = await this.progressRepository.findByCompositeId(idUser, idTopic);
    if (!progress) {
      throw new NotFoundException(
        `Progress untuk idUser ${idUser} & idTopic ${idTopic} tidak ditemukan`,
      );
    }
    return progress;
  }

  create(dto: CreateProgressDto) {
    return this.progressRepository.create(dto);
  }

  async progressUnfinished(idUser: string, idTopic: string): Promise<boolean> {
    const progress = await this.progressRepository.findByCompositeId(idUser, idTopic);
    return progress ? progress.progressCount < progress.maxCount : true;
  }

  async addProgress(userId: string, testId: string) {
    const topic = await this.topicRepository.findByTestId(testId);
    if (!topic) throw new NotFoundException(`Topic untuk testId ${testId} tidak ditemukan`);
    const existingProgress = await this.progressRepository.findByCompositeId(userId, topic.id);
    return this.progressRepository.createOrUpdate({
      idUser: userId,
      idTopic: topic.id,
      maxCount: topic.tests.length,
      progressCount: existingProgress ? existingProgress.progressCount + 1 : 1,
    });
  }

  async removeProgress(userId: string, testId: string) {
    const topic = await this.topicRepository.findByTestId(testId);
    if (!topic) throw new NotFoundException(`Topic untuk testId ${testId} tidak ditemukan`);
    const existingProgress = await this.progressRepository.findByCompositeId(userId, topic.id);
    return this.progressRepository.createOrUpdate({
      idUser: userId,
      idTopic: topic.id,
      maxCount: topic.tests.length,
      progressCount: existingProgress ? existingProgress.progressCount - 1 : 0,
    });
  }

  async update(idUser: string, idTopic: string, dto: UpdateProgressDto) {
    await this.findOne(idUser, idTopic); // pastikan data ada dulu sebelum update
    return this.progressRepository.update(idUser, idTopic, dto);
  }

  async remove(idUser: string, idTopic: string) {
    await this.findOne(idUser, idTopic); // pastikan data ada dulu sebelum hapus
    return this.progressRepository.delete(idUser, idTopic);
  }
}