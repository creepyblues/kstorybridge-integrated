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

export interface TitleWorkflowOutcomesInput {
  draftId: string
  titleId: string
  creatorId: string
  trafficType: AnalyticsTrafficType
  occurredAt: string
}

export interface TitleWorkflowOutboxIds {
  approvedOutboxId: string
  publishedOutboxId: string
}

export type TitleWorkflowOutcomeForCreatorInput = Omit<TitleWorkflowOutcomesInput, 'trafficType'>

export interface AnalyticsOutboxClient {
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
  supabase: AnalyticsOutboxClient,
  userId: string
): Promise<AnalyticsTrafficType> {
  const { data, error } = await supabase.auth.admin.getUserById(userId)
  if (error || !data.user) {
    throw new Error('analytics_traffic_lookup_failed')
  }
  return data.user.app_metadata?.internal_traffic === true ? 'internal' : 'external'
}

export async function enqueueSubscriptionStarted(
  supabase: AnalyticsOutboxClient,
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

export async function enqueueTitleWorkflowOutcomes(
  supabase: AnalyticsOutboxClient,
  input: TitleWorkflowOutcomesInput
): Promise<TitleWorkflowOutboxIds> {
  const { data, error } = await supabase.rpc('enqueue_title_workflow_outcomes', {
    p_draft_id: input.draftId,
    p_title_id: input.titleId,
    p_creator_id: input.creatorId,
    p_traffic_type: input.trafficType,
    p_occurred_at: input.occurredAt,
  })
  const row = Array.isArray(data) ? data[0] : null

  if (error ||
      typeof row?.approved_outbox_id !== 'string' ||
      typeof row?.published_outbox_id !== 'string') {
    throw new Error('analytics_title_workflow_enqueue_failed')
  }
  return {
    approvedOutboxId: row.approved_outbox_id,
    publishedOutboxId: row.published_outbox_id,
  }
}

export async function enqueueTitleWorkflowOutcomesForCreator(
  supabase: AnalyticsOutboxClient,
  input: TitleWorkflowOutcomeForCreatorInput
): Promise<TitleWorkflowOutboxIds> {
  const trafficType = await getAnalyticsTrafficType(supabase, input.creatorId)
  return enqueueTitleWorkflowOutcomes(supabase, { ...input, trafficType })
}
