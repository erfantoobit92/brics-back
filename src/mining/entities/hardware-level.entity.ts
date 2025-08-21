import {
  Column,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { Hardware } from './hardware.entity';

@Entity('hardware_levels')
@Unique(['hardware', 'level'])
export class HardwareLevel {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Hardware, (hardware) => hardware.levels, {
    onDelete: 'CASCADE',
  })
  hardware: Hardware;

  @Column()
  level: number;

  @Column({ type: 'numeric', precision: 20, scale: 8, default: 0 })
  miningRatePerHour: number;

  // Cost to upgrade to the *next* level. Last level might have a cost of 0 or null.
  @Column({ type: 'numeric', precision: 20, scale: 2, default: 0 })
  upgradeCost: number;
}