import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from 'src/user/user.entity'; // مسیر انتیتی User رو چک کن
import { StatsController } from './stats.controller';
import { StatsService } from './stats.service';

@Module({
  imports: [TypeOrmModule.forFeature([User])], // به ریپازیتوری User نیاز داریم
  controllers: [StatsController],
  providers: [StatsService],
})
export class StatsModule {}