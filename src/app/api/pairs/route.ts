import { NextResponse } from 'next/server';
import prisma from '@/lib/db';

export const dynamic = 'force-dynamic'; // Disable static optimization for this route

export async function GET() {
  console.log('API: /api/pairs endpoint called');
  console.log('Environment:', process.env.NODE_ENV);

  // Check if database URL is configured
  const dbUrlConfigured = !!process.env.POSTGRES_PRISMA_URL;
  console.log(
    'Database URL configured:',
    dbUrlConfigured ? 'Yes (masked for security)' : 'No',
  );

  if (!dbUrlConfigured) {
    console.error('API: Database URL not configured!');
    return NextResponse.json(
      {
        error: 'Database configuration missing',
        details: 'POSTGRES_PRISMA_URL environment variable is not set',
      },
      {
        status: 500,
        headers: {
          'Cache-Control': 'no-store, max-age=0',
        },
      },
    );
  }

  try {
    console.log('API: Attempting to connect to database and fetch pairs');
    const pairs = await prisma.pair.findMany();

    console.log('API: Successfully fetched pairs from database');
    console.log('API: Number of pairs found:', pairs.length);
    console.log(
      'API: First pair (if exists):',
      pairs[0] ? JSON.stringify(pairs[0]) : 'No pairs found',
    );

    // Return response with cache control headers
    return NextResponse.json(pairs, {
      headers: {
        'Cache-Control': 'no-store, max-age=0',
      },
    });
  } catch (error) {
    console.error('API: Error fetching pairs:', error);

    // More detailed error logging
    if (error instanceof Error) {
      console.error('API: Error name:', error.name);
      console.error('API: Error message:', error.message);
      console.error('API: Error stack:', error.stack);
    }

    // Check if it's a Prisma error
    if (typeof error === 'object' && error !== null && 'code' in error) {
      console.error(
        'API: Prisma error code:',
        (error as { code: string }).code,
      );
      console.error(
        'API: Prisma error meta:',
        (error as { meta?: unknown }).meta,
      );
    }

    return NextResponse.json(
      {
        error: 'Failed to fetch pairs',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      {
        status: 500,
        headers: {
          'Cache-Control': 'no-store, max-age=0',
        },
      },
    );
  }
}
