import { PrismaClient, Prisma } from '@prisma/client';
import crypto from 'crypto';

declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
  // eslint-disable-next-line no-var
  var dbConnectionStatus: {
    lastChecked: Date | null;
    isConnected: boolean;
    error: string | null;
  };
}

if (!global.dbConnectionStatus) {
  global.dbConnectionStatus = {
    lastChecked: null,
    isConnected: false,
    error: null,
  };
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
console.log('========================');
console.log('Database initialization');
console.log('Timestamp:', new Date().toISOString());
console.log('Environment:', process.env.NODE_ENV);
console.log(
  'Database URL configured:',
  process.env.POSTGRES_PRISMA_URL ? 'Yes (masked for security)' : 'No',
);
console.log('Connection hash:', connectionHash);
console.log('Process ID:', process.pid);
console.log('========================');

// Create Prisma client with additional logging in non-production environments
const prismaClientOptions: Prisma.PrismaClientOptions =
  process.env.NODE_ENV !== 'production'
    ? {
        log: ['query', 'error', 'warn'] as Prisma.LogLevel[],
      }
    : {};

// Add direct connection to primary database for critical reads
export const prisma =
  global.prisma ||
  new PrismaClient({
    ...prismaClientOptions,
    // Force all reads to go to the primary database to ensure consistency
    datasources: {
      db: {
        url: process.env.POSTGRES_PRISMA_URL,
      },
    },
  });

// Export connection testing function
export async function testConnection() {
  const startTime = Date.now();
  try {
    console.log('Testing database connection...');
    // Simple query to test the connection
    await prisma.$queryRaw`SELECT 1 as connection_test`;

    const duration = Date.now() - startTime;
    console.log(`Database connection successful (${duration}ms)`);

    global.dbConnectionStatus = {
      lastChecked: new Date(),
      isConnected: true,
      error: null,
    };

    return { success: true, duration, connectionHash };
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`Database connection failed (${duration}ms):`, error);

    global.dbConnectionStatus = {
      lastChecked: new Date(),
      isConnected: false,
      error: error instanceof Error ? error.message : String(error),
    };

    return {
      success: false,
      duration,
      error: error instanceof Error ? error.message : String(error),
      connectionHash,
    };
  }
}

// Log when a new Prisma client is created
if (!global.prisma) {
  console.log('Creating new Prisma client instance');

  // Test the connection upon initialization
  testConnection()
    .then((result) => {
      if (result.success) {
        console.log(
          `Initial database connection test successful (${result.duration}ms)`,
        );
      } else {
        console.error(
          `Initial database connection test failed (${result.duration}ms): ${result.error}`,
        );
      }
    })
    .catch((err) => {
      console.error('Error during initial database connection test:', err);
    });
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
