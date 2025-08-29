// Client-side invitation token management

export function storeInvitationToken(token: string) {
  if (typeof window !== 'undefined') {
    localStorage.setItem('invitation_token', token);
  }
}

export function getInvitationToken(): string | null {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('invitation_token');
  }
  return null;
}

export function clearInvitationToken() {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('invitation_token');
  }
}

export function getOAuthRedirectUrl(): string {
  const token = getInvitationToken();
  const baseUrl = `${window.location.origin}/auth/callback`;
  
  if (token) {
    return `${baseUrl}?invitation_token=${token}`;
  }
  
  return baseUrl;
}