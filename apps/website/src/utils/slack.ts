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
  
  if (!webhookUrl) {
    console.warn('Slack webhook URL not configured');
    return;
  }

  try {
    // Create formatted message
    const message = formatSlackMessage(data);
    
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text: message,
        username: 'KStoryBridge Bot',
        icon_emoji: ':bell:',
        // Use blocks for richer formatting
        blocks: [
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: message
            }
          }
        ]
      }),
    });
    
    if (!response.ok) {
      console.error('Failed to send Slack notification:', response.statusText);
    } else {
      console.log('Slack notification sent successfully');
    }
  } catch (error) {
    console.error('Error sending Slack notification:', error);
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