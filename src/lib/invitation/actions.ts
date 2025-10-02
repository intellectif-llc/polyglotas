'use server';

import { cookies } from 'next/headers';

const INVITATION_COOKIE_NAME = 'invitation_token';
const COOKIE_MAX_AGE = 60 * 60; // 1 hour

export async function setInvitationTokenAction(token: string) {
  const cookieStore = await cookies();
  
  console.log('[INVITATION_ACTION] Setting invitation token cookie', { token });
  
  cookieStore.set(INVITATION_COOKIE_NAME, token, {
    httpOnly: false, // Need client-side access for OAuth URLs
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax', // Allows OAuth redirects
    path: '/',
    maxAge: COOKIE_MAX_AGE,
  });
}

export async function clearInvitationTokenAction() {
  const cookieStore = await cookies();
  
  console.log('[INVITATION_ACTION] Clearing invitation token cookie');
  
  cookieStore.delete(INVITATION_COOKIE_NAME);
}