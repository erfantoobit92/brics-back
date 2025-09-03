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
} from '@nestjs/common';
import { CreateHardwareDto } from './dto/create-hardware.dto';
import { UpdateHardwareDto } from './dto/update-hardware.dto';
import { CreateHardwareLevelDto } from './dto/create-hardware-level.dto';
import { UpdateHardwareLevelDto } from './dto/update-hardware-level.dto';
import { AdminHardwaresService } from './admin-hardwares.service';

@Controller('admin/hardwares')
export class AdminHardwaresController {
  constructor(private readonly adminHardwaresService: AdminHardwaresService) {}

  // --- Hardware Endpoints ---

  @Post()
  @HttpCode(HttpStatus.CREATED)
  createHardware(@Body() createHardwareDto: CreateHardwareDto) {
    return this.adminHardwaresService.createHardware(createHardwareDto);
  }

  @Get()
  findAllHardwares() {
    return this.adminHardwaresService.findAllHardwares();
  }

  @Get(':id')
  findOneHardware(@Param('id', ParseIntPipe) id: number) {
    return this.adminHardwaresService.findOneHardware(id);
  }

  @Patch(':id')
  updateHardware(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateHardwareDto: UpdateHardwareDto,
  ) {
    return this.adminHardwaresService.updateHardware(id, updateHardwareDto);
  }

  @Delete(':id')
  removeHardware(@Param('id', ParseIntPipe) id: number) {
    return this.adminHardwaresService.removeHardware(id);
  }

  // --- HardwareLevel Endpoints ---
  // روت‌ها به صورت تو در تو تعریف میشن که منطقی‌تره

  @Post(':hardwareId/levels')
  @HttpCode(HttpStatus.CREATED)
  createHardwareLevel(
    @Param('hardwareId', ParseIntPipe) hardwareId: number,
    @Body() createLevelDto: CreateHardwareLevelDto,
  ) {
    return this.adminHardwaresService.createHardwareLevel(hardwareId, createLevelDto);
  }

  @Get(':hardwareId/levels')
  findAllLevelsForHardware(@Param('hardwareId', ParseIntPipe) hardwareId: number) {
    return this.adminHardwaresService.findAllLevelsForHardware(hardwareId);
  }

  // برای آپدیت و حذف یک Level خاص، دیگه نیازی به hardwareId در URL نداریم چون levelId یکتاست
  @Patch('levels/:levelId')
  updateHardwareLevel(
    @Param('levelId', ParseIntPipe) levelId: number,
    @Body() updateLevelDto: UpdateHardwareLevelDto,
  ) {
    return this.adminHardwaresService.updateHardwareLevel(levelId, updateLevelDto);
  }

  @Delete('levels/:levelId')
  removeHardwareLevel(@Param('levelId', ParseIntPipe) levelId: number) {
    return this.adminHardwaresService.removeHardwareLevel(levelId);
  }
}