import {
  Html,
  Head,
  Body,
  Container,
  Section,
  Text,
  Button,
  Heading,
} from '@react-email/components';

interface PartnershipInvitationEmailProps {
  partnershipName: string;
  trialDurationDays: number;
  trialTier: string;
  discountPercentage: number;
  invitationUrl: string;
}

export default function PartnershipInvitationEmail({
  partnershipName,
  trialDurationDays,
  trialTier,
  discountPercentage,
  invitationUrl,
}: PartnershipInvitationEmailProps) {
  return (
    <Html>
      <Head />
      <Body style={main}>
        <Container style={container}>
          <Section style={header}>
            <Heading style={headerTitle}>Welcome to Polyglotas!</Heading>
            <Text style={headerSubtitle}>
              You&apos;ve been invited by <strong>{partnershipName}</strong>
            </Text>
          </Section>

          <Section style={content}>
            <Heading style={contentTitle}>Your Exclusive Benefits</Heading>
            
            <Section style={benefits}>
              <Heading style={benefitsTitle}>🎉 Special Partnership Offer</Heading>
              <Text style={benefitsList}>
                • <strong>{trialDurationDays}-day free trial</strong> with {trialTier.toUpperCase()} access<br/>
                {discountPercentage > 0 && (
                  <>• <strong>{discountPercentage}% discount</strong> on your subscription after the trial<br/></>
                )}
                • Access to all premium features<br/>
                • Personalized learning experience
              </Text>
            </Section>

            <Text style={description}>
              Ready to start your language learning journey? Click the button below to create your account and claim your exclusive benefits:
            </Text>

            <Section style={buttonContainer}>
              <Button style={button} href={invitationUrl}>
                Claim Your Benefits
              </Button>
            </Section>

            <Text style={important}>
              <strong>Important:</strong> This invitation is personalized for you and expires soon. Don&apos;t miss out on this exclusive opportunity!
            </Text>
          </Section>

          <Section style={footer}>
            <Text style={footerText}>
              This invitation was sent by {partnershipName} through Polyglotas.
            </Text>
            <Text style={footerText}>
              If you have any questions, please contact our support team.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

const main = {
  backgroundColor: '#f6f9fc',
  fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
};

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '20px 0 48px',
  marginBottom: '64px',
};

const header = {
  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  color: '#ffffff',
  padding: '30px',
  textAlign: 'center' as const,
  borderRadius: '8px 8px 0 0',
};

const headerTitle = {
  fontSize: '32px',
  fontWeight: 'bold',
  margin: '0 0 10px',
  color: '#ffffff',
};

const headerSubtitle = {
  fontSize: '16px',
  margin: '0',
  color: '#ffffff',
};

const content = {
  padding: '30px',
};

const contentTitle = {
  fontSize: '24px',
  fontWeight: 'bold',
  margin: '0 0 20px',
  color: '#333333',
};

const benefits = {
  backgroundColor: '#e3f2fd',
  padding: '20px',
  borderRadius: '8px',
  margin: '20px 0',
};

const benefitsTitle = {
  fontSize: '18px',
  fontWeight: 'bold',
  margin: '0 0 10px',
  color: '#1976d2',
};

const benefitsList = {
  fontSize: '16px',
  lineHeight: '1.6',
  margin: '0',
  color: '#333333',
};

const description = {
  fontSize: '16px',
  lineHeight: '1.6',
  margin: '20px 0',
  color: '#333333',
};

const buttonContainer = {
  textAlign: 'center' as const,
  margin: '30px 0',
};

const button = {
  backgroundColor: '#4CAF50',
  borderRadius: '5px',
  color: '#ffffff',
  fontSize: '16px',
  fontWeight: 'bold',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '15px 30px',
};

const important = {
  fontSize: '14px',
  lineHeight: '1.6',
  margin: '20px 0',
  color: '#666666',
  fontStyle: 'italic',
};

const footer = {
  textAlign: 'center' as const,
  marginTop: '30px',
  borderTop: '1px solid #eee',
  paddingTop: '20px',
};

const footerText = {
  fontSize: '14px',
  color: '#666666',
  margin: '5px 0',
};