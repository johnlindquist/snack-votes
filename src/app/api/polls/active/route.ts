import { NextResponse } from 'next/server';
import prisma from '@/lib/db';

export async function GET() {
  console.log('************************');
  console.log('GET /api/polls/active request received');
  console.log('Timestamp:', new Date().toISOString());
  console.log('************************');

  try {
    console.log('Attempting to connect to the database');

    // Check database connection
    try {
      await prisma.$queryRaw`SELECT 1`;
      console.log('Database connection successful');
    } catch (dbError) {
      console.error('Database connection failed:', dbError);
      return NextResponse.json(
        { error: 'Database connection failed' },
        {
          status: 500,
          headers: {
            'Cache-Control':
              'no-store, no-cache, must-revalidate, proxy-revalidate',
            Pragma: 'no-cache',
            Expires: '0',
            'Surrogate-Control': 'no-store',
          },
        },
      );
    }

    console.log('Fetching active poll from database');
    const activePoll = await prisma.poll.findFirst({
      where: { isActive: true },
      include: {
        pairs: true,
        groups: {
          include: {
            pairs: true,
          },
          orderBy: {
            id: 'asc',
          },
        },
      },
    });

    console.log('Active poll query completed');
    console.log('Active poll found:', activePoll ? 'Yes' : 'No');

    if (!activePoll) {
      console.log('No active poll found in the database');
      return NextResponse.json(
        { error: 'No active poll found' },
        {
          status: 404,
          headers: {
            'Cache-Control':
              'no-store, no-cache, must-revalidate, proxy-revalidate',
            Pragma: 'no-cache',
            Expires: '0',
            'Surrogate-Control': 'no-store',
          },
        },
      );
    }

    console.log(
      `Active poll details - ID: ${activePoll.id}, Title: "${activePoll.title}"`,
    );
    console.log(
      `Poll has ${activePoll.groups.length} groups and ${activePoll.pairs.length} direct pairs`,
    );

    return NextResponse.json(activePoll, {
      headers: {
        'Cache-Control':
          'no-store, no-cache, must-revalidate, proxy-revalidate',
        Pragma: 'no-cache',
        Expires: '0',
        'Surrogate-Control': 'no-store',
      },
    });
  } catch (error) {
    console.error('Error fetching active poll:', error);
    console.error(
      'Error details:',
      error instanceof Error ? error.message : String(error),
    );
    console.error(
      'Error stack:',
      error instanceof Error ? error.stack : 'No stack trace available',
    );

    return NextResponse.json(
      { error: 'Failed to fetch active poll' },
      {
        status: 500,
        headers: {
          'Cache-Control':
            'no-store, no-cache, must-revalidate, proxy-revalidate',
          Pragma: 'no-cache',
          Expires: '0',
          'Surrogate-Control': 'no-store',
        },
      },
    );
  } finally {
    console.log('************************');
    console.log('Active poll request completed');
    console.log('************************');
  }
}
