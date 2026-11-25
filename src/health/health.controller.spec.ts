import { Test, TestingModule } from '@nestjs/testing';
import {
  HealthCheckResult,
  HealthCheckService,
  TypeOrmHealthIndicator,
} from '@nestjs/terminus';
import { HealthController } from './health.controller';

describe('HealthController', () => {
  let controller: HealthController;
  const pingCheck = jest.fn();
  const check = jest.fn();

  beforeEach(async () => {
    jest.resetAllMocks();

    const moduleRef: TestingModule = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [
        { provide: HealthCheckService, useValue: { check } },
        { provide: TypeOrmHealthIndicator, useValue: { pingCheck } },
      ],
    }).compile();

    controller = moduleRef.get(HealthController);
  });

  it('gọi pingCheck tới database thông qua HealthCheckService', async () => {
    const expected: HealthCheckResult = {
      status: 'ok',
      info: { database: { status: 'up' } },
      error: {},
      details: { database: { status: 'up' } },
    };
    pingCheck.mockResolvedValue({ database: { status: 'up' } });
    check.mockImplementation(
      async (indicators: Array<() => Promise<unknown>>) => {
        await indicators[0]();
        return expected;
      },
    );

    await expect(controller.check()).resolves.toEqual(expected);
    expect(pingCheck).toHaveBeenCalledWith('database');
  });
});
