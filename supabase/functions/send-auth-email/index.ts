import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Webhook } from "https://esm.sh/standardwebhooks@1.0.0";
import { Resend } from "npm:resend@4.0.0";
import { renderAsync } from "npm:@react-email/components@0.0.22";
import React from "npm:react@18.3.1";
import { AuthEmail } from "./_templates/auth-email.tsx";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.54.0';

const resend = new Resend(Deno.env.get("RESEND_API_KEY") as string);
const hookSecret = Deno.env.get("AUTH_EMAIL_HOOK_SECRET") as string;

// Initialize Supabase client for database access
const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  try {
    const payload = await req.text();
    const headers = Object.fromEntries(req.headers);
    const wh = new Webhook(hookSecret);
    
    const {
      user,
      email_data: { token, token_hash, redirect_to, email_action_type, site_url },
    } = wh.verify(payload, headers) as {
      user: {
        email: string;
      };
      email_data: {
        token: string;
        token_hash: string;
        redirect_to: string;
        email_action_type: string;
        site_url: string;
      };
    };

    // Map email action type to template type
    let templateType: string;
    switch (email_action_type) {
      case "signup":
        templateType = "signup";
        break;
      case "magiclink":
        templateType = "login";
        break;
      case "recovery":
        templateType = "recovery";
        break;
      case "email_change":
        templateType = "email_change";
        break;
      default:
        templateType = "signup";
    }

    // Get custom template from database
    const { data: customTemplate, error: templateError } = await supabase
      .from('email_templates')
      .select('*')
      .eq('template_type', templateType)
      .eq('is_active', true)
      .single();

    if (templateError && templateError.code !== 'PGRST116') {
      console.error('Error fetching email template:', templateError);
    }

    // Use custom template if available, otherwise fall back to defaults
    const subject = customTemplate?.subject || getDefaultSubject(email_action_type);
    const emailType = templateType;
    const templateConfig = customTemplate ? {
      heading: customTemplate.heading,
      message: customTemplate.message,
      button_text: customTemplate.button_text,
      footer_text: customTemplate.footer_text,
      preview_text: customTemplate.preview_text,
    } : null;

    // Render the email template
    const html = await renderAsync(
      React.createElement(AuthEmail, {
        supabase_url: site_url,
        token,
        token_hash,
        redirect_to,
        email_action_type,
        email_type: emailType,
        template_config: templateConfig,
      })
    );

    // Use custom sender info if available
    const fromName = customTemplate?.from_name || "Panacea Certified";
    const fromEmail = customTemplate?.from_email || "noreply@certified.panaceasuite.io";
    const replyToEmail = customTemplate?.reply_to_email || "support@panaceasuite.io";

    // Send email via Resend
    const { error } = await resend.emails.send({
      from: `${fromName} <${fromEmail}>`,
      to: [user.email],
      subject,
      html,
      reply_to: replyToEmail,
    });

    if (error) {
      console.error("Error sending email:", error);
      throw error;
    }

    console.log(`Auth email sent successfully to ${user.email} (${email_action_type}) using ${customTemplate ? 'custom' : 'default'} template`);

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in send-auth-email function:", error);
    return new Response(
      JSON.stringify({
        error: {
          message: error.message,
        },
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
});

// Helper function for default subjects
function getDefaultSubject(email_action_type: string): string {
  switch (email_action_type) {
    case "signup":
      return "Confirm your email address";
    case "magiclink":
      return "Your magic link to sign in";
    case "recovery":
      return "Reset your password";
    case "email_change":
      return "Confirm your new email address";
    default:
      return "Authentication required";
  }
}