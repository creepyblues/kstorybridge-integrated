import { supabase } from '@/integrations/supabase/client';

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

/**
 * Core email sending service using Supabase Edge Function
 */
export class EmailService {
  private static instance: EmailService;
  
  public static getInstance(): EmailService {
    if (!EmailService.instance) {
      EmailService.instance = new EmailService();
    }
    return EmailService.instance;
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
   * Send welcome email to new users
   */
  async sendWelcomeEmail(data: WelcomeEmailData): Promise<{ success: boolean; messageId?: string; error?: string }> {
    const subject = `Welcome to KStoryBridge, ${data.userName}! 🎉`;
    
    return this.sendEmail({
      to: data.userEmail,
      subject,
      template: 'welcome',
      templateData: data,
      from: 'KStoryBridge Team <welcome@kstorybridge.com>'
    });
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
    try {
      // You can store email logs in Supabase for analytics
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