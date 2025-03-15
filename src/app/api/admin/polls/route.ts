import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { isAdmin } from '@/app/api/auth';

export async function GET(_request: Request) {
  console.log('GET /api/admin/polls request received');
  try {
    const isAdminUser = await isAdmin();
    console.log('isAdmin check result:', isAdminUser);
    if (!isAdminUser) {
      console.log('Unauthorized access attempt to GET /api/admin/polls');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('Fetching polls from database');
    const polls = await prisma.poll.findMany({
      include: {
        _count: {
          select: {
            pairs: true,
            voters: true,
          },
        },
      },
    });
    console.log(`Successfully fetched ${polls.length} polls`);
    return NextResponse.json(polls);
  } catch (error) {
    console.error('Error fetching polls:', error);
    return NextResponse.json(
      { error: 'Failed to fetch polls' },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  console.log('POST /api/admin/polls request received');
  try {
    const isAdminUser = await isAdmin();
    console.log('isAdmin check result:', isAdminUser);
    if (!isAdminUser) {
      console.log('Unauthorized access attempt to POST /api/admin/polls');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    console.log('Request body:', body);
    const { title } = body;

    if (!title) {
      console.log('Missing required fields in request body');
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }

    console.log('Creating new poll:', { title });
    const newPoll = await prisma.poll.create({
      data: { title },
    });
    console.log('New poll created:', newPoll);

    return NextResponse.json(newPoll, { status: 201 });
  } catch (error) {
    console.error('Error creating poll:', error);
    return NextResponse.json(
      { error: 'Failed to create poll' },
      { status: 500 },
    );
  }
}
