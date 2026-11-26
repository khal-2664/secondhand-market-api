import { Logger } from '@nestjs/common';
import { ShutdownService } from './shutdown.service';

describe('ShutdownService', () => {
  it('ghi log tín hiệu tắt và hoàn tất bước dọn dẹp bất đồng bộ', async () => {
    const logSpy = jest
      .spyOn(Logger.prototype, 'log')
      .mockImplementation(() => undefined);
    const service = new ShutdownService();

    await service.onApplicationShutdown('SIGTERM');

    expect(logSpy).toHaveBeenNthCalledWith(
      1,
      'Đang tắt ứng dụng, tín hiệu: SIGTERM',
    );
    expect(logSpy).toHaveBeenNthCalledWith(
      2,
      'Đã hoàn tất dọn dẹp tài nguyên trước khi thoát',
    );
    logSpy.mockRestore();
  });
});
