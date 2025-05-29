
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.8";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const handler = async (req: Request): Promise<Response> => {
  console.log("Handle approval function called");
  console.log("Request URL:", req.url);
  console.log("Request method:", req.method);

  try {
    const url = new URL(req.url);
    const token = url.searchParams.get('token');
    const action = url.searchParams.get('action');

    console.log("Extracted token:", token);
    console.log("Extracted action:", action);

    if (!token || !action) {
      console.log("Missing required parameters");
      const redirectUrl = `${supabaseUrl.replace('/rest/v1', '')}/approval-result?success=false&message=${encodeURIComponent('Missing required parameters')}&action=unknown`;
      return Response.redirect(redirectUrl, 302);
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const isApproval = action === 'approve';

    console.log("Calling database function with token:", token);

    const { data, error } = await supabase.rpc('approve_user_request', {
      _approval_token: token,
      _approve: isApproval
    });

    console.log("Database response - data:", data, "error:", error);

    if (error) {
      console.error('Database error:', error);
      const redirectUrl = `${supabaseUrl.replace('/rest/v1', '')}/approval-result?success=false&message=${encodeURIComponent(`Failed to process request: ${error.message}`)}&action=${action}`;
      return Response.redirect(redirectUrl, 302);
    }

    const result = data as { success: boolean; message: string; user_id?: string; organization_id?: string };
    console.log("Processed result:", result);

    // If approval was successful and we have user_id and organization_id, update the profile
    if (result.success && isApproval && result.user_id && result.organization_id) {
      console.log("Updating profile with organization_id:", result.organization_id);
      
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ organization_id: result.organization_id })
        .eq('id', result.user_id);

      if (profileError) {
        console.error('Error updating profile organization_id:', profileError);
      } else {
        console.log('Successfully updated profile with organization_id');
      }
    }

    // Redirect to the approval result page with the results
    const redirectUrl = `${supabaseUrl.replace('/rest/v1', '')}/approval-result?success=${result.success}&message=${encodeURIComponent(result.message)}&action=${action}`;
    console.log("Redirecting to:", redirectUrl);

    return Response.redirect(redirectUrl, 302);

  } catch (error: any) {
    console.error("Unexpected error:", error);
    const redirectUrl = `${supabaseUrl.replace('/rest/v1', '')}/approval-result?success=false&message=${encodeURIComponent(`An unexpected error occurred: ${error.message}`)}&action=unknown`;
    return Response.redirect(redirectUrl, 302);
  }
};

serve(handler);
