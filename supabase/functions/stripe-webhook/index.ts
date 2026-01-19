import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, stripe-signature',
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY');
    const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');
    
    if (!stripeSecretKey) {
      console.error('STRIPE_SECRET_KEY not configured');
      return new Response(
        JSON.stringify({ error: 'Stripe not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const signature = req.headers.get('stripe-signature');
    const body = await req.text();

    // If webhook secret is configured, verify signature
    let event;
    if (webhookSecret && signature) {
      // Stripe webhook signature verification using Web Crypto API
      const encoder = new TextEncoder();
      
      const parts = signature.split(',');
      const timestamp = parts.find(p => p.startsWith('t='))?.split('=')[1];
      const v1Signature = parts.find(p => p.startsWith('v1='))?.split('=')[1];
      
      if (!timestamp || !v1Signature) {
        console.error('Invalid signature format');
        return new Response(
          JSON.stringify({ error: 'Invalid signature' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const signedPayload = `${timestamp}.${body}`;
      const key = await crypto.subtle.importKey(
        "raw",
        encoder.encode(webhookSecret),
        { name: "HMAC", hash: "SHA-256" },
        false,
        ["sign"]
      );
      const signatureBuffer = await crypto.subtle.sign("HMAC", key, encoder.encode(signedPayload));
      const expectedSignature = Array.from(new Uint8Array(signatureBuffer))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');

      if (expectedSignature !== v1Signature) {
        console.error('Signature verification failed');
        return new Response(
          JSON.stringify({ error: 'Invalid signature' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      event = JSON.parse(body);
    } else {
      // No webhook secret, parse event directly (not recommended for production)
      console.warn('Processing webhook without signature verification');
      event = JSON.parse(body);
    }

    console.log('Received Stripe event:', event.type);

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Handle different event types
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        console.log('Checkout completed:', session.id);
        
        const userId = session.metadata?.user_id;
        const tier = session.metadata?.tier as 'premium' | 'pro';
        
        if (userId && tier) {
          // Update or create subscription
          const { error } = await supabase
            .from('subscriptions')
            .upsert({
              user_id: userId,
              tier: tier,
              is_active: true,
              stripe_customer_id: session.customer,
              stripe_subscription_id: session.subscription,
              started_at: new Date().toISOString(),
              expires_at: null, // Will be set by subscription update event
            }, { onConflict: 'user_id' });

          if (error) {
            console.error('Error updating subscription:', error);
          } else {
            console.log(`Updated subscription for user ${userId} to ${tier}`);
          }
        }
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object;
        console.log('Subscription updated:', subscription.id);
        
        const { error } = await supabase
          .from('subscriptions')
          .update({
            is_active: subscription.status === 'active',
            expires_at: subscription.current_period_end 
              ? new Date(subscription.current_period_end * 1000).toISOString() 
              : null,
          })
          .eq('stripe_subscription_id', subscription.id);

        if (error) {
          console.error('Error updating subscription status:', error);
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object;
        console.log('Subscription cancelled:', subscription.id);
        
        const { error } = await supabase
          .from('subscriptions')
          .update({
            is_active: false,
            tier: 'free',
          })
          .eq('stripe_subscription_id', subscription.id);

        if (error) {
          console.error('Error cancelling subscription:', error);
        }
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object;
        console.log('Payment failed for invoice:', invoice.id);
        
        // Could send notification to user here
        break;
      }

      default:
        console.log('Unhandled event type:', event.type);
    }

    return new Response(
      JSON.stringify({ received: true }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Webhook error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
