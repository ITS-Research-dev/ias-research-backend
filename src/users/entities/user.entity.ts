import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Role } from '../../role/entities/role.entity';

@Entity('table_user')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  fullname!: string;

  @Column({
    unique: true,
  })
  ucredentials!: string;

  @Column()
  upassword!: string;

  @Column({ name: 'idrole', nullable: true, type: 'uuid' })
  idRole?: string;

  @ManyToOne(() => Role, (role) => role.users)
  @JoinColumn({ name: 'idrole' })
  role?: Role;
}
