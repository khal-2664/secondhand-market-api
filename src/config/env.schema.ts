import { z } from 'zod';

function emptyToUndefined(value: unknown): unknown {
  return value === '' || value === undefined || value === null
    ? undefined
    : value;
}

const requiredEnv = (name: string) =>
  z
    .string({ error: `Thiếu biến môi trường ${name}` })
    .trim()
    .min(1, `Thiếu biến môi trường ${name}`);

export const envSchema = z
  .object({
    PORT: z.preprocess(
      emptyToUndefined,
      z.coerce
        .number({ error: 'PORT phải là số nguyên dương' })
        .int('PORT phải là số nguyên dương')
        .positive('PORT phải là số nguyên dương')
        .default(3000),
    ),
    DB_HOST: requiredEnv('DB_HOST'),
    DB_PORT: z.preprocess(
      emptyToUndefined,
      z.coerce
        .number({ error: 'DB_PORT phải là số nguyên dương' })
        .int('DB_PORT phải là số nguyên dương')
        .positive('DB_PORT phải là số nguyên dương')
        .default(5432),
    ),
    DB_USERNAME: requiredEnv('DB_USERNAME'),
    DB_PASSWORD: z
      .string({ error: 'Thiếu biến môi trường DB_PASSWORD' })
      .min(1, 'Thiếu biến môi trường DB_PASSWORD'),
    DB_NAME: requiredEnv('DB_NAME'),
    MAX_PRICE: z.preprocess(
      emptyToUndefined,
      z.coerce
        .number({ error: 'MAX_PRICE phải là số nguyên dương' })
        .int('MAX_PRICE phải là số nguyên dương')
        .positive('MAX_PRICE phải là số nguyên dương')
        .optional(),
    ),
  })
  .passthrough();

export function validateEnv(
  config: Record<string, unknown>,
): Record<string, unknown> {
  const result = envSchema.safeParse(config);
  if (!result.success) {
    const messages = [
      ...new Set(result.error.issues.map((issue) => issue.message)),
    ];
    throw new Error(`Cấu hình môi trường không hợp lệ: ${messages.join('; ')}`);
  }
  return result.data;
}
