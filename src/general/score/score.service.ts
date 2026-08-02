import { Injectable, NotFoundException } from '@nestjs/common';
import { ScoreRepository } from './score.repository';
import { CreateScoreDto } from './dto/create-score.dto';
import { UpdateScoreDto } from './dto/update-score.dto';

@Injectable()
export class ScoreService {
  constructor(private readonly scoreRepository: ScoreRepository) {}

  findAll() {
    return this.scoreRepository.findAll();
  }

  async findOne(id: string) {
    const score = await this.scoreRepository.findById(id);
    if (!score) {
      throw new NotFoundException(`Score dengan id ${id} tidak ditemukan`);
    }
    return score;
  }

  create(dto: CreateScoreDto) {
    return this.scoreRepository.create(dto);
  }

  async update(id: string, dto: UpdateScoreDto) {
    await this.findOne(id); // pastikan data ada dulu sebelum update
    return this.scoreRepository.update(id, dto);
  }

  async remove(id: string) {
    await this.findOne(id); // pastikan data ada dulu sebelum hapus
    return this.scoreRepository.delete(id);
  }
}
