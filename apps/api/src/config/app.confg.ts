import { registerAs } from '@nestjs/config';

export default registerAs('app', () => ({
  name: process.env.APP_NAME ?? 'DevSync AI',
  environment: process.env.NODE_ENV ?? 'development',
  port: Number(process.env.API_PORT ?? 3000),
  apiPrefix: process.env.API_PREFIX ?? 'api',
  webUrl: process.env.WEB_URL ?? 'http://localhost:5173',
}));
