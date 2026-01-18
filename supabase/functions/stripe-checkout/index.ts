import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface CheckoutRequest {
  tier: 'premium' | 'pro';
  userId: string;
  email: string;
  successUrl: string;
  cancelUrl: string;
}

const TIER_PRICES = {
  premium: {
    amount: 500, // $5.00 in cents
    name: 'Premium Plan',
    description: 'Ad-free viewing with HD streaming',
  },
  pro: {
    amount: 1999, // $19.99 in cents
    name: 'Pro Plan',
    description: '4K Ultra HD with exclusive content',
  },
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY");
    
    if (!stripeSecretKey) {
      // Return a specific error that the frontend can handle
      return new Response(
        JSON.stringify({ 
          error: "Stripe not configured",
          message: "Please configure Stripe secret key in admin settings"
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }

    const { tier, userId, email, successUrl, cancelUrl }: CheckoutRequest = await req.json();

    if (!tier || !TIER_PRICES[tier]) {
      return new Response(
        JSON.stringify({ error: "Invalid subscription tier" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const priceInfo = TIER_PRICES[tier];

    // Create Stripe checkout session
    const response = await fetch("https://api.stripe.com/v1/checkout/sessions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${stripeSecretKey}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        "mode": "subscription",
        "success_url": successUrl || `${req.headers.get("origin")}/dashboard?success=true`,
        "cancel_url": cancelUrl || `${req.headers.get("origin")}/subscription?canceled=true`,
        "customer_email": email,
        "client_reference_id": userId,
        "line_items[0][price_data][currency]": "usd",
        "line_items[0][price_data][product_data][name]": priceInfo.name,
        "line_items[0][price_data][product_data][description]": priceInfo.description,
        "line_items[0][price_data][unit_amount]": priceInfo.amount.toString(),
        "line_items[0][price_data][recurring][interval]": "month",
        "line_items[0][quantity]": "1",
        "metadata[userId]": userId,
        "metadata[tier]": tier,
      }),
    });

    const session = await response.json();

    if (session.error) {
      console.error("Stripe error:", session.error);
      return new Response(
        JSON.stringify({ error: session.error.message }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ url: session.url, sessionId: session.id }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: unknown) {
    console.error("Checkout error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
