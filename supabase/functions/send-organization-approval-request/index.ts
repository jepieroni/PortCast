
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

    console.log('Processing organization approval request for:', organizationName);

    // Get all global admins - First get the user IDs with global_admin role
    const { data: globalAdminRoles, error: adminRoleError } = await supabase
      .from('user_roles')
      .select('user_id')
      .eq('role', 'global_admin');

    console.log('Global admin roles query result:', { globalAdminRoles, adminRoleError });

    if (adminRoleError) {
      throw adminRoleError;
    }

    if (!globalAdminRoles || globalAdminRoles.length === 0) {
      console.log('No global admins found - cannot send approval emails');
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'No global administrators found to send approval request to' 
        }),
        {
          status: 400,
          headers: {
            "Content-Type": "application/json",
            ...corsHeaders,
          },
        }
      );
    }

    // Now get the profile information for these users
    const userIds = globalAdminRoles.map(role => role.user_id);
    console.log('Global admin user IDs:', userIds);

    const { data: adminProfiles, error: profileError } = await supabase
      .from('profiles')
      .select('id, email, first_name, last_name')
      .in('id', userIds);

    console.log('Admin profiles query result:', { adminProfiles, profileError });

    if (profileError) {
      throw profileError;
    }

    if (!adminProfiles || adminProfiles.length === 0) {
      console.log('No admin profiles found - cannot send approval emails');
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'No global administrator profiles found to send approval request to' 
        }),
        {
          status: 400,
          headers: {
            "Content-Type": "application/json",
            ...corsHeaders,
          },
        }
      );
    }

    console.log('Sending to admin profiles:', adminProfiles);

    // Get the current request URL to determine the correct base URL
    const requestUrl = new URL(req.url);
    const isLocalhost = requestUrl.hostname === 'localhost';
    
    // Use the appropriate base URL based on environment
    const appBaseUrl = isLocalhost 
      ? 'http://localhost:3000'
      : 'https://portcast-voyage-builder.lovable.app';

    // Send email to all global admins
    const emailPromises = adminProfiles.map(async (admin) => {
      if (!admin.email) {
        console.log('Skipping admin with no email:', admin);
        return;
      }

      const locationString = city && state ? `${city}, ${state}` : city || state || 'Not specified';

      console.log('Sending email to admin:', admin.email);

      return resend.emails.send({
        from: "PortCast <admin@portcast.app>",
        to: [admin.email],
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
          
          <p><strong>Action Required:</strong> Please log into the PortCast Admin Dashboard to review and approve or deny this organization registration request.</p>
          
          <div style="margin: 20px 0;">
            <a href="${appBaseUrl}" 
               style="background-color: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              Go to Admin Dashboard
            </a>
          </div>
          
          <p><small>This request was submitted through the PortCast system. If you did not expect this request, please contact your system administrator.</small></p>
          
          <hr style="margin: 20px 0; border: none; border-top: 1px solid #eee;">
          <p style="font-size: 12px; color: #666;">
            This is an automated message. Please do not reply to this email.
          </p>
        `,
      });
    });

    const emailResults = await Promise.allSettled(emailPromises);
    
    emailResults.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        console.log(`Email ${index + 1} sent successfully:`, result.value);
      } else {
        console.error(`Email ${index + 1} failed:`, result.reason);
      }
    });

    console.log("Organization approval emails processing completed");

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
