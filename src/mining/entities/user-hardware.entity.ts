import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Hardware } from './hardware.entity';
import { User } from 'src/user/user.entity';

@Entity('user_hardwares')
export class UserHardware {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User, (user) => user.hardwares, { onDelete: 'CASCADE' })
  user: User;

  @ManyToOne(() => Hardware, (hardware) => hardware.userHardwares, {
    eager: true, // Automatically load the hardware info
  })
  hardware: Hardware;

  @Column({ default: 1 })
  level: number;
}
