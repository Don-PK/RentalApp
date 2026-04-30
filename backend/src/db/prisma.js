import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';

const { Client } = pg;

const connectionString = process.env.DATABASE_URL;

const client = new Client({ connectionString });

const adapter = new PrismaPg({ client });

export const prisma = new PrismaClient({ adapter });