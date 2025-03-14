import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { isAdmin } from '@/app/api/auth';

export async function POST(request: Request) {
  try {
    if (!(await isAdmin())) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { pairsText } = await request.json();

    if (!pairsText) {
      return NextResponse.json({ error: 'No text provided' }, { status: 400 });
    }

    // Split the text into groups of two lines
    const groups = pairsText
      .split(/\n\s*\n/) // Split on empty lines
      .filter(Boolean); // Remove empty groups

    // Process each group into a pair
    const pairs = groups.map((group: string) => {
      const [optionA, optionB] = group
        .split('\n')
        .map((s: string) => s.trim())
        .filter(Boolean);
      return {
        optionA,
        optionB,
      };
    });

    // Create all pairs in the database
    const result = await prisma.$transaction(
      pairs.map((pair: { optionA: string; optionB: string }) =>
        prisma.pair.create({
          data: {
            optionA: pair.optionA,
            optionB: pair.optionB,
          },
        }),
      ),
    );

    return NextResponse.json({ pairs: result });
  } catch (error) {
    console.error('Error creating pairs:', error);
    return NextResponse.json(
      { error: 'Failed to create pairs' },
      { status: 500 },
    );
  }
}
