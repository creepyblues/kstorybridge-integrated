/**
 * Analytics Utility - GA4 Event Tracking
 *
 * Provides comprehensive event tracking for user journey analytics.
 * Enables data-driven optimization for onboarding, engagement, and paid conversion.
 *
 * @module analytics
 * @see docs/tracking/PHASE_1_ANALYTICS.md
 */

// TypeScript type definitions
export type OnboardingAction = 'start' | 'complete' | 'skip';
export type SavedTitleSource = 'chat' | 'search' | 'featured';

export interface TrackingEvent {
  event_name: string;
  event_params: Record<string, string | number | boolean>;
}

// Environment-based configuration
const GA_MEASUREMENT_ID = import.meta.env.VITE_GA_MEASUREMENT_ID || '';
const IS_DEV = import.meta.env.DEV;
const IS_ANALYTICS_ENABLED = !!GA_MEASUREMENT_ID;

/**
 * Initialize Google Analytics 4
 * Call this once in your app's entry point (main.tsx)
 */
export const initializeAnalytics = (): void => {
  if (!IS_ANALYTICS_ENABLED) {
    if (IS_DEV) {
      console.log('[Analytics] GA4 not configured (VITE_GA_MEASUREMENT_ID not set)');
    }
    return;
  }

  // Load gtag.js script dynamically
  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`;
  document.head.appendChild(script);

  // Initialize gtag
  window.dataLayer = window.dataLayer || [];
  function gtag(...args: unknown[]) {
    window.dataLayer.push(args);
  }
  window.gtag = gtag;

  gtag('js', new Date());
  gtag('config', GA_MEASUREMENT_ID, {
    send_page_view: true,
  });

  if (IS_DEV) {
    console.log(`[Analytics] GA4 initialized (${GA_MEASUREMENT_ID})`);
  }
};

/**
 * Generic event tracking helper
 */
const trackEvent = (eventName: string, params: Record<string, unknown>): void => {
  if (IS_DEV) {
    console.log(`[Analytics] ${eventName}`, params);
  }

  if (!IS_ANALYTICS_ENABLED) {
    return;
  }

  if (typeof window.gtag === 'function') {
    window.gtag('event', eventName, params);
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
    view_duration_seconds: duration || 0,
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
  const params: Record<string, unknown> = {
    target_tier: targetTier,
    current_tier: currentTier || 'unknown',
    upgrade_source: source || 'unknown',
    conversion_category: 'tier_upgrade',
    conversion_value: targetTier === 'pro' ? 250 : targetTier === 'suite' ? 500 : 0,
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
  measurementId: GA_MEASUREMENT_ID ? `${GA_MEASUREMENT_ID.substring(0, 5)}...` : 'Not configured',
};
