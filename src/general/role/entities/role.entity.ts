// entities/role.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
} from 'typeorm';
import { User } from '../../user/entities/user.entity';

@Entity('TABLE_ROLE')
export class Role {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('varchar')
  description: string;

  @OneToMany(() => User, (user) => user.role)
  users: User[];
}