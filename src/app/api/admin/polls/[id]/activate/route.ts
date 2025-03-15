import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { isAdmin } from '@/app/api/auth';

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } },
) {
  console.log('************************');
  console.log(`PATCH /api/admin/polls/${params.id}/activate request received`);
  console.log('Timestamp:', new Date().toISOString());
  console.log('************************');

  try {
    console.log('Checking admin authorization');
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

    // Check if the poll exists before trying to activate it
    console.log(`Checking if poll ${pollId} exists`);
    const pollExists = await prisma.poll.findUnique({
      where: { id: pollId },
      select: { id: true, title: true },
    });

    if (!pollExists) {
      console.log(`Poll ${pollId} not found in database`);
      return NextResponse.json(
        { error: `Poll with ID ${pollId} not found` },
        { status: 404 },
      );
    }

    console.log(
      `Found poll to activate: ${pollExists.title} (ID: ${pollExists.id})`,
    );

    // First, get the currently active poll (if any)
    const currentActivePoll = await prisma.poll.findFirst({
      where: { isActive: true },
      select: { id: true, title: true },
    });

    if (currentActivePoll) {
      console.log(
        `Currently active poll: ${currentActivePoll.title} (ID: ${currentActivePoll.id})`,
      );
    } else {
      console.log('No currently active poll found');
    }

    // Set all polls to inactive
    console.log('Setting all polls to inactive');
    const deactivateResult = await prisma.poll.updateMany({
      data: { isActive: false },
    });
    console.log(`Deactivated ${deactivateResult.count} polls`);

    // Then, set the specified poll to active
    console.log(`Setting poll ${pollId} to active`);
    const updatedPoll = await prisma.poll.update({
      where: { id: pollId },
      data: { isActive: true },
    });

    console.log(
      `Poll activated successfully: ${updatedPoll.title} (ID: ${updatedPoll.id})`,
    );
    return NextResponse.json(updatedPoll);
  } catch (error) {
    console.error('Error activating poll:', error);
    console.error(
      'Error details:',
      error instanceof Error ? error.message : String(error),
    );
    console.error(
      'Error stack:',
      error instanceof Error ? error.stack : 'No stack trace available',
    );

    return NextResponse.json(
      { error: 'Failed to activate poll' },
      { status: 500 },
    );
  } finally {
    console.log('************************');
    console.log('Poll activation request completed');
    console.log('************************');
  }
}
