import { supabase } from '@/integrations/supabase/client';
import { trackOnboardingStep } from '@/utils/analytics';
import { sendOnboardingCompletionEmail, type OnboardingEmailData } from '@/services/emailService';

export interface OnboardingStatus {
  id: string;
  user_id: string;
  user_email: string;
  onboarding_completed: boolean;
  onboarding_started_at: string | null;
  onboarding_completed_at: string | null;
  current_step: number;
  skipped: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * Onboarding Service for PRD 2.1
 * Manages user onboarding progress and tracking
 */
export class OnboardingService {
  /**
   * Check if user has completed onboarding (SIMPLIFIED - No retry logic)
   */
  static async checkOnboardingStatus(userId: string): Promise<OnboardingStatus | null> {
    try {
      const { data, error } = await supabase
        .from('user_onboarding')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (error) {
        // Check if table doesn't exist
        if (error.code === '42P01') {
          throw new Error('Onboarding table not found. Database migration required.');
        }
        console.warn('⚠️ ONBOARDING SERVICE: Database error:', error.message);
        return null;
      }

      return data;
    } catch (error) {
      console.error('❌ ONBOARDING SERVICE: Failed to check onboarding status:', error);
      throw error;
    }
  }

  /**
   * Initialize onboarding for a new user
   */
  static async startOnboarding(userId: string, userEmail: string): Promise<OnboardingStatus | null> {
    try {
      // Check if onboarding already exists
      const existing = await this.checkOnboardingStatus(userId);
      if (existing) {
        return existing;
      }

      // Create new onboarding record
      const { data, error } = await supabase
        .from('user_onboarding')
        .insert({
          user_id: userId,
          user_email: userEmail,
          onboarding_started_at: new Date().toISOString(),
          current_step: 1
        })
        .select()
        .single();

      if (error) {
        console.error('Error starting onboarding:', error);
        return null;
      }

      // Track analytics
      trackOnboardingStep(1, 'start', 'Onboarding Started');

      console.log('✅ Onboarding started for user:', userId);
      return data;
    } catch (error) {
      console.error('Failed to start onboarding:', error);
      return null;
    }
  }

  /**
   * Update onboarding progress to next step
   */
  static async updateOnboardingStep(
    userId: string,
    step: number,
    action: 'complete' | 'skip',
    userName?: string
  ): Promise<boolean> {
    try {
      // Get current status first to check if completion
      const currentStatus = await this.checkOnboardingStatus(userId);
      if (!currentStatus) {
        console.error('No onboarding status found for user:', userId);
        return false;
      }

      const updates: any = {
        current_step: step
      };

      // If completing the final step (step 4), mark as completed
      if (step === 4 && action === 'complete') {
        updates.onboarding_completed = true;
        updates.onboarding_completed_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from('user_onboarding')
        .update(updates)
        .eq('user_id', userId);

      if (error) {
        console.error('Error updating onboarding step:', error);
        return false;
      }

      // Track analytics
      trackOnboardingStep(step, action, `Step ${step}`);

      // PRD 2.1: Send completion email when onboarding is finished
      if (step === 4 && action === 'complete' && userName) {
        try {
          await sendOnboardingCompletionEmail({
            userEmail: currentStatus.user_email,
            userName,
            userId,
            completedSteps: 4,
            totalSteps: 4,
            skipped: false
          });
          console.log('📧 Onboarding completion email sent');
        } catch (emailError) {
          console.warn('Failed to send onboarding completion email:', emailError);
          // Don't fail the onboarding update if email fails
        }
      }

      console.log(`✅ Onboarding step ${step} ${action} for user:`, userId);
      return true;
    } catch (error) {
      console.error('Failed to update onboarding step:', error);
      return false;
    }
  }

  /**
   * Skip onboarding entirely
   */
  static async skipOnboarding(userId: string, userName?: string): Promise<boolean> {
    try {
      // Get current status for email
      const currentStatus = await this.checkOnboardingStatus(userId);
      if (!currentStatus) {
        console.error('No onboarding status found for user:', userId);
        return false;
      }

      const { error } = await supabase
        .from('user_onboarding')
        .update({
          skipped: true,
          onboarding_completed: true,
          onboarding_completed_at: new Date().toISOString()
        })
        .eq('user_id', userId);

      if (error) {
        console.error('Error skipping onboarding:', error);
        return false;
      }

      // Track analytics
      trackOnboardingStep(0, 'skip', 'Onboarding Skipped');

      // PRD 2.1: Send helpful email for users who skipped onboarding
      if (userName) {
        try {
          await sendOnboardingCompletionEmail({
            userEmail: currentStatus.user_email,
            userName,
            userId,
            completedSteps: 0,
            totalSteps: 4,
            skipped: true
          });
          console.log('📧 Onboarding skip email sent');
        } catch (emailError) {
          console.warn('Failed to send onboarding skip email:', emailError);
          // Don't fail the skip action if email fails
        }
      }

      console.log('⏭️ Onboarding skipped for user:', userId);
      return true;
    } catch (error) {
      console.error('Failed to skip onboarding:', error);
      return false;
    }
  }

  /**
   * Reset onboarding (for testing or restart from settings)
   */
  static async resetOnboarding(userId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('user_onboarding')
        .update({
          onboarding_completed: false,
          onboarding_started_at: new Date().toISOString(),
          onboarding_completed_at: null,
          current_step: 1,
          skipped: false
        })
        .eq('user_id', userId);

      if (error) {
        console.error('Error resetting onboarding:', error);
        return false;
      }

      console.log('🔄 Onboarding reset for user:', userId);
      return true;
    } catch (error) {
      console.error('Failed to reset onboarding:', error);
      return false;
    }
  }

  /**
   * Check if user should see onboarding (SIMPLIFIED - Minimal logging)
   * Returns true if user is new and hasn't completed or skipped onboarding
   */
  static async shouldShowOnboarding(userId: string): Promise<boolean> {
    const status = await this.checkOnboardingStatus(userId);

    // Show onboarding if:
    // 1. No status exists (new user)
    // 2. Status exists but not completed and not skipped
    const shouldShow = !status || (!status.onboarding_completed && !status.skipped);

    console.log('🎯 ONBOARDING SERVICE:', {
      userId,
      shouldShow,
      reason: !status ? 'new_user' : status.onboarding_completed ? 'completed' : status.skipped ? 'skipped' : 'in_progress'
    });

    return shouldShow;
  }

}