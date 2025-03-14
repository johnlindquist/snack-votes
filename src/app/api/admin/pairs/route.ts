import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { isAdmin } from '@/app/api/auth';

export async function GET(_request: Request) {
  console.log('GET /api/admin/pairs request received');
  try {
    const isAdminUser = await isAdmin();
    console.log('isAdmin check result:', isAdminUser);
    if (!isAdminUser) {
      console.log('Unauthorized access attempt to GET /api/admin/pairs');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('Fetching pairs from database');
    const pairs = await prisma.pair.findMany({
      include: { votes: true },
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
    const { optionA, optionB } = body;

    if (!optionA || !optionB) {
      console.log('Missing required fields in request body');
      return NextResponse.json(
        { error: 'Both options are required' },
        { status: 400 },
      );
    }

    console.log('Creating new pair:', { optionA, optionB });
    const newPair = await prisma.pair.create({
      data: { optionA, optionB },
    });
    console.log('New pair created:', newPair);

    return NextResponse.json(newPair, { status: 201 });
  } catch (error) {
    console.error('Error creating pair:', error);
    return NextResponse.json(
      { error: 'Failed to create pair' },
      { status: 500 },
    );
  }
}
