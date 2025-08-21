import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { HardwareLevel } from './hardware-level.entity';
import { UserHardware } from './user-hardware.entity';

@Entity('hardwares')
export class Hardware {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @OneToMany(() => HardwareLevel, (level) => level.hardware)
  levels: HardwareLevel[];

  @OneToMany(() => UserHardware, (userHardware) => userHardware.hardware)
  userHardwares: UserHardware[];
}