import { ConfigService } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import { priceLimitProvider } from './business.providers';
import { PRICE_LIMIT } from './tokens';

async function resolvePriceLimit(maxPrice: number): Promise<number> {
  const moduleRef = await Test.createTestingModule({
    providers: [
      priceLimitProvider,
      {
        provide: ConfigService,
        useValue: new ConfigService({ MAX_PRICE: maxPrice }),
      },
    ],
  }).compile();

  return moduleRef.get<number>(PRICE_LIMIT);
}

describe('priceLimitProvider', () => {
  it('trả về MAX_PRICE từ config đã validate', async () => {
    await expect(resolvePriceLimit(25_000_000)).resolves.toBe(25_000_000);
  });
});
