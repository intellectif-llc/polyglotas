import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const token = searchParams.get('token');

  console.log('[INVITE_REDEEM] Starting invitation redemption process', { token });

  if (!token) {
    console.log('[INVITE_REDEEM] ERROR: No token provided');
    return NextResponse.json({ error: 'Token is required' }, { status: 400 });
  }

  try {
    const supabase = await createClient();
    const serviceSupabase = createServiceClient();
    
    const { data: { user } } = await supabase.auth.getUser();
    console.log('[INVITE_REDEEM] User authentication check', { userId: user?.id, hasUser: !!user });
    
    if (!user) {
      console.log('[INVITE_REDEEM] No authenticated user, redirecting to invitation page');
      return NextResponse.redirect(new URL(`/invite/${token}`, process.env.NEXT_PUBLIC_SITE_URL));
    }

    // Get invitation details
    console.log('[INVITE_REDEEM] Fetching invitation details', { token });
    const { data: invitation, error: invitationError } = await serviceSupabase
      .from('partnership_invitations')
      .select(`
        *,
        partnership:partnerships(*)
      `)
      .eq('token', token)
      .eq('status', 'pending')
      .gt('expires_at', new Date().toISOString())
      .single();

    console.log('[INVITE_REDEEM] Invitation fetch result', { 
      hasInvitation: !!invitation, 
      invitationId: invitation?.id,
      partnershipId: invitation?.partnership_id,
      trialTier: invitation?.partnership?.trial_tier,
      trialDuration: invitation?.partnership?.trial_duration_days,
      error: invitationError 
    });

    if (!invitation) {
      console.log('[INVITE_REDEEM] ERROR: Invalid or expired invitation');
      return NextResponse.redirect(new URL('/invite/error?error=invalid', process.env.NEXT_PUBLIC_SITE_URL));
    }

    // Check if invitation is for this user's email
    console.log('[INVITE_REDEEM] Verifying user email match');
    const { data: userIdentity, error: identityError } = await serviceSupabase.auth.admin.getUserById(user.id);
    console.log('[INVITE_REDEEM] User identity check', { 
      userEmail: userIdentity.user?.email, 
      intendedEmail: invitation.intended_for_email,
      emailMatch: userIdentity.user?.email === invitation.intended_for_email,
      identityError 
    });
    
    if (userIdentity.user?.email !== invitation.intended_for_email) {
      console.log('[INVITE_REDEEM] ERROR: Email mismatch');
      return NextResponse.redirect(new URL('/invite/error?error=wrong_email', process.env.NEXT_PUBLIC_SITE_URL));
    }

    // Mark invitation as redeemed
    console.log('[INVITE_REDEEM] Marking invitation as redeemed', { invitationId: invitation.id, userId: user.id });
    const { error: redeemError } = await serviceSupabase
      .from('partnership_invitations')
      .update({
        status: 'redeemed',
        redeemed_by_profile_id: user.id,
        redeemed_at: new Date().toISOString(),
      })
      .eq('id', invitation.id);
    
    console.log('[INVITE_REDEEM] Invitation redemption result', { success: !redeemError, error: redeemError });

    // Update user's profile with partnership benefits
    console.log('[INVITE_REDEEM] Updating user profile with partnership', { userId: user.id, partnershipId: invitation.partnership_id });
    const { error: profileUpdateError } = await serviceSupabase
      .from('profiles')
      .update({
        partnership_id: invitation.partnership_id,
      })
      .eq('id', user.id);
    
    console.log('[INVITE_REDEEM] Profile update result', { success: !profileUpdateError, error: profileUpdateError });

    // Get monthly price record for the trial tier
    console.log('[INVITE_REDEEM] Fetching trial price', { trialTier: invitation.partnership.trial_tier });
    const { data: trialPrice, error: priceError } = await serviceSupabase
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

    console.log('[INVITE_REDEEM] Trial price fetch result', { 
      hasPrice: !!trialPrice, 
      priceId: trialPrice?.id, 
      tierKey: Array.isArray(trialPrice?.products) ? trialPrice.products[0]?.tier_key : undefined,
      error: priceError 
    });

    if (!trialPrice) {
      console.error('[INVITE_REDEEM] ERROR: No active price found for trial tier:', invitation.partnership.trial_tier);
      return NextResponse.json({ error: 'Trial configuration error' }, { status: 500 });
    }

    // Calculate trial period dates
    const trialStart = new Date();
    const trialEnd = new Date();
    trialEnd.setDate(trialEnd.getDate() + invitation.partnership.trial_duration_days);
    
    const subscriptionData = {
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
    };

    console.log('[INVITE_REDEEM] Creating trial subscription', { 
      userId: user.id, 
      priceId: trialPrice.id,
      trialDuration: invitation.partnership.trial_duration_days,
      subscriptionId: subscriptionData.stripe_subscription_id
    });

    // Create trial subscription record
    const { error: subscriptionError } = await serviceSupabase
      .from('student_subscriptions')
      .insert(subscriptionData);

    console.log('[INVITE_REDEEM] Trial subscription creation result', { 
      success: !subscriptionError, 
      error: subscriptionError 
    });

    if (subscriptionError) {
      console.error('[INVITE_REDEEM] ERROR: Failed to create trial subscription:', subscriptionError);
      return NextResponse.json({ error: 'Failed to create trial subscription' }, { status: 500 });
    }

    // Update student profile with partnership benefits
    console.log('[INVITE_REDEEM] Updating student profile tier', { 
      userId: user.id, 
      newTier: invitation.partnership.trial_tier,
      partnershipId: invitation.partnership_id 
    });
    
    const { error: studentProfileError } = await serviceSupabase
      .from('student_profiles')
      .update({
        subscription_tier: invitation.partnership.trial_tier,
        partnership_id: invitation.partnership_id,
      })
      .eq('profile_id', user.id);

    console.log('[INVITE_REDEEM] Student profile update result', { 
      success: !studentProfileError, 
      error: studentProfileError 
    });

    // CRITICAL: Call the database function to properly calculate subscription tier
    console.log('[INVITE_REDEEM] Calling update_user_subscription_tier function', { userId: user.id });
    const { data: tierUpdateResult, error: tierUpdateError } = await serviceSupabase
      .rpc('update_user_subscription_tier', {
        user_profile_id: user.id
      });

    console.log('[INVITE_REDEEM] Subscription tier update function result', { 
      result: tierUpdateResult,
      success: !tierUpdateError, 
      error: tierUpdateError 
    });

    if (tierUpdateError) {
      console.error('[INVITE_REDEEM] ERROR: Failed to update subscription tier via function:', tierUpdateError);
    }

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
    console.error('[INVITE_REDEEM] FATAL ERROR: Exception during invitation redemption:', error);
    return NextResponse.json(
      { error: 'Failed to redeem invitation' },
      { status: 500 }
    );
  }
}