import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { isAdmin } from '@/app/api/auth';

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } },
) {
  console.log(`DELETE /api/admin/polls/${params.id} request received`);

  // 1. Check admin credentials
  const isAdminUser = await isAdmin();
  if (!isAdminUser) {
    console.log(`Unauthorized attempt to DELETE poll ${params.id}`);
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // 2. Parse the pollId and validate it
    const pollId = parseInt(params.id, 10);
    if (isNaN(pollId)) {
      console.log('Invalid poll ID:', params.id);
      return NextResponse.json({ error: 'Invalid poll ID' }, { status: 400 });
    }

    // 3. Check that the poll exists before deleting
    const existingPoll = await prisma.poll.findUnique({
      where: { id: pollId },
    });
    if (!existingPoll) {
      console.log(`Poll ${pollId} not found in database`);
      return NextResponse.json(
        { error: `Poll with ID ${pollId} not found` },
        { status: 404 },
      );
    }

    // 4. Delete all associated records in the correct order
    // First delete votes associated with this poll's voters
    await prisma.vote.deleteMany({
      where: {
        voter: {
          pollId: pollId,
        },
      },
    });

    // Then delete voters
    await prisma.voter.deleteMany({
      where: { pollId: pollId },
    });

    // Delete pairs
    await prisma.pair.deleteMany({
      where: { pollId: pollId },
    });

    // Delete groups
    await prisma.group.deleteMany({
      where: { pollId: pollId },
    });

    // 5. Finally delete the poll itself
    await prisma.poll.delete({
      where: { id: pollId },
    });

    console.log(`Poll ${pollId} deleted successfully`);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting poll:', error);
    return NextResponse.json(
      { error: 'Failed to delete poll' },
      { status: 500 },
    );
  }
}
