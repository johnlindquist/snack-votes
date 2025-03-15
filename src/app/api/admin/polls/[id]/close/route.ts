import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { isAdmin } from '@/app/api/auth';

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } },
) {
  console.log(`PATCH /api/admin/polls/${params.id}/close request received`);
  try {
    const isAdminUser = await isAdmin();
    console.log('isAdmin check result:', isAdminUser);
    if (!isAdminUser) {
      console.log(
        `Unauthorized access attempt to PATCH /api/admin/polls/${params.id}/close`,
      );
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const pollId = parseInt(params.id, 10);
    if (isNaN(pollId)) {
      console.log('Invalid poll ID:', params.id);
      return NextResponse.json({ error: 'Invalid poll ID' }, { status: 400 });
    }

    console.log(`Setting poll ${pollId} to closed`);
    const updatedPoll = await prisma.poll.update({
      where: { id: pollId },
      data: { isClosed: true },
    });

    console.log('Poll closed successfully:', updatedPoll);
    return NextResponse.json(updatedPoll);
  } catch (error) {
    console.error('Error closing poll:', error);
    return NextResponse.json(
      { error: 'Failed to close poll' },
      { status: 500 },
    );
  }
}
