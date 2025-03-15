import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { isAdmin } from '@/app/api/auth';

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } },
) {
  console.log(`DELETE /api/admin/polls/${params.id} request received`);
  try {
    const isAdminUser = await isAdmin();
    console.log('isAdmin check result:', isAdminUser);
    if (!isAdminUser) {
      console.log(
        `Unauthorized access attempt to DELETE /api/admin/polls/${params.id}`,
      );
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const pollId = parseInt(params.id, 10);
    if (isNaN(pollId)) {
      console.log('Invalid poll ID:', params.id);
      return NextResponse.json({ error: 'Invalid poll ID' }, { status: 400 });
    }

    // First delete all related data
    console.log(`Deleting all data related to poll ${pollId}`);

    // Delete votes related to pairs in this poll
    console.log('Deleting votes for poll pairs');
    const pairsInPoll = await prisma.pair.findMany({
      where: {
        pollId,
      },
      select: {
        id: true,
      },
    });

    const pairIds = pairsInPoll.map((pair) => pair.id);

    if (pairIds.length > 0) {
      await prisma.vote.deleteMany({
        where: {
          pairId: {
            in: pairIds,
          },
        },
      });
    }

    // Delete pairs in this poll
    console.log('Deleting pairs for poll');
    await prisma.pair.deleteMany({
      where: {
        pollId,
      },
    });

    // Delete groups in this poll
    console.log('Deleting groups for poll');
    await prisma.group.deleteMany({
      where: {
        pollId,
      },
    });

    // Delete voters in this poll
    console.log('Deleting voters for poll');
    await prisma.voter.deleteMany({
      where: {
        pollId,
      },
    });

    // Finally delete the poll
    console.log(`Deleting poll ${pollId}`);
    const deletedPoll = await prisma.poll.delete({
      where: {
        id: pollId,
      },
    });

    console.log('Poll deleted successfully:', deletedPoll);
    return NextResponse.json({ message: 'Poll deleted successfully' });
  } catch (error) {
    console.error('Error deleting poll:', error);
    return NextResponse.json(
      { error: 'Failed to delete poll' },
      { status: 500 },
    );
  }
}
