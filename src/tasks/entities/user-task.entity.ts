import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  Unique,
} from 'typeorm';
import { Task } from '../../tasks/entities/task.entity'; 
import { User } from 'src/user/user.entity';

export enum UserTaskStatus {
  PENDING = 'PENDING',
  STARTED = 'STARTED',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
}

@Entity('user_tasks')
@Unique(['user', 'task'])
export class UserTask {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, (user) => user.userTasks)
  user: User;

  @ManyToOne(() => Task, (task) => task.id)
  task: Task;

  @Column({
    type: 'enum',
    enum: UserTaskStatus,
    default: UserTaskStatus.PENDING,
  })
  status: UserTaskStatus;

  @Column({ type: 'timestamp with time zone', nullable: true })
  startedAt: Date;

  @Column({ type: 'timestamp with time zone', nullable: true })
  completedAt: Date;
}
