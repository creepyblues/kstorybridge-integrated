import { supabase } from '@/integrations/supabase/client';
import { syncOAuthUserMetadata, getCurrentUserForSync } from '@/utils/oauthMetadataSync';

interface BaseEmailData {
  to: string;
  subject: string;
  from?: string;
  replyTo?: string;
}

interface DirectEmailData extends BaseEmailData {
  html?: string;
  text?: string;
}

interface TemplateEmailData extends BaseEmailData {
  template: string;
  templateData: Record<string, any>;
}

type EmailData = DirectEmailData | TemplateEmailData;

interface WelcomeEmailData {
  userName: string;
  userEmail: string;
  accountType: 'buyer' | 'creator';
  dashboardUrl?: string;
  loginUrl?: string;
}

interface EmailEventData {
  eventType: string;
  userId?: string;
  userEmail: string;
  userName?: string;
  metadata?: Record<string, any>;
  timestamp: string;
}

// PRD 2.1: Enhanced email trigger types for engagement and conversion
interface OnboardingEmailData {
  userEmail: string;
  userName: string;
  userId: string;
  completedSteps: number;
  totalSteps: number;
  skipped: boolean;
}

interface EngagementEmailData {
  userEmail: string;
  userName: string;
  userId: string;
  eventType: 'first_search' | 'first_save' | 'daily_return' | 'weekly_return';
  metadata?: {
    searchQuery?: string;
    titlesSaved?: number;
    daysSinceSignup?: number;
  };
}

interface ConversionEmailData {
  userEmail: string;
  userName: string;
  userId: string;
  currentTier: string;
  targetTier: 'pro' | 'suite';
  triggerEvent: 'premium_content_view' | 'contact_attempt' | 'multiple_saves' | 'extended_usage';
  metadata?: {
    contentTitle?: string;
    savesCount?: number;
    usageDays?: number;
  };
}

/**
 * Core email sending service using Supabase Edge Function with centralized tracking
 */
export class EmailService {
  private static instance: EmailService;
  private emailLogsTableExists: boolean | null = null;

  public static getInstance(): EmailService {
    if (!EmailService.instance) {
      EmailService.instance = new EmailService();
    }
    return EmailService.instance;
  }

  /**
   * Check if email_logs table exists in the database
   * DISABLED: Table doesn't exist and causes OAuth signup timeouts
   */
  private async checkEmailLogsTableExists(): Promise<boolean> {
    // Fast path: Return false immediately since table doesn't exist
    // This prevents slow/failing database queries during OAuth signup
    if (this.emailLogsTableExists !== null) {
      return this.emailLogsTableExists;
    }

    // Set to false without database query to avoid OAuth timeouts
    this.emailLogsTableExists = false;
    console.log('📧 Email logs table check disabled (table does not exist)');
    return false;
  }

  /**
   * Check if an email has already been sent to prevent duplicates
   */
  private async hasEmailBeenSent(userEmail: string, emailType: string): Promise<boolean> {
    // Check if email_logs table exists first
    const tableExists = await this.checkEmailLogsTableExists();
    if (!tableExists) {
      console.log('📧 Email logs table not available, skipping duplicate check');
      return false; // Allow sending if table doesn't exist
    }

    try {
      const { data, error } = await supabase
        .from('email_logs')
        .select('id')
        .eq('user_email', userEmail.toLowerCase())
        .eq('email_type', emailType)
        .eq('status', 'sent')
        .maybeSingle();

      if (error) {
        console.warn('⚠️ Could not check email logs:', error);
        return false; // Allow sending if we can't check
      }

      return !!data;
    } catch (error) {
      console.warn('⚠️ Could not check email logs:', error);
      return false; // Allow sending if we can't check
    }
  }

  /**
   * Log email attempt for tracking and deduplication
   */
  private async logEmailAttempt(userEmail: string, emailType: string, status: 'sent' | 'failed', messageId?: string, error?: string): Promise<void> {
    // Check if email_logs table exists first
    const tableExists = await this.checkEmailLogsTableExists();
    if (!tableExists) {
      console.log('📧 Email logs table not available, skipping email logging');
      return;
    }

    try {
      await supabase
        .from('email_logs')
        .insert({
          user_email: userEmail.toLowerCase(),
          email_type: emailType,
          status,
          message_id: messageId,
          error_message: error,
          sent_at: new Date().toISOString()
        });
    } catch (logError) {
      console.warn('⚠️ Could not log email attempt:', logError);
      // Don't fail the email send if logging fails
    }
  }

  /**
   * Send email using Supabase Edge Function with Resend
   */
  async sendEmail(emailData: EmailData): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      console.log('📧 Sending email:', { to: emailData.to, subject: emailData.subject });

      const { data, error } = await supabase.functions.invoke('send-email', {
        body: emailData
      });

      if (error) {
        console.error('❌ Email service error:', error);
        return { success: false, error: error.message };
      }

      console.log('✅ Email sent successfully:', data?.messageId);
      return { success: true, messageId: data?.messageId };
    } catch (error) {
      console.error('❌ Email sending failed:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  /**
   * Send welcome email to new users with duplicate prevention and OAuth metadata sync
   */
  async sendWelcomeEmail(data: WelcomeEmailData): Promise<{ success: boolean; messageId?: string; error?: string }> {
    const emailType = 'welcome';
    const userEmail = data.userEmail.toLowerCase();

    // Check if we've already sent a welcome email to this user
    const alreadySent = await this.hasEmailBeenSent(userEmail, emailType);
    if (alreadySent) {
      console.log(`🔄 Welcome email already sent to ${userEmail}, skipping duplicate`);
      return { success: true, error: 'Email already sent (duplicate prevented)' };
    }

    // OAuth Metadata Sync: Ensure metadata matches database for OAuth users (with timeout protection)
    let finalAccountType = data.accountType;
    try {
      console.log(`🔍 OAuth Sync: Checking metadata for ${userEmail} (${data.accountType})`);

      // Add timeout protection to prevent hanging
      const syncWithTimeout = async () => {
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('OAuth metadata sync timeout after 60 seconds')), 60000)
        );

        const syncPromise = (async () => {
          // Get current user for OAuth detection and metadata update
          const currentUser = await getCurrentUserForSync();

          // Sync OAuth user metadata (email users are skipped automatically)
          return await syncOAuthUserMetadata(
            userEmail,
            data.accountType,
            currentUser
          );
        })();

        return await Promise.race([syncPromise, timeoutPromise]);
      };

      const correctedAccountType = await syncWithTimeout();

      if (correctedAccountType !== data.accountType) {
        console.log(`✅ OAuth Sync: Account type corrected for welcome email - ${data.accountType} → ${correctedAccountType}`);
        finalAccountType = correctedAccountType;
      }

    } catch (error) {
      console.warn('⚠️ OAuth Sync: Metadata sync failed/timed out, using original account type:', error);
      // Continue with original account type - don't fail email sending
    }

    const subject = `Welcome to KStoryBridge, ${data.userName}! 🎉`;

    console.log(`📧 Sending welcome email to ${userEmail} (${finalAccountType})`);

    // Use corrected account type for email template data
    const emailData = {
      ...data,
      accountType: finalAccountType
    };

    const result = await this.sendEmail({
      to: data.userEmail,
      subject,
      template: 'welcome',
      templateData: emailData,
      from: 'KStoryBridge Team <welcome@kstorybridge.com>'
    });

    // Log the attempt
    await this.logEmailAttempt(
      userEmail,
      emailType,
      result.success ? 'sent' : 'failed',
      result.messageId,
      result.error
    );

    return result;
  }

  /**
   * Send email verification reminder
   */
  async sendVerificationReminder(email: string, userName: string): Promise<{ success: boolean; messageId?: string; error?: string }> {
    return this.sendEmail({
      to: email,
      subject: 'Please verify your email address',
      html: this.getVerificationReminderHTML(userName, email),
      text: this.getVerificationReminderText(userName)
    });
  }

  /**
   * Send password reset confirmation
   */
  async sendPasswordResetConfirmation(email: string, userName: string): Promise<{ success: boolean; messageId?: string; error?: string }> {
    return this.sendEmail({
      to: email,
      subject: 'Your password has been reset',
      html: this.getPasswordResetHTML(userName),
      text: this.getPasswordResetText(userName)
    });
  }

  /**
   * Send account tier upgrade notification
   */
  async sendTierUpgradeEmail(email: string, userName: string, newTier: string): Promise<{ success: boolean; messageId?: string; error?: string }> {
    return this.sendEmail({
      to: email,
      subject: `Account upgraded to ${newTier.charAt(0).toUpperCase() + newTier.slice(1)} tier!`,
      html: this.getTierUpgradeHTML(userName, newTier),
      text: this.getTierUpgradeText(userName, newTier)
    });
  }

  // PRD 2.1: Automated email triggers for engagement and conversion

  /**
   * Send onboarding completion celebration email
   */
  async sendOnboardingCompletionEmail(data: OnboardingEmailData): Promise<{ success: boolean; messageId?: string; error?: string }> {
    const emailType = 'onboarding_completion';

    // Check for duplicates
    const alreadySent = await this.hasEmailBeenSent(data.userEmail, emailType);
    if (alreadySent) {
      console.log(`🔄 Onboarding completion email already sent to ${data.userEmail}`);
      return { success: true, error: 'Email already sent (duplicate prevented)' };
    }

    const subject = data.skipped
      ? "Getting started with KStoryBridge - We're here to help!"
      : "🎉 Welcome aboard! You're all set to discover amazing content";

    const result = await this.sendEmail({
      to: data.userEmail,
      subject,
      template: 'onboarding_completion',
      templateData: data,
      from: 'KStoryBridge Team <onboarding@kstorybridge.com>'
    });

    await this.logEmailAttempt(data.userEmail, emailType, result.success ? 'sent' : 'failed', result.messageId, result.error);
    return result;
  }

  /**
   * Send engagement milestone emails (first search, save, return visits)
   */
  async sendEngagementEmail(data: EngagementEmailData): Promise<{ success: boolean; messageId?: string; error?: string }> {
    const emailType = `engagement_${data.eventType}`;

    // Check for duplicates (some engagement emails should only be sent once)
    const alreadySent = await this.hasEmailBeenSent(data.userEmail, emailType);
    if (alreadySent && ['first_search', 'first_save'].includes(data.eventType)) {
      console.log(`🔄 Engagement email ${data.eventType} already sent to ${data.userEmail}`);
      return { success: true, error: 'Email already sent (duplicate prevented)' };
    }

    const emailConfigs = {
      first_search: {
        subject: "Great first search! Here's what else you can discover",
        template: 'engagement_first_search'
      },
      first_save: {
        subject: "🔖 Title saved! Building your perfect content collection",
        template: 'engagement_first_save'
      },
      daily_return: {
        subject: "Welcome back! New content recommendations await",
        template: 'engagement_daily_return'
      },
      weekly_return: {
        subject: "We missed you! Check out this week's hottest Korean content",
        template: 'engagement_weekly_return'
      }
    };

    const config = emailConfigs[data.eventType];
    if (!config) {
      console.warn(`Unknown engagement event type: ${data.eventType}`);
      return { success: false, error: 'Unknown engagement event type' };
    }

    const result = await this.sendEmail({
      to: data.userEmail,
      subject: config.subject,
      template: config.template,
      templateData: data,
      from: 'KStoryBridge Team <engagement@kstorybridge.com>'
    });

    await this.logEmailAttempt(data.userEmail, emailType, result.success ? 'sent' : 'failed', result.messageId, result.error);
    return result;
  }

  /**
   * Send conversion emails to encourage Pro upgrades
   */
  async sendConversionEmail(data: ConversionEmailData): Promise<{ success: boolean; messageId?: string; error?: string }> {
    const emailType = `conversion_${data.triggerEvent}`;

    // Check for recent conversion emails (don't spam users)
    const recentEmailSent = await this.hasRecentEmailBeenSent(data.userEmail, 'conversion_', 7); // 7 days cooldown
    if (recentEmailSent) {
      console.log(`🔄 Recent conversion email sent to ${data.userEmail}, respecting cooldown`);
      return { success: true, error: 'Conversion email cooldown active' };
    }

    const emailConfigs = {
      premium_content_view: {
        subject: "🔓 Unlock full access to premium Korean content",
        template: 'conversion_premium_view'
      },
      contact_attempt: {
        subject: "Connect directly with creators - Upgrade to Pro!",
        template: 'conversion_contact_attempt'
      },
      multiple_saves: {
        subject: "📚 You're building a great collection! Unlock Pro features",
        template: 'conversion_multiple_saves'
      },
      extended_usage: {
        subject: "🌟 You're a power user! Time for Pro benefits",
        template: 'conversion_extended_usage'
      }
    };

    const config = emailConfigs[data.triggerEvent];
    if (!config) {
      console.warn(`Unknown conversion trigger: ${data.triggerEvent}`);
      return { success: false, error: 'Unknown conversion trigger' };
    }

    const result = await this.sendEmail({
      to: data.userEmail,
      subject: config.subject,
      template: config.template,
      templateData: data,
      from: 'KStoryBridge Team <growth@kstorybridge.com>'
    });

    await this.logEmailAttempt(data.userEmail, emailType, result.success ? 'sent' : 'failed', result.messageId, result.error);
    return result;
  }

  /**
   * Check if a recent email of a certain type has been sent (for conversion cooldowns)
   */
  private async hasRecentEmailBeenSent(userEmail: string, emailTypePrefix: string, daysCooldown: number): Promise<boolean> {
    const tableExists = await this.checkEmailLogsTableExists();
    if (!tableExists) return false;

    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysCooldown);

      const { data, error } = await supabase
        .from('email_logs')
        .select('id')
        .eq('user_email', userEmail.toLowerCase())
        .like('email_type', `${emailTypePrefix}%`)
        .eq('status', 'sent')
        .gte('sent_at', cutoffDate.toISOString())
        .limit(1);

      if (error) {
        console.warn('⚠️ Could not check recent email logs:', error);
        return false;
      }

      return data && data.length > 0;
    } catch (error) {
      console.warn('⚠️ Could not check recent email logs:', error);
      return false;
    }
  }

  /**
   * Generic event-based email sender
   */
  async sendEventEmail(eventData: EmailEventData): Promise<{ success: boolean; messageId?: string; error?: string }> {
    const emailConfig = this.getEmailConfigForEvent(eventData.eventType);
    
    if (!emailConfig) {
      console.log(`📧 No email configuration for event: ${eventData.eventType}`);
      return { success: true }; // Not all events need emails
    }

    const subject = emailConfig.subject(eventData);
    const { html, text } = emailConfig.template(eventData);

    return this.sendEmail({
      to: eventData.userEmail,
      subject,
      html,
      text,
      from: emailConfig.from
    });
  }

  /**
   * Log email event for analytics
   */
  private async logEmailEvent(eventType: string, recipient: string, success: boolean, messageId?: string): Promise<void> {
    // Check if email_logs table exists first
    const tableExists = await this.checkEmailLogsTableExists();
    if (!tableExists) {
      console.log('📧 Email logs table not available, skipping event logging');
      return;
    }

    try {
      await supabase.from('email_logs').insert({
        event_type: eventType,
        recipient,
        success,
        message_id: messageId,
        sent_at: new Date().toISOString()
      });
    } catch (error) {
      console.error('Failed to log email event:', error);
    }
  }

  // Email template helpers
  private getVerificationReminderHTML(userName: string, email: string): string {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Email Verification Required</h2>
        <p>Hi ${userName},</p>
        <p>We noticed you haven't verified your email address yet. Please check your inbox for a verification email.</p>
        <p>If you didn't receive it, you can request a new verification email from your dashboard.</p>
        <p>Email: ${email}</p>
        <p>Best regards,<br>The KStoryBridge Team</p>
      </div>
    `;
  }

  private getVerificationReminderText(userName: string): string {
    return `Hi ${userName},\n\nWe noticed you haven't verified your email address yet. Please check your inbox for a verification email.\n\nIf you didn't receive it, you can request a new verification email from your dashboard.\n\nBest regards,\nThe KStoryBridge Team`;
  }

  private getPasswordResetHTML(userName: string): string {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Password Reset Successful</h2>
        <p>Hi ${userName},</p>
        <p>Your password has been successfully reset. You can now sign in with your new password.</p>
        <p>If you didn't request this change, please contact our support team immediately.</p>
        <p>Best regards,<br>The KStoryBridge Team</p>
      </div>
    `;
  }

  private getPasswordResetText(userName: string): string {
    return `Hi ${userName},\n\nYour password has been successfully reset. You can now sign in with your new password.\n\nIf you didn't request this change, please contact our support team immediately.\n\nBest regards,\nThe KStoryBridge Team`;
  }

  private getTierUpgradeHTML(userName: string, newTier: string): string {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Account Upgraded! 🎉</h2>
        <p>Hi ${userName},</p>
        <p>Great news! Your account has been upgraded to <strong>${newTier.charAt(0).toUpperCase() + newTier.slice(1)}</strong> tier.</p>
        <p>You now have access to premium features and content. Visit your dashboard to explore what's new!</p>
        <p>Best regards,<br>The KStoryBridge Team</p>
      </div>
    `;
  }

  private getTierUpgradeText(userName: string, newTier: string): string {
    return `Hi ${userName},\n\nGreat news! Your account has been upgraded to ${newTier.charAt(0).toUpperCase() + newTier.slice(1)} tier.\n\nYou now have access to premium features and content. Visit your dashboard to explore what's new!\n\nBest regards,\nThe KStoryBridge Team`;
  }

  private getEmailConfigForEvent(eventType: string) {
    const configs = {
      'user_signup': {
        from: 'KStoryBridge <welcome@kstorybridge.com>',
        subject: (data: EmailEventData) => `Welcome to KStoryBridge, ${data.userName || 'there'}!`,
        template: (data: EmailEventData) => ({
          html: `<p>Welcome ${data.userName || 'there'}! Thanks for joining KStoryBridge.</p>`,
          text: `Welcome ${data.userName || 'there'}! Thanks for joining KStoryBridge.`
        })
      },
      'tier_upgrade': {
        from: 'KStoryBridge <notifications@kstorybridge.com>',
        subject: (data: EmailEventData) => `Account Upgraded - ${data.metadata?.newTier || 'Premium'}`,
        template: (data: EmailEventData) => ({
          html: this.getTierUpgradeHTML(data.userName || 'User', data.metadata?.newTier || 'Premium'),
          text: this.getTierUpgradeText(data.userName || 'User', data.metadata?.newTier || 'Premium')
        })
      }
    };

    return configs[eventType as keyof typeof configs];
  }
}

// Export singleton instance
export const emailService = EmailService.getInstance();

// Convenience functions for common email types
export const sendWelcomeEmail = (data: WelcomeEmailData) => emailService.sendWelcomeEmail(data);
export const sendVerificationReminder = (email: string, userName: string) => emailService.sendVerificationReminder(email, userName);
export const sendPasswordResetConfirmation = (email: string, userName: string) => emailService.sendPasswordResetConfirmation(email, userName);
export const sendTierUpgradeEmail = (email: string, userName: string, newTier: string) => emailService.sendTierUpgradeEmail(email, userName, newTier);
export const sendEventEmail = (eventData: EmailEventData) => emailService.sendEventEmail(eventData);

// PRD 2.1: New automated email triggers
export const sendOnboardingCompletionEmail = (data: OnboardingEmailData) => emailService.sendOnboardingCompletionEmail(data);
export const sendEngagementEmail = (data: EngagementEmailData) => emailService.sendEngagementEmail(data);
export const sendConversionEmail = (data: ConversionEmailData) => emailService.sendConversionEmail(data);

// Export types for use in other modules
export type {
  WelcomeEmailData,
  EmailEventData,
  OnboardingEmailData,
  EngagementEmailData,
  ConversionEmailData
};

/**
 * PRD 2.1: Email trigger utilities for easy integration
 * These functions make it easy to trigger emails from various parts of the app
 */

/**
 * Trigger engagement email when user performs first search
 */
export const triggerFirstSearchEmail = async (userId: string, userEmail: string, userName: string, searchQuery: string) => {
  return sendEngagementEmail({
    userEmail,
    userName,
    userId,
    eventType: 'first_search',
    metadata: { searchQuery }
  });
};

/**
 * Trigger engagement email when user saves first title
 */
export const triggerFirstSaveEmail = async (userId: string, userEmail: string, userName: string) => {
  return sendEngagementEmail({
    userEmail,
    userName,
    userId,
    eventType: 'first_save'
  });
};

/**
 * Trigger conversion email when user tries to view premium content
 * TEMPORARILY DISABLED: Email templates not yet implemented in edge function
 */
export const triggerPremiumContentEmail = async (
  userId: string,
  userEmail: string,
  userName: string,
  currentTier: string,
  contentTitle: string
) => {
  // TEMPORARY: Disable conversion emails until templates are added to edge function
  console.log('🚫 Conversion email temporarily disabled:', {
    type: 'premium_content_view',
    userEmail,
    currentTier,
    contentTitle
  });
  return { success: true, error: 'Conversion emails temporarily disabled' };

  // TODO: Re-enable once templates are added to Supabase edge function
  // if (currentTier === 'basic') {
  //   return sendConversionEmail({
  //     userEmail,
  //     userName,
  //     userId,
  //     currentTier,
  //     targetTier: 'pro',
  //     triggerEvent: 'premium_content_view',
  //     metadata: { contentTitle }
  //   });
  // }
};

/**
 * Trigger conversion email when basic user tries to contact creator
 * TEMPORARILY DISABLED: Email templates not yet implemented in edge function
 */
export const triggerContactAttemptEmail = async (
  userId: string,
  userEmail: string,
  userName: string,
  currentTier: string
) => {
  // TEMPORARY: Disable conversion emails until templates are added to edge function
  console.log('🚫 Conversion email temporarily disabled:', {
    type: 'contact_attempt',
    userEmail,
    currentTier
  });
  return { success: true, error: 'Conversion emails temporarily disabled' };

  // TODO: Re-enable once templates are added to Supabase edge function
  // if (currentTier === 'basic') {
  //   return sendConversionEmail({
  //     userEmail,
  //     userName,
  //     userId,
  //     currentTier,
  //     targetTier: 'pro',
  //     triggerEvent: 'contact_attempt'
  //   });
  // }
};

/**
 * Trigger conversion email when user has saved multiple titles (5+)
 * TEMPORARILY DISABLED: Email templates not yet implemented in edge function
 */
export const triggerMultipleSavesEmail = async (
  userId: string,
  userEmail: string,
  userName: string,
  currentTier: string,
  savesCount: number
) => {
  // TEMPORARY: Disable conversion emails until templates are added to edge function
  console.log('🚫 Conversion email temporarily disabled:', {
    type: 'multiple_saves',
    userEmail,
    currentTier,
    savesCount
  });
  return { success: true, error: 'Conversion emails temporarily disabled' };

  // TODO: Re-enable once templates are added to Supabase edge function
  // if (currentTier === 'basic' && savesCount >= 5) {
  //   return sendConversionEmail({
  //     userEmail,
  //     userName,
  //     userId,
  //     currentTier,
  //     targetTier: 'pro',
  //     triggerEvent: 'multiple_saves',
  //     metadata: { savesCount }
  //   });
  // }
};