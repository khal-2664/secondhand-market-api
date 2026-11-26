import { DEFAULT_PRICE_LIMIT } from '../common/constants/price';
import { validateEnv } from './env.schema';

const valid = {
  DB_HOST: 'localhost',
  DB_PORT: '5432',
  DB_USERNAME: 'postgres',
  DB_PASSWORD: 'postgres',
  DB_NAME: 'secondhand_market',
};

describe('validateEnv', () => {
  it('nhận cấu hình hợp lệ và gán PORT mặc định', () => {
    const result = validateEnv({ ...valid });
    expect(result.PORT).toBe(3000);
    expect(result.DB_HOST).toBe('localhost');
    expect(result.DB_PORT).toBe(5432);
    expect(result.DB_NAME).toBe('secondhand_market');
    expect(result.MAX_PRICE).toBe(DEFAULT_PRICE_LIMIT);
  });

  it('đọc MAX_PRICE là số nguyên dương', () => {
    const result = validateEnv({ ...valid, MAX_PRICE: '25000000' });
    expect(result.MAX_PRICE).toBe(25_000_000);
  });

  it('dùng giá trị mặc định khi để trống MAX_PRICE', () => {
    const result = validateEnv({ ...valid, MAX_PRICE: '' });
    expect(result.MAX_PRICE).toBe(DEFAULT_PRICE_LIMIT);
  });

  it('ném lỗi tiếng Việt khi thiếu DB_NAME', () => {
    expect(() => validateEnv({ ...valid, DB_NAME: '' })).toThrow(
      /Cấu hình môi trường không hợp lệ:.*Thiếu biến môi trường DB_NAME/,
    );
    const { DB_NAME: _, ...rest } = valid;
    expect(() => validateEnv(rest)).toThrow(/Thiếu biến môi trường DB_NAME/);
  });

  it('ném lỗi tiếng Việt khi MAX_PRICE không phải số nguyên dương', () => {
    expect(() => validateEnv({ ...valid, MAX_PRICE: 'abc' })).toThrow(
      /Cấu hình môi trường không hợp lệ:.*MAX_PRICE phải là số nguyên dương/,
    );
    expect(() => validateEnv({ ...valid, MAX_PRICE: '-1' })).toThrow(
      /MAX_PRICE phải là số nguyên dương/,
    );
    expect(() => validateEnv({ ...valid, MAX_PRICE: '1.5' })).toThrow(
      /MAX_PRICE phải là số nguyên dương/,
    );
  });
});
