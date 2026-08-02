// progress.repository.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Progress } from './entities/progress.entity';

@Injectable()
export class ProgressRepository {
  constructor(
    @InjectRepository(Progress)
    private readonly repo: Repository<Progress>,
  ) {}

  findAll(): Promise<Progress[]> {
    return this.repo.find();
  }

  findByCompositeId(idUser: string, idTopic: string): Promise<Progress | null> {
    return this.repo.findOneBy({ idUser, idTopic });
  }

  create(data: Partial<Progress>): Promise<Progress> {
    const entity = this.repo.create(data);
    return this.repo.save(entity);
  }

  async update(
    idUser: string,
    idTopic: string,
    data: Partial<Progress>,
  ): Promise<Progress | null> {
    await this.repo.update({ idUser, idTopic }, data);
    return this.findByCompositeId(idUser, idTopic);
  }

  async delete(idUser: string, idTopic: string): Promise<void> {
    await this.repo.delete({ idUser, idTopic });
  }
}