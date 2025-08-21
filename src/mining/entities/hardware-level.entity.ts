import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Hardware } from './hardware.entity';

@Entity('hardware_levels')
export class HardwareLevel {
  @PrimaryGeneratedColumn()
  id: number;

  // --- ستون جدید رو اینجا اضافه کن ---
  @Column()
  hardwareId: number;

  @Column()
  level: number;

  @Column({ type: 'numeric', precision: 20, scale: 8 })
  bricsPerHour: number;

  @Column({ type: 'bigint' })
  upgradeCostCoins: number;

  @Column({ type: 'numeric', precision: 20, scale: 8, default: 0 })
  upgradeCostBrics: number;

  @ManyToOne(() => Hardware, (hardware) => hardware.levels)
  @JoinColumn({ name: 'hardwareId' }) // به TypeORM میگیم که این ارتباط از ستون hardwareId استفاده می‌کنه
  hardware: Hardware;
}
