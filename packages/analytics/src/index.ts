export const AUTH_EVENT_NAMES = {
  signup: {
    viewed: 'signup_viewed',
    attempted: 'signup_attempted',
    completed: 'signup_completed',
    failed: 'signup_failed',
  },
  signin: {
    viewed: 'signin_viewed',
    attempted: 'signin_attempted',
    completed: 'signin_completed',
    failed: 'signin_failed',
  },
  creatorProfileCompleted: 'creator_profile_completed',
} as const;

export type AuthFlow = keyof Pick<typeof AUTH_EVENT_NAMES, 'signup' | 'signin'>;
export type AuthStage = keyof (typeof AUTH_EVENT_NAMES)['signup'];
export type AuthMethod = 'email' | 'google';
export type AccountType = 'buyer' | 'creator';
export const AUTH_FAILURE_REASONS = [
  'validation_required_fields',
  'validation_password_mismatch',
  'validation_password_length',
  'email_not_confirmed',
  'profile_not_found',
  'profile_lookup_failed', // three-state lookup returned 'error' (timeout / query failure)
  'duplicate_email', // signup for an email that already has an account (internal only; UI copy is generic)
  'profile_creation_failed',
  'oauth_start_failed',
  'oauth_session_failed',
  'oauth_callback_failed',
  'auth_rejected',
  'other',
] as const;
export type AuthFailureReason = (typeof AUTH_FAILURE_REASONS)[number];

export interface AuthEventParams {
  method: AuthMethod;
  account_type: AccountType;
  failure_reason?: AuthFailureReason;
  role?: string;
}

export const getAuthEventName = (flow: AuthFlow, stage: AuthStage): string =>
  AUTH_EVENT_NAMES[flow][stage];

export const normalizeFailureReason = (reason?: string): AuthFailureReason | undefined => {
  if (!reason) return undefined;
  return (AUTH_FAILURE_REASONS as readonly string[]).includes(reason)
    ? (reason as AuthFailureReason)
    : 'other';
};

export const ANALYTICS_EVENT_NAMES = {
  ...AUTH_EVENT_NAMES,
  emailLandingEngaged: 'email_landing_engaged',
  audiencePathSelected: 'audience_path_selected',
  featurePromoSelected: 'feature_promo_selected',
  trialCtaClicked: 'trial_cta_clicked',
  signupCtaClicked: 'signup_cta_clicked',
  signinCtaClicked: 'signin_cta_clicked',
  creatorInquiryStarted: 'creator_inquiry_started',
  creatorInquirySubmitted: 'creator_inquiry_submitted',
  creatorInquiryFailed: 'creator_inquiry_failed',
  interestSubmitted: 'interest_submitted',
  introductionRequested: 'introduction_requested',
  introductionCompleted: 'introduction_completed',
  checkoutStarted: 'checkout_started',
  subscriptionStarted: 'subscription_started',
  titleSearchSubmitted: 'title_search_submitted',
  titleDetailViewed: 'title_detail_viewed',
  chatMessageSent: 'chat_message_sent',
  compsSearchSubmitted: 'comps_search_submitted',
  mandateSearchSubmitted: 'mandate_search_submitted',
  favoriteAdded: 'favorite_added',
  favoriteRemoved: 'favorite_removed',
  pitchDeckOpened: 'pitch_deck_opened',
  pitchDeckPageViewed: 'pitch_deck_page_viewed',
  titleDraftCreated: 'title_draft_created',
  titleSubmitted: 'title_submitted',
  titleApproved: 'title_approved',
  titlePublished: 'title_published',
} as const;

export type CreatorTitleEntryMethod = 'full' | 'quick_add';

const SAFE_ANALYTICS_PARAM_KEYS = new Set([
  'access_type',
  'account_type',
  'action',
  'app_section',
  'billing_period',
  'button_name',
  'campaign_medium',
  'campaign_name',
  'campaign_source',
  'chat_mode',
  'click_source',
  'contact_source',
  'content_format',
  'conversion_category',
  'conversion_intent',
  'cta_position',
  'cta_type',
  'currency',
  'current_tier',
  'depth_percentage',
  'document_type',
  'draft_id',
  'engagement_action',
  'engagement_method',
  'entry_method',
  'error_code',
  'error_location',
  'error_type',
  'event_action',
  'event_category',
  'event_value',
  'failure_reason',
  'feature_name',
  'field_name',
  'filter_count',
  'filter_type',
  'format_type',
  'from_tab',
  'has_pitch',
  'has_results',
  'input_count',
  'input_method',
  'input_type',
  'is_upgrade',
  'landing_path',
  'last_tool_used',
  'link_type',
  'location',
  'match_score',
  'max_page_reached',
  'message_count',
  'message_length_bucket',
  'message_position',
  'method',
  'milestone_seconds',
  'modal_name',
  'page_location',
  'page_number',
  'page_path',
  'pages_viewed',
  'plan_type',
  'popup_action',
  'position',
  'post_id',
  'potential_value',
  'processing_phase',
  'processing_time_ms',
  'provider',
  'query_length',
  'rank',
  'remaining_trials',
  'required_tier',
  'result_count',
  'role',
  'search_count',
  'search_type',
  'searches_used',
  'section_name',
  'selected_tier',
  'source',
  'source_tool',
  'stage',
  'status_code',
  'step_name',
  'step_number',
  'step_reached',
  'success',
  'target_tier',
  'tier',
  'time_on_page_ms',
  'time_viewing_ms',
  'title_id',
  'to_tab',
  'tool',
  'total_time_ms',
  'traffic_type',
  'trial_tool',
  'trigger',
  'upgrade_source',
  'user_state',
  'user_tier',
  'user_type',
  'value',
  'view_duration',
  'view_duration_seconds',
  'zoom_level',
]);

const ANALYTICS_PATH_KEYS = new Set(['landing_path', 'page_path']);
const ANALYTICS_UUID_KEYS = new Set(['draft_id', 'post_id', 'title_id']);
const STABLE_ID_PATTERN = /^[a-z0-9][a-z0-9._-]{0,99}$/i;
const CONTROLLED_VALUE_PATTERN = /^[a-z0-9][a-z0-9._-]{0,99}$/i;
const EMAIL_PATTERN = /(^|[^a-z0-9._%+-])[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}([^a-z0-9.-]|$)/i;

const pathContainsSensitiveText = (value: string): boolean => {
  try {
    const decoded = decodeURIComponent(value);
    return decoded.includes('@') || EMAIL_PATTERN.test(decoded);
  } catch {
    return true;
  }
};

const sanitizedPath = (value: string): string | null => {
  const path = value.split(/[?#]/, 1)[0];
  if (!path.startsWith('/') || path.length > 300 || pathContainsSensitiveText(path)) return null;
  return path;
};

const sanitizedPageLocation = (eventName: string, value: string): string | null => {
  if (eventName !== 'page_view') return null;
  try {
    const parsed = new URL(value);
    if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') return null;
    const location = `${parsed.origin}${parsed.pathname}`;
    return location.length <= 300 && !pathContainsSensitiveText(parsed.pathname) ? location : null;
  } catch {
    return null;
  }
};

/**
 * Fail-closed GA parameter boundary shared by every client app.
 *
 * Only known, low-risk primitives survive. Free text, names, queries, raw
 * errors, arbitrary URLs, timestamps, session/subscription IDs, arrays,
 * objects, and future unknown keys are dropped rather than silently collected.
 */
export const sanitizeAnalyticsEventParams = (
  eventName: string,
  params: Record<string, unknown>
): Record<string, string | number | boolean> => {
  const sanitized: Record<string, string | number | boolean> = {};

  for (const [key, value] of Object.entries(params)) {
    if (!SAFE_ANALYTICS_PARAM_KEYS.has(key) || value === null || value === undefined) continue;

    if (typeof value === 'number') {
      if (Number.isFinite(value)) sanitized[key] = value;
      continue;
    }
    if (typeof value === 'boolean') {
      sanitized[key] = value;
      continue;
    }
    if (typeof value !== 'string') continue;

    if (key === 'page_location') {
      const location = sanitizedPageLocation(eventName, value);
      if (location) sanitized[key] = location;
      continue;
    }
    if (EMAIL_PATTERN.test(value)) continue;
    if (ANALYTICS_PATH_KEYS.has(key)) {
      const path = sanitizedPath(value);
      if (path) sanitized[key] = path;
      continue;
    }
    if (ANALYTICS_UUID_KEYS.has(key)) {
      if (STABLE_ID_PATTERN.test(value)) sanitized[key] = value;
      continue;
    }
    if (key === 'currency') {
      if (/^[A-Z]{3}$/.test(value)) sanitized[key] = value;
      continue;
    }
    if (CONTROLLED_VALUE_PATTERN.test(value)) sanitized[key] = value;
  }

  return sanitized;
};
