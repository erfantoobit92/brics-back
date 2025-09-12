import {
  Controller,
  Get,
  Post,
  Param,
  UseGuards,
  Req,
  Body,
  HttpCode,
  HttpStatus,
  ParseUUIDPipe,
  Patch,
  Delete,
  ValidationPipe,
} from '@nestjs/common';
import { TasksService } from './tasks.service';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { BotAuthGuard } from 'src/auth/bot-auth.guard';
import { CompleteStoryTaskDto } from './dto/complete-story-task.dto';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { AdminTasksService } from './admin/admin-tasks.service';
import { CreateTaskDto } from './admin/dto/create-task.dto';
import { UpdateTaskDto } from './admin/dto/update-task.dto';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { IdParamsDto } from './dto/id-param.dto';

@Controller('tasks')
export class TasksController {
  constructor(
    private readonly tasksService: TasksService,
    private readonly adminTasksService: AdminTasksService,
  ) {}

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
  async claimReward(@Req() req, @Param() params: IdParamsDto) {
    console.log(req.user.sub);

    const userId = req.user.sub;
    return this.tasksService.claimReward(userId, params.id);
  }

  @UseGuards(BotAuthGuard)
  @Post('internal/complete-story-from-bot')
  async completeStoryTaskFromBot(@Body() dto: CompleteStoryTaskDto) {
    return this.tasksService.handleStoryForwarded(dto.telegramId);
  }

  @Roles('admin')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Post('/admin') // POST /admin/tasks
  @HttpCode(HttpStatus.CREATED)
  create(@Body() createTaskDto: CreateTaskDto) {
    return this.adminTasksService.create(createTaskDto);
  }

  @Roles('admin')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Get('/admin') // GET /admin/tasks
  findAll() {
    return this.adminTasksService.findAll();
  }

  @Roles('admin')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Get('/admin/:id') // GET /admin/tasks/:id
  findOne(@Param() params: IdParamsDto) {
    return this.adminTasksService.findOne(params.id);
  }

  @Roles('admin')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Patch('/admin/:id')
  update(
  @Param(new ValidationPipe({ transform: true })) params: IdParamsDto,
    @Body() updateTaskDto: UpdateTaskDto,
  ) {
    return this.adminTasksService.update(params.id, updateTaskDto);
  }

  @Roles('admin')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Delete('/admin/:id') // DELETE /admin/tasks/:id
  @HttpCode(HttpStatus.OK)
  remove(@Param() params: IdParamsDto) {
    return this.adminTasksService.remove(params.id);
  }
}
