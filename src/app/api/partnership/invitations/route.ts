import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { sendEmail } from '@/lib/email/ses';
import { renderPartnershipInvitationEmail } from '@/lib/email/render';

export async function POST(request: NextRequest) {
  try {
    const { email, expiresInDays = 30, partnershipId } = await request.json();

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    const supabase = await createClient();
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user profile and partnership
    const { data: profile } = await supabase
      .from('profiles')
      .select('partnership_id, role')
      .eq('id', user.id)
      .single();

    if (!profile || (profile.role !== 'partnership_manager' && profile.role !== 'admin')) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    // Determine which partnership to use
    let targetPartnershipId = profile.partnership_id;
    
    if (profile.role === 'admin') {
      if (!partnershipId) {
        return NextResponse.json({ error: 'Partnership ID required for admin' }, { status: 400 });
      }
      targetPartnershipId = partnershipId;
    } else if (!profile.partnership_id) {
      return NextResponse.json({ error: 'No partnership associated' }, { status: 400 });
    }

    // Get partnership details
    const { data: partnership } = await supabase
      .from('partnerships')
      .select('*')
      .eq('id', targetPartnershipId)
      .single();

    if (!partnership) {
      return NextResponse.json({ error: 'Partnership not found' }, { status: 404 });
    }

    // Create invitation
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + expiresInDays);

    const { data: invitation, error: invitationError } = await supabase
      .from('partnership_invitations')
      .insert([{
        partnership_id: partnership.id,
        intended_for_email: email,
        expires_at: expiresAt.toISOString(),
      }])
      .select()
      .single();

    if (invitationError) {
      throw invitationError;
    }

    // Generate invitation URL
    const invitationUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/invite/${invitation.token}`;

    // Render email template
    const emailHtml = await renderPartnershipInvitationEmail({
      partnershipName: partnership.name,
      trialDurationDays: partnership.trial_duration_days,
      trialTier: partnership.trial_tier,
      discountPercentage: partnership.discount_percentage,
      invitationUrl,
    });

    // Send email
    await sendEmail({
      to: email,
      subject: `You're invited to join Polyglotas through ${partnership.name}`,
      html: emailHtml,
    });

    return NextResponse.json({ 
      success: true, 
      invitationId: invitation.id,
      token: invitation.token 
    });

  } catch (error) {
    console.error('Error creating invitation:', error);
    return NextResponse.json(
      { error: 'Failed to create invitation' },
      { status: 500 }
    );
  }
}