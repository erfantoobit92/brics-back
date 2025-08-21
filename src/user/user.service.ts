import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './user.entity';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  async findOne(id: number): Promise<User | null> {
    return this.usersRepository.findOneBy({ id });
  }

  async findReferrals(userId: number) {
    const userWithReferrals = await this.usersRepository.findOne({
      where: { id: userId },
      relations: ['referrals'], // این خط باعث میشه دوستانش هم لود بشن
    });

    if (!userWithReferrals) {
      throw new Error('User not found');
    }

    // فقط اطلاعات ضروری رو به فرانت می‌فرستیم
    return userWithReferrals.referrals.map(ref => ({
      id: ref.id,
      firstName: ref.firstName,
      username: ref.username,
    }));
  }
}