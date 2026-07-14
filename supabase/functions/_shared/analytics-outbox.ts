export type AnalyticsAccountType = 'buyer' | 'creator'
export type AnalyticsTrafficType = 'external' | 'internal'
export type AnalyticsBillingPeriod = 'monthly' | 'yearly'

export interface SubscriptionStartedInput {
  stripeSubscriptionId: string
  userId: string
  accountType: AnalyticsAccountType
  trafficType: AnalyticsTrafficType
  planType: 'pro' | 'suite' | 'packaging' | 'premium'
  billingPeriod: AnalyticsBillingPeriod
  currency: string
  value: number
  occurredAt: string
}

interface SupabaseRpcClient {
  rpc: (name: string, params: Record<string, unknown>) => PromiseLike<{
    data: unknown
    error: { message?: string } | null
  }>
  auth: {
    admin: {
      getUserById: (userId: string) => Promise<{
        data: { user: { app_metadata?: Record<string, unknown> } | null }
        error: { message?: string } | null
      }>
    }
  }
}

export function billingPeriodFromStripeInterval(interval?: string | null): AnalyticsBillingPeriod {
  return interval === 'year' ? 'yearly' : 'monthly'
}

export function subscriptionValueFromUnitAmount(unitAmount?: number | null): number {
  return typeof unitAmount === 'number' && unitAmount >= 0 ? unitAmount / 100 : 0
}

export async function getAnalyticsTrafficType(
  supabase: SupabaseRpcClient,
  userId: string
): Promise<AnalyticsTrafficType> {
  const { data, error } = await supabase.auth.admin.getUserById(userId)
  if (error || !data.user) {
    throw new Error('analytics_traffic_lookup_failed')
  }
  return data.user.app_metadata?.internal_traffic === true ? 'internal' : 'external'
}

export async function enqueueSubscriptionStarted(
  supabase: SupabaseRpcClient,
  input: SubscriptionStartedInput
): Promise<string> {
  const { data, error } = await supabase.rpc('enqueue_subscription_started', {
    p_dedupe_key: `subscription_started:${input.accountType}:${input.stripeSubscriptionId}`,
    p_user_id: input.userId,
    p_account_type: input.accountType,
    p_traffic_type: input.trafficType,
    p_plan_type: input.planType,
    p_billing_period: input.billingPeriod,
    p_currency: input.currency.toUpperCase(),
    p_value: input.value,
    p_occurred_at: input.occurredAt,
  })

  if (error || typeof data !== 'string') {
    throw new Error('analytics_outbox_enqueue_failed')
  }
  return data
}
