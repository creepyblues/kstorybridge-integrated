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

    // Initialize Stripe with environment-based configuration
    const stripeConfig = getStripeConfig(req)
    console.log('📊 Fetching billing history for creator:', {
      email: user.email,
      environment: stripeConfig.environment
    })

    const stripe = new Stripe(stripeConfig.secretKey || '', {
      apiVersion: '2024-06-20',
    })

    // Get creator's Stripe customer ID
    const { data: customerData, error: customerError } = await supabase
      .from('creator_stripe_customers')
      .select('stripe_customer_id')
      .eq('creator_email', user.email)
      .single()

    if (customerError || !customerData) {
      console.log('⚠️ No Stripe customer found for creator:', user.email)
      // Return empty data - creator hasn't subscribed yet
      return new Response(
        JSON.stringify({
          subscriptions: [],
          transactions: [],
          paymentMethod: null,
        }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    const stripeCustomerId = customerData.stripe_customer_id

    // Fetch active subscriptions from database with title details
    const { data: subscriptions, error: subscriptionsError } = await supabase
      .from('creator_subscriptions')
      .select(`
        *,
        titles:title_id (
          title_id,
          title_name_kr,
          title_name_en,
          title_image
        )
      `)
      .eq('creator_email', user.email)
      .order('created_at', { ascending: false })

    if (subscriptionsError) {
      console.error('❌ Error fetching subscriptions:', subscriptionsError)
      throw new Error(`Database error: ${subscriptionsError.message}`)
    }

    console.log(`✅ Found ${subscriptions?.length || 0} subscriptions`)

    // Fetch transaction history from Stripe invoices
    let transactions: any[] = []
    try {
      const invoices = await stripe.invoices.list({
        customer: stripeCustomerId,
        limit: 100, // Get last 100 invoices
      })

      transactions = invoices.data.map(invoice => ({
        id: invoice.id,
        date: new Date(invoice.created * 1000).toISOString(),
        amount: invoice.amount_paid / 100, // Convert cents to dollars
        currency: invoice.currency,
        status: invoice.status,
        invoiceUrl: invoice.hosted_invoice_url,
        receiptUrl: invoice.invoice_pdf,
        subscriptionId: invoice.subscription,
        description: invoice.description || `Payment for subscription`,
        paid: invoice.paid,
      }))

      console.log(`✅ Found ${transactions.length} transactions`)
    } catch (stripeError) {
      console.error('⚠️ Error fetching invoices from Stripe:', stripeError)
      // Continue with empty transactions - non-critical
    }

    // Alternatively, fetch transactions from creator_payments table (if using database)
    // This is useful for faster queries without hitting Stripe API
    const { data: dbTransactions, error: dbTransactionsError } = await supabase
      .from('creator_payments')
      .select('*')
      .eq('creator_email', user.email)
      .order('created_at', { ascending: false })
      .limit(100)

    if (!dbTransactionsError && dbTransactions && dbTransactions.length > 0) {
      // Use database transactions if available
      console.log(`✅ Found ${dbTransactions.length} transactions in database`)
      // Merge or prefer database transactions (they're already in the right format)
      transactions = dbTransactions.map(payment => ({
        id: payment.stripe_invoice_id || payment.stripe_payment_intent_id,
        date: payment.created_at,
        amount: payment.amount,
        currency: payment.currency,
        status: payment.status,
        invoiceUrl: payment.invoice_url,
        receiptUrl: payment.receipt_url,
        subscriptionId: payment.subscription_id,
        description: payment.description || `Payment for subscription`,
        paid: payment.status === 'succeeded',
      }))
    }

    // Fetch payment method from Stripe
    let paymentMethod: any = null
    try {
      const customer = await stripe.customers.retrieve(stripeCustomerId, {
        expand: ['invoice_settings.default_payment_method'],
      })

      if (customer.deleted) {
        console.warn('⚠️ Customer has been deleted')
      } else if (customer.invoice_settings?.default_payment_method) {
        const pm = customer.invoice_settings.default_payment_method

        if (typeof pm !== 'string') {
          // Expanded payment method object
          paymentMethod = {
            id: pm.id,
            type: pm.type,
            card: pm.card ? {
              brand: pm.card.brand,
              last4: pm.card.last4,
              expMonth: pm.card.exp_month,
              expYear: pm.card.exp_year,
            } : null,
          }
        }
      }

      console.log('✅ Payment method fetched:', paymentMethod ? 'Available' : 'Not set')
    } catch (stripeError) {
      console.error('⚠️ Error fetching payment method:', stripeError)
      // Continue without payment method - non-critical
    }

    // Return combined billing data
    return new Response(
      JSON.stringify({
        subscriptions: subscriptions || [],
        transactions: transactions,
        paymentMethod: paymentMethod,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  } catch (error) {
    console.error('❌ Error fetching billing history:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})
