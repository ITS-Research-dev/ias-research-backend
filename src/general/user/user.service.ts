// src/modules/user/user.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { UserRepository } from './user.repository';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UserService {
  constructor(private readonly userRepository: UserRepository) {}

  findAll() {
    return this.userRepository.findAll();
  }

  async findOne(id: string) {
    const user = await this.userRepository.findById(id);
    if (!user) {
      throw new NotFoundException(`User dengan id ${id} tidak ditemukan`);
    }
    return user;
  }

  async create(dto: CreateUserDto) {
    dto.uPassword = await bcrypt.hash(dto.uPassword, 10);
    return this.userRepository.create(dto);
  }

  async update(id: string, dto: UpdateUserDto) {
    await this.findOne(id);
    return this.userRepository.update(id, dto);
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.userRepository.delete(id);
  }
}
