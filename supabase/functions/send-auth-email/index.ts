import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Webhook } from "https://esm.sh/standardwebhooks@1.0.0";
import { Resend } from "npm:resend@4.0.0";
import { renderAsync } from "npm:@react-email/components@0.0.22";
import React from "npm:react@18.3.1";
import { AuthEmail } from "./_templates/auth-email.tsx";

const resend = new Resend(Deno.env.get("RESEND_API_KEY") as string);
const hookSecret = Deno.env.get("AUTH_EMAIL_HOOK_SECRET") as string;

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

    let subject: string;
    let emailType: string;

    // Determine email type and subject
    switch (email_action_type) {
      case "signup":
        subject = "Confirm your email address";
        emailType = "signup";
        break;
      case "magiclink":
        subject = "Your magic link to sign in";
        emailType = "login";
        break;
      case "recovery":
        subject = "Reset your password";
        emailType = "recovery";
        break;
      case "email_change":
        subject = "Confirm your new email address";
        emailType = "email_change";
        break;
      default:
        subject = "Authentication required";
        emailType = "default";
    }

    // Render the email template
    const html = await renderAsync(
      React.createElement(AuthEmail, {
        supabase_url: site_url,
        token,
        token_hash,
        redirect_to,
        email_action_type,
        email_type: emailType,
      })
    );

    // Send email via Resend
    const { error } = await resend.emails.send({
      from: "onboarding@resend.dev", // Update this to your verified domain when ready
      to: [user.email],
      subject,
      html,
    });

    if (error) {
      console.error("Error sending email:", error);
      throw error;
    }

    console.log(`Auth email sent successfully to ${user.email} (${email_action_type})`);

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