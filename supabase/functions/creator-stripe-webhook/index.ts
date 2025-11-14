// @ts-ignore
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Stripe from 'https://esm.sh/stripe@14.21.0'
import { getStripeConfig } from '../_shared/stripe-config.ts'

const cryptoProvider = Stripe.createSubtleCryptoProvider()

/**
 * Creator Stripe Webhook Handler
 *
 * Handles webhook events for creator subscriptions.
 * Updates creator_subscriptions table (separate from buyer subscriptions).
 */

// CRITICAL: Configure function to bypass Supabase auth middleware
// Webhooks use signature verification, not JWT tokens
const handler = async (request: Request): Promise<Response> => {
  // Log request for debugging
  console.log('🔍 Creator Webhook request received:', {
    method: request.method,
    url: request.url,
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

  // Get environment-based Stripe configuration
  const stripeConfig = getStripeConfig(request)
  const stripe = new Stripe(stripeConfig.secretKey || '', {
    apiVersion: '2024-06-20',
  })

  const signature = request.headers.get('Stripe-Signature')
  const body = await request.text()

  // Webhook debugging
  const webhookSecret = stripeConfig.webhookSecret

  console.log('📨 Creator Webhook received - DEBUG:', {
    method: request.method,
    environment: stripeConfig.environment,
    isProduction: stripeConfig.isProduction,
    hasSignature: !!signature,
    signatureFormat: signature ? `${signature.substring(0, 20)}...` : 'NONE',
    bodyLength: body.length,
    hasWebhookSecret: !!webhookSecret,
    secretFormat: webhookSecret ? `${webhookSecret.substring(0, 12)}...` : 'NONE',
    timestamp: new Date().toISOString()
  })

  // Check for signature header
  if (!signature) {
    console.error('❌ AUTHENTICATION FAILURE: No Stripe signature header found')
    return new Response('No signature', { status: 400 })
  }

  // Check for webhook secret
  if (!webhookSecret) {
    console.error('❌ CONFIGURATION ERROR: STRIPE_WEBHOOK_SECRET not set')
    return new Response('Webhook secret not configured', { status: 500 })
  }

  let event: Stripe.Event

  try {
    // Verify webhook signature
    event = await stripe.webhooks.constructEventAsync(
      body,
      signature,
      webhookSecret,
      undefined,
      cryptoProvider
    )

    console.log('✅ Webhook signature verified:', {
      eventType: event.type,
      eventId: event.id,
      created: new Date(event.created * 1000).toISOString()
    })
  } catch (err) {
    console.error('❌ Webhook signature verification failed:', err.message)
    console.error('🔍 Verification details:', {
      hasSignature: !!signature,
      hasSecret: !!webhookSecret,
      bodyLength: body.length,
      error: err
    })
    return new Response(`Webhook Error: ${err.message}`, { status: 400 })
  }

  // Initialize Supabase client with service role
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  )

  console.log('🎯 Processing event:', {
    type: event.type,
    id: event.id
  })

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        console.log('💳 Checkout session completed:', {
          sessionId: session.id,
          customerId: session.customer,
          subscriptionId: session.subscription,
          metadata: session.metadata
        })

        // Extract metadata
        const {
          title_id,
          title_name,
          creator_email,
          plan_type,
          billing_period
        } = session.metadata || {}

        if (!title_id || !creator_email || !plan_type) {
          console.error('❌ Missing required metadata in checkout session')
          return new Response('Missing metadata', { status: 400 })
        }

        // Get subscription details from Stripe
        const subscription = await stripe.subscriptions.retrieve(session.subscription as string)

        console.log('📋 Subscription details:', {
          id: subscription.id,
          status: subscription.status,
          currentPeriodStart: new Date(subscription.current_period_start * 1000).toISOString(),
          currentPeriodEnd: new Date(subscription.current_period_end * 1000).toISOString(),
          cancelAtPeriodEnd: subscription.cancel_at_period_end
        })

        // Create subscription record in database
        const { data: subscriptionData, error: subscriptionError } = await supabase
          .from('creator_subscriptions')
          .insert({
            creator_email: creator_email,
            title_id: title_id,
            stripe_subscription_id: subscription.id,
            stripe_customer_id: session.customer as string,
            plan_type: plan_type,
            billing_period: billing_period || 'monthly',
            status: subscription.status,
            current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
            current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
            cancel_at_period_end: subscription.cancel_at_period_end,
          })
          .select()
          .single()

        if (subscriptionError) {
          console.error('❌ Failed to create subscription record:', subscriptionError)
          throw new Error(`Database error: ${subscriptionError.message}`)
        }

        console.log('✅ Subscription record created:', subscriptionData)

        // Update or create customer record
        const { error: customerError } = await supabase
          .from('creator_stripe_customers')
          .upsert({
            creator_email: creator_email,
            stripe_customer_id: session.customer as string,
          }, {
            onConflict: 'creator_email'
          })

        if (customerError) {
          console.error('⚠️ Failed to update customer record:', customerError)
          // Non-critical - continue
        }

        console.log('✅ Checkout session processed successfully')
        break
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription
        console.log('🔄 Subscription updated:', {
          id: subscription.id,
          status: subscription.status,
          cancelAtPeriodEnd: subscription.cancel_at_period_end
        })

        // Update subscription in database
        const { error: updateError } = await supabase
          .from('creator_subscriptions')
          .update({
            status: subscription.status,
            current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
            current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
            cancel_at_period_end: subscription.cancel_at_period_end,
            updated_at: new Date().toISOString(),
          })
          .eq('stripe_subscription_id', subscription.id)

        if (updateError) {
          console.error('❌ Failed to update subscription:', updateError)
          throw new Error(`Database error: ${updateError.message}`)
        }

        console.log('✅ Subscription updated successfully')
        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription
        console.log('❌ Subscription deleted/canceled:', {
          id: subscription.id,
          status: subscription.status
        })

        // Mark subscription as canceled
        const { error: deleteError } = await supabase
          .from('creator_subscriptions')
          .update({
            status: 'canceled',
            cancel_at_period_end: false,
            updated_at: new Date().toISOString(),
          })
          .eq('stripe_subscription_id', subscription.id)

        if (deleteError) {
          console.error('❌ Failed to mark subscription as canceled:', deleteError)
          throw new Error(`Database error: ${deleteError.message}`)
        }

        console.log('✅ Subscription marked as canceled')
        break
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice
        console.log('💰 Payment succeeded:', {
          invoiceId: invoice.id,
          subscriptionId: invoice.subscription,
          amountPaid: invoice.amount_paid,
          currency: invoice.currency
        })

        // Optional: Record payment in creator_payments table
        if (invoice.subscription) {
          // Get subscription to find creator_email
          const { data: subscriptionData } = await supabase
            .from('creator_subscriptions')
            .select('creator_email')
            .eq('stripe_subscription_id', invoice.subscription)
            .single()

          if (subscriptionData) {
            const { error: paymentError } = await supabase
              .from('creator_payments')
              .insert({
                creator_email: subscriptionData.creator_email,
                subscription_id: invoice.subscription as string,
                stripe_payment_intent_id: invoice.payment_intent as string,
                stripe_invoice_id: invoice.id,
                amount: invoice.amount_paid / 100, // Convert cents to dollars
                currency: invoice.currency,
                status: 'succeeded',
                invoice_url: invoice.hosted_invoice_url,
                receipt_url: invoice.invoice_pdf,
                description: invoice.description || `Payment for subscription ${invoice.subscription}`,
              })

            if (paymentError) {
              console.error('⚠️ Failed to record payment (non-critical):', paymentError)
              // Continue - payment succeeded in Stripe
            } else {
              console.log('✅ Payment recorded in database')
            }
          }
        }

        break
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice
        console.log('⚠️ Payment failed:', {
          invoiceId: invoice.id,
          subscriptionId: invoice.subscription,
          attemptCount: invoice.attempt_count
        })

        // Update subscription status to past_due
        if (invoice.subscription) {
          const { error: updateError } = await supabase
            .from('creator_subscriptions')
            .update({
              status: 'past_due',
              updated_at: new Date().toISOString(),
            })
            .eq('stripe_subscription_id', invoice.subscription)

          if (updateError) {
            console.error('❌ Failed to update subscription to past_due:', updateError)
          } else {
            console.log('✅ Subscription marked as past_due')
          }

          // Optional: Record failed payment
          const { data: subscriptionData } = await supabase
            .from('creator_subscriptions')
            .select('creator_email')
            .eq('stripe_subscription_id', invoice.subscription)
            .single()

          if (subscriptionData) {
            const { error: paymentError } = await supabase
              .from('creator_payments')
              .insert({
                creator_email: subscriptionData.creator_email,
                subscription_id: invoice.subscription as string,
                stripe_payment_intent_id: invoice.payment_intent as string,
                stripe_invoice_id: invoice.id,
                amount: invoice.amount_due / 100,
                currency: invoice.currency,
                status: 'failed',
                description: `Failed payment for subscription ${invoice.subscription}`,
              })

            if (paymentError) {
              console.error('⚠️ Failed to record failed payment:', paymentError)
            }
          }
        }

        break
      }

      default:
        console.log(`⚪ Unhandled event type: ${event.type}`)
    }

    return new Response(JSON.stringify({ received: true, eventType: event.type }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('❌ Error processing webhook:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    )
  }
}

serve(handler)
