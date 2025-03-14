import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// For this simple project, assume admin authentication is done via headers
async function isAdmin(request: Request) {
  const auth = request.headers.get('authorization');
  return auth === 'Basic myplainTextAdminCreds';
}

export async function GET(request: Request) {
  if (!(await isAdmin(request))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const pairs = await prisma.pair.findMany({
      include: { votes: true },
    });
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
  if (!(await isAdmin(request))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { optionA, optionB } = await request.json();

    if (!optionA || !optionB) {
      return NextResponse.json(
        { error: 'Both options are required' },
        { status: 400 },
      );
    }

    const newPair = await prisma.pair.create({
      data: { optionA, optionB },
    });

    return NextResponse.json(newPair, { status: 201 });
  } catch (error) {
    console.error('Error creating pair:', error);
    return NextResponse.json(
      { error: 'Failed to create pair' },
      { status: 500 },
    );
  }
}
