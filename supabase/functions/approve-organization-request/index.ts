
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.8";
import { createOrganizationWithAdmin, type OrganizationData } from "./_utils/organizationService.ts";
import { sendAccountSetupEmail } from "./_utils/emailService.ts";
import { getOrganizationRequest, updateRequestStatus } from "./_utils/requestProcessor.ts";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface OrganizationApprovalRequest {
  requestId: string;
  action: 'approve' | 'deny';
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
    const { requestId, action, organizationName, city, state, firstName, lastName, email }: OrganizationApprovalRequest = await req.json();

    console.log('Processing organization approval request:', { requestId, action, organizationName });

    // Get the organization request to verify it exists and is pending
    const orgRequest = await getOrganizationRequest(supabase, requestId);

    if (action === 'approve') {
      console.log('Approving organization:', organizationName);

      const organizationData: OrganizationData = {
        organizationName,
        city,
        state,
        firstName,
        lastName,
        email
      };

      // Create the organization and setup token
      const { organization, setupToken } = await createOrganizationWithAdmin(supabase, organizationData);

      // Update the organization request status
      await updateRequestStatus(supabase, requestId, 'approved');

      // Send account setup email to the organization admin
      await sendAccountSetupEmail(supabase, setupToken.id);

      return new Response(JSON.stringify({
        success: true,
        message: `Organization "${organizationName}" approved successfully`,
        organizationId: organization.id,
        setupTokenId: setupToken.id
      }), {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      });

    } else if (action === 'deny') {
      console.log('Denying organization request:', requestId);

      // Update the request status
      await updateRequestStatus(supabase, requestId, 'denied');

      return new Response(JSON.stringify({
        success: true,
        message: 'Organization request denied successfully'
      }), {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      });
    } else {
      throw new Error('Invalid action specified');
    }

  } catch (error: any) {
    console.error("Error in approve-organization-request function:", error);
    return new Response(JSON.stringify({
      success: false,
      message: error.message || 'Failed to process organization request'
    }), {
      status: 400,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  }
};

serve(handler);
