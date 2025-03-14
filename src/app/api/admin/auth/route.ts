import { NextResponse } from 'next/server';
import { headers } from 'next/headers';

export async function GET() {
  console.log('GET /api/admin/auth request received');
  try {
    const headersList = headers();
    const auth = headersList.get('authorization');
    console.log('Authorization header:', auth);

    if (auth === 'Basic myplainTextAdminCreds') {
      console.log('Authentication successful');
      return NextResponse.json({ authenticated: true });
    }

    console.log('Authentication failed');
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  } catch (error) {
    console.error('Error in admin auth:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
