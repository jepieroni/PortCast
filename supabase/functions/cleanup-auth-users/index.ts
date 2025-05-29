
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.8";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const handler = async (req: Request): Promise<Response> => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  try {
    const { userIds } = await req.json();

    if (!userIds || !Array.isArray(userIds)) {
      return new Response('Invalid request: userIds array required', { status: 400 });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const results = [];

    for (const userId of userIds) {
      console.log(`Attempting to delete user: ${userId}`);
      
      const { error } = await supabase.auth.admin.deleteUser(userId);
      
      if (error) {
        console.error(`Error deleting user ${userId}:`, error);
        results.push({ userId, success: false, error: error.message });
      } else {
        console.log(`Successfully deleted user: ${userId}`);
        results.push({ userId, success: true });
      }
    }

    return new Response(JSON.stringify({ results }), {
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('Error in cleanup function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

serve(handler);
