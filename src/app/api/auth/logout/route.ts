import { NextResponse } from 'next/server';

export async function POST() {
  // Create the redirect response
  const redirectUrl = new URL('/', process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000');
  const response = NextResponse.redirect(redirectUrl);

  // Delete the session cookie in the response headers
  response.cookies.delete('session_token');

  return response;
}