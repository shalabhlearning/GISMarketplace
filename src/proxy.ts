import { NextRequest, NextResponse } from 'next/server';

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Only apply protection to dashboard routes
  if (!pathname.startsWith('/dashboard/')) {
    return NextResponse.next();
  }

  const sessionToken = req.cookies.get('session_token')?.value;

  // No token at all → redirect to homepage
  if (!sessionToken) {
    return NextResponse.redirect(new URL('/', req.url));
  }

  // Validate the session by calling your /api/auth/me endpoint
  const authRes = await fetch(new URL('/api/auth/me', req.url), {
    headers: {
      cookie: `session_token=${sessionToken}`,
    },
    credentials: 'include', // Important for cookie forwarding
  });

  // If auth check fails (invalid/expired token) → redirect + clear cookie
  if (!authRes.ok) {
    const response = NextResponse.redirect(new URL('/', req.url));
    response.cookies.delete('session_token');
    return response;
  }

  const data = await authRes.json();
  const user = data.user;

  // If no valid user returned → redirect + clear cookie
  if (!user) {
    const response = NextResponse.redirect(new URL('/', req.url));
    response.cookies.delete('session_token');
    return response;
  }

  // Role-based access control
  const isBuyerRoute = pathname.startsWith('/pages/Buyerpage');
  const isProviderRoute = pathname.startsWith('/pages/Providerpage');

  if (isBuyerRoute && user.user_type !== 'buyer') {
    return NextResponse.redirect(new URL('/', req.url));
  }

  if (isProviderRoute && user.user_type !== 'provider') {
    return NextResponse.redirect(new URL('/', req.url));
  }

  // All checks passed → allow access
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/dashboard/:path*',  // Protects ALL sub-paths under /dashboard/
  ],
};