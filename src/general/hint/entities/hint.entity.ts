// entities/hint.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Test } from '../../test/entities/test.entity';

@Entity('TABLE_HINT')
export class Hint {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  idTest: string;

  @Column('text')
  hint1: string;

  @Column('text')
  hint2: string;

  @Column('text')
  hint3: string;

  @ManyToOne(() => Test, (test) => test.hints)
  @JoinColumn({ name: 'idTest' })
  test: Test;
}