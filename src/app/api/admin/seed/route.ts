import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// For this simple project, assume admin authentication is done via headers
async function isAdmin(request: Request) {
  const auth = request.headers.get('authorization');
  return auth === 'Basic myplainTextAdminCreds';
}

const pairs = [
  { optionA: 'hot tamales', optionB: 'dark chocolate' },
  { optionA: 'skinny pop regular', optionB: 'popcorn' },
  { optionA: 'cookies', optionB: 'chocolate' },
  { optionA: 'munchies', optionB: 'regular chex mix' },
  { optionA: 'pringles', optionB: 'pringles BBQ' },
  { optionA: 'Chocolate raisins', optionB: 'dried mangos' },
];

export async function POST(request: Request) {
  if (!(await isAdmin(request))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Delete existing pairs
    await prisma.pair.deleteMany();

    // Create new pairs
    const createdPairs = await Promise.all(
      pairs.map((pair) =>
        prisma.pair.create({
          data: pair,
        }),
      ),
    );

    return NextResponse.json(createdPairs, { status: 201 });
  } catch (error) {
    console.error('Error seeding pairs:', error);
    return NextResponse.json(
      { error: 'Failed to seed pairs' },
      { status: 500 },
    );
  }
}
