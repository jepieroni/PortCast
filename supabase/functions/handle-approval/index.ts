
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.8";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const handler = async (req: Request): Promise<Response> => {
  console.log("Handle approval function called with URL:", req.url);
  console.log("Request method:", req.method);
  console.log("Request headers:", Object.fromEntries(req.headers.entries()));

  try {
    const url = new URL(req.url);
    const token = url.searchParams.get('token');
    const action = url.searchParams.get('action'); // 'approve' or 'deny'

    console.log("Token:", token);
    console.log("Action:", action);

    if (!token || !action) {
      console.log("Missing required parameters");
      return new Response(
        `<!DOCTYPE html>
        <html>
        <head>
          <title>Invalid Request</title>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body { font-family: Arial, sans-serif; margin: 40px; text-align: center; }
            .error { color: #dc2626; font-size: 24px; font-weight: bold; }
          </style>
        </head>
        <body>
          <h1>PortCast User Request</h1>
          <div class="error">Invalid Request</div>
          <p>Missing required parameters.</p>
        </body>
        </html>`,
        { 
          status: 400,
          headers: { 
            "Content-Type": "text/html",
            "Cache-Control": "no-cache, no-store, must-revalidate",
            "Pragma": "no-cache",
            "Expires": "0"
          }
        }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const isApproval = action === 'approve';

    console.log("Calling approve_user_request with token:", token, "approve:", isApproval);

    // Use the database function to handle the approval
    const { data, error } = await supabase.rpc('approve_user_request', {
      _approval_token: token,
      _approve: isApproval
    });

    console.log("Database function result:", { data, error });

    if (error) {
      console.error('Error processing request:', error);
      return new Response(
        `<!DOCTYPE html>
        <html>
        <head>
          <title>Error</title>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body { font-family: Arial, sans-serif; margin: 40px; text-align: center; }
            .error { color: #dc2626; font-size: 24px; font-weight: bold; }
          </style>
        </head>
        <body>
          <h1>PortCast User Request</h1>
          <div class="error">Error</div>
          <p>Failed to process request: ${error.message}</p>
        </body>
        </html>`,
        { 
          status: 500,
          headers: { 
            "Content-Type": "text/html",
            "Cache-Control": "no-cache, no-store, must-revalidate",
            "Pragma": "no-cache",
            "Expires": "0"
          }
        }
      );
    }

    const result = data as { success: boolean; message: string };
    console.log("Parsed result:", result);

    if (!result.success) {
      return new Response(
        `<!DOCTYPE html>
        <html>
        <head>
          <title>Request Processing Failed</title>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body { font-family: Arial, sans-serif; margin: 40px; text-align: center; }
            .error { color: #dc2626; font-size: 24px; font-weight: bold; }
          </style>
        </head>
        <body>
          <h1>PortCast User Request</h1>
          <div class="error">Request Processing Failed</div>
          <p>${result.message}</p>
        </body>
        </html>`,
        { 
          status: 400,
          headers: { 
            "Content-Type": "text/html",
            "Cache-Control": "no-cache, no-store, must-revalidate",
            "Pragma": "no-cache",
            "Expires": "0"
          }
        }
      );
    }

    const statusMessage = isApproval ? 'approved' : 'denied';
    const statusColor = isApproval ? '#16a34a' : '#dc2626';

    console.log("Returning success response");

    return new Response(
      `<!DOCTYPE html>
      <html>
      <head>
        <title>Request ${statusMessage.charAt(0).toUpperCase() + statusMessage.slice(1)}</title>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body { font-family: Arial, sans-serif; margin: 40px; text-align: center; background-color: #f9fafb; }
          .container { max-width: 600px; margin: 0 auto; background: white; padding: 40px; border-radius: 8px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); }
          .status { color: ${statusColor}; font-size: 24px; font-weight: bold; margin: 20px 0; }
          .message { margin: 20px 0; font-size: 16px; color: #374151; }
          h1 { color: #1f2937; margin-bottom: 10px; }
          .info { color: #6b7280; font-size: 14px; margin-top: 30px; }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>PortCast User Request</h1>
          <div class="status">Request ${statusMessage.charAt(0).toUpperCase() + statusMessage.slice(1)}</div>
          <div class="message">${result.message}</div>
          ${isApproval ? '<p class="info">The user will be notified that their account has been approved and they can now sign in.</p>' : '<p class="info">The user will be notified that their request was denied.</p>'}
        </div>
      </body>
      </html>`,
      { 
        status: 200,
        headers: { 
          "Content-Type": "text/html",
          "Cache-Control": "no-cache, no-store, must-revalidate",
          "Pragma": "no-cache",
          "Expires": "0"
        }
      }
    );

  } catch (error: any) {
    console.error("Error in handle-approval function:", error);
    return new Response(
      `<!DOCTYPE html>
      <html>
      <head>
        <title>Error</title>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body { font-family: Arial, sans-serif; margin: 40px; text-align: center; }
          .error { color: #dc2626; font-size: 24px; font-weight: bold; }
        </style>
      </head>
      <body>
        <h1>PortCast User Request</h1>
        <div class="error">Error</div>
        <p>An unexpected error occurred: ${error.message}</p>
      </body>
      </html>`,
      { 
        status: 500,
        headers: { 
          "Content-Type": "text/html",
          "Cache-Control": "no-cache, no-store, must-revalidate",
          "Pragma": "no-cache",
          "Expires": "0"
        }
      }
    );
  }
};

serve(handler);
