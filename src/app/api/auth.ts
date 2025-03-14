import { headers } from 'next/headers';

// For this simple project, assume admin authentication is done via headers
export async function isAdmin(): Promise<boolean> {
  console.log('isAdmin check called');
  try {
    const headersList = headers();
    const auth = headersList.get('authorization');
    console.log('Authorization header:', auth);
    const result = auth === 'Basic myplainTextAdminCreds';
    console.log('isAdmin result:', result);
    return result;
  } catch (error) {
    console.error('Error in isAdmin check:', error);
    return false;
  }
}
