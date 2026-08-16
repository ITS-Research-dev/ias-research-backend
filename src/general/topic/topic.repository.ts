import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Topic } from './entities/topic.entity';

@Injectable()
export class TopicRepository {
  constructor(
    @InjectRepository(Topic)
    private readonly repo: Repository<Topic>,
  ) {}

  findAll(): Promise<Topic[]> {
    return this.repo.find();
  }

  findById(id: string): Promise<Topic | null> {
    return this.repo.findOneBy({ id });
  }

  findByClassId(cId: string): Promise<Topic[]> {
    return this.repo.find({
      where: {
        idClass: cId,
        isActive: true
      },
      select: {
        id: true,
        title: true,
        startDate: true,
        progresses: { maxCount: true, progressCount: true },
      },
      order: {
        title: "asc",
        startDate: "desc"
      }
  });
}

  create(data: Partial<Topic>): Promise<Topic> {
    const entity = this.repo.create(data);
    return this.repo.save(entity);
  }

  async update(id: string, data: Partial<Topic>): Promise<Topic | null> {
    await this.repo.update(id, data);
    return this.findById(id);
  }

  async delete(id: string): Promise<void> {
    await this.repo.delete(id);
  }
}
