
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

interface OrganizationApprovalRequestBody {
  organizationName: string;
  city?: string;
  state?: string;
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
    const { organizationName, city, state, firstName, lastName, email }: OrganizationApprovalRequestBody = await req.json();

    // Get the organization request for the approval token
    const { data: orgRequest, error: requestError } = await supabase
      .from('organization_requests')
      .select('approval_token')
      .eq('email', email)
      .eq('organization_name', organizationName)
      .eq('status', 'pending')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (requestError || !orgRequest) {
      throw new Error('Organization request not found');
    }

    // Get all global admins
    const { data: globalAdmins, error: adminError } = await supabase
      .from('user_roles')
      .select(`
        user_id,
        profiles (
          email,
          first_name,
          last_name
        )
      `)
      .eq('role', 'global_admin');

    if (adminError) {
      throw new Error('Failed to fetch global admins');
    }

    if (!globalAdmins || globalAdmins.length === 0) {
      throw new Error('No global administrators found');
    }

    // Construct the proper Edge Function URL
    const baseUrl = supabaseUrl.replace('/rest/v1', '');
    const approvalUrl = `${baseUrl}/functions/v1/handle-organization-approval?token=${orgRequest.approval_token}`;

    console.log('Organization approval URL constructed:', approvalUrl);

    // Send email to all global admins
    const emailPromises = globalAdmins.map(async (admin) => {
      if (!admin.profiles?.email) return;

      const locationString = city && state ? `${city}, ${state}` : city || state || 'Not specified';

      return resend.emails.send({
        from: "PortCast <admin@portcast.app>",
        to: [admin.profiles.email],
        subject: `New Organization Registration Request: ${organizationName}`,
        html: `
          <h2>New Organization Registration Request</h2>
          <p>A new organization registration request has been submitted and requires your approval:</p>
          
          <h3>Organization Details:</h3>
          <ul>
            <li><strong>Name:</strong> ${organizationName}</li>
            <li><strong>Location:</strong> ${locationString}</li>
          </ul>
          
          <h3>Admin Contact Details:</h3>
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
    });

    await Promise.all(emailPromises);

    console.log("Organization approval emails sent successfully to global admins");

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-organization-approval-request function:", error);
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
