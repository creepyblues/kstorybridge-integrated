import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, stripe-signature',
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    console.log('🔔 [Webhook] Received Stripe webhook');

    // Get webhook secret from environment
    const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');
    if (!webhookSecret) {
      throw new Error('STRIPE_WEBHOOK_SECRET not configured');
    }

    // Get Stripe signature from headers
    const signature = req.headers.get('stripe-signature');
    if (!signature) {
      throw new Error('No Stripe signature found');
    }

    // Get raw body
    const body = await req.text();

    // NOTE: In production, verify the webhook signature using Stripe SDK
    // import Stripe from 'https://esm.sh/stripe@14.10.0';
    // const stripe = new Stripe(stripeApiKey, { apiVersion: '2023-10-16' });
    // const event = stripe.webhooks.constructEvent(body, signature, webhookSecret);

    // For now, parse the event directly (INSECURE - only for development)
    const event = JSON.parse(body);
    console.log('📨 [Webhook] Event type:', event.type);

    // Initialize Supabase client with service role
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Handle different event types
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        const userId = session.metadata?.user_id || session.client_reference_id;
        const tier = session.metadata?.tier;

        console.log('✅ [Webhook] Checkout completed:', { userId, tier });

        if (!userId || !tier) {
          console.error('❌ [Webhook] Missing userId or tier in session metadata');
          break;
        }

        // Update user tier in database
        const { error: updateError } = await supabase
          .from('user_buyers')
          .update({
            tier: tier,
            stripe_customer_id: session.customer,
            stripe_subscription_id: session.subscription,
          })
          .eq('id', userId);

        if (updateError) {
          console.error('❌ [Webhook] Failed to update user tier:', updateError);
          throw updateError;
        }

        console.log('✅ [Webhook] User tier updated to:', tier);
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object;
        const customerId = subscription.customer;

        console.log('🔄 [Webhook] Subscription updated:', subscription.id);

        // Determine tier based on subscription status
        let newTier: string;
        if (subscription.status === 'active') {
          // Get tier from subscription metadata or price ID
          newTier = subscription.metadata?.tier || 'pro';
        } else {
          // Subscription cancelled/paused - downgrade to basic
          newTier = 'basic';
        }

        // Update user tier
        const { error: updateError } = await supabase
          .from('user_buyers')
          .update({ tier: newTier })
          .eq('stripe_customer_id', customerId);

        if (updateError) {
          console.error('❌ [Webhook] Failed to update subscription:', updateError);
          throw updateError;
        }

        console.log('✅ [Webhook] Subscription updated, new tier:', newTier);
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object;
        const customerId = subscription.customer;

        console.log('🗑️ [Webhook] Subscription deleted:', subscription.id);

        // Downgrade to basic tier
        const { error: updateError } = await supabase
          .from('user_buyers')
          .update({ tier: 'basic' })
          .eq('stripe_customer_id', customerId);

        if (updateError) {
          console.error('❌ [Webhook] Failed to downgrade user:', updateError);
          throw updateError;
        }

        console.log('✅ [Webhook] User downgraded to basic tier');
        break;
      }

      default:
        console.log('ℹ️ [Webhook] Unhandled event type:', event.type);
    }

    // Return success response
    return new Response(
      JSON.stringify({ received: true }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error: any) {
    console.error('❌ [Webhook] Error:', error.message);
    return new Response(
      JSON.stringify({ error: error.message || 'Webhook processing failed' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
