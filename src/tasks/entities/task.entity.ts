import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';
import { TaskType } from '../enum/task-type.enum';

@Entity('tasks')
export class Task {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column({ nullable: true })
  description: string;

  @Column({ type: 'bigint' })
  rewardCoin: number;

  @Column({
    type: 'enum',
    enum: TaskType,
  })
  type: TaskType;

  // This is the magic field!
  // For VISIT_WEBSITE: { url: '...', durationSeconds: 60 }
  // For ON_CHAIN_TRANSACTION: { network: 'TON', toAddress: '...', amount: '2' }
  @Column({ type: 'jsonb', default: {} })
  metadata: Record<string, any>;

  @Column({ default: true })
  isActive: boolean;
}