// entities/class-assign.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../../user/entities/user.entity';
import { Class } from '../../class/entities/class.entity';
import { RoleState } from './role-state.enum';

@Entity('TABLE_CLASS_ASSIGN')
export class ClassAssign {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  idUser: string;

  @Column({ type: 'uuid' })
  idClass: string;

  @Column({ type: 'enum', enum: RoleState })
  state: RoleState;

  @ManyToOne(() => User, (user) => user.assignments)
  @JoinColumn({ name: 'idUser' })
  user: User;

  @ManyToOne(() => Class, (cls) => cls.assignments)
  @JoinColumn({ name: 'idClass' })
  class: Class;
}