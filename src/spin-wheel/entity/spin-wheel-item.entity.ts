// src/spin-wheel/spin-wheel-item.entity.ts

import { ColumnNumericTransformer } from 'src/utils/column-numeric-transformer';
import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

// تعریف نوع جایزه
export enum SpinRewardType {
  COIN = 'coin', // سکه داخل بازی
  BRICS = 'brics',
  Empty = 'empty',
  // میتونی انواع دیگه‌ای هم اضافه کنی، مثلا آیتم خاص، NFT و...
}

// برای تبدیل bigint به string
class BigIntTransformer {
  to(data: number): number { return data; }
  from(data: string): number { return parseInt(data, 10); }
}

@Entity('spin_wheel_items')
export class SpinWheelItem {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 100, comment: 'Display name for the prize, e.g., "1,000 Coins"' })
  label: string;

  @Column({
    type: 'enum',
    enum: SpinRewardType,
    comment: 'The type of the reward',
  })
  type: SpinRewardType;

  @Column({
    type: 'numeric',
    precision: 20,
    scale: 6, // for 0.000001 precision
    default: 0,
    comment: 'The probability weight. Higher means more likely to be chosen.',
    transformer: new ColumnNumericTransformer(),
  })
  value: number;
  
  @Column({
    type: 'int',
    comment: 'The probability weight. Higher means more likely to be chosen.',
    default: 10
  })
  weight: number;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;
}