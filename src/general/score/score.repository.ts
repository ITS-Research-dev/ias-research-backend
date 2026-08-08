import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Score } from './entities/score.entity';
import { CreateScoreDto } from './dto/create-score.dto';
import { UpdateScoreDto } from './dto/update-score.dto';

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

  findProfile(uId: string): Promise<Score[]> {
   return this.repo.find({
    where: { idUser: uId },
    relations: {
      test: { topic: true },
    },
    select: {
      id: true,
      averageScore: true,
      level: true,
      aiScore: true,
      teacherScore: true,
      hintUsage: true,
      createdAt: true,
      test: {
        title: true,
        topic: { title: true },
      },
    },
  });
  }

  create(data: Partial<CreateScoreDto>): Promise<Score> {
    const entity = this.repo.create(data);
    return this.repo.save(entity);
  }

  async update(id: string, data: Partial<UpdateScoreDto>): Promise<Score | null> {
    await this.repo.update(id, data);
    return this.findById(id);
  }

  async delete(id: string): Promise<void> {
    await this.repo.delete(id);
  }
}
