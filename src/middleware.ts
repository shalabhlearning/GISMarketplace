import { NextRequest, NextResponse } from 'next/server';

export async function middleware(req: NextRequest) {
  const sessionToken = req.cookies.get('session_token')?.value;

  const protectedProviderRoute = req.nextUrl.pathname.startsWith('/dashboard/provider');

  if (!protectedProviderRoute) return NextResponse.next();

  if (!sessionToken) {
    return NextResponse.redirect(new URL('/', req.url));
  }

  const res = await fetch(new URL('/api/auth/me', req.url), {
    headers: { cookie: `session_token=${sessionToken}` },
  });

  if (!res.ok) {
    return NextResponse.redirect(new URL('/', req.url));
  }

  const { user } = await res.json();

  if (user.user_type !== 'provider') {
    return NextResponse.redirect(new URL('/', req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/provider/:path*'],
};
