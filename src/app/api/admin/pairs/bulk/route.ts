import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { isAdmin } from '@/app/api/auth';

export async function POST(request: Request) {
  console.log('POST /api/admin/pairs/bulk request received');
  try {
    const isAdminUser = await isAdmin();
    console.log('isAdmin check result:', isAdminUser);
    if (!isAdminUser) {
      console.log('Unauthorized access attempt to POST /api/admin/pairs/bulk');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    console.log('Request body:', body);
    const { pairsText, pollId, groupId } = body;

    if (!pairsText) {
      console.log('No pairsText provided in request body');
      return NextResponse.json({ error: 'No text provided' }, { status: 400 });
    }

    // Either groupId or pollId is required
    if (!groupId && !pollId) {
      console.log('Neither groupId nor pollId provided in request body');
      return NextResponse.json(
        { error: 'Either Group ID or Poll ID is required' },
        { status: 400 },
      );
    }

    // Split the text into lines and filter out empty lines
    const lines = pairsText
      .split('\n')
      .map((line: string) => line.trim())
      .filter(Boolean);

    console.log(`Parsed ${lines.length} non-empty lines from input text`);

    // Group lines into pairs (every two lines form a pair)
    const pairs = [];
    for (let i = 0; i < lines.length; i += 2) {
      // Make sure we have both options for the pair
      if (i + 1 < lines.length) {
        pairs.push({
          optionA: lines[i],
          optionB: lines[i + 1],
        });
      }
    }

    console.log(`Created ${pairs.length} pair objects`);

    // If groupId is provided, use it and get the pollId from the group
    let targetPollId = pollId;
    let targetGroupId = groupId;

    if (groupId && !pollId) {
      // Get the pollId from the group
      const group = await prisma.group.findUnique({
        where: { id: groupId },
        select: { pollId: true },
      });

      if (!group) {
        console.log(`Group with ID ${groupId} not found`);
        return NextResponse.json({ error: 'Group not found' }, { status: 404 });
      }

      targetPollId = group.pollId;
      console.log(`Using pollId ${targetPollId} from group ${groupId}`);
    } else if (pollId && !groupId) {
      // If only pollId is provided, check if there are any groups
      const groups = await prisma.group.findMany({
        where: { pollId },
        orderBy: { id: 'asc' },
        take: 1,
      });

      // If there's at least one group, use the first one
      if (groups.length > 0) {
        targetGroupId = groups[0].id;
        console.log(`Using existing group ${targetGroupId} for poll ${pollId}`);
      } else {
        // Create a default group for this poll
        const defaultGroup = await prisma.group.create({
          data: {
            title: 'Default Group',
            pollId,
          },
        });
        targetGroupId = defaultGroup.id;
        console.log(
          `Created default group ${targetGroupId} for poll ${pollId}`,
        );
      }
    }

    // Create all pairs in the database
    console.log('Creating pairs in database');
    const pairsData = pairs.map((pair) => {
      const data: {
        optionA: string;
        optionB: string;
        poll: { connect: { id: number } };
        group?: { connect: { id: number } };
      } = {
        optionA: pair.optionA,
        optionB: pair.optionB,
        poll: { connect: { id: targetPollId } },
      };

      if (targetGroupId) {
        data.group = { connect: { id: targetGroupId } };
      }

      return prisma.pair.create({ data });
    });

    const result = await prisma.$transaction(pairsData);
    console.log(`Successfully created ${result.length} pairs in database`);

    return NextResponse.json({ pairs: result });
  } catch (error) {
    console.error('Error creating pairs:', error);
    return NextResponse.json(
      { error: 'Failed to create pairs' },
      { status: 500 },
    );
  }
}
