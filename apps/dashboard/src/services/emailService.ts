import { supabase } from '@/lib/supabase';

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

export interface WelcomeEmailData {
  userName: string;
  userEmail: string;
  accountType: 'buyer' | 'creator';
  dashboardUrl?: string;
  loginUrl?: string;
}

export interface EmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
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
   * Send pitch deck request notification to support team
   */
  async sendPitchDeckRequestEmail(data: {
    requestorEmail: string;
    requestorName: string;
    titleName: string;
    titleId: string;
    requestDate: string;
  }): Promise<{ success: boolean; messageId?: string; error?: string }> {
    const emailBody = `
Pitch Deck Request

Requestor: ${data.requestorName} (${data.requestorEmail})
Title: ${data.titleName}
Title ID: ${data.titleId}
Date: ${data.requestDate}

Dashboard Link: https://dashboard-v2.kstorybridge.com/buyers/titles/${data.titleId}
    `.trim();

    return this.sendEmail({
      to: 'support@kstorybridge.com',
      subject: `Pitch Deck Request: ${data.titleName}`,
      text: emailBody,
      from: 'KStoryBridge <noreply@kstorybridge.com>'
    });
  }

  /**
   * Send welcome email to new buyer users
   *
   * @param data - Welcome email data including user info and app URLs
   * @returns Promise with success status and optional message ID or error
   */
  async sendWelcomeEmail(data: WelcomeEmailData): Promise<EmailResult> {
    try {
      console.log('📧 Sending welcome email to:', data.userEmail);

      const { data: result, error } = await supabase.functions.invoke('send-email', {
        body: {
          to: data.userEmail,
          subject: `Welcome to KStoryBridge, ${data.userName}! 🎉`,
          template: 'welcome',
          templateData: {
            userName: data.userName,
            userEmail: data.userEmail,
            accountType: data.accountType,
            dashboardUrl: data.dashboardUrl || 'https://dashboard.kstorybridge.com',
            loginUrl: data.loginUrl || 'https://dashboard.kstorybridge.com/signin',
          },
          from: 'KStoryBridge Team <welcome@kstorybridge.com>',
        },
      });

      if (error) {
        console.error('❌ Welcome email error:', error);
        return {
          success: false,
          error: error.message || 'Failed to send welcome email',
        };
      }

      console.log('✅ Welcome email sent successfully:', result?.messageId);
      return {
        success: true,
        messageId: result?.messageId,
      };
    } catch (error) {
      console.error('❌ Welcome email sending failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Send contact creator message to support team
   */
  async sendContactCreatorMessage(data: {
    requestorEmail: string;
    requestorName: string;
    titleName: string;
    titleId: string;
    message: string;
    requestDate: string;
  }): Promise<{ success: boolean; messageId?: string; error?: string }> {
    const emailBody = `
Contact Creator Request

From: ${data.requestorName} (${data.requestorEmail})
Title: ${data.titleName}
Title ID: ${data.titleId}
Date: ${data.requestDate}

Message:
${data.message}

Dashboard Link: https://dashboard-v2.kstorybridge.com/buyers/titles/${data.titleId}
    `.trim();

    return this.sendEmail({
      to: 'support@kstorybridge.com',
      subject: `Contact Request: ${data.titleName}`,
      text: emailBody,
      from: 'KStoryBridge <noreply@kstorybridge.com>'
    });
  }
}

// Export singleton instance
export const emailService = EmailService.getInstance();

/**
 * PRD 2.1: Email trigger utilities for conversion optimization
 */

/**
 * Trigger conversion email when user tries to view premium content
 * Note: Currently disabled until email templates are implemented in edge function
 */
export const triggerPremiumContentEmail = async (
  userId: string,
  userEmail: string,
  userName: string,
  currentTier: string,
  contentTitle: string
) => {
  // Log for now (will be enabled in future with proper email templates)
  console.log('🚫 Conversion email (premium_content_view):', {
    type: 'premium_content_view',
    userEmail,
    userName,
    userId,
    currentTier,
    contentTitle
  });

  // Return success to not block user flow
  return { success: true, error: 'Conversion emails will be enabled in a future update' };

  // TODO: Implement conversion email when templates are ready
  // This will send an email to basic tier users encouraging them to upgrade
  // when they attempt to view premium content like pitch decks
};

/**
 * Trigger conversion email when basic user tries to contact creator
 * Note: Currently disabled until email templates are implemented in edge function
 */
export const triggerContactAttemptEmail = async (
  userId: string,
  userEmail: string,
  userName: string,
  currentTier: string
) => {
  // Log for now (will be enabled in future with proper email templates)
  console.log('🚫 Conversion email (contact_attempt):', {
    type: 'contact_attempt',
    userEmail,
    userName,
    userId,
    currentTier
  });

  // Return success to not block user flow
  return { success: true, error: 'Conversion emails will be enabled in a future update' };

  // TODO: Implement conversion email when templates are ready
  // This will send an email to basic tier users encouraging them to upgrade
  // when they attempt to contact a creator
};

/**
 * Trigger engagement email when user saves first title
 * Note: Currently disabled until email templates are implemented in edge function
 */
export const triggerFirstSaveEmail = async (
  userId: string,
  userEmail: string,
  userName: string
) => {
  // Log for now (will be enabled in future with proper email templates)
  console.log('🚫 Engagement email (first_save):', {
    type: 'first_save',
    userEmail,
    userName,
    userId
  });

  // Return success to not block user flow
  return { success: true, error: 'Engagement emails will be enabled in a future update' };

  // TODO: Implement engagement email when templates are ready
  // This will send a celebration email when a user saves their first title
};

/**
 * Convenience function for sending welcome emails with deduplication
 *
 * Note: This function will NOT throw errors or block signup flow.
 * Email failures are logged but don't prevent user registration.
 * Uses sessionStorage to prevent duplicate emails within same session.
 *
 * @param data - Welcome email data
 * @returns Promise with email result
 */
export async function sendWelcomeEmail(data: WelcomeEmailData): Promise<EmailResult> {
  const welcomeEmailKey = `welcome_email_sent_${data.userEmail}`;

  // Check if already sent in this session (deduplication)
  if (typeof window !== 'undefined' && sessionStorage.getItem(welcomeEmailKey)) {
    console.log('⚠️ Welcome email already sent in this session, skipping');
    return { success: true, error: 'Already sent in this session' };
  }

  try {
    const result = await emailService.sendWelcomeEmail(data);

    // Mark as sent in this session if successful
    if (result.success && typeof window !== 'undefined') {
      sessionStorage.setItem(welcomeEmailKey, 'true');
    }

    return result;
  } catch (error) {
    // Log but don't throw - email failures shouldn't block signup
    console.warn('⚠️ Welcome email failed (non-blocking):', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
