import { Provider } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CURRENCY, PRICE_LIMIT } from './tokens';

export const DEFAULT_PRICE_LIMIT = 100_000_000;

export const currencyProvider: Provider = {
  provide: CURRENCY,
  useValue: 'VND',
};

export const priceLimitProvider: Provider = {
  provide: PRICE_LIMIT,
  inject: [ConfigService],
  useFactory: (config: ConfigService): number => {
    const value = Number(config.get<string>('MAX_PRICE'));
    return Number.isInteger(value) && value > 0 ? value : DEFAULT_PRICE_LIMIT;
  },
};
