import { NextResponse } from 'next/server';
import prisma from '@/lib/db';

async function isAdmin(request: Request) {
  const auth = request.headers.get('authorization');
  return auth === 'Basic myplainTextAdminCreds';
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } },
) {
  if (!(await isAdmin(request))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const id = parseInt(params.id);

    if (isNaN(id)) {
      return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
    }

    await prisma.pair.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting pair:', error);
    return NextResponse.json(
      { error: 'Failed to delete pair' },
      { status: 500 },
    );
  }
}
