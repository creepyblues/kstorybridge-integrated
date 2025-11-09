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
