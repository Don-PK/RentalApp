import 'dotenv/config';
import prismaPkg from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const { PrismaClient } = prismaPkg;

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is not set in environment variables');
}

const connectionString = process.env.DATABASE_URL.trim();
console.log('Using DATABASE_URL:', connectionString);

const url = new URL(connectionString);
const config = {
  host: url.hostname,
  port: Number(url.port || 5432),
  user: url.username,
  password: url.password,
  database: url.pathname.slice(1),
};

console.log('Parsed DB config:', config);

const adapter = new PrismaPg(config);

export const prisma = new PrismaClient({
  adapter,
  log: ['error'],
});