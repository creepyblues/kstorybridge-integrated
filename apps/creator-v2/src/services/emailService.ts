import { supabase } from '../lib/supabase'

interface WelcomeEmailData {
  userName: string
  userEmail: string
  accountType: 'buyer' | 'creator'
  dashboardUrl?: string
  loginUrl?: string
}

interface EmailResult {
  success: boolean
  messageId?: string
  error?: string
}

/**
 * Email Service for Creator App
 *
 * Simplified email service that calls the shared Supabase edge function
 * for sending emails using Resend API.
 */
class EmailService {
  private static instance: EmailService

  public static getInstance(): EmailService {
    if (!EmailService.instance) {
      EmailService.instance = new EmailService()
    }
    return EmailService.instance
  }

  /**
   * Send welcome email to new creator users
   *
   * @param data - Welcome email data including user info and app URLs
   * @returns Promise with success status and optional message ID or error
   */
  async sendWelcomeEmail(data: WelcomeEmailData): Promise<EmailResult> {
    try {
      console.log('📧 Sending welcome email to:', data.userEmail)

      // Call Supabase edge function to send email
      const { data: result, error } = await supabase.functions.invoke('send-email', {
        body: {
          to: data.userEmail,
          subject: `Welcome to KStoryBridge, ${data.userName}! 🎉`,
          template: 'welcome',
          templateData: {
            userName: data.userName,
            userEmail: data.userEmail,
            accountType: data.accountType,
            dashboardUrl: data.dashboardUrl,
            loginUrl: data.loginUrl,
          },
          from: 'KStoryBridge Team <welcome@kstorybridge.com>',
        },
      })

      if (error) {
        console.error('❌ Email service error:', error)
        return {
          success: false,
          error: error.message || 'Failed to send email',
        }
      }

      console.log('✅ Welcome email sent successfully:', result?.messageId)
      return {
        success: true,
        messageId: result?.messageId,
      }
    } catch (error) {
      console.error('❌ Email sending failed:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }
}

// Export singleton instance
export const emailService = EmailService.getInstance()

/**
 * Convenience function for sending welcome emails
 *
 * Note: This function will NOT throw errors or block signup flow.
 * Email failures are logged but don't prevent user registration.
 *
 * @param data - Welcome email data
 * @returns Promise with email result
 */
export async function sendWelcomeEmail(data: WelcomeEmailData): Promise<EmailResult> {
  try {
    return await emailService.sendWelcomeEmail(data)
  } catch (error) {
    // Log but don't throw - email failures shouldn't block signup
    console.warn('⚠️ Welcome email failed (non-blocking):', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

// Export types
export type { WelcomeEmailData, EmailResult }
