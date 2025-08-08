/**
 * Utility functions for sending Slack notifications
 */

export interface SlackNotificationData {
  event: string;
  userType: 'buyer' | 'creator';
  fullName: string;
  email: string;
  company?: string;
  additionalInfo?: Record<string, unknown>;
}

export const sendSlackNotification = async (data: SlackNotificationData): Promise<void> => {
  // Use Supabase Edge Function to proxy the Slack webhook request
  // This avoids CORS issues when making requests directly from the browser
  const SUPABASE_URL = "https://dlrnrgcoguxlkkcitlpd.supabase.co";
  const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRscm5yZ2NvZ3V4bGtrY2l0bHBkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE3OTIzMzQsImV4cCI6MjA2NzM2ODMzNH0.KWYF7TvoA0I3iyoIbyYIyTSlJcIyPH6yCfHueEEMIlA";
  
  const proxyUrl = `${SUPABASE_URL}/functions/v1/slack-webhook-proxy`;
  
  console.log('🔍 Debug: Using Slack proxy endpoint');
  console.log('🔍 Debug: Notification data:', data);
  
  try {
    console.log('🔍 Debug: Sending to proxy endpoint:', proxyUrl);
    
    const response = await fetch(proxyUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify(data),
    });
    
    console.log('🔍 Debug: Proxy response status:', response.status);
    console.log('🔍 Debug: Proxy response ok:', response.ok);
    
    if (!response.ok) {
      const responseText = await response.text();
      console.error('❌ Failed to send Slack notification via proxy:', response.status, response.statusText);
      console.error('❌ Response body:', responseText);
    } else {
      const result = await response.json();
      console.log('✅ Slack notification sent successfully via proxy!', result);
    }
  } catch (error) {
    console.error('❌ Error sending Slack notification via proxy:', error);
  }
};


// Test function for debugging
export const testSlackNotification = async () => {
  console.log('🧪 Testing Slack notification...');
  await sendSlackNotification({
    event: 'Test Notification',
    userType: 'buyer',
    fullName: 'Test User',
    email: 'test@example.com',
    company: 'Test Company',
    additionalInfo: {
      note: 'This is a test message from KStoryBridge Dashboard'
    }
  });
};

// Make it available globally for browser console testing
if (typeof window !== 'undefined') {
  (window as typeof window & { testSlackNotification: typeof testSlackNotification }).testSlackNotification = testSlackNotification;
}

// Convenience function for pitch request notifications
export const notifyPitchRequest = async (requestData: {
  userFullName: string;
  userEmail: string;
  titleName: string;
  titleId: string;
  requestType: string;
  company?: string;
}) => {
  await sendSlackNotification({
    event: 'Pitch Document Requested',
    userType: 'buyer', // Assuming pitch requests come from buyers
    fullName: requestData.userFullName,
    email: requestData.userEmail,
    company: requestData.company,
    additionalInfo: {
      titleName: requestData.titleName,
      titleId: requestData.titleId,
      requestType: requestData.requestType,
      dashboardUrl: `https://dashboard.kstorybridge.com/titles/${requestData.titleId}`,
    }
  });
};

// Convenience functions for common events (existing ones for compatibility)
export const notifyBuyerSignup = async (userData: {
  fullName: string;
  email: string;  
  company?: string;
  role?: string;
  linkedinUrl?: string;
}) => {
  await sendSlackNotification({
    event: 'New Buyer Signup',
    userType: 'buyer',
    fullName: userData.fullName,
    email: userData.email,
    company: userData.company,
    additionalInfo: {
      role: userData.role,
      linkedinUrl: userData.linkedinUrl,
    }
  });
};

export const notifyCreatorSignup = async (userData: {
  fullName: string;
  email: string;
  penName?: string;
  company?: string;
  role?: string;
  websiteUrl?: string;
}) => {
  await sendSlackNotification({
    event: 'New Creator Signup',
    userType: 'creator',
    fullName: userData.fullName,
    email: userData.email,
    company: userData.company,
    additionalInfo: {
      penName: userData.penName,
      role: userData.role,
      websiteUrl: userData.websiteUrl,
    }
  });
};