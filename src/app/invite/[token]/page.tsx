import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { redirect } from "next/navigation";
import { InvitationRedemption } from "@/components/invitation/InvitationRedemption";

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
    .from("partnership_invitations")
    .select(
      `
      *,
      partnership:partnerships(*)
    `
    )
    .eq("token", token)
    .eq("status", "pending")
    .gt("expires_at", new Date().toISOString())
    .single();

  if (!invitation) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="max-w-md w-full bg-white/10 backdrop-blur-sm border border-white/20 shadow-2xl rounded-2xl p-6">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-white mb-4">
              Invalid or Expired Invitation
            </h1>
            <p className="text-gray-300 mb-6">
              This invitation link is either invalid or has expired.
            </p>
            <a
              href="/auth"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-xl text-white bg-brand-gradient hover:shadow-lg hover:shadow-brand-primary/25 transition-all duration-200"
            >
              Continue to Polyglotas
            </a>
          </div>
        </div>
      </div>
    );
  }

  // Check if user is already authenticated
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    // User is logged in, redirect to redemption handler
    redirect(`/api/invite/redeem?token=${token}`);
  }

  return (
    <InvitationRedemption
      invitation={invitation}
      partnership={invitation.partnership}
      token={token}
    />
  );
}
