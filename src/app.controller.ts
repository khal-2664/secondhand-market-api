import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import type { AppSettings } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('settings')
  getSettings(): AppSettings {
    return this.appService.getSettings();
  }
}
