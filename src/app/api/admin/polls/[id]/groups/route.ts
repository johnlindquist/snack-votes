import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { isAdmin } from '@/app/api/auth';

// GET /api/admin/polls/[id]/groups - Get all groups for a poll
export async function GET(
  request: Request,
  { params }: { params: { id: string } },
) {
  console.log(`GET /api/admin/polls/${params.id}/groups request received`);
  try {
    const isAdminUser = await isAdmin();
    console.log('isAdmin check result:', isAdminUser);
    if (!isAdminUser) {
      console.log(
        `Unauthorized access attempt to GET /api/admin/polls/${params.id}/groups`,
      );
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const pollId = parseInt(params.id);
    if (isNaN(pollId)) {
      console.log('Invalid poll ID:', params.id);
      return NextResponse.json({ error: 'Invalid poll ID' }, { status: 400 });
    }

    console.log(`Fetching groups for poll ID ${pollId}`);
    const groups = await prisma.group.findMany({
      where: { pollId },
      include: {
        pairs: true,
        _count: {
          select: { pairs: true },
        },
      },
      orderBy: { id: 'asc' },
    });

    console.log(`Found ${groups.length} groups for poll ID ${pollId}`);
    return NextResponse.json(groups);
  } catch (error) {
    console.error('Error fetching groups:', error);
    return NextResponse.json(
      { error: 'Failed to fetch groups' },
      { status: 500 },
    );
  }
}

// POST /api/admin/polls/[id]/groups - Create a new group for a poll
export async function POST(
  request: Request,
  { params }: { params: { id: string } },
) {
  console.log(`POST /api/admin/polls/${params.id}/groups request received`);
  try {
    const isAdminUser = await isAdmin();
    console.log('isAdmin check result:', isAdminUser);
    if (!isAdminUser) {
      console.log(
        `Unauthorized access attempt to POST /api/admin/polls/${params.id}/groups`,
      );
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const pollId = parseInt(params.id);
    if (isNaN(pollId)) {
      console.log('Invalid poll ID:', params.id);
      return NextResponse.json({ error: 'Invalid poll ID' }, { status: 400 });
    }

    // Check if poll exists
    const poll = await prisma.poll.findUnique({
      where: { id: pollId },
    });

    if (!poll) {
      console.log(`Poll with ID ${pollId} not found`);
      return NextResponse.json({ error: 'Poll not found' }, { status: 404 });
    }

    const body = await request.json();
    console.log('Request body:', body);
    const { title } = body;

    if (!title || !title.trim()) {
      console.log('Missing or empty title in request body');
      return NextResponse.json(
        { error: 'Group title is required' },
        { status: 400 },
      );
    }

    console.log(`Creating new group "${title}" for poll ID ${pollId}`);
    const newGroup = await prisma.group.create({
      data: {
        title: title.trim(),
        poll: { connect: { id: pollId } },
      },
    });
    console.log('New group created:', newGroup);

    return NextResponse.json(newGroup, { status: 201 });
  } catch (error) {
    console.error('Error creating group:', error);
    return NextResponse.json(
      { error: 'Failed to create group' },
      { status: 500 },
    );
  }
}
