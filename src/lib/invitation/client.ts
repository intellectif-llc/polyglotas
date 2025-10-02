// Client-side invitation token management using cookies

function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) {
    return parts.pop()?.split(';').shift() || null;
  }
  return null;
}

function setCookie(name: string, value: string, maxAge: number = 3600) {
  if (typeof document === 'undefined') return;
  
  const secure = window.location.protocol === 'https:' ? '; Secure' : '';
  document.cookie = `${name}=${value}; Path=/; SameSite=Lax; Max-Age=${maxAge}${secure}`;
}

function deleteCookie(name: string) {
  if (typeof document === 'undefined') return;
  
  document.cookie = `${name}=; Path=/; SameSite=Lax; Max-Age=0`;
}

export function storeInvitationToken(token: string) {
  console.log('[INVITATION_CLIENT] Storing invitation token in cookie', { token });
  setCookie('invitation_token', token, 3600); // 1 hour
}

export function getInvitationToken(): string | null {
  const token = getCookie('invitation_token');
  console.log('[INVITATION_CLIENT] Retrieved invitation token from cookie', { token, hasToken: !!token });
  return token;
}

export function clearInvitationToken() {
  console.log('[INVITATION_CLIENT] Clearing invitation token cookie');
  deleteCookie('invitation_token');
}

export function getOAuthRedirectUrl(): string {
  const baseUrl = typeof window !== 'undefined' 
    ? `${window.location.origin}/auth/callback`
    : `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`;
  
  const token = getInvitationToken();
  
  if (token) {
    const urlWithToken = `${baseUrl}?invitation_token=${token}`;
    console.log('[INVITATION_CLIENT] OAuth URL with invitation token', { 
      baseUrl, 
      token, 
      finalUrl: urlWithToken 
    });
    return urlWithToken;
  }
  
  console.log('[INVITATION_CLIENT] OAuth URL without token', { baseUrl });
  return baseUrl;
}