
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.8";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const createHtmlResponse = (title: string, statusMessage: string, message: string, isSuccess: boolean) => {
  const statusColor = isSuccess ? '#16a34a' : '#dc2626';
  
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    body { 
      font-family: Arial, sans-serif; 
      margin: 40px; 
      text-align: center; 
      background-color: #f9fafb; 
    }
    .container { 
      max-width: 600px; 
      margin: 0 auto; 
      background: white; 
      padding: 40px; 
      border-radius: 8px; 
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); 
    }
    .status { 
      color: ${statusColor}; 
      font-size: 24px; 
      font-weight: bold; 
      margin: 20px 0; 
    }
    .message { 
      margin: 20px 0; 
      font-size: 16px; 
      color: #374151; 
    }
    h1 { 
      color: #1f2937; 
      margin-bottom: 10px; 
    }
    .info { 
      color: #6b7280; 
      font-size: 14px; 
      margin-top: 30px; 
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>PortCast User Request</h1>
    <div class="status">${statusMessage}</div>
    <div class="message">${message}</div>
    ${isSuccess && statusMessage.includes('Approved') ? 
      '<p class="info">The user will be notified that their account has been approved and they can now sign in.</p>' : 
      '<p class="info">The user will be notified that their request was denied.</p>'
    }
  </div>
</body>
</html>`;
};

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
      const html = createHtmlResponse(
        "Invalid Request", 
        "Invalid Request", 
        "Missing required parameters.", 
        false
      );
      
      return new Response(html, { 
        status: 400,
        headers: { 
          "Content-Type": "text/html; charset=utf-8"
        }
      });
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
      const html = createHtmlResponse(
        "Error", 
        "Error", 
        `Failed to process request: ${error.message}`, 
        false
      );
      
      return new Response(html, { 
        status: 500,
        headers: { 
          "Content-Type": "text/html; charset=utf-8"
        }
      });
    }

    const result = data as { success: boolean; message: string };
    console.log("Processed result:", result);

    if (!result.success) {
      const html = createHtmlResponse(
        "Request Processing Failed", 
        "Request Processing Failed", 
        result.message, 
        false
      );
      
      return new Response(html, { 
        status: 400,
        headers: { 
          "Content-Type": "text/html; charset=utf-8"
        }
      });
    }

    const statusMessage = isApproval ? 'Request Approved' : 'Request Denied';
    const title = statusMessage;

    console.log("Creating success response with title:", title);

    const html = createHtmlResponse(title, statusMessage, result.message, true);
    
    console.log("Returning HTML response");

    return new Response(html, { 
      status: 200,
      headers: { 
        "Content-Type": "text/html; charset=utf-8"
      }
    });

  } catch (error: any) {
    console.error("Unexpected error:", error);
    const html = createHtmlResponse(
      "Error", 
      "Error", 
      `An unexpected error occurred: ${error.message}`, 
      false
    );
    
    return new Response(html, { 
      status: 500,
      headers: { 
        "Content-Type": "text/html; charset=utf-8"
      }
    });
  }
};

serve(handler);
