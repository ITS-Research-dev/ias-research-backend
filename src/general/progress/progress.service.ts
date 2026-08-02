// progress.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { ProgressRepository } from './progress.repository';
import { CreateProgressDto } from './dto/create-progress.dto';
import { UpdateProgressDto } from './dto/update-progress.dto';

@Injectable()
export class ProgressService {
  constructor(private readonly progressRepository: ProgressRepository) {}

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

  async update(idUser: string, idTopic: string, dto: UpdateProgressDto) {
    await this.findOne(idUser, idTopic); // pastikan data ada dulu sebelum update
    return this.progressRepository.update(idUser, idTopic, dto);
  }

  async remove(idUser: string, idTopic: string) {
    await this.findOne(idUser, idTopic); // pastikan data ada dulu sebelum hapus
    return this.progressRepository.delete(idUser, idTopic);
  }
}