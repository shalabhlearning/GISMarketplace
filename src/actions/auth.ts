'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export async function logoutAction() {
  const cookieStore = await cookies();
  // Delete the session cookie
  cookieStore.delete('session_token');

  // Redirect to homepage
  redirect('/');
}