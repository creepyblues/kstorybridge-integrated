import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Stripe from 'https://esm.sh/stripe@14.21.0'

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
  apiVersion: '2024-06-20',
})

const cryptoProvider = Stripe.createSubtleCryptoProvider()

serve(async (request) => {
  const signature = request.headers.get('Stripe-Signature')
  const body = await request.text()

  let receivedEvent
  try {
    receivedEvent = await stripe.webhooks.constructEventAsync(
      body,
      signature!,
      Deno.env.get('STRIPE_WEBHOOK_SECRET')!,
      undefined,
      cryptoProvider
    )
  } catch (err) {
    console.error(`Webhook signature verification failed: ${err.message}`)
    return new Response(`Webhook signature verification failed`, { status: 400 })
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  )

  console.log(`🔔 Event received: ${receivedEvent.type}`)

  try {
    switch (receivedEvent.type) {
      case 'checkout.session.completed': {
        const session = receivedEvent.data.object as Stripe.Checkout.Session
        
        // Retrieve the subscription
        const subscription = await stripe.subscriptions.retrieve(
          session.subscription as string
        )

        // Create subscription record
        await supabase.from('subscriptions').upsert({
          user_id: session.metadata?.user_id,
          stripe_subscription_id: subscription.id,
          stripe_customer_id: subscription.customer as string,
          plan_type: session.metadata?.plan_type,
          status: subscription.status,
          current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
          current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
          trial_start: subscription.trial_start 
            ? new Date(subscription.trial_start * 1000).toISOString() 
            : null,
          trial_end: subscription.trial_end 
            ? new Date(subscription.trial_end * 1000).toISOString() 
            : null,
        })

        console.log(`✅ Subscription created: ${subscription.id}`)
        break
      }

      case 'customer.subscription.updated': {
        const subscription = receivedEvent.data.object as Stripe.Subscription

        await supabase
          .from('subscriptions')
          .update({
            status: subscription.status,
            current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
            current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
            cancel_at_period_end: subscription.cancel_at_period_end,
            canceled_at: subscription.canceled_at 
              ? new Date(subscription.canceled_at * 1000).toISOString() 
              : null,
          })
          .eq('stripe_subscription_id', subscription.id)

        console.log(`✅ Subscription updated: ${subscription.id}`)
        break
      }

      case 'customer.subscription.deleted': {
        const subscription = receivedEvent.data.object as Stripe.Subscription

        await supabase
          .from('subscriptions')
          .update({
            status: 'canceled',
            canceled_at: new Date().toISOString(),
          })
          .eq('stripe_subscription_id', subscription.id)

        console.log(`✅ Subscription canceled: ${subscription.id}`)
        break
      }

      case 'payment_intent.succeeded': {
        const paymentIntent = receivedEvent.data.object as Stripe.PaymentIntent

        // Find the subscription associated with this payment
        const { data: subscription } = await supabase
          .from('subscriptions')
          .select('id, user_id')
          .eq('stripe_customer_id', paymentIntent.customer as string)
          .single()

        if (subscription) {
          await supabase.from('payments').insert({
            subscription_id: subscription.id,
            user_id: subscription.user_id,
            stripe_payment_intent_id: paymentIntent.id,
            amount_cents: paymentIntent.amount,
            currency: paymentIntent.currency,
            status: paymentIntent.status,
            payment_method_type: paymentIntent.payment_method_types?.[0],
          })
        }

        console.log(`✅ Payment recorded: ${paymentIntent.id}`)
        break
      }

      case 'payment_intent.payment_failed': {
        const paymentIntent = receivedEvent.data.object as Stripe.PaymentIntent

        // Find the subscription associated with this payment
        const { data: subscription } = await supabase
          .from('subscriptions')
          .select('id, user_id')
          .eq('stripe_customer_id', paymentIntent.customer as string)
          .single()

        if (subscription) {
          await supabase.from('payments').insert({
            subscription_id: subscription.id,
            user_id: subscription.user_id,
            stripe_payment_intent_id: paymentIntent.id,
            amount_cents: paymentIntent.amount,
            currency: paymentIntent.currency,
            status: 'failed',
            payment_method_type: paymentIntent.payment_method_types?.[0],
          })
        }

        console.log(`❌ Payment failed: ${paymentIntent.id}`)
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

  return new Response(JSON.stringify({ received: true }), { status: 200 })
})