import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
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
    const { pairsText } = body;

    if (!pairsText) {
      console.log('No pairsText provided in request body');
      return NextResponse.json({ error: 'No text provided' }, { status: 400 });
    }

    // Split the text into groups of two lines
    const groups = pairsText
      .split(/\n\s*\n/) // Split on empty lines
      .filter(Boolean); // Remove empty groups

    console.log(`Parsed ${groups.length} groups from input text`);

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

    console.log(`Created ${pairs.length} pair objects:`, pairs);

    // Create all pairs in the database
    console.log('Creating pairs in database');
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
