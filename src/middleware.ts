import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Only apply to API routes
  if (request.nextUrl.pathname.startsWith('/api/')) {
    // Get the response
    const response = NextResponse.next();

    // Add cache control headers to prevent caching
    response.headers.set(
      'Cache-Control',
      'no-store, no-cache, must-revalidate, proxy-revalidate',
    );
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');
    response.headers.set('Surrogate-Control', 'no-store');

    // Add a unique header to help debug
    response.headers.set('X-Cache-Timestamp', Date.now().toString());

    return response;
  }

  return NextResponse.next();
}

// Configure the middleware to run only for API routes
export const config = {
  matcher: '/api/:path*',
};
