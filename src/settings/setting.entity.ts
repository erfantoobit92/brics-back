import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity('settings')
export class Setting {
  @PrimaryColumn() // از PrimaryColumn استفاده می‌کنیم چون key ما منحصر به فرد است
  key: string;

  @Column({ type: 'text' })
  value: string;
}