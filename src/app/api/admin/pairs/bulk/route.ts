import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { headers } from 'next/headers';

const prisma = new PrismaClient();

// For this simple project, assume admin authentication is done via headers
async function isAdmin(request: Request) {
    const headersList = await headers();
    const auth = headersList.get('authorization');
    return auth === 'Basic myplainTextAdminCreds';
}

export async function POST(request: Request) {
    if (!await isAdmin(request)) {
        return NextResponse.json(
            { error: 'Unauthorized' },
            { status: 401 }
        );
    }

    try {
        const { pairsText } = await request.json();

        if (!pairsText) {
            return NextResponse.json(
                { error: 'No pairs provided' },
                { status: 400 }
            );
        }

        // Split by double newlines to get groups
        const groups = pairsText.split(/\n\s*\n/).filter(Boolean);

        const pairs = groups.map(group => {
            const [optionA, optionB] = group.split('\n').map(s => s.trim()).filter(Boolean);
            if (!optionA || !optionB) {
                throw new Error('Each group must contain exactly two options');
            }
            return { optionA, optionB };
        });

        // Create all pairs in a transaction
        const createdPairs = await prisma.$transaction(
            pairs.map(pair =>
                prisma.pair.create({
                    data: pair
                })
            )
        );

        return NextResponse.json(createdPairs, { status: 201 });
    } catch (error) {
        console.error('Error creating pairs:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Failed to create pairs' },
            { status: 500 }
        );
    }
} 