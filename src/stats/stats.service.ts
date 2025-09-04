import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from 'src/user/user.entity'; // مسیر انتیتی User رو چک کن
import { Repository } from 'typeorm';

export interface DashboardStats {
  usersCount: number;
  // در آینده می‌تونی آمارهای دیگه رو اینجا اضافه کنی
  // tasksCompletedToday: number;
  // totalRevenue: number;
}

@Injectable()
export class StatsService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async getDashboardStats(): Promise<DashboardStats> {
    // .count() یک کوئری بهینه SELECT COUNT(*) به دیتابیس میزنه
    const usersCount = await this.userRepository.count();

    return {
      usersCount,
    };
  }
}