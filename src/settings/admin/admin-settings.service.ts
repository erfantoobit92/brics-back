import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Setting } from '../setting.entity';

@Injectable()
export class AdminSettingsService {
  constructor(
    @InjectRepository(Setting)
    private readonly settingRepository: Repository<Setting>,
  ) {}

  /**
   * Gets a setting by its key.
   * If the setting does not exist, it creates it with a default value.
   * @param key The key of the setting.
   * @param defaultValue The default value if the setting is not found.
   * @returns The setting object.
   */
  async getSetting(key: string, defaultValue: string = '1000'): Promise<Setting> {
    let setting = await this.settingRepository.findOneBy({ key });

    if (!setting) {
      // اگر تنظیمات وجود نداشت، با مقدار پیش‌فرض ایجادش می‌کنیم
      setting = this.settingRepository.create({ key, value: defaultValue });
      await this.settingRepository.save(setting);
    }
    
    return setting;
  }

  /**
   * Updates or creates (upserts) a setting.
   * @param key The key of the setting.
   * @param value The new value for the setting.
   * @returns The updated setting object.
   */
  async updateSetting(key: string, value: string): Promise<Setting> {
    // 'save' in TypeORM with a primary key acts as an upsert.
    // If an entity with the given key exists, it's updated. Otherwise, it's inserted.
    const setting = this.settingRepository.create({ key, value });
    return this.settingRepository.save(setting);
  }
}