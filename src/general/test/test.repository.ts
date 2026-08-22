import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Test } from './entities/test.entity';

@Injectable()
export class TestRepository {
  constructor(
    @InjectRepository(Test)
    private readonly repo: Repository<Test>,
  ) {}

  findAll(): Promise<Test[]> {
    return this.repo.find();
  }

  findById(id: string): Promise<Test | null> {
    return this.repo.findOneBy({ id });
  }

  findByTopicId(idTopic: string): Promise<Test[]> {
    return this.repo.find({
      where: { idTopic },
      relations: { hints: true },
      order: { title: 'ASC' },
    });
  }

  create(data: Partial<Test>): Promise<Test> {
    const entity = this.repo.create(data);
    return this.repo.save(entity);
  }

  async update(id: string, data: Partial<Test>): Promise<Test | null> {
    await this.repo.update(id, data);
    return this.findById(id);
  }

  async delete(id: string): Promise<void> {
    await this.repo.delete(id);
  }
}
