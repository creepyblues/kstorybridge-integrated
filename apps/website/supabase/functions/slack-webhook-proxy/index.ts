import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface SlackNotificationData {
  event: string
  userType: 'buyer' | 'creator'
  fullName: string
  email: string
  company?: string
  additionalInfo?: Record<string, unknown>
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Only allow POST method
    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        { 
          status: 405, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Get Slack webhook URL from environment
    const slackWebhookUrl = Deno.env.get('SLACK_WEBHOOK_URL')
    if (!slackWebhookUrl) {
      console.error('SLACK_WEBHOOK_URL environment variable not set')
      return new Response(
        JSON.stringify({ error: 'Slack webhook not configured' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Parse request body
    const notificationData: SlackNotificationData = await req.json()
    const { event, userType, fullName, email, company, additionalInfo } = notificationData

    if (!event || !userType || !fullName || !email) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: event, userType, fullName, email' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Format Slack message
    const message = formatSlackMessage(notificationData)
    
    const slackPayload = {
      text: message,
      username: 'KStoryBridge Bot',
      icon_emoji: ':bell:',
    }

    console.log('Sending Slack notification:', { event, userType, fullName, email })

    // Send request to Slack
    const slackResponse = await fetch(slackWebhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(slackPayload),
    })

    if (!slackResponse.ok) {
      const errorText = await slackResponse.text()
      console.error('Slack API error:', slackResponse.status, errorText)
      return new Response(
        JSON.stringify({ 
          error: 'Failed to send Slack notification',
          details: `Slack API returned ${slackResponse.status}: ${errorText}`
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    console.log('Slack notification sent successfully!')

    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'Slack notification sent successfully'
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Function error:', error)
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        details: error.message 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})

function formatSlackMessage(data: SlackNotificationData): string {
  const { event, userType, fullName, email, company, additionalInfo } = data
  
  const userTypeEmoji = userType === 'buyer' ? '🛒' : '✍️'
  const eventEmoji = getEventEmoji(event)
  
  let message = `${eventEmoji} *${event}*\n`
  message += `${userTypeEmoji} *Type:* ${userType === 'buyer' ? 'Content Buyer' : 'IP Owner/Creator'}\n`
  message += `👤 *Name:* ${fullName}\n`
  message += `📧 *Email:* ${email}\n`
  
  if (company) {
    message += `🏢 *Company:* ${company}\n`
  }
  
  if (additionalInfo) {
    Object.entries(additionalInfo).forEach(([key, value]) => {
      if (value) {
        const formattedKey = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())
        message += `• *${formattedKey}:* ${value}\n`
      }
    })
  }
  
  message += `\n⏰ *Time:* ${new Date().toLocaleString('en-US', { 
    timeZone: 'America/New_York',
    dateStyle: 'short',
    timeStyle: 'short'
  })}`
  
  return message
}

function getEventEmoji(event: string): string {
  const eventEmojiMap: Record<string, string> = {
    'New Buyer Signup': '🎉',
    'New Creator Signup': '🌟',
    'User Login': '🔑',
    'Profile Updated': '✏️',
    'Title Added': '📚',
    'Contact Request': '📞',
    'Pitch Document Requested': '📄',
  }
  
  return eventEmojiMap[event] || '📢'
}