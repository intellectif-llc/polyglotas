import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const token = searchParams.get('token');

  if (!token) {
    return NextResponse.json({ error: 'Token is required' }, { status: 400 });
  }

  try {
    const supabase = await createClient();
    const serviceSupabase = createServiceClient();
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.redirect(new URL(`/invite/${token}`, process.env.NEXT_PUBLIC_SITE_URL));
    }

    // Get invitation details
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
      return NextResponse.redirect(new URL('/invite/error?error=invalid', process.env.NEXT_PUBLIC_SITE_URL));
    }

    // Check if invitation is for this user's email
    const { data: userIdentity } = await serviceSupabase.auth.admin.getUserById(user.id);
    if (userIdentity.user?.email !== invitation.intended_for_email) {
      return NextResponse.redirect(new URL('/invite/error?error=wrong_email', process.env.NEXT_PUBLIC_SITE_URL));
    }

    // Mark invitation as redeemed
    await serviceSupabase
      .from('partnership_invitations')
      .update({
        status: 'redeemed',
        redeemed_by_profile_id: user.id,
        redeemed_at: new Date().toISOString(),
      })
      .eq('id', invitation.id);

    // Update user's profile with partnership benefits
    await serviceSupabase
      .from('profiles')
      .update({
        partnership_id: invitation.partnership_id,
      })
      .eq('id', user.id);

    // Get monthly price record for the trial tier
    const { data: trialPrice } = await serviceSupabase
      .from('prices')
      .select(`
        id,
        products!inner(tier_key)
      `)
      .eq('products.tier_key', invitation.partnership.trial_tier)
      .eq('active', true)
      .eq('billing_interval', 'month')
      .limit(1)
      .single();

    if (!trialPrice) {
      console.error('No active price found for trial tier:', invitation.partnership.trial_tier);
      return NextResponse.json({ error: 'Trial configuration error' }, { status: 500 });
    }

    // Calculate trial period dates
    const trialStart = new Date();
    const trialEnd = new Date();
    trialEnd.setDate(trialEnd.getDate() + invitation.partnership.trial_duration_days);

    // Create trial subscription record
    const { error: subscriptionError } = await serviceSupabase
      .from('student_subscriptions')
      .insert({
        profile_id: user.id,
        price_id: trialPrice.id,
        stripe_subscription_id: `trial_${invitation.partnership_id}_${user.id}_${Date.now()}`,
        status: 'trialing',
        current_period_start: trialStart.toISOString(),
        current_period_end: trialEnd.toISOString(),
        trial_start_at: trialStart.toISOString(),
        trial_end_at: trialEnd.toISOString(),
        metadata: {
          partnership_id: invitation.partnership_id,
          invitation_id: invitation.id,
          trial_type: 'partnership'
        }
      });

    if (subscriptionError) {
      console.error('Error creating trial subscription:', subscriptionError);
    }

    // Update student profile with partnership benefits
    await serviceSupabase
      .from('student_profiles')
      .update({
        subscription_tier: invitation.partnership.trial_tier,
        partnership_id: invitation.partnership_id,
      })
      .eq('profile_id', user.id);

    // Create response with script to clear localStorage
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Invitation Redeemed</title>
        </head>
        <body>
          <script>
            localStorage.removeItem('invitation_token');
            window.location.href = '${process.env.NEXT_PUBLIC_SITE_URL}/learn?invitation_redeemed=true&partnership=${encodeURIComponent(invitation.partnership.name)}';
          </script>
        </body>
      </html>
    `;
    
    return new NextResponse(html, {
      headers: { 'Content-Type': 'text/html' },
    });

  } catch (error) {
    console.error('Error redeeming invitation:', error);
    return NextResponse.json(
      { error: 'Failed to redeem invitation' },
      { status: 500 }
    );
  }
}