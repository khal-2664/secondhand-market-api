import { ConfigService } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import { DEFAULT_PRICE_LIMIT, priceLimitProvider } from './business.providers';
import { PRICE_LIMIT } from './tokens';

async function resolvePriceLimit(maxPrice?: string): Promise<number> {
  const moduleRef = await Test.createTestingModule({
    providers: [
      priceLimitProvider,
      {
        provide: ConfigService,
        useValue: new ConfigService(
          maxPrice === undefined ? {} : { MAX_PRICE: maxPrice },
        ),
      },
    ],
  }).compile();

  return moduleRef.get<number>(PRICE_LIMIT);
}

describe('priceLimitProvider', () => {
  it('đọc MAX_PRICE và chuyển sang số', async () => {
    await expect(resolvePriceLimit('25000000')).resolves.toBe(25_000_000);
  });

  it('dùng giá trị mặc định khi thiếu MAX_PRICE', async () => {
    await expect(resolvePriceLimit()).resolves.toBe(DEFAULT_PRICE_LIMIT);
  });
});
