import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';
import { redirect } from 'next/navigation';
import { InvitationRedemption } from '@/components/invitation/InvitationRedemption';

interface PageProps {
  params: Promise<{
    token: string;
  }>;
}

export default async function InvitePage({ params }: PageProps) {
  const { token } = await params;
  
  const supabase = await createClient();
  const serviceSupabase = createServiceClient();
  
  // Validate invitation token using service client to bypass RLS
  const { data: invitation } = await serviceSupabase
    .from('partnership_invitations')
    .select(`
      *,
      partnership:partnerships(*)
    `)
    .eq('token', token)
    .eq('status', 'pending')
    .gt('expires_at', new Date().toISOString())
    .single();



  if (!invitation) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-6">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              Invalid or Expired Invitation
            </h1>
            <p className="text-gray-600 mb-6">
              This invitation link is either invalid or has expired.
            </p>
            <a
              href="/auth/signup"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
            >
              Sign Up Normally
            </a>
          </div>
        </div>
      </div>
    );
  }

  // Check if user is already authenticated
  const { data: { user } } = await supabase.auth.getUser();
  
  if (user) {
    // User is logged in, redirect to redemption handler
    redirect(`/api/invite/redeem?token=${token}`);
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <InvitationRedemption 
        invitation={invitation} 
        partnership={invitation.partnership}
        token={token}
      />
    </div>
  );
}