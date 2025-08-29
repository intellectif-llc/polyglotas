import { render } from '@react-email/render';
import PartnershipInvitationEmail from './templates/partnership-invitation';

export async function renderPartnershipInvitationEmail({
  partnershipName,
  trialDurationDays,
  trialTier,
  discountPercentage,
  invitationUrl,
}: {
  partnershipName: string;
  trialDurationDays: number;
  trialTier: string;
  discountPercentage: number;
  invitationUrl: string;
}) {
  return await render(PartnershipInvitationEmail({
    partnershipName,
    trialDurationDays,
    trialTier,
    discountPercentage,
    invitationUrl,
  }));
}