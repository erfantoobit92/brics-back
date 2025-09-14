// src/boosts/boost-level.entity.ts

import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

// برای تبدیل bigint به string در زمان ارسال و دریافت از دیتابیس
// چون جاوااسکریپت با اعداد بزرگ مشکل داره
class BigIntTransformer {
  to(data: number): number {
    return data;
  }
  from(data: string): number {
    return parseInt(data, 10);
  }
}

@Entity('boost_levels')
export class BoostLevel {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int', unique: true, comment: 'The tap level value, e.g., 1, 2, 3' })
  level: number;

  @Column({
    type: 'bigint',
    comment: 'The cost in game currency to upgrade to this level',
    transformer: new BigIntTransformer(), // مهم
  })
  cost: number;
}