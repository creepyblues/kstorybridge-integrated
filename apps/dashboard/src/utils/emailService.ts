import { supabase } from '@/integrations/supabase/client';

interface AdminNotificationPayload {
  requestId: string;
  titleId: string;
  userId: string;
  type: string;
  requestorName: string;
  titleName: string;
}

export const sendAdminNotification = async (payload: AdminNotificationPayload): Promise<void> => {
  try {
    console.log('Sending admin notification:', payload);
    
    const { data, error } = await supabase.functions.invoke('send-admin-notification', {
      body: payload
    });

    if (error) {
      console.error('Error calling send-admin-notification function:', error);
      throw error;
    }

    console.log('Admin notification sent successfully:', data);
  } catch (error) {
    console.error('Failed to send admin notification:', error);
    // Don't throw error to prevent disrupting the main request flow
    // The request should still be recorded even if email notification fails
  }
};