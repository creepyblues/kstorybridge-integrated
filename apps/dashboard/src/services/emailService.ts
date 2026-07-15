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
    titleSlug?: string;
    requestDate: string;
  }): Promise<{ success: boolean; messageId?: string; error?: string }> {
    const emailBody = `
Pitch Deck Request

Requestor: ${data.requestorName} (${data.requestorEmail})
Title: ${data.titleName}
Title ID: ${data.titleId}
Date: ${data.requestDate}

Dashboard Link: https://dashboard-v2.kstorybridge.com/buyers/titles/${data.titleSlug || data.titleId}
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
    titleSlug?: string;
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

Dashboard Link: https://dashboard-v2.kstorybridge.com/buyers/titles/${data.titleSlug || data.titleId}
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
 * Trigger engagement email when user saves first title.
 * Non-blocking, deduped per browser via localStorage.
 */
export const triggerFirstSaveEmail = async (
  _userId: string,
  userEmail: string,
  userName: string,
  titleName?: string
) => {
  const dedupKey = `first_save_email_sent_${userEmail.toLowerCase()}`;
  try {
    if (typeof window !== 'undefined' && localStorage.getItem(dedupKey)) {
      return { success: true, error: 'Already sent' };
    }
  } catch {
    // localStorage unavailable - proceed
  }

  const dashboardUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/buyers/saved`
    : 'https://dashboard.kstorybridge.com/buyers/saved';
  const escapeHtml = (value: string): string =>
    value
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  const firstName = escapeHtml(userName?.split(' ')[0] || 'there');
  const safeTitleName = titleName ? escapeHtml(titleName) : undefined;

  const result = await emailService.sendEmail({
    to: userEmail.toLowerCase(),
    subject: titleName
      ? `${titleName} is on your shortlist 🎬`
      : 'Your first title is saved 🎬',
    from: 'KStoryBridge <noreply@kstorybridge.com>',
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 32px 24px; color: #111827;">
        <h2 style="margin: 0 0 16px;">Nice pick, ${firstName}!</h2>
        <p style="font-size: 16px; line-height: 1.6; color: #374151;">
          ${safeTitleName ? `<strong>${safeTitleName}</strong> is` : 'Your first title is'} now on your shortlist.
          When you're ready, hit <strong>Express Interest</strong> on any title and our team
          will connect you with the rights holder.
        </p>
        <p style="margin: 24px 0;">
          <a href="${dashboardUrl}" style="display: inline-block; background: #000; color: #fff; padding: 12px 24px; border-radius: 9999px; text-decoration: none; font-weight: 500;">
            View your shortlist
          </a>
        </p>
        <p style="font-size: 14px; color: #6b7280; line-height: 1.6;">
          Tip: run a comps search with a show you love and we'll surface more Korean IP like it.
        </p>
      </div>
    `,
  });

  if (result.success) {
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem(dedupKey, new Date().toISOString());
      }
    } catch {
      // ignore
    }
  }

  return result;
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
