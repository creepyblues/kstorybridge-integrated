export const TRIAL_FUNNEL_EVENTS = [
  'trial_page_view',
  'trial_tool_selected',
  'trial_comps_search',
  'trial_mandate_search',
  'trial_chat_message_sent',
  'trial_search_completed',
  'trial_limit_reached',
  'trial_signup_cta_clicked',
] as const

export const AUTHENTICATED_BUYER_ENGAGEMENT_EVENTS = [
  'title_search_submitted',
  'title_detail_viewed',
  'chat_message_sent',
  'comps_search_submitted',
  'mandate_search_submitted',
  'favorite_added',
  'favorite_removed',
  'pitch_deck_opened',
  'pitch_deck_page_viewed',
] as const

export const COMMERCIAL_OUTCOME_EVENTS = [
  'checkout_started',
  'subscription_started',
] as const

export const SCHEDULED_REPORT_EVENTS = [
  'first_visit',
  'email_landing_engaged',
  ...TRIAL_FUNNEL_EVENTS,
  'signup_completed',
  'signin_completed',
  ...AUTHENTICATED_BUYER_ENGAGEMENT_EVENTS,
  ...COMMERCIAL_OUTCOME_EVENTS,
] as const

export const AUTHENTICATED_BUYER_ENGAGEMENT_LABELS: Record<
  (typeof AUTHENTICATED_BUYER_ENGAGEMENT_EVENTS)[number],
  string
> = {
  title_search_submitted: 'Title search submitted',
  title_detail_viewed: 'Title detail viewed',
  chat_message_sent: 'Chat message sent',
  comps_search_submitted: 'Comps search submitted',
  mandate_search_submitted: 'Mandate search submitted',
  favorite_added: 'Favorite added',
  favorite_removed: 'Favorite removed',
  pitch_deck_opened: 'Pitch deck opened',
  pitch_deck_page_viewed: 'Pitch deck page viewed',
}

export interface AnalyticsEventMetric {
  eventCount: number
  totalUsers: number
}

export interface AnalyticsReportEventRow extends AnalyticsEventMetric {
  eventName: (typeof AUTHENTICATED_BUYER_ENGAGEMENT_EVENTS)[number]
  label: string
}

export function authenticatedBuyerEngagementRows(
  metrics: Record<string, AnalyticsEventMetric>
): AnalyticsReportEventRow[] {
  return AUTHENTICATED_BUYER_ENGAGEMENT_EVENTS.map(eventName => ({
    eventName,
    label: AUTHENTICATED_BUYER_ENGAGEMENT_LABELS[eventName],
    ...(metrics[eventName] || { eventCount: 0, totalUsers: 0 }),
  }))
}
