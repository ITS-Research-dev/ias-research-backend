// role.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { RoleRepository } from './role.repository';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';

@Injectable()
export class RoleService {
  constructor(private readonly roleRepository: RoleRepository) {}

  findAll() {
    return this.roleRepository.findAll();
  }

  async findOne(id: string) {
    const role = await this.roleRepository.findById(id);
    if (!role) {
      throw new NotFoundException(`Role dengan id ${id} tidak ditemukan`);
    }
    return role;
  }

  create(dto: CreateRoleDto) {
    return this.roleRepository.create(dto);
  }

  async update(id: string, dto: UpdateRoleDto) {
    await this.findOne(id); // pastikan data ada dulu sebelum update
    return this.roleRepository.update(id, dto);
  }

  async remove(id: string) {
    await this.findOne(id); // pastikan data ada dulu sebelum hapus
    return this.roleRepository.delete(id);
  }
}