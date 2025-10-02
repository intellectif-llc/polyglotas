// Server-side invitation token management using cookies
import { cookies } from 'next/headers';

const INVITATION_COOKIE_NAME = 'invitation_token';

export async function getInvitationToken(): Promise<string | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(INVITATION_COOKIE_NAME)?.value || null;
  
  console.log('[INVITATION_SERVER] Retrieved invitation token cookie', { token, hasToken: !!token });
  
  return token;
}