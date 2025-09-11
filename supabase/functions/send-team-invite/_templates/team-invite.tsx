import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Text,
  Section,
  Hr,
} from 'npm:@react-email/components@0.0.22'
import * as React from 'npm:react@18.3.1'

interface TeamInviteEmailProps {
  invitee_name?: string
  inviter_name: string
  team_name: string
  brand_name: string
  role: string
  invite_url: string
  app_url: string
}

export const TeamInviteEmail = ({
  invitee_name,
  inviter_name,
  team_name,
  brand_name,
  role,
  invite_url,
  app_url,
}: TeamInviteEmailProps) => (
  <Html>
    <Head />
    <Preview>You've been invited to join {team_name} at {brand_name}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>Team Invitation</Heading>
        
        <Text style={text}>
          {invitee_name ? `Hi ${invitee_name}!` : 'Hello!'}
        </Text>
        
        <Text style={text}>
          <strong>{inviter_name}</strong> has invited you to join the team{' '}
          <strong>{team_name}</strong> at <strong>{brand_name}</strong> as a{' '}
          <strong>{role}</strong>.
        </Text>

        <Section style={buttonSection}>
          <Link
            href={invite_url}
            target="_blank"
            style={button}
          >
            Accept Invitation
          </Link>
        </Section>

        <Text style={text}>
          Or copy and paste this link in your browser:
        </Text>
        <Text style={code}>{invite_url}</Text>

        <Hr style={hr} />

        <Text style={footerText}>
          This invitation will expire in 7 days. If you have any questions, 
          please contact {inviter_name} or visit our{' '}
          <Link href={app_url} style={link}>
            platform
          </Link>.
        </Text>

        <Text style={footerText}>
          If you weren't expecting this invitation, you can safely ignore this email.
        </Text>

        <Text style={footer}>
          <Link
            href={app_url}
            target="_blank"
            style={{ ...link, color: '#898989' }}
          >
            {brand_name}
          </Link>
        </Text>
      </Container>
    </Body>
  </Html>
)

export default TeamInviteEmail

const main = {
  backgroundColor: '#ffffff',
  fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Oxygen-Sans,Ubuntu,Cantarell,"Helvetica Neue",sans-serif',
}

const container = {
  margin: '0 auto',
  padding: '20px 0 48px',
  maxWidth: '560px',
}

const h1 = {
  color: '#333',
  fontSize: '24px',
  fontWeight: 'bold',
  margin: '40px 0 20px',
  padding: '0',
}

const text = {
  color: '#333',
  fontSize: '16px',
  lineHeight: '24px',
  margin: '16px 0',
}

const buttonSection = {
  textAlign: 'center' as const,
  margin: '32px 0',
}

const button = {
  backgroundColor: '#007ee6',
  borderRadius: '8px',
  color: '#fff',
  fontSize: '16px',
  fontWeight: 'bold',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '12px 24px',
}

const link = {
  color: '#007ee6',
  textDecoration: 'underline',
}

const code = {
  display: 'inline-block',
  padding: '16px 4.5%',
  width: '90.5%',
  backgroundColor: '#f4f4f4',
  borderRadius: '5px',
  border: '1px solid #eee',
  color: '#333',
  fontSize: '14px',
  fontFamily: 'monospace',
  lineHeight: '1.4',
  margin: '16px 0',
}

const hr = {
  borderColor: '#cccccc',
  margin: '32px 0',
}

const footerText = {
  color: '#666666',
  fontSize: '14px',
  lineHeight: '20px',
  margin: '16px 0',
}

const footer = {
  color: '#898989',
  fontSize: '12px',
  margin: '48px 0 0',
}