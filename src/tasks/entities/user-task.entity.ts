import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, Unique } from 'typeorm';
import { Task } from '../../tasks/entities/task.entity'; // Path to our new Task entity
import { User } from 'src/user/user.entity';

export enum UserTaskStatus {
  PENDING = 'PENDING',   // هنوز شروع نکرده
  STARTED = 'STARTED',   // روی دکمه انجام کلیک کرده
  COMPLETED = 'COMPLETED', // تسک رو با موفقیت انجام داده و جایزه رو گرفته
  FAILED = 'FAILED',     // تلاش کرده ولی موفق نبوده
}

@Entity('user_tasks')
@Unique(['user', 'task']) // Each user can have only one entry per task
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