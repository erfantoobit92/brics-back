import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { Task } from '../entities/task.entity';

@Injectable()
export class AdminTasksService {
  constructor(
    @InjectRepository(Task)
    private readonly taskRepository: Repository<Task>,
  ) {}

  // ایجاد یک تسک جدید
  async create(createTaskDto: CreateTaskDto): Promise<Task> {
    const task = this.taskRepository.create(createTaskDto);
    return this.taskRepository.save(task);
  }

  // گرفتن همه تسک‌ها (بدون پجینیشن، برای پنل ادمین معمولا اوکیه)
  async findAll(): Promise<Task[]> {
    return this.taskRepository.find({ order: { title: 'ASC' } });
  }

  // پیدا کردن یک تسک با ID
  async findOne(id: string): Promise<Task> {
    const task = await this.taskRepository.findOneBy({ id });
    if (!task) {
      throw new NotFoundException(`Task with ID "${id}" not found`);
    }
    return task;
  }

  // آپدیت کردن یک تسک
  async update(id: string, updateTaskDto: UpdateTaskDto): Promise<Task> {
    // `preload` اول تسک رو پیدا میکنه و بعد فیلدهای جدید رو باهاش مرج میکنه
    const task = await this.taskRepository.preload({
      id: id,
      ...updateTaskDto,
    });
    if (!task) {
      throw new NotFoundException(`Task with ID "${id}" not found to update`);
    }
    return this.taskRepository.save(task);
  }

  // حذف یک تسک
  async remove(id: string): Promise<{ message: string }> {
    const task = await this.findOne(id); // متد findOne رو صدا میزنیم تا اگه تسک نبود ارور بده
    await this.taskRepository.remove(task);
    return { message: `Task with ID "${id}" has been deleted successfully.` };
  }
}