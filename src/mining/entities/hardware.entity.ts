import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { HardwareLevel } from './hardware-level.entity';

@Entity('hardwares')
export class Hardware {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  name: string;

  @Column('text')
  description: string;

  @Column()
  maxLevel: number;

  @Column({ type: 'real', default: 2.0 }) // به ساعت
  storageHours: number;

  @OneToMany(() => HardwareLevel, (level) => level.hardware)
  levels: HardwareLevel[];
}
