import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface EmailData {
  to: string;
  subject: string;
  html?: string;
  text?: string;
  template?: string;
  templateData?: Record<string, unknown>;
  from?: string;
  replyTo?: string;
}

interface WelcomeTemplateData {
  userName: string;
  userEmail: string;
  accountType: 'buyer' | 'creator';
  dashboardUrl?: string;
  loginUrl?: string;
}

interface TransactionTemplateData {
  userEmail: string;
  userName: string;
  plan: string;
  price: number;
  tierUpdateSuccess: boolean;
  errorDetails?: string;
  timestamp: string;
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

    // Get Resend API key from environment
    const resendApiKey = Deno.env.get('RESEND_API_KEY')
    if (!resendApiKey) {
      console.error('RESEND_API_KEY environment variable not set')
      return new Response(
        JSON.stringify({ error: 'Email service not configured' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Parse request body
    const emailData: EmailData = await req.json()
    const { to, subject, html, text, template, templateData, from, replyTo } = emailData

    if (!to || !subject) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: to, subject' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    let emailHtml = html
    let emailText = text

    // Handle template-based emails
    if (template) {
      const templates = getEmailTemplates()
      if (templates[template]) {
        const templateResult = templates[template](templateData || {})
        emailHtml = templateResult.html
        emailText = templateResult.text
      } else {
        return new Response(
          JSON.stringify({ error: `Template '${template}' not found` }),
          { 
            status: 400, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }
    }

    // Prepare Resend payload
    const resendPayload = {
      from: from || 'KStoryBridge <noreply@kstorybridge.com>',
      to: [to],
      subject: subject,
      html: emailHtml,
      text: emailText,
      reply_to: replyTo,
    }

    console.log('Sending email via Resend:', { to, subject, template })

    // Send email via Resend API
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(resendPayload),
    })

    const responseData = await response.json()

    if (!response.ok) {
      console.error('Resend API error:', response.status, responseData)
      return new Response(
        JSON.stringify({ 
          error: 'Failed to send email',
          details: responseData
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    console.log('Email sent successfully:', responseData.id)

    return new Response(
      JSON.stringify({ 
        success: true,
        messageId: responseData.id,
        message: 'Email sent successfully'
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Email function error:', error)
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

function getEmailTemplates() {
  return {
    welcome: (data: WelcomeTemplateData) => {
      const { userName, userEmail, accountType, dashboardUrl = 'https://dashboard.kstorybridge.com', loginUrl = 'https://dashboard.kstorybridge.com/signin' } = data
      
      const accountTypeText = accountType === 'buyer' ? 'Content Buyer' : 'Content Creator'
      const welcomeMessage = accountType === 'buyer' 
        ? 'You now have access to premium Korean content for your business needs.'
        : 'You can now share your creative work with global buyers.'
      
      const nextSteps = accountType === 'buyer'
        ? [
          'Browse our catalog of premium Korean content',
          'Save your favorite titles to your watchlist',
          'Submit requests for content that matches your needs',
          'Connect directly with creators and rights holders'
        ]
        : [
          'Add your titles to our global catalog',
          'Create detailed profiles for your content',
          'Connect with international buyers',
          'Track interest and requests for your work'
        ]

      const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Welcome to KStoryBridge</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #1f2937;
            margin: 0;
            padding: 20px;
            background-color: #f9fafb;
        }
        .email-container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
            border-radius: 16px;
            overflow: hidden;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
        }
        .header {
            background: linear-gradient(135deg, #4C9C9B 0%, #3a7a79 100%);
            color: white;
            padding: 40px 30px;
            text-align: center;
        }
        .logo {
            font-size: 32px;
            font-weight: bold;
            margin-bottom: 8px;
            letter-spacing: -0.5px;
        }
        .tagline {
            opacity: 0.9;
            font-size: 16px;
            font-weight: 400;
        }
        .content {
            padding: 40px 30px;
        }
        .greeting {
            font-size: 28px;
            font-weight: 700;
            color: #111827;
            margin-bottom: 16px;
            line-height: 1.2;
        }
        .subtitle {
            font-size: 18px;
            color: #6b7280;
            margin-bottom: 32px;
            font-weight: 400;
        }
        .main-text {
            font-size: 16px;
            color: #374151;
            margin-bottom: 32px;
            line-height: 1.6;
        }
        .features-section {
            background-color: #f9fafb;
            border-radius: 12px;
            padding: 24px;
            margin: 32px 0;
        }
        .features-title {
            font-size: 20px;
            font-weight: 600;
            color: #111827;
            margin-bottom: 16px;
        }
        .features-list {
            list-style: none;
            padding: 0;
            margin: 0;
        }
        .features-list li {
            padding: 8px 0;
            color: #4b5563;
            position: relative;
            padding-left: 24px;
        }
        .features-list li:before {
            content: "✓";
            position: absolute;
            left: 0;
            color: #4C9C9B;
            font-weight: bold;
        }
        .cta-section {
            text-align: center;
            margin: 40px 0;
        }
        .cta-button {
            display: inline-block;
            background: linear-gradient(135deg, #4C9C9B 0%, #3a7a79 100%);
            color: white;
            text-decoration: none;
            padding: 16px 32px;
            border-radius: 8px;
            font-weight: 600;
            font-size: 16px;
            letter-spacing: 0.025em;
            transition: transform 0.2s ease;
        }
        .cta-button:hover {
            transform: translateY(-2px);
        }
        .footer {
            background-color: #4C9C9B;
            color: white;
            padding: 32px 30px;
            text-align: center;
        }
        .footer-content {
            font-size: 14px;
            opacity: 0.9;
            margin-bottom: 16px;
        }
        .footer-links {
            margin: 16px 0;
        }
        .footer-links a {
            color: white;
            text-decoration: underline;
            margin: 0 8px;
        }
        .footer-address {
            font-size: 12px;
            opacity: 0.7;
            margin-top: 16px;
        }
        .unsubscribe {
            font-size: 12px;
            opacity: 0.8;
            margin-top: 8px;
        }
        .unsubscribe a {
            color: white;
            text-decoration: underline;
        }
        
        /* Mobile responsiveness */
        @media (max-width: 600px) {
            body {
                padding: 10px;
            }
            .content {
                padding: 30px 20px;
            }
            .header {
                padding: 30px 20px;
            }
            .footer {
                padding: 24px 20px;
            }
            .greeting {
                font-size: 24px;
            }
            .cta-button {
                padding: 14px 24px;
                font-size: 15px;
            }
        }
    </style>
</head>
<body>
    <div class="email-container">
        <div class="header">
            <div class="logo">KStoryBridge</div>
            <div class="tagline">Connecting Korean Content with Global Audiences</div>
        </div>

        <div class="content">
            <h1 class="greeting">Welcome, ${userName}!</h1>
            <p class="subtitle">Your ${accountTypeText} account is now active</p>
            
            <div class="main-text">
                <p>Thank you for joining KStoryBridge, the premier platform for Korean content discovery and collaboration.</p>
                <p>${welcomeMessage}</p>
            </div>

            <div class="features-section">
                <h3 class="features-title">What's Next?</h3>
                <ul class="features-list">
                    ${nextSteps.map(step => `<li>${step}</li>`).join('')}
                </ul>
            </div>

            <div class="cta-section">
                <a href="${dashboardUrl}" class="cta-button">Get Started Now</a>
            </div>

            <div class="main-text">
                <p>If you have any questions or need assistance, don't hesitate to reach out to our support team. We're here to help you succeed!</p>
            </div>
        </div>

        <div class="footer">
            <div class="footer-content">
                <strong>Need help?</strong> Contact us at <a href="mailto:support@kstorybridge.com">support@kstorybridge.com</a>
            </div>
            
            <div class="footer-links">
                <a href="https://kstorybridge.com">Visit our website</a> |
                <a href="${loginUrl}">Dashboard Login</a>
            </div>
            
            <div class="footer-address">
                © 2025 KStoryBridge. All rights reserved.<br>
                228 Park Ave S, #29976, New York, New York 10003, United States
            </div>
            
            <div class="unsubscribe">
                Update your email preferences or <a href="#unsubscribe">unsubscribe here</a><br>
                You're receiving this email because you created an account with us.
            </div>
        </div>
    </div>
</body>
</html>`

      const text = `
Welcome to KStoryBridge!

Hello ${userName}!

Your ${accountTypeText} account has been successfully created.

Thank you for joining KStoryBridge, the premier platform for Korean content discovery and collaboration.

${welcomeMessage}

What's Next?
${nextSteps.map((step, index) => `${index + 1}. ${step}`).join('\n')}

Get started: ${dashboardUrl}

If you have any questions or need assistance, don't hesitate to reach out to our support team at support@kstorybridge.com

Best regards,
The KStoryBridge Team

---
© 2025 KStoryBridge. All rights reserved.
You're receiving this email because you created an account with us.
`

      return { html, text }
    },

    transaction_notification: (data: TransactionTemplateData) => {
      const { userEmail, userName, plan, price, tierUpdateSuccess, errorDetails, timestamp } = data

      const statusBadge = tierUpdateSuccess
        ? '<span style="background-color: #10b981; color: white; padding: 4px 12px; border-radius: 9999px; font-size: 12px; font-weight: 600;">SUCCESS</span>'
        : '<span style="background-color: #ef4444; color: white; padding: 4px 12px; border-radius: 9999px; font-size: 12px; font-weight: 600;">FAILED</span>'

      const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Transaction Notification</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #1f2937;
            margin: 0;
            padding: 20px;
            background-color: #f9fafb;
        }
        .email-container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
            border-radius: 16px;
            overflow: hidden;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
        }
        .header {
            background: linear-gradient(135deg, #4C9C9B 0%, #3a7a79 100%);
            color: white;
            padding: 40px 30px;
            text-align: center;
        }
        .logo {
            font-size: 32px;
            font-weight: bold;
            margin-bottom: 8px;
        }
        .content {
            padding: 40px 30px;
        }
        .greeting {
            font-size: 24px;
            font-weight: 700;
            color: #111827;
            margin-bottom: 24px;
        }
        .info-box {
            background-color: #f9fafb;
            border-radius: 12px;
            padding: 24px;
            margin: 24px 0;
        }
        .info-row {
            display: flex;
            justify-content: space-between;
            padding: 12px 0;
            border-bottom: 1px solid #e5e7eb;
        }
        .info-row:last-child {
            border-bottom: none;
        }
        .info-label {
            font-weight: 600;
            color: #6b7280;
        }
        .info-value {
            color: #111827;
            font-weight: 500;
        }
        .price {
            font-size: 32px;
            font-weight: 700;
            color: #4C9C9B;
            margin: 16px 0;
        }
        .error-box {
            background-color: #fef2f2;
            border-left: 4px solid #ef4444;
            padding: 16px;
            margin: 24px 0;
            border-radius: 8px;
        }
        .error-title {
            font-weight: 600;
            color: #dc2626;
            margin-bottom: 8px;
        }
        .error-details {
            color: #991b1b;
            font-size: 14px;
        }
        .footer {
            background-color: #4C9C9B;
            color: white;
            padding: 32px 30px;
            text-align: center;
            font-size: 14px;
        }
    </style>
</head>
<body>
    <div class="email-container">
        <div class="header">
            <div class="logo">💳 Payment Notification</div>
            <div>KStoryBridge Transaction Alert</div>
        </div>

        <div class="content">
            <h1 class="greeting">New Payment Received</h1>

            <div class="info-box">
                <div class="info-row">
                    <span class="info-label">Customer Name:</span>
                    <span class="info-value">${userName}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Customer Email:</span>
                    <span class="info-value">${userEmail}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Plan Purchased:</span>
                    <span class="info-value">${plan}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Amount Paid:</span>
                    <span class="info-value price">$${price.toFixed(2)}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Tier Update Status:</span>
                    <span class="info-value">${statusBadge}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Transaction Time:</span>
                    <span class="info-value">${new Date(timestamp).toLocaleString('en-US', {
                      dateStyle: 'medium',
                      timeStyle: 'long',
                      timeZone: 'America/Los_Angeles'
                    })}</span>
                </div>
            </div>

            ${!tierUpdateSuccess && errorDetails ? `
            <div class="error-box">
                <div class="error-title">⚠️ Tier Update Failed</div>
                <div class="error-details">${errorDetails}</div>
                <div style="margin-top: 12px; color: #991b1b; font-size: 14px;">
                    <strong>Action Required:</strong> Please manually update the user's tier in the dashboard or check the webhook logs.
                </div>
            </div>
            ` : ''}

            ${tierUpdateSuccess ? `
            <p style="color: #059669; font-weight: 600; margin: 24px 0;">
                ✅ User tier has been successfully updated in the database.
            </p>
            ` : ''}
        </div>

        <div class="footer">
            <div>This is an automated notification from KStoryBridge payment system.</div>
            <div style="margin-top: 16px; opacity: 0.8;">
                View transaction details in <a href="https://dashboard.stripe.com" style="color: white; text-decoration: underline;">Stripe Dashboard</a>
            </div>
        </div>
    </div>
</body>
</html>`

      const text = `
PAYMENT NOTIFICATION - KStoryBridge

New payment received:

Customer Name: ${userName}
Customer Email: ${userEmail}
Plan Purchased: ${plan}
Amount Paid: $${price.toFixed(2)}
Tier Update Status: ${tierUpdateSuccess ? 'SUCCESS' : 'FAILED'}
Transaction Time: ${new Date(timestamp).toLocaleString('en-US', {
  dateStyle: 'medium',
  timeStyle: 'long',
  timeZone: 'America/Los_Angeles'
})}

${!tierUpdateSuccess && errorDetails ? `
⚠️ TIER UPDATE FAILED
Error Details: ${errorDetails}

Action Required: Please manually update the user's tier in the dashboard or check the webhook logs.
` : ''}

${tierUpdateSuccess ? '✅ User tier has been successfully updated in the database.' : ''}

---
This is an automated notification from KStoryBridge payment system.
View transaction details in Stripe Dashboard: https://dashboard.stripe.com
`

      return { html, text }
    }
  }
}