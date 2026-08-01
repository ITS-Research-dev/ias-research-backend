// src/modules/user/entities/user.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Role } from '../../role/entities/role.entity';
import { ClassAssign } from '../../class-assign/entities/class-assign.entity';
import { Score } from '../../score/entities/score.entity';
import { Progress } from '../../progress/entities/progress.entity';

@Entity('TABLE_USER')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  idRole: string;

  @Column({ type: 'varchar' })
  fullName: string;

  @Column({ type: 'varchar' })
  uCredentials: string;

  @Column({ type: 'varchar' })
  uPassword: string;

  @ManyToOne(() => Role, (role) => role.users)
  @JoinColumn({ name: 'idRole' })
  role: Role;

  @OneToMany(() => ClassAssign, (classAssign) => classAssign.user)
  assignments: ClassAssign[];
  
  @OneToMany(() => Score, (score) => score.user)
  scores: Score[];
  
  @OneToMany(() => Score, (score) => score.overridingUser)
  overriddenScores: Score[];
 
  @OneToMany(() => Progress, (progress) => progress.user)
  progresses: Progress[];

  
}
