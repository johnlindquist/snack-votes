import { NextResponse } from 'next/server';
import { headers } from 'next/headers';

export async function GET() {
  const headersList = headers();
  const auth = headersList.get('authorization');

  if (auth === 'Basic myplainTextAdminCreds') {
    return NextResponse.json({ authenticated: true });
  }

  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}
