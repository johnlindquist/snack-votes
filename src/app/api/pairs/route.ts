import { NextResponse } from 'next/server';
import prisma from '@/lib/db';

export async function GET() {
  try {
    const pairs = await prisma.pair.findMany();
    return NextResponse.json(pairs);
  } catch (error) {
    console.error('Error fetching pairs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch pairs' },
      { status: 500 },
    );
  }
}
