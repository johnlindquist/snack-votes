import { NextResponse } from 'next/server';
import prisma from '@/lib/db';

export async function GET(
  request: Request,
  { params }: { params: { id: string } },
) {
  console.log(`GET /api/polls/${params.id} request received`);
  try {
    const pollId = parseInt(params.id, 10);
    if (isNaN(pollId)) {
      console.log('Invalid poll ID:', params.id);
      return NextResponse.json({ error: 'Invalid poll ID' }, { status: 400 });
    }

    console.log(`Fetching poll ${pollId} from database`);
    const poll = await prisma.poll.findUnique({
      where: { id: pollId },
      include: {
        pairs: {
          include: {
            votes: true,
          },
        },
      },
    });

    if (!poll) {
      console.log(`Poll ${pollId} not found`);
      return NextResponse.json({ error: 'Poll not found' }, { status: 404 });
    }

    console.log(`Poll ${pollId} found`);
    return NextResponse.json(poll);
  } catch (error) {
    console.error('Error fetching poll:', error);
    return NextResponse.json(
      { error: 'Failed to fetch poll' },
      { status: 500 },
    );
  }
}
