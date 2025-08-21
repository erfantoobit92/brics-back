import { UserHardware } from 'src/mining/entities/user-hardware.entity';
import { ColumnNumericTransformer } from 'src/utils/column-numeric-transformer';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  OneToMany,
  ManyToOne,
  JoinColumn,
} from 'typeorm';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'bigint', unique: true })
  telegramId: number;

  @Column({ nullable: true })
  username: string;

  @Column({ nullable: true })
  firstName: string;

  @Column({ type: 'text', nullable: true }) // از نوع text استفاده می‌کنیم چون URL ممکنه طولانی باشه
  photoUrl: string | null;

  @Column({
    type: 'numeric', // <<-- نوع را به numeric تغییر دهید
    precision: 20, // <<-- حداکثر تعداد کل ارقام
    scale: 4, // <<-- تعداد ارقام بعد از اعشار (۴ رقم برای دقت کافیه)
    default: 5000,
    transformer: new ColumnNumericTransformer(), // <<-- مطمئن شوید transformer وجود دارد
  })
  balance: number;

  @Column({
    type: 'numeric',
    precision: 20,
    scale: 6, // for 0.000001 precision
    default: 0,
    transformer: new ColumnNumericTransformer(), // Assuming you have this transformer for numeric types
  })
  bricsBalance: number;

  @Column({ default: 1 })
  tapLevel: number;

  @Column({ default: 1000 })
  energyLimit: number;

  @Column({ default: 1000 })
  currentEnergy: number;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  lastEnergyRefill: Date;

  @CreateDateColumn()
  createdAt: Date;

  // این فیلد ID معرف رو نگه میداره (اختیاری)
  @Column({ type: 'integer', nullable: true })
  referrerId: number | null; // اسم رو عوض کردم که واضح‌تر باشه

  // ADD THESE NEW COLUMNS
  @Column({
    type: 'numeric',
    precision: 20,
    scale: 6,
    default: 0,
    transformer: new ColumnNumericTransformer(),
  })
  unclaimedMiningReward: number;

  @Column({
    type: 'timestamp with time zone',
    default: () => 'CURRENT_TIMESTAMP',
  })
  lastMiningInteraction: Date;

  // ADD THIS RELATION
  @OneToMany(() => UserHardware, (hardware) => hardware.user)
  hardwares: UserHardware[];

  // ارتباط Many-to-One: هر کاربر (user) توسط یک نفر (referrer) معرفی شده
  @ManyToOne(
    () => User,
    (referrer) => referrer.referrals, // به TypeORM میگیم که طرف مقابل این ارتباط، فیلد 'referrals' است
    { onDelete: 'SET NULL', onUpdate: 'CASCADE' }, // رفتار در زمان حذف/آپدیت معرف
  )
  @JoinColumn({ name: 'referrerId' }) // صریحاً میگیم این ارتباط از طریق ستون 'referrerId' برقرار میشه
  referrer: User;

  // ارتباط One-to-Many: هر کاربر (referrer) میتونه افراد زیادی (referrals) رو معرفی کنه
  @OneToMany(
    () => User,
    (user) => user.referrer, // به TypeORM میگیم که طرف مقابل این ارتباط، فیلد 'referrer' است
  )
  referrals: User[];
}
