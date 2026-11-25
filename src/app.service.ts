import { Inject, Injectable } from '@nestjs/common';
import { CURRENCY, PRICE_LIMIT } from './common/tokens';

export interface AppSettings {
  currency: string;
  priceLimit: number;
}

@Injectable()
export class AppService {
  constructor(
    @Inject(CURRENCY) private readonly currency: string,
    @Inject(PRICE_LIMIT) private readonly priceLimit: number,
  ) {}

  getHello(): string {
    return 'Chào mừng đến với chợ đồ cũ!';
  }

  getSettings(): AppSettings {
    return { currency: this.currency, priceLimit: this.priceLimit };
  }
}
