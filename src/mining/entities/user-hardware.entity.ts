import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { User } from '../../user/user.entity';
import { Hardware } from './hardware.entity';

@Entity('user_hardwares')
export class UserHardware {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  userId: number;

  @Column()
  hardwareId: number;

  @Column({ default: 0 }) // سطح ۰ یعنی کاربر هنوز این سخت‌افزار رو نخریده
  currentLevel: number;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  lastClaimTimestamp: Date;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user: User;

  @ManyToOne(() => Hardware)
  @JoinColumn({ name: 'hardwareId' })
  hardware: Hardware;
}