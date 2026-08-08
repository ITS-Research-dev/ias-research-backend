// entities/score.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { Test } from '../../test/entities/test.entity';
import { User } from '../../user/entities/user.entity';

export interface Scoring {
  fungsionalitas: number;
  logika: number;
  syntax: number;
  code_style: number;
  dokumentasi: number;
  konsep: number;
}

@Entity('TABLE_SCORE')
export class Score {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  idTest: string;

  @Column({ type: 'uuid' })
  idUser: string;

  @Column('varchar')
  level: string;

  @Column('int')
  averageScore: number;

  @Column()
  flagOverride: boolean;
  
  @Column('int')
  hintUsage: number;

  @Column('jsonb', { default: {} })
  aiScore: Scoring;

  @Column('text')
  aiSuggestion: string;

  @Column('text')
  aiFinishTime: string;

  @Column('text')
  uCode: string;

  @Column({ type: 'uuid', nullable: true })
  overrideBy: string | null;

  @Column({ type: 'jsonb', nullable: true })
  teacherScore: Scoring | null;

  @Column({ type: 'text', nullable: true })
  teacherSuggestion: string | null;

  @CreateDateColumn()
  createdAt: Date;

  @ManyToOne(() => Test, (test) => test.scores)
  @JoinColumn({ name: 'idTest' })
  test: Test;

  @ManyToOne(() => User, (user) => user.scores)
  @JoinColumn({ name: 'idUser' })
  user: User;

  @ManyToOne(() => User, (user) => user.overriddenScores)
  @JoinColumn({ name: 'overrideBy' })
  overridingUser: User | null;
}
