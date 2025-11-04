/**
 * Tier Configuration and Access Rules
 *
 * Defines tier hierarchy and content access rules for the buyer tier system.
 */

/**
 * Available tier types
 */
export type TierType = 'invited' | 'basic' | 'pro' | 'suite';

/**
 * Tier hierarchy values (higher = more access)
 */
export const TIER_HIERARCHY: Record<TierType, number> = {
  invited: 0,
  basic: 1,
  pro: 2,
  suite: 3
} as const;

/**
 * Pitch deck page access limits by tier
 */
export const PITCH_PAGE_LIMITS: Record<TierType, number | 'all'> = {
  invited: 0,      // No access
  basic: 5,        // Pages 1-5 only
  pro: 'all',      // Full access
  suite: 'all'     // Full access
} as const;

/**
 * Feature access by tier
 */
export const TIER_FEATURES = {
  CHAT_ACCESS: ['basic', 'pro', 'suite'] as TierType[],
  TITLE_BROWSING: ['basic', 'pro', 'suite'] as TierType[],
  FAVORITES: ['basic', 'pro', 'suite'] as TierType[],
  PITCH_PREVIEW: ['basic', 'pro', 'suite'] as TierType[], // Limited for basic
  FULL_PITCH_ACCESS: ['pro', 'suite'] as TierType[],
  ADVANCED_FILTERS: ['pro', 'suite'] as TierType[],
  EXPORT_DATA: ['suite'] as TierType[],
  PRIORITY_SUPPORT: ['suite'] as TierType[]
} as const;

/**
 * Tier display names
 */
export const TIER_DISPLAY_NAMES: Record<TierType, string> = {
  invited: 'Invited',
  basic: 'Basic',
  pro: 'Pro',
  suite: 'Suite'
} as const;

/**
 * Tier colors (for badges and UI)
 */
export const TIER_COLORS: Record<TierType, string> = {
  invited: '#6B7280',  // gray-500
  basic: '#4C9C9B',    // hanok-teal
  pro: '#AF52DE',      // pro-purple
  suite: '#FF6B6B'     // coral-red
} as const;

/**
 * Check if a tier has access to a feature
 *
 * @param userTier - User's current tier
 * @param feature - Feature to check access for
 * @returns True if user has access
 *
 * @example
 * hasFeatureAccess('basic', 'CHAT_ACCESS') // Returns true
 * hasFeatureAccess('basic', 'FULL_PITCH_ACCESS') // Returns false
 */
export function hasFeatureAccess(
  userTier: TierType,
  feature: keyof typeof TIER_FEATURES
): boolean {
  return TIER_FEATURES[feature].includes(userTier);
}

/**
 * Check if user tier meets or exceeds required tier
 *
 * @param userTier - User's current tier
 * @param requiredTier - Minimum tier required
 * @returns True if user tier >= required tier
 *
 * @example
 * hasTierAccess('pro', 'basic') // Returns true
 * hasTierAccess('basic', 'pro') // Returns false
 */
export function hasTierAccess(userTier: TierType, requiredTier: TierType): boolean {
  return TIER_HIERARCHY[userTier] >= TIER_HIERARCHY[requiredTier];
}

/**
 * Get pitch deck page limit for a tier
 *
 * @param tier - User's tier
 * @returns Page limit (number or 'all')
 *
 * @example
 * getPitchPageLimit('basic') // Returns 5
 * getPitchPageLimit('pro') // Returns 'all'
 */
export function getPitchPageLimit(tier: TierType): number | 'all' {
  return PITCH_PAGE_LIMITS[tier];
}

/**
 * Check if user can view a specific pitch page
 *
 * @param tier - User's tier
 * @param pageNumber - Page number to check (1-indexed)
 * @returns True if user can view the page
 *
 * @example
 * canViewPitchPage('basic', 3) // Returns true (pages 1-5)
 * canViewPitchPage('basic', 10) // Returns false
 * canViewPitchPage('pro', 10) // Returns true
 */
export function canViewPitchPage(tier: TierType, pageNumber: number): boolean {
  const limit = getPitchPageLimit(tier);

  if (limit === 'all') return true;
  if (limit === 0) return false;

  return pageNumber <= limit;
}
