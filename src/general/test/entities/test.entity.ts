// entities/test.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { Topic } from '../../topic/entities/topic.entity';
import { Hint } from '../../hint/entities/hint.entity';
import { Score } from '../../score/entities/score.entity';

@Entity('TABLE_TEST')
export class Test {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  idTopic: string;

  @Column('varchar')
  title: string;

  @Column('text')
  question: string;

  @Column('varchar')
  expOutput: string;

  @Column('int')
  maxTries: number;

  @Column('boolean')
  isActive: boolean;

  @ManyToOne(() => Topic, (topic) => topic.tests)
  @JoinColumn({ name: 'idTopic' })
  topic: Topic;

  @OneToMany(() => Hint, (hint) => hint.test)
  hints: Hint[];

  @OneToMany(() => Score, (score) => score.test)
  scores: Score[];
}