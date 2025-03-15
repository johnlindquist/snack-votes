import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import crypto from 'crypto';

export async function GET() {
  console.log('Debug API: Database connection test initiated');

  // Allow in production for temporary debugging
  // if (process.env.NODE_ENV === 'production') {
  //   console.log('Debug API: Blocked in production mode');
  //   return NextResponse.json(
  //     { error: 'Debug endpoints are not available in production' },
  //     { status: 403 },
  //   );
  // }

  try {
    // Test database connection by running a simple query
    console.log('Debug API: Testing database connection...');

    // Check if we can connect to the database
    const pairCount = await prisma.pair.count();
    const pollCount = await prisma.poll.count();
    const voterCount = await prisma.voter.count();

    // Get a hash of the connection string to verify it's the same across requests
    // without exposing the actual connection string
    const connectionHash = process.env.POSTGRES_PRISMA_URL
      ? crypto
          .createHash('md5')
          .update(process.env.POSTGRES_PRISMA_URL)
          .digest('hex')
          .substring(0, 8)
      : 'not-set';

    // Get database connection info (safely)
    const dbInfo = {
      provider: 'postgresql', // Hardcoded since we can't access internal properties
      url: process.env.POSTGRES_PRISMA_URL
        ? 'Set (masked for security)'
        : 'Not set',
      connectionHash,
      pairCount,
      pollCount,
      voterCount,
      timestamp: new Date().toISOString(),
    };

    console.log('Debug API: Database connection successful');
    console.log('Debug API: Database info:', dbInfo);

    return NextResponse.json({
      status: 'success',
      message: 'Database connection successful',
      dbInfo,
      env: {
        NODE_ENV: process.env.NODE_ENV,
        // Add other non-sensitive environment variables here
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
        message: 'Database connection failed',
        error: error instanceof Error ? error.message : 'Unknown error',
        env: {
          NODE_ENV: process.env.NODE_ENV,
          DATABASE_URL_SET: !!process.env.POSTGRES_PRISMA_URL,
        },
      },
      { status: 500 },
    );
  }
}
