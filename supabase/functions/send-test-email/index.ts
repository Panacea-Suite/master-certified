import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.54.0";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface TestEmailRequest {
  templateId: string;
  recipientEmail: string;
  templateData?: any;
}

const renderEmailFromComponents = (components: any[], templateConfig: any, darkMode = false) => {
  const sortedComponents = [...components].sort((a, b) => a.order - b.order);
  
  const componentHtml = sortedComponents.map(component => {
    const { config } = component;
    const baseStyle = `padding: ${config.padding || 20}px; background-color: ${config.backgroundColor || (darkMode ? '#1a1a1a' : '#ffffff')};`;
    
    switch (component.type) {
      case 'email_header':
        return `<div style="${baseStyle}">
          <div style="text-align: center;">
            <h1 style="font-size: 24px; font-weight: bold; color: ${darkMode ? '#ffffff' : '#333333'}; margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
              ${config.title || 'Your Brand'}
            </h1>
          </div>
        </div>`;
        
      case 'email_heading':
        return `<div style="${baseStyle}">
          <h2 style="font-size: ${config.fontSize || '20'}px; font-weight: ${config.fontWeight || 'bold'}; color: ${config.textColor || (darkMode ? '#ffffff' : '#333333')}; text-align: ${config.textAlign || 'left'}; margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
            ${config.text || 'Heading Text'}
          </h2>
        </div>`;
        
      case 'email_text':
        return `<div style="${baseStyle}">
          <p style="font-size: ${config.fontSize || '16'}px; font-weight: ${config.fontWeight || 'normal'}; color: ${config.textColor || (darkMode ? '#cccccc' : '#333333')}; text-align: ${config.textAlign || 'left'}; margin: 0; line-height: 1.5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
            ${config.text || 'This is your email text content.'}
          </p>
        </div>`;
        
      case 'email_button':
        return `<div style="${baseStyle}">
          <div style="text-align: ${config.buttonAlign || 'center'};">
            <a href="${config.buttonUrl || '#'}" style="background-color: ${config.buttonBgColor || '#5F57FF'}; color: ${config.buttonTextColor || '#ffffff'}; text-decoration: none; padding: 12px 24px; border-radius: ${config.borderRadius || 6}px; font-size: 16px; font-weight: bold; display: inline-block; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
              ${config.buttonText || 'Click Here'}
            </a>
          </div>
        </div>`;
        
      case 'email_image':
        return config.imageUrl ? `<div style="${baseStyle}">
          <div style="text-align: ${config.imageAlign || 'center'};">
            <img src="${config.imageUrl}" alt="${config.altText || ''}" style="max-width: ${config.maxWidth || 600}px; width: 100%; height: auto; display: block; margin: ${config.imageAlign === 'center' ? '0 auto' : '0'};">
          </div>
        </div>` : '';
        
      case 'email_divider':
        return `<div style="${baseStyle}">
          <hr style="border: none; border-top: 1px solid ${darkMode ? '#444444' : '#e5e5e5'}; margin: 0;">
        </div>`;
        
      case 'email_spacer':
        return `<div style="${baseStyle} min-height: ${config.height || 40}px;"></div>`;
        
      case 'email_footer':
        return `<div style="${baseStyle}">
          <div style="text-align: center;">
            <p style="font-size: 12px; color: ${darkMode ? '#888888' : '#666666'}; margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
              ${config.footerText || 'If you no longer wish to receive these emails, you can unsubscribe here.'}
            </p>
          </div>
        </div>`;
        
      default:
        return '';
    }
  }).join('');

  return `
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${templateConfig.subject}</title>
      </head>
      <body style="margin: 0; padding: 0; background-color: ${darkMode ? '#000000' : '#f4f4f4'}; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
        <div style="max-width: 600px; margin: 0 auto; background-color: ${darkMode ? '#1a1a1a' : '#ffffff'};">
          ${componentHtml}
        </div>
      </body>
    </html>
  `;
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { templateId, recipientEmail, templateData }: TestEmailRequest = await req.json();

    if (!templateId || !recipientEmail) {
      return new Response(
        JSON.stringify({ error: "Template ID and recipient email are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get email template
    const { data: template, error: templateError } = await supabase
      .from("email_templates")
      .select("*, email_components(*)")
      .eq("id", templateId)
      .single();

    if (templateError || !template) {
      console.error("Template fetch error:", templateError);
      return new Response(
        JSON.stringify({ error: "Template not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Prepare template config
    const templateConfig = {
      subject: `[TEST] ${template.subject}`,
      previewText: template.preview_text,
      from_name: template.from_name || "Test Email",
      from_email: template.from_email || "test@example.com"
    };

    // Sort components and render HTML
    const components = template.email_components || [];
    const html = renderEmailFromComponents(components, templateConfig, false);

    console.log(`Sending test email for template ${templateId} to ${recipientEmail}`);

    // Send email via Resend
    const { data: emailResult, error: emailError } = await resend.emails.send({
      from: `${templateConfig.from_name} <${template.from_email}>`,
      to: [recipientEmail],
      subject: templateConfig.subject,
      html,
      reply_to: template.reply_to_email || template.from_email,
    });

    if (emailError) {
      console.error("Error sending test email:", emailError);
      return new Response(
        JSON.stringify({ error: "Failed to send test email", details: emailError }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Test email sent successfully to ${recipientEmail}`, emailResult);

    return new Response(
      JSON.stringify({ 
        success: true, 
        emailId: emailResult?.id,
        message: `Test email sent to ${recipientEmail}` 
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in send-test-email function:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error", details: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
};

serve(handler);