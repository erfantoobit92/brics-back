import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateHardwareDto } from './dto/create-hardware.dto';
import { UpdateHardwareDto } from './dto/update-hardware.dto';
import { CreateHardwareLevelDto } from './dto/create-hardware-level.dto';
import { UpdateHardwareLevelDto } from './dto/update-hardware-level.dto';
import { Hardware } from '../entities/hardware.entity';
import { HardwareLevel } from '../entities/hardware-level.entity';

@Injectable()
export class AdminHardwaresService {
  constructor(
    @InjectRepository(Hardware)
    private readonly hardwareRepository: Repository<Hardware>,
    @InjectRepository(HardwareLevel)
    private readonly hardwareLevelRepository: Repository<HardwareLevel>,
  ) {}

  // --- Hardware CRUD ---

  async createHardware(createHardwareDto: CreateHardwareDto): Promise<Hardware> {
    const hardware = this.hardwareRepository.create(createHardwareDto);
    try {
      return await this.hardwareRepository.save(hardware);
    } catch (error) {
      if (error.code === '23505') { // Unique constraint violation
        throw new ConflictException('A hardware with this name already exists');
      }
      throw error;
    }
  }

  async findAllHardwares(): Promise<Hardware[]> {
    // استفاده از query builder برای گرفتن تعداد levels
    return this.hardwareRepository.createQueryBuilder('hardware')
      .loadRelationCountAndMap('hardware.levelsCount', 'hardware.levels')
      .getMany();
  }

  async findOneHardware(id: number): Promise<Hardware> {
    const hardware = await this.hardwareRepository.findOneBy({ id });
    if (!hardware) {
      throw new NotFoundException(`Hardware with ID #${id} not found`);
    }
    return hardware;
  }

  async updateHardware(id: number, updateHardwareDto: UpdateHardwareDto): Promise<Hardware> {
    const hardware = await this.hardwareRepository.preload({
      id,
      ...updateHardwareDto,
    });
    if (!hardware) {
      throw new NotFoundException(`Hardware with ID #${id} not found to update`);
    }
    try {
        return await this.hardwareRepository.save(hardware);
    } catch (error) {
       if (error.code === '23505') {
        throw new ConflictException('A hardware with this name already exists');
      }
      throw error;
    }
  }

  async removeHardware(id: number): Promise<{ message: string }> {
    const hardware = await this.findOneHardware(id);
    await this.hardwareRepository.remove(hardware);
    return { message: `Hardware with ID #${id} has been deleted successfully.` };
  }

  // --- HardwareLevel CRUD ---

  async createHardwareLevel(hardwareId: number, createLevelDto: CreateHardwareLevelDto): Promise<HardwareLevel> {
    const hardware = await this.findOneHardware(hardwareId);
    
    // چک کردن تکراری نبودن سطح
    const existingLevel = await this.hardwareLevelRepository.findOne({
      where: { hardware: { id: hardwareId }, level: createLevelDto.level }
    });
    if (existingLevel) {
      throw new ConflictException(`Level ${createLevelDto.level} already exists for this hardware.`);
    }

    const newLevel = this.hardwareLevelRepository.create({
      ...createLevelDto,
      hardware,
    });
    return this.hardwareLevelRepository.save(newLevel);
  }

  async findAllLevelsForHardware(hardwareId: number): Promise<HardwareLevel[]> {
    await this.findOneHardware(hardwareId); // فقط برای اینکه مطمئن شیم سخت‌افزار وجود داره
    return this.hardwareLevelRepository.find({
      where: { hardware: { id: hardwareId } },
      order: { level: 'ASC' }, // مرتب‌سازی بر اساس سطح
    });
  }
  
  async updateHardwareLevel(levelId: number, updateLevelDto: UpdateHardwareLevelDto): Promise<HardwareLevel> {
    const level = await this.hardwareLevelRepository.preload({
      id: levelId,
      ...updateLevelDto,
    });
    if (!level) {
      throw new NotFoundException(`HardwareLevel with ID #${levelId} not found`);
    }
    return this.hardwareLevelRepository.save(level);
  }

  async removeHardwareLevel(levelId: number): Promise<{ message: string }> {
    const level = await this.hardwareLevelRepository.findOneBy({ id: levelId });
    if (!level) {
      throw new NotFoundException(`HardwareLevel with ID #${levelId} not found`);
    }
    await this.hardwareLevelRepository.remove(level);
    return { message: `HardwareLevel with ID #${levelId} has been deleted.` };
  }
}