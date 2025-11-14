/**
 * Stripe Configuration Helper
 *
 * Detects environment from request origin and returns appropriate Stripe configuration.
 * Supports: localhost (test), staging (test), production (live)
 *
 * Usage:
 *   const stripeConfig = getStripeConfig(req)
 *   const stripe = new Stripe(stripeConfig.secretKey, { ... })
 */

export interface StripeConfig {
  environment: 'test' | 'production'
  isProduction: boolean
  isStaging: boolean
  isLocalhost: boolean
  secretKey: string | undefined
  webhookSecret: string | undefined
  priceIds: {
    packaging_monthly: string | undefined
    packaging_yearly: string | undefined
    premium_monthly: string | undefined
    premium_yearly: string | undefined
  }
}

/**
 * Detects environment from request origin and returns appropriate Stripe configuration
 */
export function getStripeConfig(request: Request): StripeConfig {
  const origin = request.headers.get('origin') || ''

  // Determine environment based on origin
  const isProduction = origin.includes('creator.kstorybridge.com') &&
                      !origin.includes('staging')
  const isStaging = origin.includes('creator-staging.kstorybridge.com')
  const isLocalhost = origin.includes('localhost') || origin.includes('127.0.0.1')

  // Use test mode for staging and localhost, live mode for production
  const environment = isProduction ? 'production' : 'test'

  // Get appropriate secrets based on environment
  const secretKey = isProduction
    ? Deno.env.get('STRIPE_SECRET_KEY_LIVE')
    : Deno.env.get('STRIPE_SECRET_KEY_TEST')

  const webhookSecret = isProduction
    ? Deno.env.get('STRIPE_WEBHOOK_SECRET_LIVE')
    : Deno.env.get('STRIPE_WEBHOOK_SECRET_TEST')

  // Get appropriate price IDs based on environment
  const priceIds = isProduction ? {
    packaging_monthly: Deno.env.get('STRIPE_PRICE_PACKAGING_MONTHLY_LIVE'),
    packaging_yearly: Deno.env.get('STRIPE_PRICE_PACKAGING_YEARLY_LIVE'),
    premium_monthly: Deno.env.get('STRIPE_PRICE_PREMIUM_MONTHLY_LIVE'),
    premium_yearly: Deno.env.get('STRIPE_PRICE_PREMIUM_YEARLY_LIVE'),
  } : {
    packaging_monthly: Deno.env.get('STRIPE_PRICE_PACKAGING_MONTHLY_TEST'),
    packaging_yearly: Deno.env.get('STRIPE_PRICE_PACKAGING_YEARLY_TEST'),
    premium_monthly: Deno.env.get('STRIPE_PRICE_PREMIUM_MONTHLY_TEST'),
    premium_yearly: Deno.env.get('STRIPE_PRICE_PREMIUM_YEARLY_TEST'),
  }

  // Log configuration for debugging
  console.log('🔧 Stripe Configuration:', {
    origin,
    environment,
    isProduction,
    isStaging,
    isLocalhost,
    hasSecretKey: !!secretKey,
    hasWebhookSecret: !!webhookSecret,
    priceIdsConfigured: Object.values(priceIds).every(id => !!id)
  })

  return {
    environment,
    isProduction,
    isStaging,
    isLocalhost,
    secretKey,
    webhookSecret,
    priceIds
  }
}
