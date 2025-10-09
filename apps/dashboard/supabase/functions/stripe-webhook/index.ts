// @ts-ignore
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Stripe from 'https://esm.sh/stripe@14.21.0'

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
  apiVersion: '2024-06-20',
})

const cryptoProvider = Stripe.createSubtleCryptoProvider()

// CRITICAL: Configure function to bypass Supabase auth middleware
// Webhooks use signature verification, not JWT tokens
const handler = async (request: Request): Promise<Response> => {
  // Log request for debugging auth issues
  console.log('🔍 Webhook request received:', {
    method: request.method,
    url: request.url,
    hasAuthHeader: !!request.headers.get('Authorization'),
    hasStripeSignature: !!request.headers.get('Stripe-Signature'),
    userAgent: request.headers.get('User-Agent'),
    contentType: request.headers.get('Content-Type')
  })

  // Handle OPTIONS request for CORS
  if (request.method === 'OPTIONS') {
    console.log('⚡ Handling CORS preflight request')
    return new Response(null, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Stripe-Signature, Authorization',
        'Access-Control-Max-Age': '86400',
      }
    })
  }

  // Only accept POST requests
  if (request.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 })
  }

  const signature = request.headers.get('Stripe-Signature')
  const body = await request.text()

  // Comprehensive webhook debugging
  const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET')

  console.log('📨 Webhook received - DETAILED DEBUG:', {
    method: request.method,
    url: request.url,
    hasSignature: !!signature,
    signatureFormat: signature ? `${signature.substring(0, 20)}...` : 'NONE',
    bodyLength: body.length,
    bodyPreview: body.substring(0, 150) + '...',
    hasWebhookSecret: !!webhookSecret,
    secretFormat: webhookSecret ? `${webhookSecret.substring(0, 12)}...` : 'NONE',
    secretLength: webhookSecret?.length || 0,
    headers: {
      'content-type': request.headers.get('content-type'),
      'user-agent': request.headers.get('user-agent'),
      'stripe-signature': signature ? `${signature.substring(0, 30)}...` : 'NONE'
    },
    timestamp: new Date().toISOString()
  })

  // Check for signature header
  if (!signature) {
    console.error('❌ AUTHENTICATION FAILURE: No Stripe signature header found')
    console.error('🔍 Available headers:', Object.fromEntries(request.headers.entries()))
    return new Response('No signature', { status: 400 })
  }

  // Check for webhook secret
  if (!webhookSecret) {
    console.error('❌ AUTHENTICATION FAILURE: No webhook secret configured')
    console.error('🔍 Environment check:', {
      hasStripeSecretKey: !!Deno.env.get('STRIPE_SECRET_KEY'),
      hasSupabaseUrl: !!Deno.env.get('SUPABASE_URL'),
      hasServiceRole: !!Deno.env.get('SUPABASE_SERVICE_ROLE_KEY'),
      allEnvKeys: Object.keys(Deno.env.toObject()).filter(key => key.includes('STRIPE') || key.includes('WEBHOOK'))
    })
    return new Response('Webhook secret not configured', { status: 500 })
  }

  // Attempt signature verification with detailed logging
  let receivedEvent
  try {
    console.log('⏳ Attempting signature verification with:', {
      bodyLength: body.length,
      signatureLength: signature.length,
      secretLength: webhookSecret.length,
      secretStartsWith: webhookSecret.startsWith('whsec_') ? 'whsec_' : webhookSecret.substring(0, 8) + '...',
      verificationTimestamp: new Date().toISOString()
    })

    receivedEvent = await stripe.webhooks.constructEventAsync(
      body,
      signature!,
      webhookSecret,
      undefined,
      cryptoProvider
    )

    console.log('✅ SIGNATURE VERIFICATION SUCCESSFUL:', {
      eventType: receivedEvent.type,
      eventId: receivedEvent.id,
      created: receivedEvent.created,
      livemode: receivedEvent.livemode
    })

  } catch (err) {
    console.error('❌ SIGNATURE VERIFICATION FAILED - DETAILED ERROR:', {
      errorMessage: err.message,
      errorName: err.name,
      errorType: err.constructor.name,
      stackTrace: err.stack?.substring(0, 500) + '...',
      signaturePreview: signature.substring(0, 50) + '...',
      secretPreview: webhookSecret.substring(0, 15) + '...',
      bodyHash: body.length > 0 ? 'HAS_BODY' : 'EMPTY_BODY',
      requestDetails: {
        method: request.method,
        contentType: request.headers.get('content-type'),
        userAgent: request.headers.get('user-agent')
      }
    })

    return new Response(`Webhook signature verification failed: ${err.message}`, { status: 400 })
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  )

  console.log(`🔔 Event received: ${receivedEvent.type}`, {
    eventId: receivedEvent.id,
    created: receivedEvent.created,
    livemode: receivedEvent.livemode
  })

  // IDEMPOTENCY CHECK: Prevent duplicate event processing
  console.log('🔍 Checking for duplicate event:', receivedEvent.id)

  const { data: existingEvent, error: checkError } = await supabase
    .from('webhook_events')
    .select('id, processed_at')
    .eq('stripe_event_id', receivedEvent.id)
    .single()

  if (existingEvent) {
    console.log('✅ Event already processed at:', existingEvent.processed_at)
    console.log('📊 Duplicate event prevented:', {
      eventId: receivedEvent.id,
      eventType: receivedEvent.type,
      originalProcessing: existingEvent.processed_at,
      timeSinceOriginal: `${Math.round((new Date().getTime() - new Date(existingEvent.processed_at).getTime()) / 1000)}s ago`
    })
    return new Response(JSON.stringify({ received: true, duplicate: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    })
  }

  if (checkError && checkError.code !== 'PGRST116') {
    // PGRST116 = no rows found (expected for new events)
    console.error('❌ Error checking for duplicate event:', checkError)
    console.log('⚠️ Continuing with event processing despite check error (fail-open)')
    // Continue processing anyway - don't block legitimate webhooks due to check failures
  }

  try {
    switch (receivedEvent.type) {
      case 'checkout.session.completed': {
        const session = receivedEvent.data.object as Stripe.Checkout.Session

        // Log full session details for debugging
        console.log('🔍 Full checkout session:', {
          id: session.id,
          customer: session.customer,
          subscription: session.subscription,
          metadata: session.metadata,
          mode: session.mode,
          status: session.status,
          payment_status: session.payment_status
        })

        // Try to get user_id from session metadata first, then subscription metadata
        // IMPORTANT: Check both possible metadata keys for consistency
        let userId = session.metadata?.user_id || session.metadata?.supabase_user_id

        console.log('🔍 Checking for user_id in session metadata:', {
          user_id: session.metadata?.user_id,
          supabase_user_id: session.metadata?.supabase_user_id,
          all_metadata: session.metadata
        })

        if (!userId && session.subscription) {
          // Fallback: get user_id from subscription metadata
          console.log('⏳ No user_id in session metadata, checking subscription...')
          try {
            const subscription = await stripe.subscriptions.retrieve(session.subscription as string)
            userId = subscription.metadata?.user_id || subscription.metadata?.supabase_user_id
            console.log('🔍 Subscription metadata:', {
              user_id: subscription.metadata?.user_id,
              supabase_user_id: subscription.metadata?.supabase_user_id,
              all_metadata: subscription.metadata
            })
          } catch (subscriptionError) {
            console.error('❌ Failed to retrieve subscription for user_id:', subscriptionError)
          }
        }

        if (!userId) {
          console.error('❌ No user_id found in session or subscription metadata:', {
            sessionMetadata: session.metadata,
            sessionId: session.id
          })
          return new Response('Missing user_id in both session and subscription metadata', { status: 400 })
        }

        console.log('✅ Found user_id:', userId)

        // Retrieve the subscription with error handling
        console.log('🔄 Retrieving subscription:', session.subscription)
        let subscription
        try {
          subscription = await stripe.subscriptions.retrieve(
            session.subscription as string
          )
          console.log('✅ Subscription retrieved:', {
            id: subscription.id,
            status: subscription.status,
            current_period_end: subscription.current_period_end
          })
        } catch (subscriptionError) {
          console.error('❌ Failed to retrieve subscription:', subscriptionError)
          return new Response('Failed to retrieve subscription', { status: 400 })
        }

        // Update stripe_customers table with safe date handling and enhanced logging
        const stripeCustomerData = {
          user_id: userId,
          stripe_customer_id: subscription.customer as string,
          stripe_subscription_id: subscription.id,
          subscription_status: subscription.status,
          current_period_end: subscription.current_period_end
            ? new Date(subscription.current_period_end * 1000).toISOString()
            : null,
          cancel_at_period_end: subscription.cancel_at_period_end,
        }

        console.log('🔄 Updating stripe_customers with:', stripeCustomerData)

        const { error: stripeCustomerError } = await supabase
          .from('stripe_customers')
          .upsert(stripeCustomerData)

        if (stripeCustomerError) {
          console.error('❌ Failed to update stripe_customers:', stripeCustomerError)
          // Don't fail the webhook completely, continue with tier update
        } else {
          console.log('✅ Stripe customer record updated successfully')

          // Verify the record was created/updated correctly
          const { data: verifyRecord, error: verifyError } = await supabase
            .from('stripe_customers')
            .select('*')
            .eq('user_id', userId)
            .single()

          if (verifyError) {
            console.warn('⚠️ Could not verify stripe_customers record:', verifyError)
          } else {
            console.log('✅ Stripe customer record verification:', verifyRecord)
          }
        }

        // Update user tier to 'pro' if subscription is active
        if (subscription.status === 'active' || subscription.status === 'trialing') {
          console.log(`💳 Subscription is ${subscription.status}, updating user tier to pro...`)

          // First check if user exists in user_buyers table
          const { data: existingUser, error: checkError } = await supabase
            .from('user_buyers')
            .select('id, tier, email')
            .eq('id', userId)
            .single()

          if (checkError && checkError.code !== 'PGRST116') {
            console.error('❌ Error checking existing user:', checkError)
          } else if (!existingUser) {
            console.warn('⚠️ User not found in user_buyers table, this should not happen for authenticated users')
            return new Response('User not found in user_buyers table', { status: 400 })
          } else {
            console.log('🔍 Current user details:', {
              userId: existingUser.id,
              email: existingUser.email,
              currentTier: existingUser.tier,
              subscriptionStatus: subscription.status,
              subscriptionId: subscription.id
            })
          }

          // Update tier with retry logic and enhanced logging
          let retryCount = 0
          const maxRetries = 3
          let tierError = null

          while (retryCount < maxRetries) {
            console.log(`🔄 Attempting tier update (${retryCount + 1}/${maxRetries}) for user ${userId}...`)

            const { error, data } = await supabase
              .from('user_buyers')
              .update({ tier: 'pro' })
              .eq('id', userId)
              .select('id, tier')

            if (!error) {
              console.log(`✅ User ${userId} successfully upgraded to Pro tier (attempt ${retryCount + 1})`)
              console.log('✅ Updated user data:', data)
              tierError = null

              // Double-check the update was successful
              const { data: verifyTier, error: verifyError } = await supabase
                .from('user_buyers')
                .select('tier')
                .eq('id', userId)
                .single()

              if (verifyError) {
                console.warn('⚠️ Could not verify tier update:', verifyError)
              } else {
                console.log('✅ Tier update verification - new tier:', verifyTier.tier)
              }
              break
            } else {
              tierError = error
              retryCount++
              console.warn(`⚠️ Failed to update user tier (attempt ${retryCount}/${maxRetries}):`, error)

              if (retryCount < maxRetries) {
                console.log('⏳ Retrying tier update in 2 seconds...')
                await new Promise(resolve => setTimeout(resolve, 2000))
              }
            }
          }

          if (tierError) {
            console.error('❌ Failed to update user tier after all retries:', tierError)
            // Continue processing but log the failure for investigation
          }
        } else {
          console.warn('⚠️ Subscription status is not active or trialing:', subscription.status)
          console.log('ℹ️ Valid statuses for Pro tier: active, trialing')
        }

        console.log(`✅ Checkout completed for subscription: ${subscription.id}`)
        break
      }

      case 'customer.subscription.updated': {
        const subscription = receivedEvent.data.object as Stripe.Subscription
        const userId = subscription.metadata?.user_id || subscription.metadata?.supabase_user_id

        console.log('📝 Processing subscription update:', {
          subscriptionId: subscription.id,
          status: subscription.status,
          current_period_end: subscription.current_period_end,
          userId: userId
        })

        if (!userId) {
          console.error('❌ No user_id in subscription metadata:', subscription.metadata)
          return new Response('Missing user_id', { status: 400 })
        }

        // Update stripe_customers table with safe date handling and enhanced logging
        const updateData = {
          subscription_status: subscription.status,
          current_period_end: subscription.current_period_end
            ? new Date(subscription.current_period_end * 1000).toISOString()
            : null,
          cancel_at_period_end: subscription.cancel_at_period_end,
        }

        console.log('🔄 Updating stripe_customers subscription data:', updateData)

        const { error: updateStripeError } = await supabase
          .from('stripe_customers')
          .update(updateData)
          .eq('stripe_subscription_id', subscription.id)

        if (updateStripeError) {
          console.error('❌ Failed to update stripe_customers:', updateStripeError)
        } else {
          console.log('✅ Stripe customer record updated for subscription:', subscription.id)

          // Verify the update
          const { data: verifyUpdate, error: verifyError } = await supabase
            .from('stripe_customers')
            .select('*')
            .eq('stripe_subscription_id', subscription.id)
            .single()

          if (verifyError) {
            console.warn('⚠️ Could not verify stripe customer update:', verifyError)
          } else {
            console.log('✅ Stripe customer update verification:', verifyUpdate)
          }
        }

        // Update user tier based on subscription status
        let newTier = 'basic' // Default to basic
        if (subscription.status === 'active' || subscription.status === 'trialing') {
          newTier = 'pro'
        }

        const { error: tierError } = await supabase
          .from('user_buyers')
          .update({ tier: newTier })
          .eq('id', userId)

        if (tierError) {
          console.error('Failed to update user tier:', tierError)
        } else {
          console.log(`✅ User ${userId} tier updated to ${newTier}`)
        }

        console.log(`✅ Subscription updated: ${subscription.id}`)
        break
      }

      case 'customer.subscription.deleted': {
        const subscription = receivedEvent.data.object as Stripe.Subscription
        const userId = subscription.metadata?.user_id || subscription.metadata?.supabase_user_id

        if (!userId) {
          console.error('No user_id in subscription metadata')
          return new Response('Missing user_id', { status: 400 })
        }

        // Update stripe_customers table
        await supabase
          .from('stripe_customers')
          .update({
            subscription_status: 'canceled',
            cancel_at_period_end: false,
          })
          .eq('stripe_subscription_id', subscription.id)

        // Downgrade user to basic tier
        const { error: tierError } = await supabase
          .from('user_buyers')
          .update({ tier: 'basic' })
          .eq('id', userId)

        if (tierError) {
          console.error('Failed to downgrade user tier:', tierError)
        } else {
          console.log(`✅ User ${userId} downgraded to basic tier`)
        }

        console.log(`✅ Subscription canceled: ${subscription.id}`)
        break
      }

      case 'invoice.payment_succeeded':
      case 'invoice_payment.paid': {
        const invoice = receivedEvent.data.object as Stripe.Invoice

        console.log('💳 Processing invoice payment event:', {
          eventType: receivedEvent.type,
          invoiceId: invoice.id,
          subscriptionId: invoice.subscription,
          amountPaid: invoice.amount_paid,
          status: invoice.status
        })

        if (!invoice.subscription) {
          console.warn('⚠️ Invoice has no subscription, skipping tier update')
          break
        }

        const subscription = await stripe.subscriptions.retrieve(
          invoice.subscription as string
        )
        const userId = subscription.metadata?.user_id || subscription.metadata?.supabase_user_id

        console.log('🔍 Invoice payment - subscription details:', {
          subscriptionId: subscription.id,
          status: subscription.status,
          userId: userId,
          customerEmail: subscription.customer,
          metadata: subscription.metadata
        })

        if (userId && invoice.status === 'paid') {
          // Update stripe_customers table
          const stripeCustomerData = {
            user_id: userId,
            stripe_customer_id: subscription.customer as string,
            stripe_subscription_id: subscription.id,
            subscription_status: subscription.status,
            current_period_end: subscription.current_period_end
              ? new Date(subscription.current_period_end * 1000).toISOString()
              : null,
            cancel_at_period_end: subscription.cancel_at_period_end,
          }

          console.log('🔄 Updating stripe_customers from invoice payment:', stripeCustomerData)

          const { error: stripeCustomerError } = await supabase
            .from('stripe_customers')
            .upsert(stripeCustomerData)

          if (stripeCustomerError) {
            console.error('❌ Failed to update stripe_customers from invoice:', stripeCustomerError)
          }

          // Ensure user has Pro tier when payment succeeds
          const { error: tierError } = await supabase
            .from('user_buyers')
            .update({ tier: 'pro' })
            .eq('id', userId)

          if (!tierError) {
            console.log(`✅ Invoice payment processed - User ${userId} tier updated to Pro`)
          } else {
            console.error(`❌ Failed to update user tier from invoice payment:`, tierError)
          }
        } else {
          if (!userId) {
            console.error('❌ No userId found in subscription metadata for invoice payment')
          }
          if (invoice.status !== 'paid') {
            console.warn(`⚠️ Invoice status is ${invoice.status}, not updating tier`)
          }
        }
        break
      }

      case 'invoice.payment_failed': {
        const invoice = receivedEvent.data.object as Stripe.Invoice
        const subscription = await stripe.subscriptions.retrieve(
          invoice.subscription as string
        )
        const userId = subscription.metadata?.user_id || subscription.metadata?.supabase_user_id

        if (userId) {
          console.warn(`⚠️ Payment failed for user ${userId}`)
          // Note: We don't immediately downgrade on payment failure
          // Stripe will retry and eventually cancel the subscription if payment continues to fail
        }
        break
      }

      default:
        console.log(`🤷‍♀️ Unhandled event type: ${receivedEvent.type}`)
    }
  } catch (error) {
    console.error(`❌ Error processing webhook: ${error.message}`)
    return new Response(
      JSON.stringify({ error: `Webhook handler failed: ${error.message}` }),
      { status: 400 }
    )
  }

  // RECORD EVENT: Mark event as successfully processed
  try {
    console.log('📝 Recording successfully processed event:', receivedEvent.id)

    const { error: recordError } = await supabase
      .from('webhook_events')
      .insert({
        stripe_event_id: receivedEvent.id,
        processed_at: new Date().toISOString()
      })

    if (recordError) {
      console.error('⚠️ Failed to record event (non-critical):', {
        error: recordError,
        eventId: receivedEvent.id,
        eventType: receivedEvent.type
      })
      // Don't fail webhook - event was processed successfully
      // Recording is for idempotency protection on future retries
    } else {
      console.log('✅ Event recorded successfully:', receivedEvent.id)
    }
  } catch (recordException) {
    console.error('⚠️ Exception recording event (non-critical):', recordException)
    // Don't fail webhook - event was processed successfully
  }

  return new Response(JSON.stringify({ received: true }), { status: 200 })
}

// Serve the handler with explicit configuration to bypass auth middleware
// This is critical for webhooks which don't use JWT authentication
// Using Deno.serve to support auth configuration
Deno.serve(async (req) => {
  try {
    return await handler(req)
  } catch (error) {
    console.error('🚨 Webhook handler error:', error)
    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        message: error.message
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    )
  }
})