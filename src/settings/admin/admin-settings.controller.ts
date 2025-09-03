import { Controller, Get, Body, Patch, Param } from '@nestjs/common';
import { AdminSettingsService } from './admin-settings.service';
import { UpdateSettingDto } from './dto/admin-update-setting.dto';

@Controller('admin/settings')
export class AdminSettingsController {
  constructor(private readonly adminSettingsService: AdminSettingsService) {}

  @Get(':key')
  getSetting(@Param('key') key: string) {
    // برای این مورد خاص، ما فقط با یک کلید کار داریم
    if (key !== 'brics_to_balance_rate') {
      return { message: 'Setting not found' }; // یا ارور مناسب
    }
    return this.adminSettingsService.getSetting(key);
  }

  @Patch(':key')
  updateSetting(
    @Param('key') key: string,
    @Body() updateSettingDto: UpdateSettingDto,
  ) {
    if (key !== 'brics_to_balance_rate') {
      return { message: 'This setting cannot be updated' }; // یا ارور مناسب
    }
    return this.adminSettingsService.updateSetting(key, updateSettingDto.value);
  }
}