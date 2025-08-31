import {
  Controller,
  Get,
  Post,
  Param,
  UseGuards,
  Req,
  Body,
} from '@nestjs/common';
import { TasksService } from './tasks.service';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { BotAuthGuard } from 'src/auth/bot-auth.guard';
import { CompleteStoryTaskDto } from './dto/complete-story-task.dto';
import { Roles } from 'src/auth/decorators/roles.decorator';

@Controller('tasks')
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @UseGuards(JwtAuthGuard)
  @Roles('user')
  @Get()
  async getTasks(@Req() req) {
    const userId = req.user.sub;
    return this.tasksService.getTasksForUser(userId);
  }

  @UseGuards(JwtAuthGuard)
  @Roles('user')
  @Post('/start/:id')
  async startTask(@Req() req, @Param('id') taskId: string) {
    const userId = req.user.sub;
    return this.tasksService.startTask(userId, taskId);
  }

  @UseGuards(JwtAuthGuard)
  @Roles('user')
  @Post('claim/:id')
  async claimReward(@Req() req, @Param('id') taskId: string) {
    const userId = req.user.sub;
    return this.tasksService.claimReward(userId, taskId);
  }

  @UseGuards(BotAuthGuard)
  @Post('internal/complete-story-from-bot')
  async completeStoryTaskFromBot(@Body() dto: CompleteStoryTaskDto) {
    return this.tasksService.handleStoryForwarded(dto.telegramId);
  }
}
