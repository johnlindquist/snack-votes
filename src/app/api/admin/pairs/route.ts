import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { isAdmin } from '@/app/api/auth';

export async function GET(request: Request) {
  console.log('GET /api/admin/pairs request received');
  try {
    const isAdminUser = await isAdmin();
    console.log('isAdmin check result:', isAdminUser);
    if (!isAdminUser) {
      console.log('Unauthorized access attempt to GET /api/admin/pairs');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get query params
    const url = new URL(request.url);
    const pollId = url.searchParams.get('pollId');
    const groupId = url.searchParams.get('groupId');

    const whereClause: Record<string, unknown> = {};

    // Filter by pollId if provided
    if (pollId) {
      const pollIdNum = parseInt(pollId, 10);
      if (!isNaN(pollIdNum)) {
        whereClause.pollId = pollIdNum;
        console.log(`Fetching pairs for poll ${pollIdNum}`);
      }
    }

    // Filter by groupId if provided
    if (groupId) {
      const groupIdNum = parseInt(groupId, 10);
      if (!isNaN(groupIdNum)) {
        whereClause.groupId = groupIdNum;
        console.log(`Fetching pairs for group ${groupIdNum}`);
      }
    }

    console.log('Fetching pairs from database with where clause:', whereClause);
    const pairs = await prisma.pair.findMany({
      where: whereClause,
      include: {
        votes: true,
        group: true,
      },
    });
    console.log(`Successfully fetched ${pairs.length} pairs`);
    return NextResponse.json(pairs);
  } catch (error) {
    console.error('Error fetching pairs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch pairs' },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  console.log('POST /api/admin/pairs request received');
  try {
    const isAdminUser = await isAdmin();
    console.log('isAdmin check result:', isAdminUser);
    if (!isAdminUser) {
      console.log('Unauthorized access attempt to POST /api/admin/pairs');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    console.log('Request body:', body);
    const { optionA, optionB, groupId, pollId } = body;

    if (!optionA || !optionB) {
      console.log('Missing required fields in request body');
      return NextResponse.json(
        { error: 'Both options are required' },
        { status: 400 },
      );
    }

    // Check if we have either groupId or pollId
    if (!groupId && !pollId) {
      console.log('Missing both groupId and pollId in request body');
      return NextResponse.json(
        { error: 'Either groupId or pollId is required' },
        { status: 400 },
      );
    }

    // If we have a groupId, get the poll from the group
    if (groupId) {
      console.log('Creating new pair with group connection:', {
        optionA,
        optionB,
        groupId,
      });

      // Get the poll from the group
      const group = await prisma.group.findUnique({
        where: { id: groupId },
        select: { pollId: true },
      });

      if (!group) {
        return NextResponse.json({ error: 'Group not found' }, { status: 404 });
      }

      // Create the pair with both group and poll connections
      const newPair = await prisma.pair.create({
        data: {
          optionA,
          optionB,
          group: { connect: { id: groupId } },
          poll: { connect: { id: group.pollId } },
        },
      });

      console.log('New pair created:', newPair);
      return NextResponse.json(newPair, { status: 201 });
    }
    // If we only have pollId
    else {
      console.log('Creating new pair with poll connection:', {
        optionA,
        optionB,
        pollId,
      });

      const newPair = await prisma.pair.create({
        data: {
          optionA,
          optionB,
          poll: { connect: { id: pollId } },
        },
      });

      console.log('New pair created:', newPair);
      return NextResponse.json(newPair, { status: 201 });
    }
  } catch (error) {
    console.error('Error creating pair:', error);
    return NextResponse.json(
      { error: 'Failed to create pair' },
      { status: 500 },
    );
  }
}
