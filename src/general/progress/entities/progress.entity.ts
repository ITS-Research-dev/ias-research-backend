// entities/progress.entity.ts
import {
  Entity,
  PrimaryColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../../user/entities/user.entity';
import { Topic } from '../../topic/entities/topic.entity';

@Entity('TABLE_PROGRESS')
export class Progress {
  @PrimaryColumn({ type: 'uuid' })
  idUser: string;

  @PrimaryColumn({ type: 'uuid' })
  idTopic: string;

  @Column('int')
  maxCount: number;

  @Column('int')
  progressCount: number;

  @ManyToOne(() => User, (user) => user.progresses)
  @JoinColumn({ name: 'idUser' })
  user: User;

  @ManyToOne(() => Topic, (topic) => topic.progresses)
  @JoinColumn({ name: 'idTopic' })
  topic: Topic;
}