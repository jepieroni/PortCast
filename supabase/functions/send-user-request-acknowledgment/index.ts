
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

interface UserRequestAcknowledgmentBody {
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
    const { firstName, lastName, email, organizationName }: UserRequestAcknowledgmentBody = await req.json();

    const emailResponse = await resend.emails.send({
      from: "PortCast <admin@portcast.app>",
      to: [email],
      subject: "Your PortCast Access Request Has Been Received",
      html: `
        <h2>Access Request Received</h2>
        <p>Dear ${firstName} ${lastName},</p>
        
        <p>Thank you for requesting access to PortCast for <strong>${organizationName}</strong>.</p>
        
        <h3>What happens next:</h3>
        <ol>
          <li><strong>Review Process:</strong> Your organization's trusted agent will review your access request</li>
          <li><strong>Approval Decision:</strong> You will be notified via email once a decision has been made</li>
          <li><strong>Account Setup:</strong> If approved, you will receive a separate email with instructions to complete your account setup</li>
        </ol>
        
        <p>This process typically takes 1-2 business days. If you have any questions or concerns, please contact your organization's administrator.</p>
        
        <p>Thank you for your patience!</p>
        <p>The PortCast Team</p>
        
        <hr style="margin: 20px 0; border: none; border-top: 1px solid #eee;">
        <p style="font-size: 12px; color: #666;">
          This is an automated message. Please do not reply to this email.
        </p>
      `,
    });

    console.log("User request acknowledgment sent successfully:", emailResponse);

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-user-request-acknowledgment function:", error);
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
