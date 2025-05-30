
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

interface OrganizationRequestAcknowledgmentBody {
  firstName: string;
  lastName: string;
  email: string;
  organizationName: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { firstName, lastName, email, organizationName }: OrganizationRequestAcknowledgmentBody = await req.json();

    console.log('Sending organization request acknowledgment to:', email);

    // Get the current request URL to determine the correct base URL
    const requestUrl = new URL(req.url);
    const isLocalhost = requestUrl.hostname === 'localhost';
    
    // Use the appropriate base URL based on environment
    const appBaseUrl = isLocalhost 
      ? 'http://localhost:3000'
      : 'https://portcast-voyage-builder.lovable.app';

    const emailResponse = await resend.emails.send({
      from: "PortCast <admin@portcast.app>",
      to: [email],
      subject: "Organization Registration Request Received",
      html: `
        <h2>Organization Registration Request Received</h2>
        <p>Dear ${firstName} ${lastName},</p>
        
        <p>Thank you for submitting a registration request for <strong>${organizationName}</strong> on PortCast.</p>
        
        <h3>What happens next:</h3>
        <ol>
          <li><strong>Review Process:</strong> Global administrators will review your organization registration request</li>
          <li><strong>Approval Decision:</strong> You will be notified via email once a decision has been made</li>
          <li><strong>Account Setup:</strong> If approved, you will receive a separate email with instructions to complete your account setup as the organization administrator</li>
        </ol>
        
        <p>This process typically takes 1-3 business days. If you have any questions or concerns, please contact our support team.</p>
        
        <p>Thank you for your patience!</p>
        <p>The PortCast Team</p>
        
        <div style="margin: 20px 0;">
          <p style="font-size: 12px; color: #666;">
            You can check on the status by visiting: <a href="${appBaseUrl}">${appBaseUrl}</a>
          </p>
        </div>
        
        <hr style="margin: 20px 0; border: none; border-top: 1px solid #eee;">
        <p style="font-size: 12px; color: #666;">
          This is an automated message. Please do not reply to this email.
        </p>
      `,
    });

    console.log("Organization request acknowledgment sent successfully:", emailResponse);

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-organization-request-acknowledgment function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
