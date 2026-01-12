import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface SlackNotificationData {
  event: string;
  userType: 'buyer' | 'creator';
  fullName: string;
  email: string;
  company?: string;
  authType?: 'email' | 'google' | 'oauth';
  timestamp?: string;
  timezone?: string;
  additionalInfo?: Record<string, unknown>;
}

/**
 * Format notification data into Slack blocks for rich messaging
 */
function formatSlackMessage(data: SlackNotificationData) {
  const timestamp = data.timestamp || new Date().toISOString();
  const formattedTime = new Date(timestamp).toLocaleString('en-US', {
    timeZone: data.timezone || 'America/Los_Angeles',
    dateStyle: 'medium',
    timeStyle: 'short',
  });

  // Choose emoji based on event type
  const eventEmoji = data.event.toLowerCase().includes('signup') ? ':tada:' :
                     data.event.toLowerCase().includes('signin') ? ':wave:' :
                     ':bell:';

  // Build the main message text
  const headerText = `${eventEmoji} *${data.event}*`;

  // Build fields for the message
  const fields = [
    {
      type: 'mrkdwn',
      text: `*Name:*\n${data.fullName || 'N/A'}`,
    },
    {
      type: 'mrkdwn',
      text: `*Email:*\n${data.email}`,
    },
  ];

  if (data.company) {
    fields.push({
      type: 'mrkdwn',
      text: `*Company:*\n${data.company}`,
    });
  }

  if (data.authType) {
    fields.push({
      type: 'mrkdwn',
      text: `*Auth Method:*\n${data.authType === 'google' ? 'Google OAuth' : 'Email/Password'}`,
    });
  }

  // Add any additional info
  if (data.additionalInfo) {
    for (const [key, value] of Object.entries(data.additionalInfo)) {
      if (value !== null && value !== undefined && value !== '') {
        const formattedKey = key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
        fields.push({
          type: 'mrkdwn',
          text: `*${formattedKey}:*\n${String(value)}`,
        });
      }
    }
  }

  // Build Slack blocks
  const blocks = [
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: headerText,
      },
    },
    {
      type: 'section',
      fields: fields.slice(0, 10), // Slack limits to 10 fields per section
    },
    {
      type: 'context',
      elements: [
        {
          type: 'mrkdwn',
          text: `${data.userType === 'buyer' ? ':briefcase: Buyer' : ':art: Creator'} | ${formattedTime}`,
        },
      ],
    },
  ];

  return {
    blocks,
    text: `${data.event}: ${data.fullName} (${data.email})`, // Fallback text
  };
}

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Get Slack webhook URL from environment
    const SLACK_WEBHOOK_URL = Deno.env.get('SLACK_WEBHOOK_URL');

    if (!SLACK_WEBHOOK_URL) {
      console.error('[Slack Proxy] SLACK_WEBHOOK_URL not configured');
      return new Response(
        JSON.stringify({ error: 'Slack webhook not configured' }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Parse request body
    const data: SlackNotificationData = await req.json();

    if (!data.event || !data.email) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: event, email' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    console.log(`[Slack Proxy] Sending notification: ${data.event} for ${data.email}`);

    // Format the Slack message
    const slackPayload = formatSlackMessage(data);

    // Send to Slack webhook
    const slackResponse = await fetch(SLACK_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(slackPayload),
    });

    if (!slackResponse.ok) {
      const errorText = await slackResponse.text();
      console.error(`[Slack Proxy] Slack API error: ${slackResponse.status} - ${errorText}`);
      return new Response(
        JSON.stringify({ error: 'Failed to send Slack notification', details: errorText }),
        {
          status: 502,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    console.log(`[Slack Proxy] Notification sent successfully`);

    return new Response(
      JSON.stringify({ success: true }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('[Slack Proxy] Error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', message: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
