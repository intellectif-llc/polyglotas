// Client-side invitation token management

export function storeInvitationToken(token: string) {
  if (typeof window !== 'undefined') {
    console.log('[INVITATION_CLIENT] Storing invitation token', { token });
    localStorage.setItem('invitation_token', token);
  } else {
    console.log('[INVITATION_CLIENT] Cannot store token - window undefined');
  }
}

export function getInvitationToken(): string | null {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('invitation_token');
    console.log('[INVITATION_CLIENT] Retrieved invitation token', { token, hasToken: !!token });
    return token;
  }
  console.log('[INVITATION_CLIENT] Cannot retrieve token - window undefined');
  return null;
}

export function clearInvitationToken() {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('invitation_token');
  }
}

export function getOAuthRedirectUrl(): string {
  if (typeof window === 'undefined') {
    const url = `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`;
    console.log('[INVITATION_CLIENT] Server-side OAuth URL', { url });
    return url;
  }
  
  const token = getInvitationToken();
  const baseUrl = `${window.location.origin}/auth/callback`;
  
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