import { PrismaClient, Prisma } from '@prisma/client';
import crypto from 'crypto';

declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

// Create a hash of the connection string to verify it's the same across requests
// without exposing the actual connection string
const connectionHash = process.env.POSTGRES_PRISMA_URL
  ? crypto
      .createHash('md5')
      .update(process.env.POSTGRES_PRISMA_URL)
      .digest('hex')
      .substring(0, 8)
  : 'not-set';

// Log database connection information
console.log('Database initialization');
console.log('Environment:', process.env.NODE_ENV);
console.log(
  'Database URL configured:',
  process.env.POSTGRES_PRISMA_URL ? 'Yes (masked for security)' : 'No',
);
console.log('Connection hash:', connectionHash);

// Create Prisma client with additional logging in non-production environments
const prismaClientOptions: Prisma.PrismaClientOptions =
  process.env.NODE_ENV !== 'production'
    ? { log: ['query', 'error', 'warn'] as Prisma.LogLevel[] }
    : {};

export const prisma = global.prisma || new PrismaClient(prismaClientOptions);

// Log when a new Prisma client is created
if (!global.prisma) {
  console.log('Creating new Prisma client instance');
}

if (process.env.NODE_ENV !== 'production') {
  global.prisma = prisma;
  console.log('Prisma client attached to global object for development');
} else {
  console.log(
    'Running in production mode - Prisma client not attached to global',
  );
}

export default prisma;
