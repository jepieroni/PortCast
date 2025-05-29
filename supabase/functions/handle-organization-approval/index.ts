
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.8";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const token = url.searchParams.get('token');
    const action = url.searchParams.get('action');

    if (!token || !action) {
      return new Response('Missing token or action parameter', { status: 400 });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get the organization request
    const { data: orgRequest, error: requestError } = await supabase
      .from('organization_requests')
      .select('*')
      .eq('approval_token', token)
      .eq('status', 'pending')
      .single();

    if (requestError || !orgRequest) {
      return new Response(`
        <html>
          <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 50px auto; padding: 20px;">
            <h2 style="color: #dc2626;">Request Not Found</h2>
            <p>This approval request was not found or has already been processed.</p>
            <p><a href="/">Return to PortCast</a></p>
          </body>
        </html>
      `, {
        status: 404,
        headers: { "Content-Type": "text/html", ...corsHeaders }
      });
    }

    if (action === 'approve') {
      // Create the organization
      const { data: organization, error: orgError } = await supabase
        .from('organizations')
        .insert({
          name: orgRequest.organization_name,
          city: orgRequest.city,
          state: orgRequest.state,
          trusted_agent_email: orgRequest.email
        })
        .select()
        .single();

      if (orgError) {
        throw orgError;
      }

      // Create account setup token for organization admin instead of immediate account creation
      const { data: setupToken, error: setupTokenError } = await supabase
        .from('account_setup_tokens')
        .insert({
          email: orgRequest.email,
          first_name: orgRequest.first_name,
          last_name: orgRequest.last_name,
          organization_id: organization.id,
          organization_name: orgRequest.organization_name,
          token_type: 'organization_admin'
        })
        .select()
        .single();

      if (setupTokenError) {
        throw setupTokenError;
      }

      // Update the request status
      const { error: updateError } = await supabase
        .from('organization_requests')
        .update({
          status: 'approved',
          reviewed_at: new Date().toISOString()
        })
        .eq('id', orgRequest.id);

      if (updateError) {
        throw updateError;
      }

      // Send account setup email to the organization admin
      const baseUrl = supabaseUrl.replace('/rest/v1', '');
      const setupUrl = `${baseUrl}/setup-account?token=${setupToken.token}`;

      await resend.emails.send({
        from: "PortCast <admin@portcast.app>",
        to: [orgRequest.email],
        subject: "Organization Registration Approved - Set Up Your Account",
        html: `
          <h2>Congratulations! Your Organization Registration Has Been Approved</h2>
          <p>Dear ${orgRequest.first_name} ${orgRequest.last_name},</p>
          
          <p>Your registration request for <strong>${orgRequest.organization_name}</strong> has been approved!</p>
          
          <p>Please complete your account setup by clicking the button below:</p>
          
          <div style="margin: 20px 0;">
            <a href="${setupUrl}" 
               style="background-color: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              Set Up Your Account
            </a>
          </div>
          
          <p>As the organization administrator, you will have the ability to:</p>
          <ul>
            <li>Manage user access requests for your organization</li>
            <li>Register and manage shipments</li>
            <li>Access consolidation dashboards</li>
          </ul>
          
          <p><small><strong>Note:</strong> This link will expire in 48 hours for security purposes.</small></p>
          
          <p><small>If the button doesn't work, you can copy and paste this link directly into your browser:</small></p>
          <div style="margin: 10px 0; padding: 10px; background-color: #f8f9fa; border-radius: 4px; font-size: 12px;">
            <p>${setupUrl}</p>
          </div>
          
          <p>Welcome to PortCast!</p>
        `,
      });

      return new Response(`
        <html>
          <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 50px auto; padding: 20px;">
            <h2 style="color: #16a34a;">✓ Organization Registration Approved</h2>
            <p>The organization registration for <strong>${orgRequest.organization_name}</strong> has been approved successfully.</p>
            <p>The organization administrator (${orgRequest.email}) has been sent an email with account setup instructions.</p>
            <p><a href="/">Return to PortCast</a></p>
          </body>
        </html>
      `, {
        status: 200,
        headers: { "Content-Type": "text/html", ...corsHeaders }
      });

    } else if (action === 'deny') {
      // Update the request status
      const { error: updateError } = await supabase
        .from('organization_requests')
        .update({
          status: 'denied',
          reviewed_at: new Date().toISOString()
        })
        .eq('id', orgRequest.id);

      if (updateError) {
        throw updateError;
      }

      // Send denial email to the requester
      await resend.emails.send({
        from: "PortCast <admin@portcast.app>",
        to: [orgRequest.email],
        subject: "Organization Registration Update",
        html: `
          <h2>Organization Registration Decision</h2>
          <p>Dear ${orgRequest.first_name} ${orgRequest.last_name},</p>
          
          <p>Thank you for your interest in PortCast. After review, we are unable to approve the registration request for <strong>${orgRequest.organization_name}</strong> at this time.</p>
          
          <p>If you believe this decision was made in error or if you have additional information that might help with your application, please contact our support team.</p>
          
          <p>Thank you for your understanding.</p>
        `,
      });

      return new Response(`
        <html>
          <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 50px auto; padding: 20px;">
            <h2 style="color: #dc2626;">Organization Registration Denied</h2>
            <p>The organization registration for <strong>${orgRequest.organization_name}</strong> has been denied.</p>
            <p>The requester (${orgRequest.email}) has been notified of this decision.</p>
            <p><a href="/">Return to PortCast</a></p>
          </body>
        </html>
      `, {
        status: 200,
        headers: { "Content-Type": "text/html", ...corsHeaders }
      });
    } else {
      return new Response('Invalid action', { status: 400 });
    }

  } catch (error: any) {
    console.error("Error in handle-organization-approval function:", error);
    return new Response(`
      <html>
        <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 50px auto; padding: 20px;">
          <h2 style="color: #dc2626;">Error Processing Request</h2>
          <p>An error occurred while processing the approval request: ${error.message}</p>
          <p><a href="/">Return to PortCast</a></p>
        </body>
      </html>
    `, {
      status: 500,
      headers: { "Content-Type": "text/html", ...corsHeaders }
    });
  }
};

serve(handler);
