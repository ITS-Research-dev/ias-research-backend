import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Hint } from './entities/hint.entity';

@Injectable()
export class HintRepository {
  constructor(
    @InjectRepository(Hint)
    private readonly repo: Repository<Hint>,
  ) {}

  findAll(): Promise<Hint[]> {
    return this.repo.find();
  }

  findById(id: string): Promise<Hint | null> {
    return this.repo.findOneBy({ id });
  }

  async findByTestNLevel(idTest: string, level: number): Promise<string | null> {
    const hint = await this.repo.findOne({ where: { idTest } });
    if (!hint) return null;

    const key = `hint${level}` as keyof Hint;
    const value = hint[key];

    return (value as string) ?? null;
  }

  create(data: Partial<Hint>): Promise<Hint> {
    const entity = this.repo.create(data);
    return this.repo.save(entity);
  }

  async update(id: string, data: Partial<Hint>): Promise<Hint | null> {
    await this.repo.update(id, data);
    return this.findById(id);
  }

  async delete(id: string): Promise<void> {
    await this.repo.delete(id);
  }
}
