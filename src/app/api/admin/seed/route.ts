import { NextResponse } from 'next/server';
import prisma from '@/lib/db';

// For this simple project, assume admin authentication is done via headers
async function isAdmin(request: Request) {
  const auth = request.headers.get('authorization');
  return auth === 'Basic myplainTextAdminCreds';
}

export async function POST(request: Request) {
  if (!(await isAdmin(request))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Delete existing data
    await prisma.vote.deleteMany();
    await prisma.pair.deleteMany();
    await prisma.voter.deleteMany();
    await prisma.group.deleteMany();
    await prisma.poll.deleteMany();

    // Create a default poll
    const poll = await prisma.poll.create({
      data: {
        title: 'Snack Preferences',
        isActive: true,
      },
    });

    // Create pairs with the poll connection
    const pairs = [
      { optionA: 'hot tamales', optionB: 'dark chocolate' },
      { optionA: 'skinny pop regular', optionB: 'popcorn' },
      { optionA: 'cookies', optionB: 'chocolate' },
      { optionA: 'munchies', optionB: 'regular chex mix' },
      { optionA: 'pringles', optionB: 'pringles BBQ' },
      { optionA: 'Chocolate raisins', optionB: 'dried mangos' },
    ];

    // Create new pairs
    const createdPairs = await Promise.all(
      pairs.map((pair) =>
        prisma.pair.create({
          data: {
            ...pair,
            poll: { connect: { id: poll.id } },
          },
        }),
      ),
    );

    return NextResponse.json({ poll, pairs: createdPairs }, { status: 201 });
  } catch (error) {
    console.error('Error seeding data:', error);
    return NextResponse.json({ error: 'Failed to seed data' }, { status: 500 });
  }
}
