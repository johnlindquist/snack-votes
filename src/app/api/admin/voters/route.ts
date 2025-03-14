import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { isAdmin } from '../../auth';

const prisma = new PrismaClient();

export async function GET(_request: Request) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const voters = await prisma.voter.findMany({
      include: {
        votes: {
          include: {
            pair: true,
          },
        },
        _count: {
          select: { votes: true },
        },
      },
      orderBy: {
        id: 'desc',
      },
    });

    return NextResponse.json(voters);
  } catch (error) {
    console.error('Error fetching voters:', error);
    return NextResponse.json(
      { error: 'Failed to fetch voters' },
      { status: 500 },
    );
  }
}
