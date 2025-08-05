/**
 * Utility functions for sending Slack notifications
 */

export interface SlackNotificationData {
  event: string;
  userType: 'buyer' | 'creator';
  fullName: string;
  email: string;
  company?: string;
  additionalInfo?: Record<string, any>;
}

export const sendSlackNotification = async (data: SlackNotificationData): Promise<void> => {
  const webhookUrl = import.meta.env.VITE_SLACK_WEBHOOK_URL;
  
  console.log('🔍 Debug: Slack webhook URL:', webhookUrl ? 'Found' : 'Missing');
  console.log('🔍 Debug: Notification data:', data);
  
  if (!webhookUrl) {
    console.warn('❌ Slack webhook URL not configured in environment variables');
    return;
  }

  try {
    // Create formatted message
    const message = formatSlackMessage(data);
    console.log('🔍 Debug: Formatted message:', message);
    
    const payload = {
      text: message,
      username: 'KStoryBridge Bot',
      icon_emoji: ':bell:',
    };
    
    console.log('🔍 Debug: Sending payload to Slack:', payload);
    console.log('🔍 Debug: Webhook URL (partial):', webhookUrl.substring(0, 50) + '...');
    
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
    
    console.log('🔍 Debug: Response status:', response.status);
    console.log('🔍 Debug: Response ok:', response.ok);
    
    if (!response.ok) {
      const responseText = await response.text();
      console.error('❌ Failed to send Slack notification:', response.status, response.statusText);
      console.error('❌ Response body:', responseText);
    } else {
      console.log('✅ Slack notification sent successfully!');
    }
  } catch (error) {
    console.error('❌ Error sending Slack notification:', error);
  }
};

const formatSlackMessage = (data: SlackNotificationData): string => {
  const { event, userType, fullName, email, company, additionalInfo } = data;
  
  const userTypeEmoji = userType === 'buyer' ? '🛒' : '✍️';
  const eventEmoji = getEventEmoji(event);
  
  let message = `${eventEmoji} *${event}*\n`;
  message += `${userTypeEmoji} *Type:* ${userType === 'buyer' ? 'Content Buyer' : 'IP Owner/Creator'}\n`;
  message += `👤 *Name:* ${fullName}\n`;
  message += `📧 *Email:* ${email}\n`;
  
  if (company) {
    message += `🏢 *Company:* ${company}\n`;
  }
  
  if (additionalInfo) {
    Object.entries(additionalInfo).forEach(([key, value]) => {
      if (value) {
        const formattedKey = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
        message += `• *${formattedKey}:* ${value}\n`;
      }
    });
  }
  
  message += `\n⏰ *Time:* ${new Date().toLocaleString('en-US', { 
    timeZone: 'America/New_York',
    dateStyle: 'short',
    timeStyle: 'short'
  })}`;
  
  return message;
};

const getEventEmoji = (event: string): string => {
  const eventEmojiMap: Record<string, string> = {
    'New Buyer Signup': '🎉',
    'New Creator Signup': '🌟',
    'User Login': '🔑',
    'Profile Updated': '✏️',
    'Title Added': '📚',
    'Contact Request': '📞',
  };
  
  return eventEmojiMap[event] || '📢';
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
      note: 'This is a test message from KStoryBridge'
    }
  });
};

// Make it available globally for browser console testing
if (typeof window !== 'undefined') {
  (window as any).testSlackNotification = testSlackNotification;
}

// Convenience functions for common events
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