import { NextResponse } from 'next/server';
import { PrismaClient, Prisma } from '@prisma/client';
import { PrismaD1 } from '@prisma/adapter-d1';
import type { D1Database } from '@cloudflare/workers-types';

interface D1Context {
  env?: {
    DB?: D1Database;
  };
}

export async function GET(request: Request) {
  try {
    // Get the D1 database from the request context
    const context = (request as unknown as { context: D1Context }).context;
    const db = context?.env?.DB;

    let client: PrismaClient;

    if (process.env.NODE_ENV === 'production' && db) {
      // In production, use the D1 adapter
      const clientOptions: Prisma.PrismaClientOptions = {
        adapter: new PrismaD1(db),
      };
      client = new PrismaClient(clientOptions);
    } else {
      // In development, use the default client from db.ts
      client = new PrismaClient({ adapter: null });
    }

    const pairs = await client.pair.findMany();
    return NextResponse.json(pairs);
  } catch (error) {
    console.error('Error fetching pairs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch pairs' },
      { status: 500 },
    );
  }
}
