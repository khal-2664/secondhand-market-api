import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AppService } from './app.service';
import type { AppSettings } from './app.service';

@ApiTags('app')
@Controller({ version: '1' })
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  @ApiOperation({ summary: 'Lời chào từ hệ thống chợ đồ cũ' })
  @ApiResponse({
    status: 200,
    description: 'Trả về chuỗi chào mừng của hệ thống',
  })
  @ApiResponse({
    status: 500,
    description: 'Lỗi hệ thống nội bộ',
  })
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('settings')
  @ApiOperation({ summary: 'Lấy cấu hình tiền tệ và giới hạn giá' })
  @ApiResponse({
    status: 200,
    description: 'Trả về đơn vị tiền tệ và mức giá trần mặc định',
  })
  @ApiResponse({
    status: 500,
    description: 'Lỗi hệ thống nội bộ',
  })
  getSettings(): AppSettings {
    return this.appService.getSettings();
  }
}
