import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { HardwareLevel } from './hardware-level.entity';
import { UserHardware } from './user-hardware.entity';

@Entity('hardwares')
export class Hardware {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'jsonb', default: {} })
  name: Record<string, any>;

  @Column({ type: 'jsonb', default: {} })
  description: Record<string, any>;

  @OneToMany(() => HardwareLevel, (level) => level.hardware)
  levels: HardwareLevel[];

  @OneToMany(() => UserHardware, (userHardware) => userHardware.hardware)
  userHardwares: UserHardware[];
}
