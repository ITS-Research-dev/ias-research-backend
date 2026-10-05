import { Injectable, NotFoundException } from '@nestjs/common';
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
        isActive: true,
      },
      select: {
        id: true,
        title: true,
        startDate: true,
        progresses: { maxCount: true, progressCount: true },
      },
      order: {
        title: 'asc',
        startDate: 'desc',
      },
    });
  }

  findByUser(user: any): Promise<Topic[]> {
    return this.repo.find({
      where: {
        idClass: user.classId,
        isActive: true,
        progresses: { idUser: user.id },
      },
      relations: {
        progresses: true
      },
      select: {
        id: true,
        title: true,
        startDate: true,
        progresses: { maxCount: true, progressCount: true },
      },
      order: {
        title: 'asc',
        startDate: 'desc',
      },
    });
  }

  async findByTestId(testId: string) {
    const topic = await this.repo.findOne({
      where: { tests: { id: testId } },
      relations: { tests: true }
    });

    if(!topic) throw new NotFoundException(`Topic untuk testId ${testId} tidak ditemukan`);

    return this.repo.findOne({
      where: { id: topic.id },
      relations: { tests: true },
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
