import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { CURRENCY, PRICE_LIMIT } from './common/tokens';

describe('AppController', () => {
  let appController: AppController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [
        AppService,
        { provide: CURRENCY, useValue: 'VND' },
        { provide: PRICE_LIMIT, useValue: 50_000_000 },
      ],
    }).compile();

    appController = app.get<AppController>(AppController);
  });

  describe('root', () => {
    it('trả về lời chào của hệ thống', () => {
      expect(appController.getHello()).toBe('Chào mừng đến với chợ đồ cũ!');
    });
  });

  describe('settings', () => {
    it('trả về đơn vị tiền tệ và giới hạn giá', () => {
      expect(appController.getSettings()).toEqual({
        currency: 'VND',
        priceLimit: 50_000_000,
      });
    });
  });
});
