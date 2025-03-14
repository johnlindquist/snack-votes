import { PrismaClient } from '@prisma/client';

declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

// This is a temporary solution until we properly integrate with D1
const adapter =
  process.env.NODE_ENV === 'production'
    ? undefined // We'll set this up in the API routes
    : undefined;

export const prisma = global.prisma || new PrismaClient({ adapter });

if (process.env.NODE_ENV !== 'production') {
  global.prisma = prisma;
}

export default prisma;
