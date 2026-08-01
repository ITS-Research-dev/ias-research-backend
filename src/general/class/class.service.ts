import { Injectable, NotFoundException } from '@nestjs/common';
import { ClassRepository } from './class.repository';
import { CreateClassDto } from './dto/create-class.dto';
import { UpdateClassDto } from './dto/update-class.dto';

@Injectable()
export class ClassService {
  constructor(private readonly classRepository: ClassRepository) {}

  findAll() {
    return this.classRepository.findAll();
  }

  async findOne(id: string) {
    const exist = await this.classRepository.findById(id);
    if (!exist) {
      throw new NotFoundException(`Class dengan id ${id} tidak ditemukan`);
    }
    return exist;
  }

  create(dto: CreateClassDto) {
    return this.classRepository.create(dto);
  }

  async update(id: string, dto: UpdateClassDto) {
    await this.findOne(id); // pastikan data ada dulu sebelum update
    return this.classRepository.update(id, dto);
  }

  async remove(id: string) {
    await this.findOne(id); // pastikan data ada dulu sebelum hapus
    return this.classRepository.delete(id);
  }
}
