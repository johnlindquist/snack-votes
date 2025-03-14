import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { isAdmin } from '@/app/api/auth';

export async function GET(_request: Request) {
  console.log('GET /api/admin/voters request received');
  try {
    const isAdminUser = await isAdmin();
    console.log('isAdmin check result:', isAdminUser);
    if (!isAdminUser) {
      console.log('Unauthorized access attempt to GET /api/admin/voters');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('Fetching voters from database');
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

    console.log(`Successfully fetched ${voters.length} voters`);
    return NextResponse.json(voters);
  } catch (error) {
    console.error('Error fetching voters:', error);
    return NextResponse.json(
      { error: 'Failed to fetch voters' },
      { status: 500 },
    );
  }
}
