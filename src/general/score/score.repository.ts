import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Score } from './entities/score.entity';

@Injectable()
export class ScoreRepository {
  constructor(
    @InjectRepository(Score)
    private readonly repo: Repository<Score>,
  ) {}

  findAll(): Promise<Score[]> {
    return this.repo.find();
  }

  findById(id: string): Promise<Score | null> {
    return this.repo.findOneBy({ id });
  }

  findByUserId(uId: string): Promise<Score[]> {
    return this.repo.find({ where: { idUser: uId } });
  }

  create(data: Partial<Score>): Promise<Score> {
    const entity = this.repo.create(data);
    return this.repo.save(entity);
  }

  async update(id: string, data: Partial<Score>): Promise<Score | null> {
    await this.repo.update(id, data);
    return this.findById(id);
  }

  async delete(id: string): Promise<void> {
    await this.repo.delete(id);
  }
}
