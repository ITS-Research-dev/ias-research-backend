import { Injectable, NotFoundException } from '@nestjs/common';
import { HintRepository } from './hint.repository';
import { CreateHintDto } from './dto/create-hint.dto';
import { UpdateHintDto } from './dto/update-hint.dto';

@Injectable()
export class HintService {
  constructor(private readonly hintRepository: HintRepository) {}

  findAll() {
    return this.hintRepository.findAll();
  }

  async findOne(id: string) {
    const hint = await this.hintRepository.findById(id);
    if (!hint) {
      throw new NotFoundException(`Hint dengan id ${id} tidak ditemukan`);
    }
    return hint;
  }

  create(dto: CreateHintDto) {
    return this.hintRepository.create(dto);
  }

  async update(id: string, dto: UpdateHintDto) {
    await this.findOne(id); // pastikan data ada dulu sebelum update
    return this.hintRepository.update(id, dto);
  }

  async remove(id: string) {
    await this.findOne(id); // pastikan data ada dulu sebelum hapus
    return this.hintRepository.delete(id);
  }
}
