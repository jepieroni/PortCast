
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.8";

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
    const { data: orgRequest, error: requestError } = await supabase
      .from('organization_requests')
      .select('*')
      .eq('id', requestId)
      .eq('status', 'pending')
      .single();

    if (requestError || !orgRequest) {
      throw new Error('Organization request not found or already processed');
    }

    if (action === 'approve') {
      console.log('Approving organization:', organizationName);

      // Create the organization
      const { data: organization, error: orgError } = await supabase
        .from('organizations')
        .insert({
          name: organizationName,
          city: city,
          state: state,
          trusted_agent_email: email
        })
        .select()
        .single();

      if (orgError) {
        console.error('Error creating organization:', orgError);
        throw new Error(`Failed to create organization: ${orgError.message}`);
      }

      console.log('Organization created:', organization.id);

      // Create account setup token for organization admin
      const { data: setupToken, error: setupTokenError } = await supabase
        .from('account_setup_tokens')
        .insert({
          email: email,
          first_name: firstName,
          last_name: lastName,
          organization_id: organization.id,
          organization_name: organizationName,
          token_type: 'organization_admin'
        })
        .select()
        .single();

      if (setupTokenError) {
        console.error('Error creating setup token:', setupTokenError);
        throw new Error(`Failed to create setup token: ${setupTokenError.message}`);
      }

      console.log('Setup token created:', setupToken.id);

      // Create a user request for the organization admin (marked as approved)
      const { data: userRequest, error: userRequestError } = await supabase
        .from('user_requests')
        .insert({
          email: email,
          first_name: firstName,
          last_name: lastName,
          organization_id: organization.id,
          status: 'approved'
        })
        .select()
        .single();

      if (userRequestError) {
        console.error('Failed to create user request:', userRequestError);
        // Continue anyway, we can create the user request manually later
      } else {
        console.log('User request created:', userRequest.id);
      }

      // Update the organization request status
      const { error: updateError } = await supabase
        .from('organization_requests')
        .update({
          status: 'approved',
          reviewed_at: new Date().toISOString()
        })
        .eq('id', requestId);

      if (updateError) {
        console.error('Error updating request status:', updateError);
        throw new Error(`Failed to update request status: ${updateError.message}`);
      }

      // Send account setup email to the organization admin
      console.log('Sending account setup email...');
      try {
        const { data: emailData, error: emailError } = await supabase.functions.invoke('send-user-account-setup', {
          body: {
            setupTokenId: setupToken.id
          }
        });

        if (emailError) {
          console.error('Failed to send account setup email:', emailError);
          // Don't fail the whole operation, but log it
        } else {
          console.log('Account setup email sent successfully:', emailData);
        }
      } catch (emailError) {
        console.error('Exception sending account setup email:', emailError);
        // Don't fail the whole operation
      }

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
      const { error: updateError } = await supabase
        .from('organization_requests')
        .update({
          status: 'denied',
          reviewed_at: new Date().toISOString()
        })
        .eq('id', requestId);

      if (updateError) {
        throw new Error(`Failed to update request status: ${updateError.message}`);
      }

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
