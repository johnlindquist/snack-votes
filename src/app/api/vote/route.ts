import { NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import prisma from '@/lib/db';
import type { Prisma } from '@prisma/client';

export async function POST(request: Request) {
  try {
    const { votes, voterName, pollId } = await request.json();

    if (!voterName?.trim()) {
      return NextResponse.json(
        { error: 'Voter name is required' },
        { status: 400 },
      );
    }

    if (!pollId) {
      return NextResponse.json(
        { error: 'Poll ID is required' },
        { status: 400 },
      );
    }

    // Check if the poll exists and is not closed
    const poll = await prisma.poll.findUnique({
      where: { id: pollId },
    });

    if (!poll) {
      return NextResponse.json({ error: 'Poll not found' }, { status: 404 });
    }

    if (poll.isClosed) {
      return NextResponse.json(
        { error: 'This poll is closed and no longer accepting votes' },
        { status: 400 },
      );
    }

    const voterData: Prisma.VoterCreateInput = {
      name: voterName.trim(),
      identifier: randomUUID(),
      poll: { connect: { id: pollId } },
    };

    // Create a new voter with a random identifier for each submission
    const voter = await prisma.voter.create({
      data: voterData,
    });

    // Record each vote
    for (const vote of votes) {
      await prisma.vote.create({
        data: {
          selection: vote.selection,
          pairId: vote.pairId,
          voterId: voter.id,
        },
      });
    }

    return NextResponse.json({ message: 'Votes recorded successfully' });
  } catch (error) {
    console.error('Error recording votes:', error);
    return NextResponse.json(
      { error: 'Failed to record votes' },
      { status: 500 },
    );
  }
}
