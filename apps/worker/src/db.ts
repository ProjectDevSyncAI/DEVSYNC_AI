import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../../api/src/generated/prisma/client.js';

const connectionString = process.env.DATABASE_URL || 'postgresql://devsync:devsync@localhost:5432/devsync';
const adapter = new PrismaPg({ connectionString });

export const prisma = new PrismaClient({ adapter });
