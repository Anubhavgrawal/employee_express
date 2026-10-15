import 'dotenv/config';
import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().min(1).max(65535).default(3000),
  DATABASE_URL: z.string().min(1),
  JWT_ACCESS_SECRET: z.string().min(32, 'JWT_ACCESS_SECRET must be at least 32 characters'),
  JWT_ACCESS_TTL: z.string().default('15m'),
  JWT_ISSUER: z.string().default('employee-management-api'),
  JWT_AUDIENCE: z.string().default('employee-management-client'),
  REFRESH_TOKEN_TTL_DAYS: z.coerce.number().int().min(1).max(90).default(7),
  CORS_ORIGINS: z.string().default('http://localhost:5173'),
  RATE_LIMIT_WINDOW_MS: z.coerce.number().int().positive().default(60000),
  RATE_LIMIT_MAX_REQUESTS: z.coerce.number().int().positive().default(100),
  LOGIN_RATE_LIMIT_MAX: z.coerce.number().int().positive().default(10),
  SEED_ADMIN_EMAIL: z.string().email().optional(),
  SEED_ADMIN_PASSWORD: z.string().min(12).optional()
}).superRefine((v, ctx) => {
  if ((v.SEED_ADMIN_EMAIL && !v.SEED_ADMIN_PASSWORD) || (!v.SEED_ADMIN_EMAIL && v.SEED_ADMIN_PASSWORD)) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Set both SEED_ADMIN_EMAIL and SEED_ADMIN_PASSWORD or neither.' });
  }
});

const parsed = envSchema.safeParse(process.env);
if (!parsed.success) {
  console.error('Invalid environment configuration:', parsed.error.flatten().fieldErrors);
  process.exit(1);
}
export const env = { ...parsed.data, CORS_ORIGINS: parsed.data.CORS_ORIGINS.split(',').map(s => s.trim()).filter(Boolean) };
