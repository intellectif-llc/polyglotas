import { render } from '@react-email/render';
import PartnershipInvitationEmail from './templates/partnership-invitation';
import ActivationConfirmationEmail from './templates/activation-confirmation';

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

export async function renderActivationConfirmationEmail({
  partnershipName,
  trialDurationDays,
  trialTier,
  loginUrl,
}: {
  partnershipName: string;
  trialDurationDays: number;
  trialTier: string;
  loginUrl: string;
}) {
  return await render(ActivationConfirmationEmail({
    partnershipName,
    trialDurationDays,
    trialTier,
    loginUrl,
  }));
}