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

    // Detect environment from request origin
    const origin = req.headers.get('origin') || ''
    const isProduction = origin.includes('dashboard.kstorybridge.com') && !origin.includes('staging')
    const isLocalhost = origin.includes('localhost') || origin.includes('127.0.0.1')
    const isStaging = origin.includes('dashboard-staging') || origin.includes('dashboard-v2')

    console.log('🔧 Environment detection:', {
      origin,
      isProduction,
      isStaging,
      isLocalhost,
      mode: isProduction ? 'LIVE' : 'TEST'
    })

    // Use test mode for localhost/staging, live mode for production only
    const stripeSecretKey = isProduction
      ? (Deno.env.get('STRIPE_SECRET_KEY_LIVE') || Deno.env.get('STRIPE_SECRET_KEY'))
      : Deno.env.get('STRIPE_SECRET_KEY_TEST')

    if (!stripeSecretKey) {
      console.error('❌ Stripe secret key not configured for environment:', isProduction ? 'LIVE' : 'TEST')
      return new Response(
        JSON.stringify({ error: 'Stripe configuration error: missing secret key' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: '2024-06-20',
    })

    // Parse request body to get tier (default to 'pro' for backward compatibility)
    let requestedTier = 'pro'
    try {
      const body = await req.json()
      if (body.tier === 'suite' || body.tier === 'pro') {
        requestedTier = body.tier
      }
    } catch {
      // No body or invalid JSON - use default tier
    }

    console.log('🎯 Requested tier:', requestedTier)

    // Get the appropriate price ID based on tier AND environment
    // For test mode: use *_TEST suffix, for live mode: use *_LIVE suffix or fallback to non-suffixed
    const proPriceId = isProduction
      ? (Deno.env.get('STRIPE_PRICE_ID_PRO_LIVE') || Deno.env.get('STRIPE_PRICE_ID_PRO'))
      : Deno.env.get('STRIPE_PRICE_ID_PRO_TEST')

    const suitePriceId = isProduction
      ? (Deno.env.get('STRIPE_PRICE_ID_SUITE_LIVE') || Deno.env.get('STRIPE_PRICE_ID_SUITE'))
      : Deno.env.get('STRIPE_PRICE_ID_SUITE_TEST')

    const priceId = requestedTier === 'suite' ? suitePriceId : proPriceId

    console.log('💰 Price ID selection:', {
      requestedTier,
      isProduction,
      priceId: priceId ? `${priceId.substring(0, 20)}...` : 'NOT CONFIGURED'
    })

    if (!priceId) {
      const envSuffix = isProduction ? 'LIVE' : 'TEST'
      console.error(`❌ STRIPE_PRICE_ID_${requestedTier.toUpperCase()}_${envSuffix} not configured`)
      return new Response(
        JSON.stringify({ error: `Stripe configuration error: ${requestedTier} tier price not configured for ${envSuffix} mode` }),
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
    let needToCreateCustomer = !existingStripeCustomer?.stripe_customer_id

    // Try to retrieve existing customer (may fail if customer was created in different mode)
    if (existingStripeCustomer?.stripe_customer_id) {
      try {
        stripeCustomer = await stripe.customers.retrieve(existingStripeCustomer.stripe_customer_id)
        console.log('✅ Retrieved existing Stripe customer:', stripeCustomer.id)
      } catch (customerError: any) {
        // Customer doesn't exist in current mode (test vs live mismatch)
        console.warn('⚠️ Could not retrieve customer (likely mode mismatch):', customerError.message)
        console.log('🔄 Will create new customer in current mode')
        needToCreateCustomer = true
      }
    }

    if (needToCreateCustomer) {
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

    // Create checkout session for selected tier
    const session = await stripe.checkout.sessions.create({
      customer: stripeCustomer.id,
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${req.headers.get('origin')}/buyers/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.get('origin')}/buyers/checkout/cancel`,
      subscription_data: {
        metadata: {
          supabase_user_id: user.id,
          target_tier: requestedTier,
        },
      },
      metadata: {
        user_id: user.id,
        target_tier: requestedTier,
      },
    })

    console.log('✅ Checkout session created:', {
      sessionId: session.id,
      url: session.url ? 'present' : 'missing'
    })

    return new Response(
      JSON.stringify({ sessionId: session.id, url: session.url }),
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
