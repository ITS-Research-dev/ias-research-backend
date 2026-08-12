import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Class } from './entities/class.entity';
import { formatDuration } from '../../../common/utils/general';

export interface TeacherDashboardSummary {
  totalStudents: number;
  averageAssessmentTime: string;
  averageScore: number;
}

export interface TopicScore {
  topic: string;
  score: number;
}

export interface TeacherDashboardData {
  summary: TeacherDashboardSummary;
  topicScores: TopicScore[];
}

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

  async dashboardData(idClass: string): Promise<TeacherDashboardData> {
    const [summaryRaw, topicRows] = await Promise.all([
      this.repo
        .createQueryBuilder('class')
        .leftJoin('class.topics', 'topic')
        .leftJoin('topic.tests', 'test')
        .leftJoin('test.scores', 'score')
        .leftJoin('score.user', 'user')
        .select('COUNT(DISTINCT user.id)', 'totalStudents')
        .addSelect('AVG(score.averageScore)', 'averageScore')
        .addSelect('AVG(EXTRACT(EPOCH FROM score.aiFinishTime))', 'avgSeconds')
        .where('class.id = :idClass', { idClass })
        .getRawOne(),

      this.repo
        .createQueryBuilder('class')
        .leftJoin('class.topics', 'topic')
        .leftJoin('topic.tests', 'test')
        .leftJoin('test.scores', 'score')
        .select('topic.title', 'topic')
        .addSelect('AVG(score.averageScore)', 'score')
        .where('class.id = :idClass', { idClass })
        .groupBy('topic.id')
        .addGroupBy('topic.title')
        .getRawMany(),
    ]);

    const summary: TeacherDashboardSummary = {
      totalStudents: Number(summaryRaw?.totalStudents ?? 0),
      averageAssessmentTime: formatDuration(Number(summaryRaw?.avgSeconds ?? 0)),
      averageScore: Math.round(Number(summaryRaw?.averageScore ?? 0)),
    };

    const topicScores: TopicScore[] = topicRows.map((r) => ({
      topic: r.topic,
      score: Math.round(Number(r.score ?? 0)),
    }));

    return { summary, topicScores };
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
