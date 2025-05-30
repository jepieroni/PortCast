
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.8";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface SetupAccountRequest {
  token: string;
  password: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    const { token, password }: SetupAccountRequest = await req.json();

    console.log('Processing account setup for token:', token);

    // Validate and consume the setup token
    const { data: tokenResult, error: tokenError } = await supabase
      .rpc('validate_and_consume_setup_token', { _token: token });

    if (tokenError) {
      console.error('Token validation error:', tokenError);
      throw new Error('Failed to validate setup token');
    }

    if (!tokenResult.success) {
      console.error('Token validation failed:', tokenResult.message);
      throw new Error(tokenResult.message);
    }

    console.log('Token validated successfully:', tokenResult);

    // Create the user using Supabase Auth Admin API
    const { data: authResult, error: authError } = await supabase.auth.admin.createUser({
      email: tokenResult.email,
      password: password,
      email_confirm: true, // Skip email confirmation since they came from an approved setup link
      user_metadata: {
        first_name: tokenResult.first_name,
        last_name: tokenResult.last_name
      }
    });

    if (authError) {
      console.error('User creation error:', authError);
      throw new Error('Failed to create user account: ' + authError.message);
    }

    console.log('User created successfully:', authResult.user.id);

    // Update the user's profile with organization_id if provided
    if (tokenResult.organization_id) {
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ organization_id: tokenResult.organization_id })
        .eq('id', authResult.user.id);

      if (profileError) {
        console.error('Profile update error:', profileError);
        // Don't fail the whole operation for this
      } else {
        console.log('Profile updated with organization ID');
      }
    }

    return new Response(JSON.stringify({
      success: true,
      message: 'Account created successfully',
      user_id: authResult.user.id
    }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });

  } catch (error: any) {
    console.error("Error in setup-user-account function:", error);
    return new Response(
      JSON.stringify({
        success: false,
        message: error.message || 'Failed to create account'
      }),
      {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
