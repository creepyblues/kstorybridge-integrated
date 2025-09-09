import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Email addresses and domains to exclude from Slack notifications
const EXCLUDED_EMAILS = [
  'kevin@sandstoneartists.com',
  'sungho@dadble.com',
  'creepyblues@gmail.com'
]

const EXCLUDED_DOMAINS = [
  'dadble.com',
  'kstorybridge.com'
]

/**
 * Check if an email should be excluded from Slack notifications
 */
function shouldExcludeEmail(email: string): boolean {
  if (!email) return false;
  
  const emailLower = email.toLowerCase();
  
  // Check exact email matches
  if (EXCLUDED_EMAILS.some(excluded => excluded.toLowerCase() === emailLower)) {
    console.log(`🚫 Skipping Slack notification for excluded email: ${email}`);
    return true;
  }
  
  // Check domain matches  
  const domain = emailLower.split('@')[1];
  if (domain && EXCLUDED_DOMAINS.includes(domain)) {
    console.log(`🚫 Skipping Slack notification for excluded domain: ${domain}`);
    return true;
  }
  
  return false;
}

interface SlackNotificationData {
  event: string
  userType: 'buyer' | 'creator' | 'anonymous' | 'authenticated'
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

    // Check if email should be excluded from notifications
    if (shouldExcludeEmail(email)) {
      console.log(`🚫 Notification filtered out for email: ${email}`)
      return new Response(
        JSON.stringify({ 
          success: true,
          message: 'Notification filtered - excluded email',
          filtered: true
        }),
        { 
          status: 200, 
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
  
  // Special formatting for session end events
  if (event === 'User Session Ended') {
    const isLoggedIn = additionalInfo?.isLoggedIn
    const totalDuration = additionalInfo?.totalDuration || 'Unknown'
    const pageCount = additionalInfo?.pageCount || 0
    const reason = additionalInfo?.reason || 'unknown'
    const deviceType = additionalInfo?.deviceType || 'Unknown'
    const browser = additionalInfo?.browser || 'Unknown'
    const behavior = additionalInfo?.behavior as Array<{order: number, url: string, title: string, duration: string}> || []
    
    let reasonEmoji = '🚪'
    if (reason === 'inactivity') reasonEmoji = '😴'
    else if (reason === 'navigation') reasonEmoji = '🔄'
    
    let message = `${reasonEmoji} *Session Ended (${reason})*\n`
    
    if (isLoggedIn) {
      message += `📧 *User:* ${email}\n`
    } else {
      message += `👻 *User:* Anonymous\n`
    }
    
    message += `⏱️ *Total Duration:* ${totalDuration}\n`
    message += `📄 *Pages Visited:* ${pageCount}\n`
    message += `📱 *Device:* ${deviceType} | ${browser}\n`
    
    if (additionalInfo?.referrer && additionalInfo.referrer !== 'Direct') {
      message += `📍 *Referrer:* ${additionalInfo.referrer}\n`
    }
    
    if (behavior.length > 0) {
      message += `\n🔍 *User Journey:*\n`
      behavior.forEach(page => {
        const cleanUrl = page.url.replace(/^https?:\/\//, '').replace(/\/$/, '')
        message += `${page.order}) ${cleanUrl} - ${page.duration}\n`
      })
    }
    
    message += `\n⏰ *Ended at (PT):* ${new Date().toLocaleString('en-US', { 
      timeZone: 'America/Los_Angeles',
      dateStyle: 'short',
      timeStyle: 'short'
    })}`
    
    return message
  }
  
  // Special formatting for session start events
  if (event === 'User Session Started') {
    const isLoggedIn = additionalInfo?.isLoggedIn
    const url = additionalInfo?.url || 'Unknown URL'
    const deviceType = additionalInfo?.deviceType || 'Unknown'
    const browser = additionalInfo?.browser || 'Unknown'
    const screenResolution = additionalInfo?.screenResolution || 'Unknown'
    
    if (isLoggedIn) {
      // Logged-in user format
      let message = `👤 *User Session Started (Logged In)*\n`
      message += `📧 *Email:* ${email}\n`
      message += `🔗 *URL:* ${url}\n`
      
      if (additionalInfo?.referrer && additionalInfo.referrer !== 'Direct') {
        message += `📍 *Referrer:* ${additionalInfo.referrer}\n`
      }
      
      message += `📱 *Device:* ${deviceType} | ${browser} | ${screenResolution}\n`
      
      message += `\n⏰ *Time (PT):* ${new Date().toLocaleString('en-US', { 
        timeZone: 'America/Los_Angeles',
        dateStyle: 'short',
        timeStyle: 'short'
      })}`
      
      return message
    } else {
      // Anonymous user format - simplified
      let message = `👻 *Anonymous Session Started*\n`
      message += `🔗 *URL:* ${url}\n`
      
      if (additionalInfo?.referrer && additionalInfo.referrer !== 'Direct') {
        message += `📍 *Referrer:* ${additionalInfo.referrer}\n`
      }
      
      message += `📱 *Device:* ${deviceType} | ${browser} | ${screenResolution}\n`
      
      message += `\n⏰ *Timestamp (PT):* ${new Date().toLocaleString('en-US', { 
        timeZone: 'America/Los_Angeles',
        dateStyle: 'short',
        timeStyle: 'short'
      })}`
      
      return message
    }
  }
  
  // Default formatting for other events
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
      if (value && key !== 'isLoggedIn' && key !== 'url' && key !== 'referrer') {
        const formattedKey = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())
        
        // Handle behavior field specially to avoid [object Object]
        if (key === 'behavior' && Array.isArray(value)) {
          message += `• *${formattedKey}:* ${value.length} page visits\n`
        } else if (typeof value === 'object') {
          // Convert objects to JSON string for display
          message += `• *${formattedKey}:* ${JSON.stringify(value)}\n`
        } else {
          message += `• *${formattedKey}:* ${value}\n`
        }
      }
    })
  }
  
  message += `\n⏰ *Time (PT):* ${new Date().toLocaleString('en-US', { 
    timeZone: 'America/Los_Angeles',
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