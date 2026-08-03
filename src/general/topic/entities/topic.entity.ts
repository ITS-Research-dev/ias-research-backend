// entities/topic.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { Class } from '../../class/entities/class.entity';
import { Test } from '../../test/entities/test.entity';
import { Progress } from '../../progress/entities/progress.entity';

@Entity('TABLE_TOPIC')
export class Topic {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  idClass: string;

  @Column('varchar')
  title: string;

  @Column('text')
  subject: string;

  @Column('text')
  description: string;
  
  @Column('date')
  startDate: string;

  @Column()
  isActive: boolean;

  @ManyToOne(() => Class, (cls) => cls.topics)
  @JoinColumn({ name: 'idClass' })
  class: Class;

  @OneToMany(() => Test, (test) => test.topic)
  tests: Test[];

  @OneToMany(() => Progress, (progress) => progress.topic)
  progresses: Progress[];
}