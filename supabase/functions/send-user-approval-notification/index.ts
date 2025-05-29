
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface ApprovalNotificationBody {
  email: string;
  firstName: string;
  lastName: string;
  approved: boolean;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, firstName, lastName, approved }: ApprovalNotificationBody = await req.json();

    const subject = approved 
      ? "Your PortCast Account Has Been Approved!" 
      : "Your PortCast Account Request Update";

    const html = approved 
      ? `
        <h2>Welcome to PortCast, ${firstName}!</h2>
        <p>Great news! Your account request has been approved.</p>
        <p>You can now sign in to PortCast using the email address and password you provided during registration.</p>
        
        <div style="margin: 20px 0;">
          <a href="${Deno.env.get("SUPABASE_URL")?.replace('/rest/v1', '')}" 
             style="background-color: #16a34a; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
            Sign In to PortCast
          </a>
        </div>
        
        <p>If you have any questions or need assistance, please don't hesitate to contact our support team.</p>
        <p>Welcome aboard!</p>
        <p>The PortCast Team</p>
      `
      : `
        <h2>PortCast Account Request Update</h2>
        <p>Dear ${firstName} ${lastName},</p>
        <p>We regret to inform you that your PortCast account request has been denied.</p>
        <p>If you believe this was an error or would like to discuss this decision, please contact your organization's administrator or our support team.</p>
        <p>Thank you for your understanding.</p>
        <p>The PortCast Team</p>
      `;

    const emailResponse = await resend.emails.send({
      from: "PortCast <admin@portcast.app>",
      to: [email],
      subject: subject,
      html: html,
    });

    console.log("User approval notification sent successfully:", emailResponse);

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-user-approval-notification function:", error);
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
