import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Class } from './entities/class.entity';

@Injectable()
export class ClassRepository {
  constructor(
    @InjectRepository(Class)
    private readonly repo: Repository<Class>,
  ) {}

  findAll(): Promise<Class[]> {
    return this.repo.find();
  }

  findById(id: string): Promise<Class | null> {
    return this.repo.findOneBy({ id });
  }

  create(data: Partial<Class>): Promise<Class> {
    const entity = this.repo.create(data);
    return this.repo.save(entity);
  }

  async update(id: string, data: Partial<Class>): Promise<Class | null> {
    await this.repo.update(id, data);
    return this.findById(id);
  }

  async delete(id: string): Promise<void> {
    await this.repo.delete(id);
  }
}
