import { headers } from 'next/headers';

// For this simple project, assume admin authentication is done via headers
export async function isAdmin(): Promise<boolean> {
  const headersList = headers();
  const auth = headersList.get('authorization');
  return auth === 'Basic myplainTextAdminCreds';
}
