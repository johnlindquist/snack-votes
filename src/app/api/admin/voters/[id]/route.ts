import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { isAdmin } from '../../../auth';

const prisma = new PrismaClient();

export async function DELETE(
    request: Request,
    { params }: { params: { id: string } }
) {
    if (!await isAdmin(request)) {
        return NextResponse.json(
            { error: 'Unauthorized' },
            { status: 401 }
        );
    }

    try {
        const voterId = parseInt(params.id);

        if (isNaN(voterId)) {
            return NextResponse.json(
                { error: 'Invalid voter ID' },
                { status: 400 }
            );
        }

        await prisma.voter.delete({
            where: { id: voterId }
        });

        return NextResponse.json({ message: 'Voter and their votes deleted successfully' });
    } catch (error) {
        console.error('Error deleting voter:', error);
        return NextResponse.json(
            { error: 'Failed to delete voter' },
            { status: 500 }
        );
    }
} 