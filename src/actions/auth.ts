'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export async function logoutAction() {
  // Delete the session cookie
  cookies().delete('session_token');

  // Redirect to homepage
  redirect('/');
}