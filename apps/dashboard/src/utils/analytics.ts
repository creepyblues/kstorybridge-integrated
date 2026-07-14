/**
 * Analytics Utility - GA4 Event Tracking
 *
 * Provides comprehensive event tracking for user journey analytics.
 * Enables data-driven optimization for onboarding, engagement, and paid conversion.
 *
 * @module analytics
 * @see docs/tracking/PHASE_1_ANALYTICS.md
 */

import {
  ANALYTICS_EVENT_NAMES,
  getAuthEventName,
  normalizeFailureReason,
  type AuthFailureReason,
  type AuthMethod,
  type AuthStage,
} from '@kstorybridge/analytics';

// TypeScript type definitions
export type OnboardingAction = 'start' | 'complete' | 'skip';
export type SavedTitleSource = 'chat' | 'search' | 'featured' | 'detail';
export type TitleDetailSource = 'search' | 'chat' | 'comps' | 'saved' | 'featured' | 'direct';
export type FavoriteSource = 'title_detail' | 'title_search' | 'chat' | 'comps' | 'saved_titles';
export type ChatInputType = 'typed' | 'example' | 'suggestion' | 'url_param';
export type MessageLengthBucket = '1_25' | '26_50' | '51_100' | '101_250' | '251_plus';
export type PitchDeckAccessType = 'preview' | 'full';

export interface TrackingEvent {
  event_name: string;
  event_params: Record<string, string | number | boolean>;
}

// Environment-based configuration
const GA_MEASUREMENT_ID = import.meta.env.VITE_GA_MEASUREMENT_ID || '';
const IS_DEV = import.meta.env.DEV;
const PRODUCTION_ANALYTICS_HOSTS = new Set(['dashboard.kstorybridge.com']);
const NON_PRODUCTION_OVERRIDE_KEY = 'ksb_enable_non_production_analytics';

export const isAnalyticsCollectionAllowed = (
  hostname: string,
  allowNonProduction = false
): boolean => PRODUCTION_ANALYTICS_HOSTS.has(hostname.toLowerCase()) || allowNonProduction;

const hasRuntimeAnalyticsOverride = (): boolean => {
  if (typeof window === 'undefined') return false;

  const requested = new URLSearchParams(window.location.search).get('analytics_debug') === '1';
  if (requested) {
    window.sessionStorage.setItem(NON_PRODUCTION_OVERRIDE_KEY, 'true');
  }

  return requested || window.sessionStorage.getItem(NON_PRODUCTION_OVERRIDE_KEY) === 'true';
};

const ALLOW_NON_PRODUCTION_ANALYTICS =
  import.meta.env.VITE_ENABLE_NON_PRODUCTION_ANALYTICS === 'true' || hasRuntimeAnalyticsOverride();
const IS_ANALYTICS_ENABLED =
  !!GA_MEASUREMENT_ID &&
  typeof window !== 'undefined' &&
  isAnalyticsCollectionAllowed(window.location.hostname, ALLOW_NON_PRODUCTION_ANALYTICS);

const isInternalHost = (): boolean =>
  typeof window !== 'undefined' &&
  (/^(localhost|127\.0\.0\.1)$/.test(window.location.hostname) ||
    window.location.hostname.includes('-staging.'));

export const isInternalTrafficMetadata = (
  appMetadata?: Record<string, unknown> | null
): boolean => appMetadata?.internal_traffic === true;

type AnalyticsTrafficType = 'external' | 'internal';
type PendingAnalyticsEvent = { eventName: string; params: Record<string, unknown> };

let analyticsIdentityResolved = false;
let analyticsTrafficType: AnalyticsTrafficType = isInternalHost() ? 'internal' : 'external';
const pendingAnalyticsEvents: PendingAnalyticsEvent[] = [];
const MAX_PENDING_ANALYTICS_EVENTS = 100;

const flushPendingAnalyticsEvents = (): void => {
  if (!IS_ANALYTICS_ENABLED || !analyticsIdentityResolved || typeof window.gtag !== 'function') {
    return;
  }

  for (const event of pendingAnalyticsEvents.splice(0)) {
    window.gtag('event', event.eventName, {
      ...event.params,
      traffic_type: analyticsTrafficType,
    });
  }
};

/**
 * Initialize Google Analytics 4
 * Call this once in your app's entry point (main.tsx)
 */
export const initializeAnalytics = (): void => {
  if (!IS_ANALYTICS_ENABLED) {
    if (IS_DEV) {
      console.log('[Analytics] GA4 disabled for this environment', {
        measurementConfigured: !!GA_MEASUREMENT_ID,
        hostname: typeof window !== 'undefined' ? window.location.hostname : 'server',
        overrideEnabled: ALLOW_NON_PRODUCTION_ANALYTICS,
      });
    }
    return;
  }

  // Load gtag.js script dynamically
  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`;
  document.head.appendChild(script);

  // Initialize gtag - must use 'arguments' object, not spread args
  // This is the standard gtag pattern required by gtag.js
  window.dataLayer = window.dataLayer || [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  window.gtag = function () {
    // eslint-disable-next-line prefer-rest-params
    window.dataLayer.push(arguments);
  };

  window.gtag('js', new Date());
  window.gtag('config', GA_MEASUREMENT_ID, {
    // Route-level tracking sends page views after auth classification.
    send_page_view: false,
    traffic_type: analyticsTrafficType,
  });

  if (IS_DEV) {
    console.log(`[Analytics] GA4 initialized (${GA_MEASUREMENT_ID})`);
  }
};

/**
 * Set authenticated user for GA4 cross-session tracking
 * Call this when user logs in to enable user-level analytics
 *
 * @param userId - Supabase user UUID (not email for privacy)
 * @param userProperties - Optional user properties for segmentation
 *
 * @example
 * setAnalyticsUser(user.id, { tier: 'pro', type: 'buyer' })
 */
export const setAnalyticsUser = (
  userId: string,
  userProperties?: {
    tier?: string;
    type?: string;
    internal?: boolean;
  }
): void => {
  if (!IS_ANALYTICS_ENABLED) {
    if (IS_DEV) {
      console.log('[Analytics] setAnalyticsUser skipped (GA4 not configured)');
    }
    return;
  }

  if (typeof window !== 'undefined' && window.gtag) {
    analyticsTrafficType = userProperties?.internal ? 'internal' : 'external';
    analyticsIdentityResolved = true;

    // The Supabase UUID is non-PII. Internal classification comes from
    // service-role-controlled app_metadata, never from an email in the bundle.
    window.gtag('config', GA_MEASUREMENT_ID, {
      user_id: userId,
      traffic_type: analyticsTrafficType,
    });

    // Set user properties for segmentation in reports
    if (userProperties) {
      window.gtag('set', 'user_properties', {
        user_tier: userProperties.tier || 'unknown',
        user_type: userProperties.type || 'unknown',
      });
    }

    if (IS_DEV) {
      console.log(`[Analytics] User set: ${userId.substring(0, 8)}...`, userProperties);
    }

    flushPendingAnalyticsEvents();
  }
};

/**
 * Clear user identity on sign out
 * Call this when user logs out to reset GA4 user tracking
 */
export const clearAnalyticsUser = (): void => {
  if (!IS_ANALYTICS_ENABLED) {
    return;
  }

  if (typeof window !== 'undefined' && window.gtag) {
    analyticsTrafficType = isInternalHost() ? 'internal' : 'external';
    analyticsIdentityResolved = true;

    window.gtag('config', GA_MEASUREMENT_ID, {
      user_id: undefined,
      traffic_type: analyticsTrafficType,
    });

    if (IS_DEV) {
      console.log('[Analytics] User cleared');
    }

    flushPendingAnalyticsEvents();
  }
};

/**
 * Generic event tracking helper
 */
const trackEvent = (eventName: string, params: Record<string, unknown>): void => {
  // Add app_section to all events for segmentation
  const enrichedParams = {
    ...params,
    app_section: 'dashboard',
  };

  if (IS_DEV) {
    console.log(`[Analytics] ${eventName}`, enrichedParams);
  }

  if (!IS_ANALYTICS_ENABLED) {
    return;
  }

  if (!analyticsIdentityResolved) {
    if (pendingAnalyticsEvents.length < MAX_PENDING_ANALYTICS_EVENTS) {
      pendingAnalyticsEvents.push({ eventName, params: enrichedParams });
    }
    return;
  }

  if (typeof window.gtag === 'function') {
    window.gtag('event', eventName, {
      ...enrichedParams,
      traffic_type: analyticsTrafficType,
    });
  }
};

/**
 * Track onboarding flow steps
 *
 * @param step - Step number (1-4)
 * @param action - Action taken ('start', 'complete', 'skip')
 *
 * @example
 * trackOnboardingStep(1, 'start')  // User started step 1
 * trackOnboardingStep(1, 'complete')  // User completed step 1
 * trackOnboardingStep(2, 'skip')  // User skipped at step 2
 */
export const trackOnboardingStep = (
  step: number,
  action: OnboardingAction
): void => {
  trackEvent('onboarding_step', {
    step_number: step,
    action: action,
    timestamp: new Date().toISOString(),
  });
};

/**
 * Track when users save/favorite titles
 *
 * @param titleId - UUID of the title
 * @param titleName - Name of the title (for easier debugging)
 * @param source - Where the save action originated
 * @param userId - Optional user ID for user-specific tracking
 *
 * @example
 * trackSavedTitle('abc123', 'Sora Eyes', 'chat', 'user-uuid')  // Saved from chat interface
 * trackSavedTitle('def456', 'Devil at Crossroads', 'search')  // Saved from search results
 * trackSavedTitle('ghi789', 'Werewolves', 'featured')  // Saved from featured section
 */
export const trackSavedTitle = (
  titleId: string,
  titleName: string = 'Unknown Title',
  source: SavedTitleSource = 'search',
  userId?: string
): void => {
  const params: Record<string, string> = {
    title_id: titleId,
    title_name: titleName,
    source: source,
    timestamp: new Date().toISOString(),
  };

  if (userId) {
    params.user_id = userId;
  }

  trackEvent('save_title', params);
};

/**
 * Track when users view pitch decks (Pro feature)
 *
 * @param titleId - UUID of the title
 * @param titleName - Name of the title (for easier debugging)
 * @param tier - User's current tier ('basic', 'pro', 'suite')
 * @param duration - Optional: How long the pitch was viewed (seconds)
 *
 * @example
 * trackPitchView('abc123', 'Sora Eyes', 'pro')  // Pro user viewed pitch
 * trackPitchView('def456', 'Devil at Crossroads', 'basic', 45)  // Basic user viewed pitch for 45s
 */
export const trackPitchView = (
  titleId: string,
  titleName: string = 'Unknown Title',
  tier: string = 'basic',
  duration?: number
): void => {
  trackEvent('view_pitch', {
    title_id: titleId,
    title_name: titleName,
    user_tier: tier,
    view_duration: duration || 0, // GTM compatibility (renamed from view_duration_seconds)
    view_duration_seconds: duration || 0, // Keep for backwards compatibility
    timestamp: new Date().toISOString(),
  });
};

/**
 * Track when users click "Contact Creator" button
 * This is a key conversion event
 *
 * @param titleId - UUID of the title
 * @param titleName - Name of the title (for easier debugging)
 * @param tier - User's current tier
 * @param source - Where the click originated ('title_detail', 'favorites', etc.)
 *
 * @example
 * trackContactCreatorClick('abc123', 'Sora Eyes', 'pro', 'title_detail')
 * trackContactCreatorClick('def456', 'Devil at Crossroads', 'suite', 'favorites')
 */
export const trackContactCreatorClick = (
  titleId: string,
  titleName: string = 'Unknown Title',
  tier: string = 'basic',
  source: string = 'title_detail'
): void => {
  trackEvent('contact_creator_click', {
    title_id: titleId,
    title_name: titleName,
    user_tier: tier,
    click_source: source,
    contact_source: source, // GTM compatibility (alias for click_source)
    timestamp: new Date().toISOString(),
  });
};

/**
 * Track when users click upgrade/pricing buttons
 * Critical for measuring paid conversion funnel
 *
 * @param source - Where the click originated ('favorites', 'title_detail', 'chat', 'pricing_page')
 * @param featureName - Feature being promoted ('contact_creator', 'pitch_access', 'advanced_chat', 'plan_selection')
 * @param currentTier - User's current tier
 *
 * @example
 * trackUpgradeButtonClick('favorites', 'contact_creator', 'basic')
 * trackUpgradeButtonClick('chat', 'advanced_chat', 'basic')
 * trackUpgradeButtonClick('pricing_page', 'plan_selection', 'basic')
 */
export const trackUpgradeButtonClick = (
  source: string,
  featureName: string,
  currentTier: string
): void => {
  trackEvent('upgrade_button_click', {
    click_source: source,
    feature_name: featureName,
    current_tier: currentTier,
    timestamp: new Date().toISOString(),
  });
};

/**
 * Track page views
 * Automatically called by GA4, but can be manually triggered for SPA route changes
 *
 * @param pagePath - Path of the page (e.g., '/buyers/chat')
 * @param pageTitle - Optional page title
 */
export const trackPageView = (
  pagePath: string,
  pageTitle?: string
): void => {
  trackEvent('page_view', {
    page_path: pagePath,
    page_title: pageTitle || document.title,
    timestamp: new Date().toISOString(),
  });
};

/**
 * Track custom conversion events
 *
 * @param eventName - Name of the conversion event
 * @param value - Optional monetary value
 * @param currency - Optional currency code (default: 'USD')
 */
export const trackConversion = (
  eventName: string,
  value?: number,
  currency: string = 'USD'
): void => {
  const params: Record<string, unknown> = {
    timestamp: new Date().toISOString(),
  };

  if (value !== undefined) {
    params.value = value;
    params.currency = currency;
  }

  trackEvent(eventName, params);
};

/**
 * Track premium feature requests
 * Used when users request access to premium features (pitch deck, contact creator, etc.)
 *
 * @param featureName - Name of the premium feature requested
 *
 * @example
 * trackPremiumFeatureRequest('Pitch Deck Access')
 * trackPremiumFeatureRequest('Contact Creator')
 */
export const trackPremiumFeatureRequest = (featureName: string): void => {
  trackEvent('premium_feature_request', {
    feature_name: featureName,
    timestamp: new Date().toISOString(),
  });
};

/**
 * Track tier upgrade intent
 * Used when users click upgrade buttons or show intent to upgrade
 *
 * @param targetTier - Tier user wants to upgrade to ('pro' or 'suite')
 * @param currentTier - User's current tier
 * @param source - Where the upgrade intent originated
 * @param additionalContext - Additional tracking data
 *
 * @example
 * trackTierUpgrade('pro', 'basic', 'premium_popup', { title_id: 'abc123' })
 */
export const trackTierUpgrade = (
  targetTier: string,
  currentTier?: string,
  source?: 'premium_popup' | 'pricing_page' | 'profile_page' | 'title_detail',
  additionalContext?: Record<string, unknown>
): void => {
  const conversionValue = targetTier === 'pro' ? 250 : targetTier === 'suite' ? 500 : 0;
  const params: Record<string, unknown> = {
    target_tier: targetTier,
    current_tier: currentTier || 'unknown',
    upgrade_source: source || 'unknown',
    conversion_category: 'tier_upgrade',
    conversion_value: conversionValue,
    potential_value: conversionValue, // GTM compatibility (alias for conversion_value)
    timestamp: new Date().toISOString(),
    ...additionalContext,
  };

  trackEvent('tier_upgrade_intent', params);

  if (IS_DEV) {
    console.log(`📈 TIER UPGRADE INTENT: ${currentTier} → ${targetTier}`, {
      source,
      value: params.conversion_value,
      context: additionalContext,
    });
  }
};

/**
 * Track premium popup interactions
 * Used to track all interactions with the premium feature popup
 *
 * @param action - Type of interaction ('show', 'upgrade_click', 'close', 'request_submit')
 * @param featureName - Name of the premium feature
 * @param userTier - User's current tier
 * @param additionalContext - Additional tracking data
 *
 * @example
 * trackPremiumPopupInteraction('show', 'Contact Creator', 'basic')
 * trackPremiumPopupInteraction('upgrade_click', 'Pitch Deck Access', 'basic', { title_id: 'abc123' })
 */
export const trackPremiumPopupInteraction = (
  action: 'show' | 'upgrade_click' | 'close' | 'request_submit',
  featureName?: string,
  userTier?: string,
  additionalContext?: Record<string, unknown>
): void => {
  const params: Record<string, unknown> = {
    popup_action: action,
    feature_name: featureName || 'unknown',
    user_tier: userTier || 'unknown',
    conversion_intent: action === 'upgrade_click' ? 'tier_upgrade' : 'feature_request',
    timestamp: new Date().toISOString(),
    ...additionalContext,
  };

  trackEvent('premium_popup_interaction', params);

  if (IS_DEV) {
    console.log(`🎁 PREMIUM POPUP: ${action}`, {
      featureName,
      userTier,
      context: additionalContext,
    });
  }
};

// ============================================================================
// FUNNEL 1: AUTHENTICATION EVENTS
// Tracks: Signup → Signin → First Access
// ============================================================================

/**
 * Track signup events
 * @param stage - Canonical signup funnel stage
 * @param method - 'email' | 'google'
 * @param metadata - Allowlisted, non-PII context
 */
export const trackSignup = (
  stage: AuthStage,
  method: AuthMethod = 'email',
  metadata?: { role?: string; failure_reason?: AuthFailureReason }
): void => {
  trackEvent(getAuthEventName('signup', stage), {
    method,
    account_type: 'buyer',
    ...(metadata?.role ? { role: metadata.role } : {}),
    ...(metadata?.failure_reason
      ? { failure_reason: normalizeFailureReason(metadata.failure_reason) }
      : {}),
  });
};

/**
 * Track signin events
 * @param stage - Canonical signin funnel stage
 * @param method - 'email' | 'google'
 */
export const trackSignin = (
  stage: AuthStage,
  method: AuthMethod = 'email',
  metadata?: { failure_reason?: AuthFailureReason }
): void => {
  trackEvent(getAuthEventName('signin', stage), {
    method,
    account_type: 'buyer',
    ...(metadata?.failure_reason
      ? { failure_reason: normalizeFailureReason(metadata.failure_reason) }
      : {}),
  });
};

// ============================================================================
// FUNNEL 2: TITLE DISCOVERY EVENTS
// Tracks: Browse → Search → View Detail → Save
// ============================================================================

/**
 * Track accepted title search requests without sending the query.
 * @param searchType - 'hybrid' | 'vector' | 'pagination' | 'filter'
 */
export const trackTitleSearch = (
  searchType: 'hybrid' | 'vector' | 'pagination' | 'filter' = 'vector',
  filterCount = 0
): void => {
  trackEvent(ANALYTICS_EVENT_NAMES.titleSearchSubmitted, {
    search_type: searchType,
    filter_count: filterCount,
  });
};

/**
 * Track title detail page views
 * @param titleId - UUID of the title
 * @param source - Where the user came from
 */
export const trackTitleDetailView = (
  titleId: string,
  source: TitleDetailSource = 'direct'
): void => {
  trackEvent(ANALYTICS_EVENT_NAMES.titleDetailViewed, {
    title_id: titleId,
    source,
  });
};

/**
 * Track title detail tab switches
 * @param titleId - UUID of the title
 * @param fromTab - Previous tab
 * @param toTab - New tab
 */
export const trackTitleTabSwitch = (
  titleId: string,
  fromTab: string,
  toTab: string
): void => {
  trackEvent('title_tab_switch', {
    title_id: titleId,
    from_tab: fromTab,
    to_tab: toTab,
    timestamp: new Date().toISOString(),
  });
};

/**
 * Track favorite/unfavorite actions
 * @param action - 'add' | 'remove'
 * @param titleId - UUID of the title
 * @param source - Where the action occurred
 */
export const trackFavorite = (
  action: 'add' | 'remove',
  titleId: string,
  source: FavoriteSource = 'title_detail'
): void => {
  trackEvent(
    action === 'add' ? ANALYTICS_EVENT_NAMES.favoriteAdded : ANALYTICS_EVENT_NAMES.favoriteRemoved,
    {
    title_id: titleId,
    source,
    }
  );
};

// ============================================================================
// FUNNEL 3: AI CHAT EVENTS
// Tracks: Open Chat → Send Message → Click Title → Save
// ============================================================================

/**
 * Track an accepted chat request using a non-identifying length bucket.
 */
export const getMessageLengthBucket = (messageLength: number): MessageLengthBucket => {
  if (messageLength <= 25) return '1_25';
  if (messageLength <= 50) return '26_50';
  if (messageLength <= 100) return '51_100';
  if (messageLength <= 250) return '101_250';
  return '251_plus';
};

export const trackChatMessageSent = (
  inputType: ChatInputType,
  messageLength: number
): void => {
  trackEvent(ANALYTICS_EVENT_NAMES.chatMessageSent, {
    input_type: inputType,
    message_length_bucket: getMessageLengthBucket(messageLength),
  });
};

/**
 * Track chat search events (for GTM compatibility)
 * Fires when user searches within chat context
 * @param query - Search query
 * @param resultCount - Number of results
 * @param chatMode - Current chat mode (discovery, analysis, etc.)
 */
export const trackChatSearch = (
  query: string,
  resultCount: number,
  chatMode?: string
): void => {
  trackEvent('chat_search', {
    search_term: query,
    query_length: query.length,
    result_count: resultCount,
    chat_mode: chatMode || 'discovery',
    app_section: 'chat',
    timestamp: new Date().toISOString(),
  });
};

/**
 * Track chat title recommendation clicks
 * @param titleId - UUID of clicked title
 * @param titleName - Name of the title
 * @param position - Position in recommendation list (1-indexed)
 */
export const trackChatTitleClick = (
  titleId: string,
  titleName: string,
  position: number
): void => {
  trackEvent('chat_title_click', {
    title_id: titleId,
    title_name: titleName,
    position,
    timestamp: new Date().toISOString(),
  });
};

/**
 * Track suggested query clicks
 * @param position - Position in suggestions (1-indexed)
 */
export const trackChatSuggestionClick = (
  position: number
): void => {
  trackEvent('chat_suggestion_click', {
    position,
  });
};

/**
 * Track chat message input source (typed vs example vs suggestion)
 * @param source - How the message was initiated
 * @param messageLength - Length of the message
 */
export const trackChatMessageSource = (
  source: 'typed' | 'example' | 'suggestion' | 'url_param',
  messageLength: number
): void => {
  trackEvent('chat_message_source', {
    source,
    message_length: messageLength,
    timestamp: new Date().toISOString(),
  });
};

/**
 * Track when user clicks an initial example prompt on chat page
 */
export const trackChatExampleClicked = (): void => {
  trackEvent('chat_example_clicked', {});
};

// ============================================================================
// FUNNEL 4: COMPS NAVIGATOR EVENTS
// Tracks: Add Comps → Search → View Results → Click Title
// ============================================================================

/**
 * Track Comps Navigator search
 * Track an accepted comps request without sending comp title names.
 */
export const trackCompsSearch = (
  inputCount: number,
  source: 'comps_navigator' | 'home' | 'trial_conversion' = 'comps_navigator'
): void => {
  trackEvent(ANALYTICS_EVENT_NAMES.compsSearchSubmitted, {
    input_count: inputCount,
    source,
  });
};

/**
 * Track Comps Navigator result clicks
 * @param titleId - UUID of clicked title
 * @param matchScore - Match score (0-100)
 * @param position - Position in results (1-indexed)
 */
export const trackCompsResultClick = (
  titleId: string,
  matchScore: number,
  position: number
): void => {
  trackEvent('comps_result_click', {
    title_id: titleId,
    match_score: matchScore,
    position,
    timestamp: new Date().toISOString(),
  });
};

/**
 * Track when user clicks "Try Example" in Comps Navigator
 * @param exampleName - Name of the example used
 * @param inputCount - Number of comps in the example
 */
export const trackCompsExampleUsed = (
  exampleName: string,
  inputCount: number
): void => {
  trackEvent('comps_example_used', {
    example_name: exampleName,
    input_count: inputCount,
    timestamp: new Date().toISOString(),
  });
};

// ============================================================================
// FUNNEL 5: CHECKOUT EVENTS
// Tracks: View Plan → Start Checkout → Complete Payment
// ============================================================================

/**
 * Track plan page views
 * @param currentTier - User's current tier
 */
export const trackPlanPageView = (
  currentTier: string
): void => {
  trackEvent('plan_page_view', {
    current_tier: currentTier,
    timestamp: new Date().toISOString(),
  });
};

/**
 * Track plan selection
 * @param selectedTier - Tier user selected
 * @param currentTier - User's current tier
 */
export const trackPlanSelect = (
  selectedTier: string,
  currentTier: string
): void => {
  trackEvent('plan_select', {
    selected_tier: selectedTier,
    current_tier: currentTier,
    is_upgrade: selectedTier !== currentTier,
    timestamp: new Date().toISOString(),
  });
};

/**
 * Track checkout events
 * @param action - 'started' | 'completed' | 'cancelled' | 'error'
 * @param tier - Target tier
 * @param value - Subscription value (for completed)
 */
export const trackCheckout = (
  action: 'started' | 'completed' | 'cancelled' | 'error',
  tier: string,
  value?: number,
  metadata?: Record<string, unknown>
): void => {
  const params: Record<string, unknown> = {
    action,
    tier,
    timestamp: new Date().toISOString(),
    ...metadata,
  };

  if (value !== undefined) {
    params.value = value;
    params.currency = 'USD';
  }

  trackEvent('checkout', params);

  // Also fire GA4's built-in purchase event for completed checkouts
  if (action === 'completed' && value) {
    trackEvent('purchase', {
      transaction_id: `sub_${Date.now()}`,
      value,
      currency: 'USD',
      items: [{ item_name: `${tier}_subscription`, price: value }],
    });
  }
};

// ============================================================================
// ENGAGEMENT & SESSION TRACKING
// ============================================================================

/**
 * Track feature usage for adoption metrics
 * @param featureName - Name of feature used
 * @param userTier - User's tier
 */
export const trackFeatureUsage = (
  featureName: string,
  userTier: string = 'basic'
): void => {
  trackEvent('feature_usage', {
    feature_name: featureName,
    user_tier: userTier,
    timestamp: new Date().toISOString(),
  });
};

/**
 * Track user engagement score events
 * @param action - Type of engagement
 * @param value - Engagement value/score
 */
export const trackEngagement = (
  action: string,
  value: number = 1
): void => {
  trackEvent('user_engagement', {
    engagement_action: action,
    engagement_value: value,
    timestamp: new Date().toISOString(),
  });
};

/**
 * Track session-level search counts (fired on page leave)
 * @param tool - Which tool the searches were performed in
 * @param searchCount - Total number of searches in the session
 */
export const trackSessionSearches = (
  tool: 'chat' | 'comps' | 'mandates' | 'titles',
  searchCount: number
): void => {
  trackEvent('session_searches', {
    tool,
    search_count: searchCount,
    timestamp: new Date().toISOString(),
  });
};

/**
 * Track filter applied on titles page
 * @param filterType - Type of filter (e.g., 'format')
 * @param filterValue - Value of the filter (e.g., 'webtoon', null for 'all')
 */
export const trackTitlesFilterApplied = (
  filterType: string,
  filterValue: string | null
): void => {
  trackEvent('titles_filter_applied', {
    filter_type: filterType,
    filter_value: filterValue || 'all',
    timestamp: new Date().toISOString(),
  });
};

// ============================================================================
// PHASE 1: CRITICAL TRACKING GAPS
// Pitch Deck, API Errors, Premium Gates, Search Quality, Checkout Abandonment
// ============================================================================

// --- PITCH DECK EVENTS (8 events) ---

/**
 * Track when a pitch deck is opened/loaded
 * @param titleId - UUID of the title
 * @param accessType - Whether the viewer grants preview or full access
 */
export const trackPitchDeckOpened = (
  titleId: string,
  accessType: PitchDeckAccessType
): void => {
  trackEvent(ANALYTICS_EVENT_NAMES.pitchDeckOpened, {
    title_id: titleId,
    access_type: accessType,
  });
};

/**
 * Track pitch deck page navigation
 * @param titleId - UUID of the title
 * @param pageNumber - Current page number (1-indexed)
 * @param accessType - Whether the viewer grants preview or full access
 */
export const trackPitchDeckPageViewed = (
  titleId: string,
  pageNumber: number,
  accessType: PitchDeckAccessType
): void => {
  trackEvent(ANALYTICS_EVENT_NAMES.pitchDeckPageViewed, {
    title_id: titleId,
    page_number: pageNumber,
    access_type: accessType,
  });
};

/**
 * Track when basic users hit the page limit (page 3)
 * @param titleId - UUID of the title
 * @param userTier - User's current tier
 * @param pagesViewed - Number of pages viewed before limit
 */
export const trackPitchDeckPageLimitHit = (
  titleId: string,
  userTier: string,
  pagesViewed: number
): void => {
  trackEvent('pitch_deck_page_limit_hit', {
    title_id: titleId,
    user_tier: userTier,
    pages_viewed: pagesViewed,
    timestamp: new Date().toISOString(),
  });
};

/**
 * Track when upgrade prompt is shown in pitch deck viewer
 * @param titleId - UUID of the title
 * @param pagesViewed - Pages viewed before prompt
 * @param timeViewingMs - Total time viewing before prompt
 */
export const trackPitchDeckUpgradePromptShown = (
  titleId: string,
  pagesViewed: number,
  timeViewingMs: number
): void => {
  trackEvent('pitch_deck_upgrade_prompt_shown', {
    title_id: titleId,
    pages_viewed: pagesViewed,
    time_viewing_ms: timeViewingMs,
    timestamp: new Date().toISOString(),
  });
};

/**
 * Track when pitch deck viewer is closed
 * @param titleId - UUID of the title
 * @param pagesViewed - Total pages viewed
 * @param totalTimeMs - Total time viewing in milliseconds
 * @param maxPage - Maximum page number reached
 */
export const trackPitchDeckClosed = (
  titleId: string,
  pagesViewed: number,
  totalTimeMs: number,
  maxPage: number
): void => {
  trackEvent('pitch_deck_closed', {
    title_id: titleId,
    pages_viewed: pagesViewed,
    total_time_ms: totalTimeMs,
    max_page_reached: maxPage,
    timestamp: new Date().toISOString(),
  });
};

/**
 * Track pitch deck loading errors
 * @param titleId - UUID of the title
 * @param errorMessage - Error message (truncated)
 * @param userTier - User's current tier
 */
export const trackPitchDeckError = (
  titleId: string,
  errorMessage: string,
  userTier: string
): void => {
  trackEvent('pitch_deck_error', {
    title_id: titleId,
    error_message: errorMessage.substring(0, 100),
    user_tier: userTier,
    timestamp: new Date().toISOString(),
  });
};

/**
 * Track pitch deck zoom actions
 * @param titleId - UUID of the title
 * @param zoomLevel - Current zoom level (percentage)
 */
export const trackPitchDeckZoom = (
  titleId: string,
  zoomLevel: number
): void => {
  trackEvent('pitch_deck_zoom', {
    title_id: titleId,
    zoom_level: zoomLevel,
    timestamp: new Date().toISOString(),
  });
};

/**
 * Track pitch deck fullscreen toggle
 * @param titleId - UUID of the title
 * @param action - 'enter' | 'exit'
 */
export const trackPitchDeckFullscreen = (
  titleId: string,
  action: 'enter' | 'exit'
): void => {
  trackEvent('pitch_deck_fullscreen', {
    title_id: titleId,
    action,
    timestamp: new Date().toISOString(),
  });
};

// --- API ERROR TRACKING ---

/**
 * Track API errors for debugging and reliability monitoring
 * @param endpoint - API endpoint that failed
 * @param statusCode - HTTP status code
 * @param errorType - Type of error (network, timeout, server, etc.)
 * @param userTier - User's current tier (optional)
 */
export const trackApiError = (
  endpoint: string,
  statusCode: number,
  errorType: string,
  userTier?: string
): void => {
  trackEvent('api_error', {
    endpoint: endpoint.substring(0, 100),
    status_code: statusCode,
    error_type: errorType,
    user_tier: userTier || 'unknown',
    timestamp: new Date().toISOString(),
  });
};

// --- PREMIUM GATE TRACKING ---

/**
 * Track when a premium feature is blocked for the user
 * @param featureName - Name of the blocked feature
 * @param requiredTier - Tier required to access
 * @param userTier - User's current tier
 * @param contextPage - Page where blocking occurred
 */
export const trackPremiumFeatureBlocked = (
  featureName: string,
  requiredTier: string,
  userTier: string,
  contextPage: string
): void => {
  trackEvent('premium_feature_blocked', {
    feature_name: featureName,
    required_tier: requiredTier,
    user_tier: userTier,
    context_page: contextPage,
    timestamp: new Date().toISOString(),
  });
};

/**
 * Track when user clicks upgrade CTA in a premium gate
 * @param featureName - Feature that triggered upgrade
 * @param source - Where the CTA was clicked
 * @param userTier - User's current tier
 */
export const trackPremiumUpgradeCtaClicked = (
  featureName: string,
  source: string,
  userTier: string
): void => {
  trackEvent('premium_upgrade_cta_clicked', {
    feature_name: featureName,
    source,
    user_tier: userTier,
    timestamp: new Date().toISOString(),
  });
};

// --- SEARCH QUALITY TRACKING ---

/**
 * Track when a search returns zero results
 * @param searchType - Type of search performed
 */
export const trackSearchZeroResults = (
  searchType: string
): void => {
  trackEvent('search_zero_results', {
    search_type: searchType,
  });
};

/**
 * Track search query submission with results
 * @param query - Search query (truncated)
 * @param resultCount - Number of results returned
 * @param searchType - Type of search performed
 */
export const trackSearchQuerySubmitted = (
  query: string,
  resultCount: number,
  searchType: string
): void => {
  trackEvent('search_query_submitted', {
    query: query.substring(0, 50),
    query_length: query.length,
    result_count: resultCount,
    search_type: searchType,
    has_results: resultCount > 0,
    timestamp: new Date().toISOString(),
  });
};

// --- CHECKOUT ABANDONMENT ---

/**
 * Track checkout page abandonment
 * @param tier - Target tier
 * @param timeOnPageMs - Time spent on checkout page
 * @param stepReached - Last step reached (loading, error, redirecting)
 */
export const trackCheckoutAbandoned = (
  tier: string,
  timeOnPageMs: number,
  stepReached: string
): void => {
  trackEvent('checkout_abandoned', {
    tier,
    time_on_page_ms: timeOnPageMs,
    step_reached: stepReached,
    timestamp: new Date().toISOString(),
  });
};

// ============================================================================
// PHASE 2: HIGH PRIORITY TRACKING
// Title Interactions, Chat Lifecycle, Home Page, Mandates, Profile
// ============================================================================

// --- TITLE INTERACTION EVENTS ---

/**
 * Track title card clicks in lists/grids
 * @param titleId - UUID of the title
 * @param titleName - Name of the title
 * @param source - Where the card was displayed
 * @param position - Position in the list (1-indexed)
 */
export const trackTitleCardClicked = (
  titleId: string,
  titleName: string,
  source: string,
  position: number
): void => {
  trackEvent('title_card_clicked', {
    title_id: titleId,
    title_name: titleName,
    source,
    position,
    timestamp: new Date().toISOString(),
  });
};

/**
 * Track Contact Creator CTA clicks
 * @param titleId - UUID of the title
 * @param titleName - Name of the title
 * @param userTier - User's current tier
 */
export const trackTitleContactCreatorClicked = (
  titleId: string,
  titleName: string,
  userTier: string
): void => {
  trackEvent('title_contact_creator_clicked', {
    title_id: titleId,
    title_name: titleName,
    user_tier: userTier,
    timestamp: new Date().toISOString(),
  });
};

/**
 * Track a server-confirmed Express Interest request.
 * Title names and freeform note details are intentionally excluded.
 */
export const trackTitleInterestSubmitted = (
  titleId: string,
  source: 'title_detail' = 'title_detail'
): void => {
  trackEvent(ANALYTICS_EVENT_NAMES.interestSubmitted, {
    title_id: titleId,
    source,
  });
};

/**
 * Track View Pitch Deck button clicks
 * @param titleId - UUID of the title
 * @param titleName - Name of the title
 * @param hasPitch - Whether the title has a pitch deck
 */
export const trackTitlePitchCtaClicked = (
  titleId: string,
  titleName: string,
  hasPitch: boolean
): void => {
  trackEvent('title_pitch_cta_clicked', {
    title_id: titleId,
    title_name: titleName,
    has_pitch: hasPitch,
    timestamp: new Date().toISOString(),
  });
};

/**
 * Track document downloads from title detail
 * @param titleId - UUID of the title
 * @param documentType - Type of document (pdf, bible, etc.)
 * @param userTier - User's current tier
 */
export const trackTitleDocumentDownloaded = (
  titleId: string,
  documentType: string,
  userTier: string
): void => {
  trackEvent('title_document_downloaded', {
    title_id: titleId,
    document_type: documentType,
    user_tier: userTier,
    timestamp: new Date().toISOString(),
  });
};

// --- CHAT SESSION LIFECYCLE ---

/**
 * Track chat session start
 * @param sessionId - Unique session identifier
 * @param trigger - What triggered the new session (new_chat, example_click)
 */
export const trackChatSessionStarted = (
  sessionId: string,
  trigger: string
): void => {
  trackEvent('chat_session_started', {
    session_id: sessionId,
    trigger,
    timestamp: new Date().toISOString(),
  });
};

/**
 * Track loading of chat history
 * @param sessionId - Session being loaded
 * @param messageCount - Number of messages in history
 */
export const trackChatHistoryLoaded = (
  sessionId: string,
  messageCount: number
): void => {
  trackEvent('chat_history_loaded', {
    session_id: sessionId,
    message_count: messageCount,
    timestamp: new Date().toISOString(),
  });
};

/**
 * Track favoriting a title from chat results
 * @param titleId - UUID of the title
 * @param titleName - Name of the title
 * @param messagePosition - Position in conversation (1-indexed)
 */
export const trackChatSaveFromResults = (
  titleId: string,
  titleName: string,
  messagePosition: number
): void => {
  trackEvent('chat_save_from_results', {
    title_id: titleId,
    title_name: titleName,
    message_position: messagePosition,
    timestamp: new Date().toISOString(),
  });
};

// --- HOME PAGE ENTRY POINTS ---

/**
 * Track home page CTA clicks
 * @param ctaType - Type of CTA (chat, comps, mandates, browse)
 * @param ctaValue - Optional value/label associated with the CTA
 */
export const trackHomeCtaClicked = (
  ctaType: string,
  ctaValue?: string
): void => {
  trackEvent('home_cta_clicked', {
    cta_type: ctaType,
    cta_value: ctaValue,
    timestamp: new Date().toISOString(),
  });
};

/**
 * Track search initiated from home page
 * @param searchType - Type of search (show_comp, brief, etc.)
 * @param inputMethod - How the search was initiated (manual, autocomplete)
 */
export const trackHomeSearchInitiated = (
  searchType: string,
  inputMethod?: string
): void => {
  trackEvent('home_search_initiated', {
    search_type: searchType,
    input_method: inputMethod,
    timestamp: new Date().toISOString(),
  });
};

/**
 * Track featured title clicks from home page sections
 * @param titleId - UUID of the title
 * @param sectionName - Name of the featured section
 * @param position - Position in the section (1-indexed)
 */
export const trackFeaturedTitleClicked = (
  titleId: string,
  sectionName: string,
  position: number
): void => {
  trackEvent('featured_title_clicked', {
    title_id: titleId,
    section_name: sectionName,
    position,
    timestamp: new Date().toISOString(),
  });
};

// --- MANDATE/BRIEF SEARCH ---

/**
 * Track mandate search submission
 * Track an accepted mandate request without sending mandate text.
 */
export const trackMandateSearchSubmitted = (
  filterCount: number,
  source: 'mandates' | 'home' | 'trial_conversion' = 'mandates'
): void => {
  trackEvent(ANALYTICS_EVENT_NAMES.mandateSearchSubmitted, {
    filter_count: filterCount,
    source,
  });
};

/**
 * Track mandate result clicks
 * @param titleId - UUID of the title
 * @param matchScore - Match score percentage
 */
export const trackMandateResultClicked = (
  titleId: string,
  matchScore: number
): void => {
  trackEvent('mandate_result_clicked', {
    title_id: titleId,
    match_score: matchScore,
    timestamp: new Date().toISOString(),
  });
};

/**
 * Track example mandate usage
 */
export const trackMandateExampleUsed = (): void => {
  trackEvent('mandate_example_used', {});
};

// --- PROFILE & UPGRADE ---

/**
 * Track upgrade button click on profile page
 * @param currentTier - User's current tier
 * @param targetTier - Tier being upgraded to
 */
export const trackProfileUpgradeClicked = (
  currentTier: string,
  targetTier?: string
): void => {
  trackEvent('profile_upgrade_clicked', {
    current_tier: currentTier,
    target_tier: targetTier,
    timestamp: new Date().toISOString(),
  });
};

/**
 * Track user sign out
 * @param userTier - User's tier at sign out
 */
export const trackUserSignedOut = (
  userTier: string
): void => {
  trackEvent('user_signed_out', {
    user_tier: userTier,
    timestamp: new Date().toISOString(),
  });
};

// ============================================================================
// PHASE 3: ENGAGEMENT DEPTH & UI INTERACTIONS
// Scroll Depth, Time Milestones, Modal Tracking
// ============================================================================

/**
 * Track scroll depth milestones
 * @param pagePath - Current page path
 * @param depthPercentage - Scroll depth (25, 50, 75, 100)
 */
export const trackScrollDepthReached = (
  pagePath: string,
  depthPercentage: number
): void => {
  trackEvent('scroll_depth_reached', {
    page_path: pagePath,
    depth_percentage: depthPercentage,
    timestamp: new Date().toISOString(),
  });
};

/**
 * Track time on page milestones
 * @param pagePath - Current page path
 * @param milestoneSeconds - Time milestone (30, 60, 120)
 */
export const trackTimeOnPageMilestone = (
  pagePath: string,
  milestoneSeconds: number
): void => {
  trackEvent('time_on_page_milestone', {
    page_path: pagePath,
    milestone_seconds: milestoneSeconds,
    timestamp: new Date().toISOString(),
  });
};

/**
 * Track modal opens
 * @param modalName - Name of the modal
 * @param trigger - What triggered the modal
 */
export const trackModalOpened = (
  modalName: string,
  trigger: string
): void => {
  trackEvent('modal_opened', {
    modal_name: modalName,
    trigger,
    timestamp: new Date().toISOString(),
  });
};

/**
 * Track external link clicks
 * @param url - Full URL of the external link
 * @param linkType - Type of link (imdb, linkedin, etc.)
 * @param context - Context where link was clicked
 */
export const trackExternalLinkClicked = (
  url: string,
  linkType: string,
  context?: string
): void => {
  // Extract domain from URL for analytics
  let domain = 'unknown';
  try {
    domain = new URL(url).hostname;
  } catch {
    // Keep as unknown if URL parsing fails
  }

  trackEvent('external_link_clicked', {
    destination_url: url,
    destination_domain: domain,
    link_type: linkType,
    context,
    timestamp: new Date().toISOString(),
  });
};

// ============================================================================
// TRIAL PAGE TRACKING
// Tracks: Tool Selection, Searches, Results, Limit, Signup CTA
// ============================================================================

type TrialTool = 'comps' | 'mandates' | 'chat';

/**
 * Track trial page view
 */
export const trackTrialPageView = (remainingTrials: number): void => {
  trackEvent('trial_page_view', {
    remaining_trials: remainingTrials,
    trial_tool: 'none',
    timestamp: new Date().toISOString(),
  });
};

/**
 * Track tool selection on trial page
 */
export const trackTrialToolSelected = (
  tool: TrialTool,
  remainingTrials: number
): void => {
  trackEvent('trial_tool_selected', {
    trial_tool: tool,
    remaining_trials: remainingTrials,
    timestamp: new Date().toISOString(),
  });
};

/**
 * Track comp title added
 */
export const trackTrialCompAdded = (
  compTitle: string,
  compCount: number
): void => {
  trackEvent('trial_comp_added', {
    comp_title: compTitle,
    comp_count: compCount,
    trial_tool: 'comps',
    timestamp: new Date().toISOString(),
  });
};

/**
 * Track comp title removed
 */
export const trackTrialCompRemoved = (
  compTitle: string,
  compCount: number
): void => {
  trackEvent('trial_comp_removed', {
    comp_title: compTitle,
    comp_count: compCount,
    trial_tool: 'comps',
    timestamp: new Date().toISOString(),
  });
};

/**
 * Track comps search initiated
 */
export const trackTrialCompsSearch = (
  compTitles: string[],
  compCount: number
): void => {
  trackEvent('trial_comps_search', {
    comp_titles: compTitles.join(', ').substring(0, 100),
    comp_count: compCount,
    trial_tool: 'comps',
    timestamp: new Date().toISOString(),
  });
};

/**
 * Track comps search results received
 */
export const trackTrialCompsResults = (
  resultCount: number,
  processingTimeMs: number,
  costEstimate?: number
): void => {
  trackEvent('trial_comps_results', {
    result_count: resultCount,
    processing_time_ms: processingTimeMs,
    cost_estimate: costEstimate || 0,
    trial_tool: 'comps',
    timestamp: new Date().toISOString(),
  });
};

/**
 * Track comps example used
 */
export const trackTrialCompsExampleUsed = (exampleName: string): void => {
  trackEvent('trial_comps_example_used', {
    example_name: exampleName,
    trial_tool: 'comps',
    timestamp: new Date().toISOString(),
  });
};

/**
 * Track mandate search initiated
 */
export const trackTrialMandateSearch = (
  mandateText: string
): void => {
  trackEvent('trial_mandate_search', {
    mandate_length: mandateText.length,
    mandate_preview: mandateText.substring(0, 50),
    trial_tool: 'mandates',
    timestamp: new Date().toISOString(),
  });
};

/**
 * Track mandate search results received
 */
export const trackTrialMandateResults = (
  resultCount: number,
  processingTimeMs: number
): void => {
  trackEvent('trial_mandate_results', {
    result_count: resultCount,
    processing_time_ms: processingTimeMs,
    trial_tool: 'mandates',
    timestamp: new Date().toISOString(),
  });
};

/**
 * Track mandate example used
 */
export const trackTrialMandateExampleUsed = (exampleName: string): void => {
  trackEvent('trial_mandate_example_used', {
    example_name: exampleName,
    trial_tool: 'mandates',
    timestamp: new Date().toISOString(),
  });
};

/**
 * Track chat message sent
 */
export const trackTrialChatMessageSent = (
  messageLength: number,
  inputType: 'typed' | 'suggested'
): void => {
  trackEvent('trial_chat_message_sent', {
    message_length: messageLength,
    input_type: inputType,
    trial_tool: 'chat',
    timestamp: new Date().toISOString(),
  });
};

/**
 * Track chat response received
 */
export const trackTrialChatResponse = (
  resultCount: number,
  processingPhase: string
): void => {
  trackEvent('trial_chat_response', {
    result_count: resultCount,
    processing_phase: processingPhase,
    trial_tool: 'chat',
    timestamp: new Date().toISOString(),
  });
};

/**
 * Track chat suggestion clicked
 */
export const trackTrialChatSuggestionClicked = (suggestionText: string): void => {
  trackEvent('trial_chat_suggestion_clicked', {
    suggestion_text: suggestionText.substring(0, 50),
    trial_tool: 'chat',
    timestamp: new Date().toISOString(),
  });
};

/**
 * Track result card clicked
 */
export const trackTrialResultClicked = (
  tool: TrialTool,
  titleId: string,
  titleName: string,
  matchScore: number,
  position: number
): void => {
  trackEvent('trial_result_clicked', {
    trial_tool: tool,
    title_id: titleId,
    title_name: titleName,
    match_score: matchScore,
    position,
    timestamp: new Date().toISOString(),
  });
};

/**
 * Track trial title detail page view
 */
export const trackTrialTitleDetailView = (
  titleId: string,
  titleName: string,
  sourceTool: TrialTool
): void => {
  trackEvent('trial_title_detail_view', {
    title_id: titleId,
    title_name: titleName,
    source_tool: sourceTool,
    trial_tool: sourceTool,
    timestamp: new Date().toISOString(),
  });
};

/**
 * Track search completed (any tool)
 */
export const trackTrialSearchCompleted = (
  tool: TrialTool,
  searchesUsed: number,
  remainingTrials: number
): void => {
  trackEvent('trial_search_completed', {
    trial_tool: tool,
    searches_used: searchesUsed,
    remaining_trials: remainingTrials,
    timestamp: new Date().toISOString(),
  });
};

/**
 * Track trial limit reached (5/5 searches)
 */
export const trackTrialLimitReached = (lastToolUsed: TrialTool): void => {
  trackEvent('trial_limit_reached', {
    last_tool_used: lastToolUsed,
    trial_tool: lastToolUsed,
    timestamp: new Date().toISOString(),
  });
};

/**
 * Track signup CTA clicked from trial
 */
export const trackTrialSignupCtaClicked = (
  source: 'limit_modal' | 'title_detail_banner' | 'header'
): void => {
  trackEvent('trial_signup_cta_clicked', {
    source,
    timestamp: new Date().toISOString(),
  });
};

// --- FORMAT SPOTLIGHT ---

/**
 * Track format spotlight page view
 * @param formatType - The format type being viewed
 */
export const trackFormatSpotlightView = (
  formatType: string
): void => {
  trackEvent('format_spotlight_view', {
    format_type: formatType,
    timestamp: new Date().toISOString(),
  });
};

/**
 * Track format spotlight card click
 * @param titleId - UUID of the title
 * @param formatType - The format type
 * @param rank - Position in the list (1-indexed)
 */
export const trackFormatSpotlightCardClick = (
  titleId: string,
  formatType: string,
  rank: number
): void => {
  trackEvent('format_spotlight_card_click', {
    title_id: titleId,
    format_type: formatType,
    rank,
    timestamp: new Date().toISOString(),
  });
};

// Extend Window interface for TypeScript
declare global {
  interface Window {
    dataLayer: unknown[];
    gtag: (...args: unknown[]) => void;
  }
}

// Export configuration for debugging
export const analyticsConfig = {
  isEnabled: IS_ANALYTICS_ENABLED,
  isDev: IS_DEV,
  allowNonProduction: ALLOW_NON_PRODUCTION_ANALYTICS,
  measurementId: GA_MEASUREMENT_ID ? `${GA_MEASUREMENT_ID.substring(0, 5)}...` : 'Not configured',
};
