import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { CreateHardwareDto } from './dto/create-hardware.dto';
import { UpdateHardwareDto } from './dto/update-hardware.dto';
import { CreateHardwareLevelDto } from './dto/create-hardware-level.dto';
import { UpdateHardwareLevelDto } from './dto/update-hardware-level.dto';
import { AdminHardwaresService } from './admin-hardwares.service';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';

@Controller('admin/hardwares')
export class AdminHardwaresController {
  constructor(private readonly adminHardwaresService: AdminHardwaresService) {}

  // --- Hardware Endpoints ---

  @Roles('admin')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Post()
  @HttpCode(HttpStatus.CREATED)
  createHardware(@Body() createHardwareDto: CreateHardwareDto) {
    return this.adminHardwaresService.createHardware(createHardwareDto);
  }

  @Roles('admin')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Get()
  findAllHardwares() {
    return this.adminHardwaresService.findAllHardwares();
  }

  @Roles('admin')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Get(':id')
  findOneHardware(@Param('id', ParseIntPipe) id: number) {
    return this.adminHardwaresService.findOneHardware(id);
  }

  @Roles('admin')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Patch(':id')
  updateHardware(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateHardwareDto: UpdateHardwareDto,
  ) {
    return this.adminHardwaresService.updateHardware(id, updateHardwareDto);
  }

  @Roles('admin')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Delete(':id')
  removeHardware(@Param('id', ParseIntPipe) id: number) {
    return this.adminHardwaresService.removeHardware(id);
  }

  // --- HardwareLevel Endpoints ---
  // روت‌ها به صورت تو در تو تعریف میشن که منطقی‌تره

  @Roles('admin')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Post(':hardwareId/levels')
  @HttpCode(HttpStatus.CREATED)
  createHardwareLevel(
    @Param('hardwareId', ParseIntPipe) hardwareId: number,
    @Body() createLevelDto: CreateHardwareLevelDto,
  ) {
    return this.adminHardwaresService.createHardwareLevel(
      hardwareId,
      createLevelDto,
    );
  }

  @Roles('admin')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Get(':hardwareId/levels')
  findAllLevelsForHardware(
    @Param('hardwareId', ParseIntPipe) hardwareId: number,
  ) {
    return this.adminHardwaresService.findAllLevelsForHardware(hardwareId);
  }

  // برای آپدیت و حذف یک Level خاص، دیگه نیازی به hardwareId در URL نداریم چون levelId یکتاست
  @Roles('admin')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Patch('levels/:levelId')
  updateHardwareLevel(
    @Param('levelId', ParseIntPipe) levelId: number,
    @Body() updateLevelDto: UpdateHardwareLevelDto,
  ) {
    return this.adminHardwaresService.updateHardwareLevel(
      levelId,
      updateLevelDto,
    );
  }

  @Roles('admin')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Delete('levels/:levelId')
  removeHardwareLevel(@Param('levelId', ParseIntPipe) levelId: number) {
    return this.adminHardwaresService.removeHardwareLevel(levelId);
  }
}
