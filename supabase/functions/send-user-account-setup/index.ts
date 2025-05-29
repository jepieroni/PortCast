
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

interface AccountSetupRequestBody {
  setupTokenId: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const { setupTokenId }: AccountSetupRequestBody = await req.json();

    console.log('Looking for setup token with ID:', setupTokenId);

    // Get the setup token details - remove the used_at IS NULL filter since we just created it
    const { data: tokenData, error: tokenError } = await supabase
      .from('account_setup_tokens')
      .select('*')
      .eq('id', setupTokenId)
      .single();

    if (tokenError) {
      console.error('Database error fetching token:', tokenError);
      throw tokenError;
    }

    if (!tokenData) {
      console.error('No token data found for ID:', setupTokenId);
      throw new Error('Setup token not found');
    }

    console.log('Found token data:', tokenData);

    // Check if token is expired
    if (new Date(tokenData.expires_at) < new Date()) {
      throw new Error('Setup token has expired');
    }

    // Check if token is already used
    if (tokenData.used_at) {
      throw new Error('Setup token has already been used');
    }

    // Use Lovable preview URL for testing (this should be updated to your production domain when deployed)
    const appBaseUrl = 'https://lovable.dev/projects/drqsjwkzyiqldwcjwuey-portcast-login/editor';
    const setupUrl = `${appBaseUrl}/setup-account?token=${tokenData.token}`;

    console.log('Account setup URL constructed:', setupUrl);

    const emailResponse = await resend.emails.send({
      from: "PortCast <admin@portcast.app>",
      to: [tokenData.email],
      subject: "Complete Your PortCast Account Setup",
      html: `
        <h2>Welcome to PortCast!</h2>
        <p>Your access request has been approved. Please complete your account setup by creating a password.</p>
        
        <h3>Account Details:</h3>
        <ul>
          <li><strong>Name:</strong> ${tokenData.first_name} ${tokenData.last_name}</li>
          <li><strong>Email:</strong> ${tokenData.email}</li>
        </ul>
        
        <p>Click the button below to set up your account:</p>
        
        <div style="margin: 20px 0;">
          <a href="${setupUrl}" 
             style="background-color: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
            Set Up Your Account
          </a>
        </div>
        
        <p><small><strong>Note:</strong> This link will expire in 48 hours for security purposes.</small></p>
        
        <p><small>If the button doesn't work, you can copy and paste this link directly into your browser:</small></p>
        <div style="margin: 10px 0; padding: 10px; background-color: #f8f9fa; border-radius: 4px; font-size: 12px;">
          <p>${setupUrl}</p>
        </div>
        
        <p><small>Welcome to the PortCast transportation management system!</small></p>
      `,
    });

    console.log("Account setup email sent successfully:", emailResponse);

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-user-account-setup function:", error);
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
