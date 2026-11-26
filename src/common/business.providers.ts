import { Provider } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DEFAULT_PRICE_LIMIT } from './constants/price';
import { CURRENCY, PRICE_LIMIT } from './tokens';

export { DEFAULT_PRICE_LIMIT };

export const currencyProvider: Provider = {
  provide: CURRENCY,
  useValue: 'VND',
};

export const priceLimitProvider: Provider = {
  provide: PRICE_LIMIT,
  inject: [ConfigService],
  useFactory: (config: ConfigService): number =>
    config.getOrThrow<number>('MAX_PRICE'),
};
