import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Stripe from 'https://esm.sh/stripe@14.21.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Get the authorization header
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'No authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Verify the user from JWT
    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    )

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
      apiVersion: '2024-06-20',
    })

    // Get the Pro tier price ID from environment variable
    const proPriceId = Deno.env.get('STRIPE_PRICE_ID_PRO')
    if (!proPriceId) {
      console.error('STRIPE_PRICE_ID_PRO not configured')
      return new Response(
        JSON.stringify({ error: 'Stripe configuration error' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Check if user already has an active subscription
    const { data: existingStripeCustomer, error: stripeCustomerError } = await supabase
      .from('stripe_customers')
      .select('*')
      .eq('user_id', user.id)
      .single()

    console.log('🔍 Checking existing stripe customer:', {
      userId: user.id,
      email: user.email,
      hasRecord: !!existingStripeCustomer,
      subscriptionStatus: existingStripeCustomer?.subscription_status,
      subscriptionId: existingStripeCustomer?.stripe_subscription_id,
      error: stripeCustomerError
    })

    // Only block if user has BOTH active status AND a valid subscription ID
    // This prevents blocking users with inconsistent data (active status but no subscription ID)
    const hasActiveSubscription = existingStripeCustomer?.subscription_status === 'active' &&
                                  existingStripeCustomer?.stripe_subscription_id != null

    if (hasActiveSubscription) {
      console.warn('⛔ User has active subscription, blocking new checkout:', {
        subscriptionStatus: existingStripeCustomer.subscription_status,
        subscriptionId: existingStripeCustomer.stripe_subscription_id
      })

      return new Response(
        JSON.stringify({
          error: 'User already has an active subscription',
          subscriptionId: existingStripeCustomer.stripe_subscription_id
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Log when allowing checkout despite having a record (for debugging)
    if (existingStripeCustomer) {
      console.log('✅ Allowing checkout despite existing record:', {
        reason: existingStripeCustomer.subscription_status === 'active'
          ? 'Active status but no subscription ID (data inconsistency)'
          : 'Non-active subscription status',
        subscriptionStatus: existingStripeCustomer.subscription_status,
        hasSubscriptionId: !!existingStripeCustomer.stripe_subscription_id
      })
    }

    // Get or create Stripe customer
    let stripeCustomer
    if (existingStripeCustomer?.stripe_customer_id) {
      stripeCustomer = await stripe.customers.retrieve(existingStripeCustomer.stripe_customer_id)
    } else {
      // Get user details from user_buyers table
      const { data: buyerProfile } = await supabase
        .from('user_buyers')
        .select('full_name, buyer_company')
        .eq('id', user.id)
        .single()

      stripeCustomer = await stripe.customers.create({
        email: user.email,
        name: buyerProfile?.full_name || undefined,
        metadata: {
          supabase_user_id: user.id,
          company: buyerProfile?.buyer_company || '',
        },
      })

      // Store the Stripe customer ID
      await supabase
        .from('stripe_customers')
        .upsert({
          user_id: user.id,
          stripe_customer_id: stripeCustomer.id,
        })
    }

    // Create checkout session for Pro tier
    const session = await stripe.checkout.sessions.create({
      customer: stripeCustomer.id,
      payment_method_types: ['card'],
      line_items: [
        {
          price: proPriceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${req.headers.get('origin')}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.get('origin')}/buyers/pricing`,
      subscription_data: {
        metadata: {
          supabase_user_id: user.id,
        },
      },
      metadata: {
        user_id: user.id,
        target_tier: 'pro',
      },
    })

    return new Response(
      JSON.stringify({ sessionId: session.id }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )
  } catch (error) {
    console.error('Error in create-checkout-session:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      },
    )
  }
})