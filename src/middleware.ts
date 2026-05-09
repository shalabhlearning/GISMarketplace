// src/middleware.ts
import { NextRequest, NextResponse } from 'next/server';

export async function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname;
  const sessionToken = req.cookies.get('session_token')?.value;

  // ✅ Public routes (no auth required)
  const isPublicRoute = 
    path === '/' ||
    path.startsWith('/api/auth') ||
    path.startsWith('/api/login') ||
    path.startsWith('/api/register') ||
    path.startsWith('/api/send-otp') ||
    path.startsWith('/api/verify-otp') ||
    path.startsWith('/api/rfp') ||           // ← ADD THIS
    path.startsWith('/api/proposal');        // ← Already had this

  if (isPublicRoute) {
    return NextResponse.next();
  }

  // No session → redirect to login/home
  if (!sessionToken) {
    return NextResponse.redirect(new URL('/', req.url));
  }

  // Validate session
  try {
    const authRes = await fetch(new URL('/api/auth/me', req.url), {
      headers: {
        cookie: `session_token=${sessionToken}`,
      },
    });

    if (!authRes.ok) {
      const response = NextResponse.redirect(new URL('/', req.url));
      response.cookies.delete('session_token');
      return response;
    }

    const { user } = await authRes.json();

    if (!user) {
      const response = NextResponse.redirect(new URL('/', req.url));
      response.cookies.delete('session_token');
      return response;
    }

    // Role-based protection
    if (path.startsWith('/admin') && user.user_type !== 'admin') {
      return NextResponse.redirect(new URL('/', req.url));
    }
    if (path.startsWith('/buyer') && user.user_type !== 'buyer') {
      return NextResponse.redirect(new URL('/', req.url));
    }
    if (path.startsWith('/provider') && user.user_type !== 'provider') {
      return NextResponse.redirect(new URL('/', req.url));
    }

  } catch (error) {
    console.error('Middleware auth error:', error);
    return NextResponse.redirect(new URL('/', req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/buyer/:path*',
    '/provider/:path*',
    '/admin/:path*',
    '/propose/:path*',
    '/subscribe/:path*',
    '/api/rfp/:path*',        // ← ADD THIS
    '/api/proposal/:path*',
  ],
};