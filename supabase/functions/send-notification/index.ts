import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface NotificationRequest {
  type: "new_submission" | "approval" | "rejection";
  recipientEmail: string;
  recipientName?: string;
  contentType: "artist" | "creator";
  contentName: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    
    if (!resendApiKey) {
      console.log("RESEND_API_KEY not configured - email notifications disabled");
      return new Response(
        JSON.stringify({ message: "Email notifications not configured. Add RESEND_API_KEY to enable." }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const { type, recipientEmail, recipientName, contentType, contentName }: NotificationRequest = await req.json();

    const subjects: Record<string, string> = {
      new_submission: `New ${contentType} Submission: ${contentName}`,
      approval: `🎉 Your ${contentType} promotion has been approved!`,
      rejection: `Update on your ${contentType} promotion`,
    };

    // Use fetch to call Resend API directly
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "CinnaFlow <onboarding@resend.dev>",
        to: [recipientEmail],
        subject: subjects[type],
        html: `<h1>Notification from CinnaFlow</h1><p>Type: ${type}</p><p>Content: ${contentName}</p>`,
      }),
    });

    const result = await response.json();
    console.log("Email sent:", result);

    return new Response(JSON.stringify(result), {
      status: response.ok ? 200 : 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
