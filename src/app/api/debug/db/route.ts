import { NextResponse } from 'next/server';
import prisma, { testConnection } from '@/lib/db';
import crypto from 'crypto';

export async function GET() {
  console.log('************************');
  console.log('Debug API: Database connection test initiated');
  console.log('Timestamp:', new Date().toISOString());
  console.log('************************');

  // Allow in production for temporary debugging
  // if (process.env.NODE_ENV === 'production') {
  //   console.log('Debug API: Blocked in production mode');
  //   return NextResponse.json(
  //     { error: 'Debug endpoints are not available in production' },
  //     { status: 403 },
  //   );
  // }

  try {
    // Test connection status
    console.log('Debug API: Testing database connection...');
    const connectionTestResult = await testConnection();
    const connectionTestSuccess = connectionTestResult.success;

    // Gather additional info if connection is successful
    let dbStats = {};
    if (connectionTestSuccess) {
      console.log(
        'Debug API: Database connection successful, gathering stats...',
      );

      try {
        // Collect database statistics
        const [pairCount, pollCount, voterCount, activePollCount, activePoll] =
          await Promise.all([
            prisma.pair.count(),
            prisma.poll.count(),
            prisma.voter.count(),
            prisma.poll.count({ where: { isActive: true } }),
            prisma.poll.findFirst({
              where: { isActive: true },
              select: {
                id: true,
                title: true,
                createdAt: true,
              },
            }),
          ]);

        dbStats = {
          pairCount,
          pollCount,
          voterCount,
          activePollCount,
          activePoll,
        };

        console.log('Debug API: Database stats collected successfully');
      } catch (statsError) {
        console.error(
          'Debug API: Error collecting database stats:',
          statsError,
        );
        dbStats = { error: 'Failed to collect database stats' };
      }
    }

    // Get a hash of the connection string
    const connectionHash = process.env.POSTGRES_PRISMA_URL
      ? crypto
          .createHash('md5')
          .update(process.env.POSTGRES_PRISMA_URL)
          .digest('hex')
          .substring(0, 8)
      : 'not-set';

    // Get database connection info (safely)
    const dbInfo = {
      provider: 'postgresql',
      url: process.env.POSTGRES_PRISMA_URL
        ? 'Set (masked for security)'
        : 'Not set',
      connectionHash,
      connectionTest: {
        success: connectionTestSuccess,
        duration: connectionTestResult.duration,
        ...(connectionTestResult.error
          ? { error: connectionTestResult.error }
          : {}),
      },
      ...dbStats,
      timestamp: new Date().toISOString(),
      connectionStatus: global.dbConnectionStatus,
    };

    console.log(
      'Debug API: Database info collected:',
      JSON.stringify(dbInfo, null, 2),
    );

    return NextResponse.json({
      status: connectionTestSuccess ? 'success' : 'error',
      message: connectionTestSuccess
        ? 'Database connection successful'
        : `Database connection failed: ${connectionTestResult.error}`,
      dbInfo,
      env: {
        NODE_ENV: process.env.NODE_ENV,
        VERCEL_ENV: process.env.VERCEL_ENV || 'not-set',
        VERCEL_REGION: process.env.VERCEL_REGION || 'not-set',
      },
    });
  } catch (error) {
    console.error('Debug API: Database connection error:', error);

    // More detailed error logging
    if (error instanceof Error) {
      console.error('Debug API: Error name:', error.name);
      console.error('Debug API: Error message:', error.message);
      console.error('Debug API: Error stack:', error.stack);
    }

    return NextResponse.json(
      {
        status: 'error',
        message: 'Database connection test failed',
        error: error instanceof Error ? error.message : 'Unknown error',
        env: {
          NODE_ENV: process.env.NODE_ENV,
          VERCEL_ENV: process.env.VERCEL_ENV || 'not-set',
          DATABASE_URL_SET: !!process.env.POSTGRES_PRISMA_URL,
        },
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    );
  } finally {
    console.log('************************');
    console.log('Debug API: Database connection test completed');
    console.log('************************');
  }
}
