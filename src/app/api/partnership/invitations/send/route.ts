import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { sendEmail } from '@/lib/email/ses';
import { renderPartnershipInvitationEmail } from '@/lib/email/render';

export async function POST(request: NextRequest) {
  try {
    const { invitationIds } = await request.json();

    if (!invitationIds || !Array.isArray(invitationIds) || invitationIds.length === 0) {
      return NextResponse.json({ error: 'Invitation IDs are required' }, { status: 400 });
    }

    const supabase = await createClient();
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user profile and verify permissions
    const { data: profile } = await supabase
      .from('profiles')
      .select('partnership_id, role')
      .eq('id', user.id)
      .single();

    if (!profile || (profile.role !== 'partnership_manager' && profile.role !== 'admin')) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    // Fetch invitations with partnership details
    let query = supabase
      .from('partnership_invitations')
      .select(`
        *,
        partnership:partnerships(*)
      `)
      .in('id', invitationIds)
      .eq('status', 'pending');

    // If not admin, restrict to their partnership
    if (profile.role !== 'admin' && profile.partnership_id) {
      query = query.eq('partnership_id', profile.partnership_id);
    }

    const { data: invitations, error: fetchError } = await query;

    if (fetchError) throw fetchError;

    if (!invitations || invitations.length === 0) {
      return NextResponse.json({ error: 'No valid invitations found' }, { status: 404 });
    }

    // Send emails for each invitation
    const results = [];
    for (const invitation of invitations) {
      try {
        const invitationUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/invite/${invitation.token}`;

        const emailHtml = await renderPartnershipInvitationEmail({
          partnershipName: invitation.partnership.name,
          trialDurationDays: invitation.partnership.trial_duration_days,
          trialTier: invitation.partnership.trial_tier,
          discountPercentage: invitation.partnership.discount_percentage,
          invitationUrl,
        });

        await sendEmail({
          to: invitation.intended_for_email,
          subject: `You're invited to join Polyglotas through ${invitation.partnership.name}`,
          html: emailHtml,
        });

        results.push({ id: invitation.id, status: 'sent' });
      } catch (error) {
        console.error(`Failed to send invitation ${invitation.id}:`, error);
        results.push({ 
          id: invitation.id, 
          status: 'failed', 
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    return NextResponse.json({ 
      success: true, 
      results,
      sent: results.filter(r => r.status === 'sent').length,
      failed: results.filter(r => r.status === 'failed').length
    });

  } catch (error) {
    console.error('Error sending invitations:', error);
    return NextResponse.json(
      { error: 'Failed to send invitations' },
      { status: 500 }
    );
  }
}