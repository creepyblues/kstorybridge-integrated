import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CheckoutRequest {
  tier: 'pro' | 'suite';
  userId: string;
  email: string;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    console.log('🛒 [Checkout] Creating Stripe checkout session');

    // Get Stripe API key from environment
    const stripeApiKey = Deno.env.get('STRIPE_SECRET_KEY');
    if (!stripeApiKey) {
      throw new Error('STRIPE_SECRET_KEY not configured');
    }

    // Parse request body
    const { tier, userId, email }: CheckoutRequest = await req.json();
    console.log('📋 [Checkout] Request:', { tier, userId, email });

    if (!tier || !userId || !email) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: tier, userId, email' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Stripe Price IDs (TODO: Replace with actual Stripe Price IDs)
    const priceIds = {
      pro: Deno.env.get('STRIPE_PRICE_ID_PRO') || 'price_pro_monthly',
      suite: Deno.env.get('STRIPE_PRICE_ID_SUITE') || 'price_suite_monthly',
    };

    const priceId = priceIds[tier];
    console.log('💰 [Checkout] Using Price ID:', priceId);

    // Create Stripe checkout session
    // NOTE: This is a simplified example. In production, use the Stripe SDK:
    // import Stripe from 'https://esm.sh/stripe@14.10.0';
    // const stripe = new Stripe(stripeApiKey, { apiVersion: '2023-10-16' });

    const stripeCheckoutUrl = 'https://api.stripe.com/v1/checkout/sessions';

    // Get callback URLs from environment or use defaults
    const baseUrl = Deno.env.get('DASHBOARD_URL') || 'http://localhost:8086';
    const successUrl = `${baseUrl}/buyers/checkout/success?tier=${tier}&session_id={CHECKOUT_SESSION_ID}`;
    const cancelUrl = `${baseUrl}/buyers/checkout/cancel`;

    // Create checkout session via Stripe API
    const stripeResponse = await fetch(stripeCheckoutUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${stripeApiKey}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        'mode': 'subscription',
        'success_url': successUrl,
        'cancel_url': cancelUrl,
        'customer_email': email,
        'client_reference_id': userId,
        'line_items[0][price]': priceId,
        'line_items[0][quantity]': '1',
        'metadata[user_id]': userId,
        'metadata[tier]': tier,
      }),
    });

    if (!stripeResponse.ok) {
      const errorText = await stripeResponse.text();
      console.error('❌ [Checkout] Stripe API error:', errorText);
      throw new Error(`Stripe API error: ${errorText}`);
    }

    const session = await stripeResponse.json();
    console.log('✅ [Checkout] Session created:', session.id);

    // Return checkout session URL
    return new Response(
      JSON.stringify({
        sessionId: session.id,
        url: session.url,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error: any) {
    console.error('❌ [Checkout] Error:', error.message);
    return new Response(
      JSON.stringify({ error: error.message || 'Failed to create checkout session' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
