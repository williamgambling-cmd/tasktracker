import { PrismaClient } from '@prisma/client';

// Mock environment variables for tests
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret-key-that-is-at-least-32-characters-long';
process.env.JWT_EXPIRES_IN = '1h';
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/tasktracker_test';
process.env.BCRYPT_SALT_ROUNDS = '4'; // Lower for faster tests
process.env.RATE_LIMIT_WINDOW_MS = '900000';
process.env.RATE_LIMIT_MAX_REQUESTS = '1000';
process.env.CORS_ORIGIN = '*';

const prisma = new PrismaClient();

beforeAll(async () => {
  // Connect to test database
  await prisma.$connect();
});

afterAll(async () => {
  await prisma.$disconnect();
});

export { prisma };
