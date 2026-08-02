import { Injectable, NotFoundException } from '@nestjs/common';
import { ClassAssignRepository } from './class-assign.repository';
import { CreateClassAssignDto } from './dto/create-class-assign.dto';
import { UpdateClassAssignDto } from './dto/update-class-assign.dto';

@Injectable()
export class ClassAssignService {
  constructor(private readonly classAssignRepository: ClassAssignRepository) {}

  findAll() {
    return this.classAssignRepository.findAll();
  }

  async findOne(id: string) {
    const classAssign = await this.classAssignRepository.findById(id);
    if (!classAssign) {
      throw new NotFoundException(`ClassAssign dengan id ${id} tidak ditemukan`);
    }
    return classAssign;
  }

  create(dto: CreateClassAssignDto) {
    return this.classAssignRepository.create(dto);
  }

  async update(id: string, dto: UpdateClassAssignDto) {
    await this.findOne(id); // pastikan data ada dulu sebelum update
    return this.classAssignRepository.update(id, dto);
  }

  async remove(id: string) {
    await this.findOne(id); // pastikan data ada dulu sebelum hapus
    return this.classAssignRepository.delete(id);
  }
}
