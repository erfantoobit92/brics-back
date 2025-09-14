// src/admin/boosts.controller.ts

import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseIntPipe,
  ValidationPipe,
  UseGuards,
} from '@nestjs/common';
import { BoostsService } from '../boosts.service';
import { CreateBoostLevelDto } from '../dto/create-boost-level.dto';
import { UpdateBoostLevelDto } from '../dto/update-boost-level.dto';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
// import { AdminAuthGuard } from '../auth/admin-auth.guard'; // فرض میکنیم یه گارد برای ادمین دارید

// @UseGuards(AdminAuthGuard) // این گارد رو برای محافظت از تمام روت‌های ادمین فعال کنید
@Controller('admin/boosts')
export class BoostsController {
  constructor(private readonly boostsService: BoostsService) {}

  @Roles('admin')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Post()
  create(@Body(ValidationPipe) createBoostLevelDto: CreateBoostLevelDto) {
    return this.boostsService.create(createBoostLevelDto);
  }

  @Roles('admin')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Get()
  findAll() {
    return this.boostsService.findAll();
  }

  @Roles('admin')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.boostsService.findOne(id);
  }

  @Roles('admin')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body(ValidationPipe) updateBoostLevelDto: UpdateBoostLevelDto,
  ) {
    return this.boostsService.update(id, updateBoostLevelDto);
  }

  @Roles('admin')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.boostsService.remove(id);
  }
}
