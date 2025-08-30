import { Controller, Get, Post, Param, UseGuards, Req } from '@nestjs/common';
import { TasksService } from './tasks.service';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('tasks')
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Get()
  async getTasks(@Req() req) {
    const userId = req.user.sub;
    return this.tasksService.getTasksForUser(userId);
  }

  @Post('/start/:id')
  async startTask(@Req() req, @Param('id') taskId: string) {
    const userId = req.user.sub;
    return this.tasksService.startTask(userId, taskId);
  }

  @Post('claim/:id')
  async claimReward(@Req() req, @Param('id') taskId: string) {
    const userId = req.user.sub;
    return this.tasksService.claimReward(userId, taskId);
  }

  //  @UseGuards(JwtAuthGuard)
  // @Post('complete/post-story')
  // async completePostStoryTask(@Req() req) {
  //   const userId = req.user.sub;
  //   return this.tasksService.handlePostStoryCompletion(userId);
  // }
}
