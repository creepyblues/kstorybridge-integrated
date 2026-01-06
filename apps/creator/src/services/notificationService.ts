import { supabase } from '@/lib/supabase'

/**
 * Notification service for sending admin notifications
 * when creators submit titles for review.
 *
 * All notifications are fire-and-forget - failures should never
 * block the main user flow.
 */

export interface NotificationResult {
  success: boolean
  error?: string
}

/**
 * Notify admins when a title is submitted for review.
 *
 * Sends both email (to all active admins) and Slack notifications.
 * This is a fire-and-forget operation - failures are logged but don't
 * throw errors.
 *
 * @param draftId - UUID of the submitted draft
 * @returns Promise with success status
 */
export async function notifyTitleSubmission(draftId: string): Promise<NotificationResult> {
  try {
    const { data, error } = await supabase.functions.invoke('notify-title-submission', {
      body: {
        draftId,
        submittedAt: new Date().toISOString(),
      },
    })

    if (error) {
      console.warn('[notificationService] Notification failed (non-blocking):', error)
      return { success: false, error: error.message }
    }

    console.log('[notificationService] Notification sent successfully:', data)
    return { success: true }
  } catch (error) {
    // Log but don't throw - notification failures shouldn't block submission
    console.warn('[notificationService] Notification error (non-blocking):', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}
