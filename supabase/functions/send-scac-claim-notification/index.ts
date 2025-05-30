
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.8';
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface NotificationRequest {
  claimId: string;
  type: 'claim_submitted' | 'claim_approved' | 'claim_denied';
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { claimId, type }: NotificationRequest = await req.json();

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get claim details
    const { data: claim, error: claimError } = await supabase
      .from('scac_claims')
      .select(`
        id,
        organization_id,
        requested_by,
        tsp_ids,
        status,
        requested_at,
        organizations (name),
        profiles!scac_claims_requested_by_fkey (first_name, last_name, email)
      `)
      .eq('id', claimId)
      .single();

    if (claimError || !claim) {
      throw new Error('Claim not found');
    }

    // Get TSP details
    const { data: tsps, error: tspError } = await supabase
      .from('tsps')
      .select('scac_code, name')
      .in('id', claim.tsp_ids);

    if (tspError) {
      throw new Error('Failed to fetch TSP details');
    }

    const requesterEmail = claim.profiles?.email;
    const requesterName = `${claim.profiles?.first_name || ''} ${claim.profiles?.last_name || ''}`.trim();
    const organizationName = claim.organizations?.name || 'Unknown Organization';
    const tspList = tsps?.map(tsp => `${tsp.scac_code} - ${tsp.name}`).join('\n') || '';

    let emailSubject = '';
    let emailHtml = '';

    switch (type) {
      case 'claim_submitted':
        // Send acknowledgment to requester
        emailSubject = `SCAC Claim Submitted - ${organizationName}`;
        emailHtml = `
          <h2>SCAC Claim Submitted</h2>
          <p>Dear ${requesterName},</p>
          <p>Your SCAC claim has been submitted successfully and is pending approval.</p>
          
          <h3>Claim Details:</h3>
          <p><strong>Organization:</strong> ${organizationName}</p>
          <p><strong>Requested TSPs:</strong></p>
          <pre>${tspList}</pre>
          <p><strong>Submitted:</strong> ${new Date(claim.requested_at).toLocaleString()}</p>
          
          <p>You will receive another email once your claim has been reviewed.</p>
          
          <p>Best regards,<br>The PortCast Team</p>
        `;

        if (requesterEmail) {
          await resend.emails.send({
            from: "PortCast <onboarding@resend.dev>",
            to: [requesterEmail],
            subject: emailSubject,
            html: emailHtml,
          });
        }

        // Send notification to global admins
        const { data: globalAdmins, error: adminError } = await supabase
          .from('user_roles')
          .select(`
            user_id,
            profiles!user_roles_user_id_fkey (email, first_name, last_name)
          `)
          .eq('role', 'global_admin');

        if (!adminError && globalAdmins) {
          const adminEmails = globalAdmins
            .map(admin => admin.profiles?.email)
            .filter(email => email) as string[];

          if (adminEmails.length > 0) {
            await resend.emails.send({
              from: "PortCast <onboarding@resend.dev>",
              to: adminEmails,
              subject: `New SCAC Claim - ${organizationName}`,
              html: `
                <h2>New SCAC Claim Requires Approval</h2>
                <p>A new SCAC claim has been submitted and requires your review.</p>
                
                <h3>Claim Details:</h3>
                <p><strong>Organization:</strong> ${organizationName}</p>
                <p><strong>Requested by:</strong> ${requesterName} (${requesterEmail})</p>
                <p><strong>Requested TSPs:</strong></p>
                <pre>${tspList}</pre>
                <p><strong>Submitted:</strong> ${new Date(claim.requested_at).toLocaleString()}</p>
                
                <p>Please log in to the PortCast admin dashboard to review and approve this claim.</p>
                
                <p>Best regards,<br>The PortCast Team</p>
              `,
            });
          }
        }
        break;

      case 'claim_approved':
      case 'claim_denied':
        const action = type === 'claim_approved' ? 'approved' : 'denied';
        emailSubject = `SCAC Claim ${action.charAt(0).toUpperCase() + action.slice(1)} - ${organizationName}`;
        emailHtml = `
          <h2>SCAC Claim ${action.charAt(0).toUpperCase() + action.slice(1)}</h2>
          <p>Dear ${requesterName},</p>
          <p>Your SCAC claim has been <strong>${action}</strong>.</p>
          
          <h3>Claim Details:</h3>
          <p><strong>Organization:</strong> ${organizationName}</p>
          <p><strong>Requested TSPs:</strong></p>
          <pre>${tspList}</pre>
          
          ${type === 'claim_approved' 
            ? '<p>The requested TSPs have been assigned to your organization and are now available for use.</p>'
            : '<p>If you have questions about this decision, please contact your system administrator.</p>'
          }
          
          <p>Best regards,<br>The PortCast Team</p>
        `;

        if (requesterEmail) {
          await resend.emails.send({
            from: "PortCast <onboarding@resend.dev>",
            to: [requesterEmail],
            subject: emailSubject,
            html: emailHtml,
          });
        }
        break;
    }

    return new Response(
      JSON.stringify({ success: true, message: `${type} notification sent successfully` }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in send-scac-claim-notification function:", error);
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
