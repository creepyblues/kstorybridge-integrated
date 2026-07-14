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
