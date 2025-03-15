import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { isAdmin } from '@/app/api/auth';

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } },
) {
  console.log(`PATCH /api/admin/polls/${params.id}/activate request received`);
  try {
    const isAdminUser = await isAdmin();
    console.log('isAdmin check result:', isAdminUser);
    if (!isAdminUser) {
      console.log(
        `Unauthorized access attempt to PATCH /api/admin/polls/${params.id}/activate`,
      );
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const pollId = parseInt(params.id, 10);
    if (isNaN(pollId)) {
      console.log('Invalid poll ID:', params.id);
      return NextResponse.json({ error: 'Invalid poll ID' }, { status: 400 });
    }

    // First, set all polls to inactive
    console.log('Setting all polls to inactive');
    await prisma.poll.updateMany({
      data: { isActive: false },
    });

    // Then, set the specified poll to active
    console.log(`Setting poll ${pollId} to active`);
    const updatedPoll = await prisma.poll.update({
      where: { id: pollId },
      data: { isActive: true },
    });

    console.log('Poll activated successfully:', updatedPoll);
    return NextResponse.json(updatedPoll);
  } catch (error) {
    console.error('Error activating poll:', error);
    return NextResponse.json(
      { error: 'Failed to activate poll' },
      { status: 500 },
    );
  }
}
