
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.8";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const handler = async (req: Request): Promise<Response> => {
  try {
    const url = new URL(req.url);
    const token = url.searchParams.get('token');
    const action = url.searchParams.get('action'); // 'approve' or 'deny'

    if (!token || !action) {
      return new Response(
        `<html><body><h2>Invalid Request</h2><p>Missing required parameters.</p></body></html>`,
        { 
          status: 400,
          headers: { "Content-Type": "text/html" }
        }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const isApproval = action === 'approve';

    // Use the database function to handle the approval
    const { data, error } = await supabase.rpc('approve_user_request', {
      _approval_token: token,
      _approve: isApproval
    });

    if (error) {
      console.error('Error processing request:', error);
      return new Response(
        `<html><body><h2>Error</h2><p>Failed to process request: ${error.message}</p></body></html>`,
        { 
          status: 500,
          headers: { "Content-Type": "text/html" }
        }
      );
    }

    const result = data as { success: boolean; message: string };

    if (!result.success) {
      return new Response(
        `<html><body><h2>Request Processing Failed</h2><p>${result.message}</p></body></html>`,
        { 
          status: 400,
          headers: { "Content-Type": "text/html" }
        }
      );
    }

    const statusMessage = isApproval ? 'approved' : 'denied';
    const statusColor = isApproval ? '#16a34a' : '#dc2626';

    return new Response(
      `<html>
        <head>
          <title>Request ${statusMessage.charAt(0).toUpperCase() + statusMessage.slice(1)}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 40px; text-align: center; }
            .status { color: ${statusColor}; font-size: 24px; font-weight: bold; }
            .message { margin: 20px 0; font-size: 16px; }
          </style>
        </head>
        <body>
          <h1>PortCast User Request</h1>
          <div class="status">Request ${statusMessage.charAt(0).toUpperCase() + statusMessage.slice(1)}</div>
          <div class="message">${result.message}</div>
          ${isApproval ? '<p>The user will be notified that their account has been approved and they can now sign in.</p>' : '<p>The user will be notified that their request was denied.</p>'}
        </body>
      </html>`,
      { 
        status: 200,
        headers: { "Content-Type": "text/html" }
      }
    );

  } catch (error: any) {
    console.error("Error in handle-approval function:", error);
    return new Response(
      `<html><body><h2>Error</h2><p>An unexpected error occurred: ${error.message}</p></body></html>`,
      { 
        status: 500,
        headers: { "Content-Type": "text/html" }
      }
    );
  }
};

serve(handler);
