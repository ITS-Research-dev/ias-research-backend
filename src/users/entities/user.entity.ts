import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Role } from '../../role/entities/role.entity';

@Entity('TABLE_USER')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  fullName!: string;

  @Column({
    unique: true,
  })
  uCredentials!: string;

  @Column()
  uPassword!: string;

  @Column({ name: 'idRole', nullable: true, type: 'uuid' })
  idRole?: string;

  @ManyToOne(() => Role, (Role) => Role.users)
  @JoinColumn({ name: 'idRole' })
  role?: Role;
}
