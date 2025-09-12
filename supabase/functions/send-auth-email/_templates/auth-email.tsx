import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Text,
  Button,
} from "npm:@react-email/components@0.0.22";
import * as React from "npm:react@18.3.1";

interface AuthEmailProps {
  supabase_url: string;
  email_action_type: string;
  redirect_to: string;
  token_hash: string;
  token: string;
  email_type: string;
  template_config?: {
    heading?: string;
    message?: string;
    button_text?: string;
    footer_text?: string;
    preview_text?: string;
  } | null;
}

export const AuthEmail = ({
  token,
  supabase_url,
  email_action_type,
  redirect_to,
  token_hash,
  email_type,
  template_config,
}: AuthEmailProps) => {
  const actionUrl = `${supabase_url}/auth/v1/verify?token=${token_hash}&type=${email_action_type}&redirect_to=${redirect_to}`;
  
  const getContent = () => {
    switch (email_type) {
      case "signup":
        return {
          preview: "Confirm your email address to complete registration",
          heading: "Confirm your email",
          message: "Click the button below to confirm your email address and complete your registration.",
          buttonText: "Confirm Email",
          footerText: "If you didn't create an account, you can safely ignore this email.",
        };
      case "login":
        return {
          preview: "Your magic link to sign in",
          heading: "Sign in to your account",
          message: "Click the button below to sign in to your account.",
          buttonText: "Sign In",
          footerText: "If you didn't request this login link, you can safely ignore this email.",
        };
      case "recovery":
        return {
          preview: "Reset your password",
          heading: "Reset your password",
          message: "Click the button below to reset your password.",
          buttonText: "Reset Password",
          footerText: "If you didn't request a password reset, you can safely ignore this email.",
        };
      case "email_change":
        return {
          preview: "Confirm your new email address",
          heading: "Confirm email change",
          message: "Click the button below to confirm your new email address.",
          buttonText: "Confirm New Email",
          footerText: "If you didn't request this email change, you can safely ignore this email.",
        };
      default:
        return {
          preview: "Authentication required",
          heading: "Complete authentication",
          message: "Click the button below to complete authentication.",
          buttonText: "Continue",
          footerText: "If you didn't request this, you can safely ignore this email.",
        };
    }
  };

  const content = getContent();
  
  // Override with custom template config if provided
  const finalContent = template_config ? {
    preview: template_config.preview_text || content.preview,
    heading: template_config.heading || content.heading,
    message: template_config.message || content.message,
    buttonText: template_config.button_text || content.buttonText,
    footerText: template_config.footer_text || content.footerText,
  } : content;

  return (
    <Html>
      <Head />
      <Preview>{finalContent.preview}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>{finalContent.heading}</Heading>
          <Text style={text}>{finalContent.message}</Text>
          
          <Button href={actionUrl} style={button}>
            {finalContent.buttonText}
          </Button>
          
          <Text style={codeText}>
            Or copy and paste this link in your browser:
          </Text>
          <Text style={code}>{actionUrl}</Text>
          
          <Text style={footer}>
            {finalContent.footerText}
          </Text>
        </Container>
      </Body>
    </Html>
  );
};

export default AuthEmail;

const main = {
  backgroundColor: "#ffffff",
  fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif",
};

const container = {
  margin: "0 auto",
  padding: "20px 0 48px",
  maxWidth: "560px",
};

const h1 = {
  color: "#333",
  fontSize: "24px",
  fontWeight: "600",
  lineHeight: "1.25",
  margin: "16px 0",
};

const text = {
  color: "#333",
  fontSize: "16px",
  lineHeight: "1.5",
  margin: "16px 0",
};

const button = {
  backgroundColor: "#5F57FF",
  borderRadius: "8px",
  color: "#fff",
  fontSize: "16px",
  fontWeight: "600",
  textDecoration: "none",
  textAlign: "center" as const,
  display: "block",
  padding: "12px 24px",
  margin: "24px 0",
};

const codeText = {
  color: "#666",
  fontSize: "14px",
  margin: "24px 0 8px 0",
};

const code = {
  backgroundColor: "#f4f4f4",
  border: "1px solid #eee",
  borderRadius: "4px",
  color: "#333",
  fontSize: "14px",
  padding: "12px",
  wordBreak: "break-all" as const,
  margin: "8px 0",
};

const footer = {
  color: "#898989",
  fontSize: "12px",
  margin: "32px 0 0 0",
};