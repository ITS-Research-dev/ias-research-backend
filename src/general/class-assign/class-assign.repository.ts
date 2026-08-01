import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ClassAssign } from './entities/class-assign.entity';

@Injectable()
export class ClassAssignRepository {
  constructor(
    @InjectRepository(ClassAssign)
    private readonly repo: Repository<ClassAssign>,
  ) {}

  findAll(): Promise<ClassAssign[]> {
    return this.repo.find();
  }

  findById(id: string): Promise<ClassAssign | null> {
    return this.repo.findOneBy({ id });
  }

  create(data: Partial<ClassAssign>): Promise<ClassAssign> {
    const entity = this.repo.create(data);
    return this.repo.save(entity);
  }

  async update(id: string, data: Partial<ClassAssign>): Promise<ClassAssign | null> {
    await this.repo.update(id, data);
    return this.findById(id);
  }

  async delete(id: string): Promise<void> {
    await this.repo.delete(id);
  }
}
