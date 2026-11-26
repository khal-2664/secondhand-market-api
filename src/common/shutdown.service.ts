import { Injectable, Logger, OnApplicationShutdown } from '@nestjs/common';

@Injectable()
export class ShutdownService implements OnApplicationShutdown {
  private readonly logger = new Logger(ShutdownService.name);

  async onApplicationShutdown(signal?: string): Promise<void> {
    this.logger.log(`Đang tắt ứng dụng, tín hiệu: ${signal ?? 'không rõ'}`);
    await this.cleanup();
    this.logger.log('Đã hoàn tất dọn dẹp tài nguyên trước khi thoát');
  }

  private async cleanup(): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
}
