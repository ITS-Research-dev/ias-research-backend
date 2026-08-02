// entities/class.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
} from 'typeorm';
import { ClassAssign } from '../../class-assign/entities/class-assign.entity';
import { Topic } from '../../topic/entities/topic.entity';

@Entity('TABLE_CLASS')
export class Class {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('varchar')
  title: string;

  @Column('varchar')
  waliKelas: string;

  @Column('int')
  countTotal: number;

  @OneToMany(() => ClassAssign, (classAssign) => classAssign.class)
  assignments: ClassAssign[];

  @OneToMany(() => Topic, (topic) => topic.class)
  topics: Topic[];
}