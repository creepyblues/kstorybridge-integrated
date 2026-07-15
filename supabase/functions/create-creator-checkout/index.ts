import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Stripe from 'https://esm.sh/stripe@14.21.0'
import { getStripeConfig } from '../_shared/stripe-config.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight
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

    // Parse request body
    const { plan_type, billing_period, title_id, coupon_code } = await req.json()

    console.log('📋 Create Creator Checkout Request:', {
      creatorEmail: user.email,
      planType: plan_type,
      billingPeriod: billing_period,
      titleId: title_id,
      hasCoupon: !!coupon_code
    })

    // Validate required fields
    if (!plan_type || !billing_period || !title_id) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: plan_type, billing_period, title_id' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Validate plan_type
    if (!['packaging', 'premium'].includes(plan_type)) {
      return new Response(
        JSON.stringify({ error: 'Invalid plan_type. Must be "packaging" or "premium"' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Validate billing_period
    if (!['monthly', 'yearly'].includes(billing_period)) {
      return new Response(
        JSON.stringify({ error: 'Invalid billing_period. Must be "monthly" or "yearly"' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Verify title exists and belongs to this creator
    const { data: titleData, error: titleError } = await supabase
      .from('titles')
      .select('title_id, title_name_kr, creator_id')
      .eq('title_id', title_id)
      .eq('creator_id', user.id)
      .single()

    if (titleError || !titleData) {
      console.error('❌ Title not found or access denied:', titleError)
      return new Response(
        JSON.stringify({ error: 'Title not found or you do not have access to this title' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('✅ Title verified:', {
      titleId: titleData.title_id,
      titleName: titleData.title_name_kr,
      creatorId: titleData.creator_id
    })

    // Check if this title already has an active subscription
    const { data: existingSubscription, error: subscriptionError } = await supabase
      .from('creator_subscriptions')
      .select('*')
      .eq('title_id', title_id)
      .in('status', ['active', 'trialing'])
      .single()

    if (existingSubscription && !subscriptionError) {
      console.warn('⛔ Title already has active subscription:', {
        subscriptionId: existingSubscription.stripe_subscription_id,
        planType: existingSubscription.plan_type,
        status: existingSubscription.status
      })

      return new Response(
        JSON.stringify({
          error: 'This title already has an active subscription',
          existingPlan: existingSubscription.plan_type,
          status: existingSubscription.status
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Initialize Stripe with environment-based configuration
    const stripeConfig = getStripeConfig(req)
    const stripe = new Stripe(stripeConfig.secretKey || '', {
      apiVersion: '2024-06-20',
    })

    // Get or create Stripe customer for this creator
    let stripeCustomerId: string

    const { data: existingCustomer, error: customerError } = await supabase
      .from('creator_stripe_customers')
      .select('stripe_customer_id')
      .eq('creator_email', user.email)
      .single()

    if (existingCustomer && !customerError) {
      stripeCustomerId = existingCustomer.stripe_customer_id
      console.log('✅ Using existing Stripe customer:', stripeCustomerId)
    } else {
      // Create new Stripe customer
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: {
          account_type: 'creator',
          creator_email: user.email,
        },
      })

      stripeCustomerId = customer.id
      console.log('✅ Created new Stripe customer:', stripeCustomerId)

      // Save to database
      const { error: insertError } = await supabase
        .from('creator_stripe_customers')
        .insert({
          creator_email: user.email,
          stripe_customer_id: stripeCustomerId,
        })

      if (insertError) {
        console.error('⚠️ Failed to save customer to database:', insertError)
        // Continue anyway - customer exists in Stripe
      }
    }

    // Select price ID based on plan_type and billing_period
    // Using environment-specific prices (test mode for staging, live mode for production)
    const priceKey = `${plan_type}_${billing_period}` as keyof typeof stripeConfig.priceIds
    const priceId = stripeConfig.priceIds[priceKey]

    if (!priceId) {
      console.error('❌ Price ID not found for:', {
        priceKey,
        environment: stripeConfig.environment
      })
      return new Response(
        JSON.stringify({ error: 'Invalid plan configuration' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('💰 Selected price:', {
      priceKey,
      priceId,
      environment: stripeConfig.environment,
      isProduction: stripeConfig.isProduction
    })

    // Detect environment from request origin (supports localhost, staging, production)
    const origin = req.headers.get('origin') || 'https://creator.kstorybridge.com'

    console.log('🌐 Redirect URLs:', {
      origin,
      success: `${origin}/payment/success`,
      cancel: `${origin}/plan`
    })

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: stripeCustomerId,
      mode: 'subscription',
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: `${origin}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/plan`,
      metadata: {
        title_id: title_id,
        title_name: titleData.title_name_kr,
        account_type: 'creator',
        creator_email: user.email,
        plan_type: plan_type,
        billing_period: billing_period,
      },
      subscription_data: {
        metadata: {
          creator_id: user.id,
          title_id: title_id,
          title_name: titleData.title_name_kr,
          account_type: 'creator',
          creator_email: user.email,
          plan_type: plan_type,
          billing_period: billing_period,
        },
      },
      // TODO: Add coupon support when coupons are ready
      // discounts: coupon_code ? [{ coupon: coupon_code }] : undefined,
    })

    console.log('✅ Checkout session created:', {
      sessionId: session.id,
      url: session.url,
      customer: stripeCustomerId,
      priceId,
      titleId: title_id
    })

    return new Response(
      JSON.stringify({
        url: session.url,
        sessionId: session.id,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  } catch (error) {
    console.error('❌ Error creating checkout session:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})
