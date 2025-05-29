
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

interface ApprovalRequestBody {
  organizationId: string;
  firstName: string;
  lastName: string;
  email: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const { organizationId, firstName, lastName, email }: ApprovalRequestBody = await req.json();

    // Get organization and trusted agent details
    const { data: organization, error: orgError } = await supabase
      .from('organizations')
      .select('name, trusted_agent_email')
      .eq('id', organizationId)
      .single();

    if (orgError || !organization) {
      throw new Error('Organization not found');
    }

    if (!organization.trusted_agent_email) {
      throw new Error('No trusted agent email configured for this organization');
    }

    // Construct the PortCast application URL (using the base URL without the API path)
    const baseUrl = supabaseUrl.replace('/rest/v1', '');
    const portcastUrl = baseUrl.replace('drqsjwkzyiqldwcjwuey.supabase.co', 'portcast.app');

    console.log('PortCast URL constructed:', portcastUrl);

    const emailResponse = await resend.emails.send({
      from: "PortCast <admin@portcast.app>",
      to: [organization.trusted_agent_email],
      subject: `New User Access Request for ${organization.name}`,
      html: `
        <h2>New User Access Request</h2>
        <p>A new user has requested access to your organization: <strong>${organization.name}</strong></p>
        
        <h3>Requestor Details:</h3>
        <ul>
          <li><strong>Name:</strong> ${firstName} ${lastName}</li>
          <li><strong>Email:</strong> ${email}</li>
        </ul>
        
        <h3>Next Steps:</h3>
        <ol>
          <li>Log into your PortCast account</li>
          <li>Navigate to your Organization Admin Dashboard</li>
          <li>Review and approve or deny this access request</li>
        </ol>
        
        <div style="margin: 20px 0; padding: 15px; background-color: #f0f9ff; border-left: 4px solid #0ea5e9; border-radius: 4px;">
          <p style="margin: 0; font-weight: 600;">🔗 Access your PortCast account:</p>
          <p style="margin: 5px 0 0 0;">
            <a href="${portcastUrl}" 
               style="color: #0ea5e9; text-decoration: none; font-weight: 500;">
              Login to PortCast →
            </a>
          </p>
        </div>
        
        <p><strong>Note:</strong> As the designated trusted agent for ${organization.name}, you are responsible for reviewing and approving access requests for your organization. This request will remain pending until you take action.</p>
        
        <hr style="margin: 20px 0; border: none; border-top: 1px solid #eee;">
        <p style="font-size: 12px; color: #666;">
          This is an automated notification from the PortCast system. If you believe you received this email in error, please contact your system administrator.
        </p>
      `,
    });

    console.log("Trusted agent notification sent successfully:", emailResponse);

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-approval-request function:", error);
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
