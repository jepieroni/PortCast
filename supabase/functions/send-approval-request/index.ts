
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

    // Get the user request for the approval token
    const { data: userRequest, error: requestError } = await supabase
      .from('user_requests')
      .select('approval_token')
      .eq('email', email)
      .eq('organization_id', organizationId)
      .eq('status', 'pending')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (requestError || !userRequest) {
      throw new Error('User request not found');
    }

    // Construct the proper Edge Function URL
    const baseUrl = supabaseUrl.replace('/rest/v1', '');
    const approvalUrl = `${baseUrl}/functions/v1/handle-approval?token=${userRequest.approval_token}`;

    console.log('Approval URL constructed:', approvalUrl);

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
        
        <p>Please review this request and take action:</p>
        
        <div style="margin: 20px 0;">
          <a href="${approvalUrl}&action=approve" 
             style="background-color: #16a34a; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-right: 10px; display: inline-block;">
            Approve Request
          </a>
          <a href="${approvalUrl}&action=deny" 
             style="background-color: #dc2626; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
            Deny Request
          </a>
        </div>
        
        <p><small><strong>Note:</strong> If the buttons don't work, you can copy and paste these links directly into your browser:</small></p>
        <div style="margin: 10px 0; padding: 10px; background-color: #f8f9fa; border-radius: 4px; font-size: 12px;">
          <p><strong>Approve:</strong> ${approvalUrl}&action=approve</p>
          <p><strong>Deny:</strong> ${approvalUrl}&action=deny</p>
        </div>
        
        <p><small>This request was submitted through the PortCast system. If you did not expect this request, please contact your system administrator.</small></p>
      `,
    });

    console.log("Approval email sent successfully:", emailResponse);

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
