import { trackOnboardingStep } from '@/utils/analytics';

/**
 * Activation milestones, fired once per browser via localStorage guard:
 * 1 = signed up, 2 = first search, 3 = first title view, 4 = first save
 */
export type OnboardingMilestone = 1 | 2 | 3 | 4;

const STORAGE_PREFIX = 'onboarding_step_';

export function completeOnboardingStep(step: OnboardingMilestone): void {
  const key = `${STORAGE_PREFIX}${step}`;
  try {
    if (localStorage.getItem(key)) return;
    localStorage.setItem(key, new Date().toISOString());
  } catch {
    // localStorage unavailable (private mode) - still track, just not deduped
  }
  trackOnboardingStep(step, 'complete');
}
