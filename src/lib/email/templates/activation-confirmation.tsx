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

interface ActivationConfirmationEmailProps {
  partnershipName: string;
  trialDurationDays: number;
  trialTier: string;
  loginUrl: string;
}

export default function ActivationConfirmationEmail({
  partnershipName,
  trialDurationDays,
  trialTier,
  loginUrl,
}: ActivationConfirmationEmailProps) {
  return (
    <Html>
      <Head />
      <Body style={main}>
        <Container style={container}>
          <Section style={header}>
            <Heading style={headerTitle}>🎉 Your Pro Benefits Are Active!</Heading>
            <Text style={headerSubtitle}>
              Welcome to Polyglotas Premium through <strong>{partnershipName}</strong>
            </Text>
          </Section>

          <Section style={content}>
            <Heading style={contentTitle}>Your Benefits Have Been Activated</Heading>
            
            <Text style={description}>
              Great news! Your premium benefits have been successfully activated. You now have full access to all Polyglotas Pro features.
            </Text>

            <Section style={benefits}>
              <Heading style={benefitsTitle}>✨ What&apos;s Now Available</Heading>
              <Text style={benefitsList}>
                • <strong>Dictation Activities</strong> - Practice your writing skills<br/>
                • <strong>Pronunciation Training</strong> - Perfect your speaking<br/>
                • <strong>AI Chat Sessions</strong> - Conversational practice<br/>
                • <strong>{trialDurationDays}-day {trialTier.toUpperCase()} trial</strong> - Full premium access<br/>
                • All advanced learning features unlocked
              </Text>
            </Section>

            <Text style={description}>
              Ready to start learning? Click the button below to log in and begin your premium language learning experience:
            </Text>

            <Section style={buttonContainer}>
              <Button style={button} href={loginUrl}>
                Start Learning Now
              </Button>
            </Section>

            <Text style={important}>
              <strong>Pro Tip:</strong> Make the most of your trial by exploring all three activity types - dictation, pronunciation, and chat!
            </Text>
          </Section>

          <Section style={footer}>
            <Text style={footerText}>
              This activation was processed through your {partnershipName} partnership.
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
  background: 'linear-gradient(135deg, #4CAF50 0%, #45a049 100%)',
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
  backgroundColor: '#e8f5e8',
  padding: '20px',
  borderRadius: '8px',
  margin: '20px 0',
};

const benefitsTitle = {
  fontSize: '18px',
  fontWeight: 'bold',
  margin: '0 0 10px',
  color: '#2e7d32',
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