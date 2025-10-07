// Google Tag Manager utility functions for the dashboard

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
    dataLayer: Record<string, unknown>[];
  }
}

// Google Tag Manager Container ID
const GTM_CONTAINER_ID = 'GTM-PZBC4XQT';

// Initialize Google Tag Manager (GTM is now loaded directly in HTML)
export const initGA = () => {
  if (typeof window !== 'undefined' && window.dataLayer) {
    // GTM is initialized via the script in HTML
    // Push initial configuration to dataLayer
    window.dataLayer.push({
      'gtm.start': new Date().getTime(),
      'event': 'gtm.js',
      'app_name': 'dashboard',
      'app_version': '1.0.0'
    });
  }
};

// Track page views
export const trackPageView = (path: string, title?: string) => {
  if (typeof window !== 'undefined' && window.dataLayer) {
    window.dataLayer.push({
      'event': 'page_view',
      'page_title': title || document.title,
      'page_location': window.location.href,
      'page_path': path,
      'app_section': 'dashboard'
    });
  }
};

// Track custom events
export const trackEvent = (action: string, category: string, label?: string, value?: number) => {
  if (typeof window !== 'undefined' && window.dataLayer) {
    window.dataLayer.push({
      'event': 'custom_event',
      'event_action': action,
      'event_category': category,
      'event_label': label,
      'event_value': value,
      'app_section': 'dashboard'
    });
  }
};

// Track user interactions specific to dashboard
export const trackDashboardEvent = (action: string, details?: Record<string, unknown>) => {
  trackEvent(action, 'dashboard_interaction', JSON.stringify(details));
};

// Track premium feature requests
export const trackPremiumFeatureRequest = (featureName: string) => {
  trackEvent('premium_feature_request', 'premium_features', featureName);
};

// Track title views
export const trackTitleView = (titleId: string, titleName: string) => {
  trackEvent('view_title', 'content_engagement', titleName, undefined);

  // Also track as ecommerce event with more details
  if (typeof window !== 'undefined' && window.dataLayer) {
    window.dataLayer.push({
      'event': 'view_item',
      'item_id': titleId,
      'item_name': titleName,
      'item_category': 'title',
      'app_section': 'dashboard'
    });
  }
};

// Track title views specifically from chat (PRD 2.1: Enhanced Chat Analytics)
export const trackTitleViewFromChat = (
  titleId: string,
  titleName: string,
  chatMode: 'standard' | 'advanced',
  sessionId?: string,
  messageId?: string,
  userPrompt?: string,
  recommendationScore?: number,
  userTier?: string
) => {
  if (typeof window !== 'undefined' && window.dataLayer) {
    window.dataLayer.push({
      'event': 'title_view_from_chat',
      'title_id': titleId,
      'title_name': titleName,
      'chat_mode': chatMode,
      'user_tier': userTier,
      'session_id': sessionId,
      'message_id': messageId,
      'user_prompt': userPrompt,
      'recommendation_score': recommendationScore,
      'timestamp': new Date().toISOString(),
      'app_section': 'dashboard',
      // Conversion funnel tracking
      'funnel_step': 'title_viewed_from_chat',
      'funnel_name': 'buyer_engagement'
    });

    console.log(`👁️ TITLE VIEW FROM CHAT: ${titleName} (Mode: ${chatMode}, Tier: ${userTier || 'unknown'})`);
  }
};

// Track favorites actions
export const trackFavoriteAction = (action: 'add' | 'remove', titleId: string, titleName: string) => {
  trackEvent(`favorite_${action}`, 'content_engagement', titleName);
};

// Track search actions with enhanced context
export const trackSearch = (
  searchTerm: string,
  searchType?: 'vector' | 'traditional' | 'hybrid',
  resultCount?: number,
  userId?: string
) => {
  if (typeof window !== 'undefined' && window.dataLayer) {
    // Clean search term (remove context prefixes like "favorites:")
    const cleanSearchTerm = searchTerm.replace(/^(favorites|main):/i, '').trim();

    window.dataLayer.push({
      'event': 'search',
      'search_term': cleanSearchTerm,
      'search_type': searchType || 'traditional',
      'search_results': resultCount || 0,
      'user_id': userId,
      'page_context': window.location.pathname,
      'app_section': 'dashboard',
      // GA4 enhanced ecommerce parameters
      'search_id': `search_${Date.now()}`,
      'search_timestamp': new Date().toISOString(),
      // Conversion funnel tracking
      'funnel_step': 'search_performed',
      'funnel_name': 'buyer_engagement'
    });

    console.log('🔍 SEARCH EVENT:', {
      searchTerm: cleanSearchTerm,
      searchType: searchType || 'traditional',
      resultCount,
      userId,
      timestamp: new Date().toISOString()
    });
  }
};

// Track authentication events
export const trackAuth = (action: 'login' | 'logout' | 'signup') => {
  if (typeof window !== 'undefined' && window.dataLayer) {
    window.dataLayer.push({
      'event': 'auth_event',
      'auth_action': action,
      'app_section': 'dashboard'
    });
  }
};

// Track errors
export const trackError = (errorMessage: string, errorLocation: string) => {
  trackEvent('error', 'technical_issues', `${errorLocation}: ${errorMessage}`);
};

// ============================================================================
// PRD 2.1: Enhanced Tracking Events for User Engagement & Conversion
// ============================================================================

/**
 * Track onboarding step progress
 * @param step - Step number (1-4)
 * @param action - 'start' | 'complete' | 'skip'
 * @param stepName - Optional step name for additional context
 */
export const trackOnboardingStep = (
  step: number,
  action: 'start' | 'complete' | 'skip',
  stepName?: string
) => {
  if (typeof window !== 'undefined' && window.dataLayer) {
    window.dataLayer.push({
      'event': 'onboarding_step',
      'onboarding_step': step,
      'onboarding_action': action,
      'step_name': stepName || `Step ${step}`,
      'timestamp': new Date().toISOString(),
      'app_section': 'dashboard'
    });

    console.log(`🎓 ONBOARDING: Step ${step} - ${action}`, { stepName });
  }
};

/**
 * Track when a title is saved (favorited)
 * @param titleId - Unique title identifier
 * @param titleName - Title name for reporting
 * @param source - Where the save action originated
 * @param userId - Optional user ID for funnel tracking
 */
export const trackSavedTitle = (
  titleId: string,
  titleName: string,
  source: 'chat' | 'search' | 'featured' | 'detail' | 'list',
  userId?: string
) => {
  if (typeof window !== 'undefined' && window.dataLayer) {
    window.dataLayer.push({
      'event': 'save_title',
      'title_id': titleId,
      'title_name': titleName,
      'save_source': source,
      'user_id': userId,
      'timestamp': new Date().toISOString(),
      'app_section': 'dashboard',
      // Conversion funnel tracking
      'funnel_step': 'saved_title',
      'funnel_name': 'buyer_engagement'
    });

    console.log(`💾 SAVED TITLE: ${titleName} from ${source}`);
  }
};

/**
 * Track pitch deck views (Pro feature)
 * @param titleId - Unique title identifier
 * @param titleName - Title name
 * @param tier - User's current tier
 * @param duration - Optional view duration in seconds
 */
export const trackPitchView = (
  titleId: string,
  titleName: string,
  tier: string,
  duration?: number
) => {
  if (typeof window !== 'undefined' && window.dataLayer) {
    window.dataLayer.push({
      'event': 'view_pitch',
      'title_id': titleId,
      'title_name': titleName,
      'user_tier': tier,
      'view_duration': duration,
      'timestamp': new Date().toISOString(),
      'app_section': 'dashboard',
      // Pro feature tracking
      'feature_type': 'pro',
      'feature_name': 'pitch_access',
      // Conversion funnel tracking
      'funnel_step': 'pitch_viewed',
      'funnel_name': 'buyer_engagement'
    });

    console.log(`📊 PITCH VIEW: ${titleName} (Tier: ${tier})`);
  }
};

/**
 * Track contact creator button clicks (Pro feature)
 * @param titleId - Unique title identifier
 * @param titleName - Title name
 * @param tier - User's current tier
 * @param source - Where the contact action originated
 */
export const trackContactCreatorClick = (
  titleId: string,
  titleName: string,
  tier: string,
  source: 'detail' | 'saved' | 'pitch' | 'chat'
) => {
  if (typeof window !== 'undefined' && window.dataLayer) {
    window.dataLayer.push({
      'event': 'contact_creator_click',
      'title_id': titleId,
      'title_name': titleName,
      'user_tier': tier,
      'contact_source': source,
      'timestamp': new Date().toISOString(),
      'app_section': 'dashboard',
      // Pro feature tracking
      'feature_type': 'pro',
      'feature_name': 'contact_creator',
      // Conversion funnel tracking
      'funnel_step': 'contact_attempted',
      'funnel_name': 'buyer_engagement'
    });

    console.log(`📞 CONTACT CREATOR: ${titleName} from ${source} (Tier: ${tier})`);
  }
};

/**
 * Track upgrade button clicks across the app
 * @param source - Where the upgrade CTA was clicked
 * @param featureName - Which Pro feature triggered the prompt
 * @param currentTier - User's current tier
 * @param promptType - Type of upgrade prompt (modal, inline, banner, etc.)
 */
export const trackUpgradeButtonClick = (
  source: string,
  featureName: string,
  currentTier: string,
  promptType?: 'modal' | 'inline' | 'banner' | 'popup'
) => {
  if (typeof window !== 'undefined' && window.dataLayer) {
    window.dataLayer.push({
      'event': 'upgrade_button_click',
      'upgrade_source': source,
      'feature_name': featureName,
      'current_tier': currentTier,
      'prompt_type': promptType || 'inline',
      'timestamp': new Date().toISOString(),
      'app_section': 'dashboard',
      // Conversion funnel tracking
      'funnel_step': 'upgrade_clicked',
      'funnel_name': 'pro_conversion',
      // Value tracking for ROI
      'potential_value': currentTier === 'basic' ? 29 : 0
    });

    console.log(`⬆️ UPGRADE CLICK: ${featureName} from ${source} (Tier: ${currentTier})`);
  }
};

/**
 * Track advanced chat usage (Pro feature)
 * @param messageCount - Number of messages in session
 * @param tier - User's current tier
 * @param sessionDuration - Optional session duration in seconds
 */
export const trackAdvancedChatUsage = (
  messageCount: number,
  tier: string,
  sessionDuration?: number
) => {
  if (typeof window !== 'undefined' && window.dataLayer) {
    window.dataLayer.push({
      'event': 'advanced_chat_usage',
      'message_count': messageCount,
      'user_tier': tier,
      'session_duration': sessionDuration,
      'timestamp': new Date().toISOString(),
      'app_section': 'dashboard',
      // Pro feature tracking
      'feature_type': 'pro',
      'feature_name': 'advanced_chat'
    });

    console.log(`💬 ADVANCED CHAT: ${messageCount} messages (Tier: ${tier})`);
  }
};

/**
 * Track conversion funnel completion
 * @param funnelName - Name of the funnel (e.g., 'buyer_engagement', 'pro_conversion')
 * @param step - Current funnel step
 * @param completed - Whether the funnel was completed
 */
export const trackFunnelProgress = (
  funnelName: string,
  step: string,
  completed: boolean = false
) => {
  if (typeof window !== 'undefined' && window.dataLayer) {
    window.dataLayer.push({
      'event': 'funnel_progress',
      'funnel_name': funnelName,
      'funnel_step': step,
      'funnel_completed': completed,
      'timestamp': new Date().toISOString(),
      'app_section': 'dashboard'
    });

    console.log(`🎯 FUNNEL: ${funnelName} - ${step} ${completed ? '(COMPLETED)' : ''}`);
  }
};

/**
 * Track pricing page visits
 * @param source - Where user came from
 * @param tier - User's current tier
 */
export const trackPricingPageView = (source: string, tier: string) => {
  if (typeof window !== 'undefined' && window.dataLayer) {
    window.dataLayer.push({
      'event': 'pricing_page_view',
      'view_source': source,
      'current_tier': tier,
      'timestamp': new Date().toISOString(),
      'app_section': 'dashboard',
      // Conversion funnel tracking
      'funnel_step': 'pricing_viewed',
      'funnel_name': 'pro_conversion'
    });

    console.log(`💰 PRICING PAGE: Viewed from ${source} (Tier: ${tier})`);
  }
};

// ============================================================================
// COMPREHENSIVE BUTTON/LINK TRACKING SYSTEM
// ============================================================================

export interface ButtonTrackingContext {
  buttonId: string;
  buttonText: string;
  buttonCategory: 'navigation' | 'content_discovery' | 'content_action' | 'authentication' | 'premium_feature' | 'ui_control';
  pageSection: 'header' | 'sidebar' | 'main_content' | 'footer' | 'modal' | 'mobile_menu';
  userType?: 'buyer' | 'creator';
  currentPage?: string;
  additionalContext?: Record<string, unknown>;
}

/**
 * Comprehensive button/link click tracking
 * @param context - Complete tracking context
 */
export const trackButtonClick = (context: ButtonTrackingContext) => {
  if (typeof window !== 'undefined' && window.dataLayer) {
    window.dataLayer.push({
      'event': 'button_click',
      'button_id': context.buttonId,
      'button_text': context.buttonText,
      'button_category': context.buttonCategory,
      'page_section': context.pageSection,
      'user_type': context.userType || 'unknown',
      'current_page': context.currentPage || window.location.pathname,
      'timestamp': new Date().toISOString(),
      'app_section': 'dashboard',
      ...context.additionalContext
    });

    console.log(`🖱️ BUTTON CLICK: ${context.buttonId} (${context.buttonCategory})`, {
      text: context.buttonText,
      section: context.pageSection,
      page: context.currentPage || window.location.pathname
    });
  }
};

/**
 * Track navigation link clicks (header, sidebar, mobile menu)
 */
export const trackNavigationClick = (
  linkText: string,
  linkHref: string,
  location: 'header' | 'sidebar' | 'mobile_menu',
  userType?: 'buyer' | 'creator'
) => {
  trackButtonClick({
    buttonId: `nav-${linkText.toLowerCase().replace(/\s+/g, '-')}`,
    buttonText: linkText,
    buttonCategory: 'navigation',
    pageSection: location,
    userType,
    additionalContext: {
      destination_href: linkHref,
      navigation_type: 'internal_link'
    }
  });
};

/**
 * Track logo clicks (home navigation)
 */
export const trackLogoClick = (
  location: 'header' | 'sidebar',
  userType?: 'buyer' | 'creator'
) => {
  trackButtonClick({
    buttonId: `logo-${location}`,
    buttonText: 'KStoryBridge Logo',
    buttonCategory: 'navigation',
    pageSection: location,
    userType,
    additionalContext: {
      action_type: 'home_navigation'
    }
  });
};

/**
 * Track mobile menu toggle
 */
export const trackMobileMenuToggle = (
  action: 'open' | 'close',
  userType?: 'buyer' | 'creator'
) => {
  trackButtonClick({
    buttonId: 'mobile-menu-toggle',
    buttonText: `${action === 'open' ? 'Open' : 'Close'} Menu`,
    buttonCategory: 'ui_control',
    pageSection: 'header',
    userType,
    additionalContext: {
      menu_action: action
    }
  });
};

/**
 * Track content discovery actions (search, filter, sort)
 */
export const trackContentDiscoveryAction = (
  actionType: 'search' | 'filter' | 'sort' | 'view_toggle',
  actionValue: string,
  userType?: 'buyer' | 'creator',
  additionalData?: Record<string, unknown>
) => {
  trackButtonClick({
    buttonId: `content-${actionType}-${actionValue.toLowerCase().replace(/\s+/g, '-')}`,
    buttonText: actionValue,
    buttonCategory: 'content_discovery',
    pageSection: 'main_content',
    userType,
    additionalContext: {
      discovery_type: actionType,
      discovery_value: actionValue,
      ...additionalData
    }
  });
};

/**
 * Track title card interactions
 */
export const trackTitleCardClick = (
  titleId: string,
  titleName: string,
  clickType: 'card_click' | 'title_link' | 'image_click',
  source: 'browse' | 'search' | 'favorites' | 'featured',
  userType?: 'buyer' | 'creator'
) => {
  trackButtonClick({
    buttonId: `title-card-${clickType}`,
    buttonText: titleName,
    buttonCategory: 'content_action',
    pageSection: 'main_content',
    userType,
    additionalContext: {
      title_id: titleId,
      click_type: clickType,
      content_source: source,
      action_type: 'title_selection'
    }
  });
};

/**
 * Track authentication actions
 */
export const trackAuthAction = (
  action: 'sign_in' | 'sign_out' | 'sign_up' | 'forgot_password',
  method?: 'email' | 'google' | 'form',
  userType?: 'buyer' | 'creator'
) => {
  trackButtonClick({
    buttonId: `auth-${action}`,
    buttonText: action.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
    buttonCategory: 'authentication',
    pageSection: 'main_content',
    userType,
    additionalContext: {
      auth_action: action,
      auth_method: method,
      timestamp: new Date().toISOString()
    }
  });
};

/**
 * Track tier/badge clicks
 */
export const trackTierBadgeClick = (
  currentTier: string,
  location: 'header' | 'sidebar' | 'profile',
  userType?: 'buyer' | 'creator'
) => {
  trackButtonClick({
    buttonId: `tier-badge-${location}`,
    buttonText: `${currentTier} Badge`,
    buttonCategory: 'premium_feature',
    pageSection: location,
    userType,
    additionalContext: {
      current_tier: currentTier,
      badge_location: location,
      action_type: 'tier_info_view'
    }
  });
};

/**
 * Track form submissions
 */
export const trackFormSubmission = (
  formType: 'profile_edit' | 'contact' | 'feedback' | 'search',
  formLocation: string,
  userType?: 'buyer' | 'creator',
  formData?: Record<string, unknown>
) => {
  trackButtonClick({
    buttonId: `form-submit-${formType}`,
    buttonText: 'Submit Form',
    buttonCategory: 'content_action',
    pageSection: 'main_content',
    userType,
    additionalContext: {
      form_type: formType,
      form_location: formLocation,
      form_timestamp: new Date().toISOString(),
      ...formData
    }
  });
};

/**
 * Enhanced search tracking with context and suggestions
 */
export const trackSearchWithContext = (
  searchTerm: string,
  searchContext: 'main_search' | 'chat_search' | 'favorites_search',
  resultCount: number,
  searchSuggestions?: string[],
  userType?: 'buyer' | 'creator'
) => {
  // Use existing search tracking but with enhanced context
  if (typeof window !== 'undefined' && window.dataLayer) {
    const cleanSearchTerm = searchTerm.replace(/^(favorites|main):/i, '').trim();

    window.dataLayer.push({
      'event': 'search_enhanced',
      'search_term': cleanSearchTerm,
      'search_context': searchContext,
      'search_results': resultCount,
      'search_suggestions': searchSuggestions,
      'user_type': userType,
      'timestamp': new Date().toISOString(),
      'app_section': 'dashboard',
      'funnel_step': 'content_discovery',
      'funnel_name': 'buyer_engagement'
    });

    console.log('🔍 ENHANCED SEARCH:', {
      term: cleanSearchTerm,
      context: searchContext,
      results: resultCount,
      suggestions: searchSuggestions?.length || 0
    });
  }
};

/**
 * Track user journey progression
 */
export const trackUserJourneyStep = (
  journeyName: string,
  stepName: string,
  stepOrder: number,
  completed: boolean,
  userType?: 'buyer' | 'creator',
  metadata?: Record<string, unknown>
) => {
  if (typeof window !== 'undefined' && window.dataLayer) {
    window.dataLayer.push({
      'event': 'user_journey_step',
      'journey_name': journeyName,
      'step_name': stepName,
      'step_order': stepOrder,
      'step_completed': completed,
      'user_type': userType,
      'timestamp': new Date().toISOString(),
      'app_section': 'dashboard',
      ...metadata
    });

    console.log(`🛤️ USER JOURNEY: ${journeyName} - ${stepName} (${completed ? 'Completed' : 'Started'})`);
  }
};

/**
 * Track premium feature access attempts (view sample, upgrade plan, etc.)
 */
export const trackPremiumFeatureAccess = (
  action: 'view_sample' | 'upgrade_plan' | 'contact_creator' | 'request_pitch',
  titleId?: string,
  titleName?: string,
  userTier?: string,
  additionalContext?: Record<string, unknown>
) => {
  if (typeof window !== 'undefined' && window.dataLayer) {
    window.dataLayer.push({
      'event': 'premium_feature_access',
      'feature_action': action,
      'title_id': titleId,
      'title_name': titleName,
      'user_tier': userTier || 'unknown',
      'conversion_intent': action === 'upgrade_plan' ? 'tier_upgrade' : 'content_access',
      'app_section': 'dashboard',
      'timestamp': new Date().toISOString(),
      ...additionalContext
    });

    console.log(`👑 PREMIUM FEATURE ACCESS: ${action}`, {
      titleId,
      titleName,
      userTier,
      context: additionalContext
    });
  }
};

/**
 * Track tier upgrade intentions and actions
 */
export const trackTierUpgrade = (
  targetTier: string,
  currentTier?: string,
  source?: 'premium_popup' | 'pricing_page' | 'profile_page' | 'title_detail',
  additionalContext?: Record<string, unknown>
) => {
  if (typeof window !== 'undefined' && window.dataLayer) {
    window.dataLayer.push({
      'event': 'tier_upgrade_intent',
      'target_tier': targetTier,
      'current_tier': currentTier || 'unknown',
      'upgrade_source': source || 'unknown',
      'conversion_category': 'tier_upgrade',
      'conversion_value': targetTier === 'pro' ? 250 : targetTier === 'suite' ? 500 : 0,
      'app_section': 'dashboard',
      'timestamp': new Date().toISOString(),
      ...additionalContext
    });

    console.log(`📈 TIER UPGRADE INTENT: ${currentTier} → ${targetTier}`, {
      source,
      value: targetTier === 'pro' ? 250 : targetTier === 'suite' ? 500 : 0,
      context: additionalContext
    });
  }
};

/**
 * Track tier downgrade actions
 */
export const trackTierDowngrade = (
  targetTier: string,
  currentTier?: string,
  reason?: string,
  additionalContext?: Record<string, unknown>
) => {
  if (typeof window !== 'undefined' && window.dataLayer) {
    window.dataLayer.push({
      'event': 'tier_downgrade_intent',
      'target_tier': targetTier,
      'current_tier': currentTier || 'unknown',
      'downgrade_reason': reason || 'user_initiated',
      'conversion_category': 'tier_downgrade',
      'app_section': 'dashboard',
      'timestamp': new Date().toISOString(),
      ...additionalContext
    });

    console.log(`📉 TIER DOWNGRADE INTENT: ${currentTier} → ${targetTier}`, {
      reason,
      context: additionalContext
    });
  }
};

/**
 * Track premium popup interactions specifically
 */
export const trackPremiumPopupInteraction = (
  action: 'show' | 'upgrade_click' | 'close' | 'request_submit',
  featureName?: string,
  userTier?: string,
  additionalContext?: Record<string, unknown>
) => {
  if (typeof window !== 'undefined' && window.dataLayer) {
    window.dataLayer.push({
      'event': 'premium_popup_interaction',
      'popup_action': action,
      'feature_name': featureName,
      'user_tier': userTier || 'unknown',
      'conversion_intent': action === 'upgrade_click' ? 'tier_upgrade' : 'feature_request',
      'app_section': 'dashboard',
      'timestamp': new Date().toISOString(),
      ...additionalContext
    });

    console.log(`🎁 PREMIUM POPUP: ${action}`, {
      featureName,
      userTier,
      context: additionalContext
    });
  }
};