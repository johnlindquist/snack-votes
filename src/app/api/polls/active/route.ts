import { NextResponse } from 'next/server';
import prisma from '@/lib/db';

export async function GET() {
  console.log('GET /api/polls/active request received');
  try {
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

    if (!activePoll) {
      console.log('No active poll found');
      return NextResponse.json(
        { error: 'No active poll found' },
        { status: 404 },
      );
    }

    console.log(
      `Active poll found: ${activePoll.id} with ${activePoll.groups.length} groups`,
    );
    return NextResponse.json(activePoll);
  } catch (error) {
    console.error('Error fetching active poll:', error);
    return NextResponse.json(
      { error: 'Failed to fetch active poll' },
      { status: 500 },
    );
  }
}
