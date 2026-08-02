import { Injectable, NotFoundException } from '@nestjs/common';
import { TestRepository } from './test.repository';
import { CreateTestDto } from './dto/create-test.dto';
import { UpdateTestDto } from './dto/update-test.dto';

@Injectable()
export class TestService {
  constructor(private readonly testRepository: TestRepository) {}

  findAll() {
    return this.testRepository.findAll();
  }

  async findOne(id: string) {
    const test = await this.testRepository.findById(id);
    if (!test) {
      throw new NotFoundException(`Test dengan id ${id} tidak ditemukan`);
    }
    return test;
  }

  create(dto: CreateTestDto) {
    return this.testRepository.create(dto);
  }

  async update(id: string, dto: UpdateTestDto) {
    await this.findOne(id); // pastikan data ada dulu sebelum update
    return this.testRepository.update(id, dto);
  }

  async remove(id: string) {
    await this.findOne(id); // pastikan data ada dulu sebelum hapus
    return this.testRepository.delete(id);
  }
}
