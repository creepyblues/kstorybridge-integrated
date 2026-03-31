import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// ============================================
// BRAND CONFIGURATION
// ============================================
const BRAND = {
  colors: {
    primary: '#4C9C9B',      // Hanok Teal
    primaryDark: '#3a7a79',  // Darker teal for gradients
    error: '#E63946',        // Sunrise Coral
    success: '#10B981',      // Green
    textPrimary: '#111827',  // Near black
    textSecondary: '#6B7280', // Gray
    textMuted: '#9CA3AF',    // Light gray
    border: '#E5E7EB',       // Light gray border
    bgLight: '#F9FAFB',      // Light background
    bgWhite: '#FFFFFF',      // White
  },
  logo: {
    text: 'KStoryBridge',
    tagline: 'Connecting Korean Content with Global Audiences',
  },
  contact: {
    support: 'support@kstorybridge.com',
    website: 'https://kstorybridge.com',
    address: '228 Park Ave S, #29976, New York, New York 10003, United States',
  },
  year: new Date().getFullYear(),
}

// ============================================
// INTERFACES
// ============================================
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

interface PaymentConfirmationData {
  userName: string;
  userEmail: string;
  plan: string;
  price: number;
  nextBillingDate: string;
}

interface OfficialUpdateData {
  userName: string;
  userEmail: string;
  updateTitle: string;
  updateContent: string;
  keyChanges?: string[];
  ctaText?: string;
  ctaUrl?: string;
}

interface NotificationAlertData {
  userName: string;
  userEmail: string;
  notificationType: 'approval' | 'rejection' | 'request' | 'alert' | 'info';
  title: string;
  message: string;
  contextBox?: { title: string; content: string };
  ctaText?: string;
  ctaUrl?: string;
}

// ============================================
// SHARED EMAIL COMPONENTS
// ============================================

/**
 * Get shared email styles (inline CSS for email clients)
 */
function getEmailStyles(): string {
  return `
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: ${BRAND.colors.textPrimary};
      margin: 0;
      padding: 20px;
      background-color: ${BRAND.colors.bgLight};
    }
    .email-container {
      max-width: 600px;
      margin: 0 auto;
      background-color: ${BRAND.colors.bgWhite};
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
    }
    .header {
      background: linear-gradient(135deg, ${BRAND.colors.primary} 0%, ${BRAND.colors.primaryDark} 100%);
      color: white;
      padding: 40px 30px;
      text-align: center;
    }
    .header-simple {
      background: ${BRAND.colors.primary};
      color: white;
      padding: 24px 30px;
      text-align: center;
    }
    .logo {
      font-size: 28px;
      font-weight: bold;
      margin-bottom: 8px;
      letter-spacing: -0.5px;
    }
    .tagline {
      opacity: 0.9;
      font-size: 14px;
      font-weight: 400;
    }
    .content {
      padding: 40px 30px;
    }
    .greeting {
      font-size: 28px;
      font-weight: 700;
      color: ${BRAND.colors.textPrimary};
      margin-bottom: 16px;
      line-height: 1.2;
    }
    .subtitle {
      font-size: 18px;
      color: ${BRAND.colors.textSecondary};
      margin-bottom: 32px;
      font-weight: 400;
    }
    .main-text {
      font-size: 16px;
      color: #374151;
      margin-bottom: 24px;
      line-height: 1.6;
    }
    .info-box {
      background-color: ${BRAND.colors.bgLight};
      border-radius: 12px;
      padding: 24px;
      margin: 24px 0;
    }
    .info-row {
      display: flex;
      justify-content: space-between;
      padding: 12px 0;
      border-bottom: 1px solid ${BRAND.colors.border};
    }
    .info-row:last-child {
      border-bottom: none;
    }
    .info-label {
      font-weight: 600;
      color: ${BRAND.colors.textSecondary};
    }
    .info-value {
      color: ${BRAND.colors.textPrimary};
      font-weight: 500;
    }
    .features-section {
      background-color: ${BRAND.colors.bgLight};
      border-radius: 12px;
      padding: 24px;
      margin: 32px 0;
    }
    .features-title {
      font-size: 18px;
      font-weight: 600;
      color: ${BRAND.colors.textPrimary};
      margin-bottom: 16px;
    }
    .features-list {
      list-style: none;
      padding: 0;
      margin: 0;
    }
    .features-list li {
      padding: 10px 0;
      color: #4b5563;
      position: relative;
      padding-left: 28px;
      font-size: 15px;
    }
    .features-list li:before {
      content: "✓";
      position: absolute;
      left: 0;
      color: ${BRAND.colors.primary};
      font-weight: bold;
      font-size: 16px;
    }
    .cta-section {
      text-align: center;
      margin: 40px 0;
    }
    .cta-button {
      display: inline-block;
      background: linear-gradient(135deg, ${BRAND.colors.primary} 0%, ${BRAND.colors.primaryDark} 100%);
      color: white;
      text-decoration: none;
      padding: 16px 32px;
      border-radius: 8px;
      font-weight: 600;
      font-size: 16px;
      letter-spacing: 0.025em;
    }
    .footer {
      background-color: ${BRAND.colors.primary};
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
    .success-badge {
      background-color: ${BRAND.colors.success};
      color: white;
      padding: 4px 12px;
      border-radius: 9999px;
      font-size: 12px;
      font-weight: 600;
    }
    .error-badge {
      background-color: ${BRAND.colors.error};
      color: white;
      padding: 4px 12px;
      border-radius: 9999px;
      font-size: 12px;
      font-weight: 600;
    }
    .error-box {
      background-color: #fef2f2;
      border-left: 4px solid ${BRAND.colors.error};
      padding: 16px;
      margin: 24px 0;
      border-radius: 8px;
    }
    .context-box {
      background: linear-gradient(135deg, #f0fdfa 0%, #e0f2fe 100%);
      border: 1px solid #99f6e4;
      border-radius: 12px;
      padding: 24px;
      margin: 24px 0;
    }
    .highlight-box {
      background-color: ${BRAND.colors.bgLight};
      border-left: 4px solid ${BRAND.colors.primary};
      padding: 16px 20px;
      margin: 24px 0;
      border-radius: 0 8px 8px 0;
    }

    /* Mobile responsiveness */
    @media (max-width: 600px) {
      body {
        padding: 10px;
      }
      .content {
        padding: 30px 20px;
      }
      .header, .header-simple {
        padding: 24px 20px;
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
  `
}

/**
 * Get email header with logo
 */
function getEmailHeader(options: { showTagline?: boolean; title?: string } = {}): string {
  const { showTagline = true, title } = options
  return `
    <div class="header">
      <div class="logo">${title || BRAND.logo.text}</div>
      ${showTagline ? `<div class="tagline">${BRAND.logo.tagline}</div>` : ''}
    </div>
  `
}

/**
 * Get email footer with links and legal
 */
function getEmailFooter(options: { loginUrl?: string; showUnsubscribe?: boolean } = {}): string {
  const { loginUrl = 'https://dashboard.kstorybridge.com/signin', showUnsubscribe = true } = options
  return `
    <div class="footer">
      <div class="footer-content">
        <strong>Need help?</strong> Contact us at <a href="mailto:${BRAND.contact.support}" style="color: white;">${BRAND.contact.support}</a>
      </div>

      <div class="footer-links">
        <a href="${BRAND.contact.website}">Visit our website</a> |
        <a href="${loginUrl}">Dashboard Login</a>
      </div>

      <div class="footer-address">
        © ${BRAND.year} The Story Bridge, LLC. All rights reserved.<br>
        ${BRAND.contact.address}
      </div>

      ${showUnsubscribe ? `
      <div class="unsubscribe">
        Update your email preferences or <a href="#unsubscribe">unsubscribe here</a><br>
        You're receiving this email because you created an account with us.
      </div>
      ` : ''}
    </div>
  `
}

/**
 * Get CTA button HTML
 */
function getCtaButton(text: string, url: string, options: { color?: string; fullWidth?: boolean } = {}): string {
  const { color, fullWidth = false } = options
  const bgStyle = color
    ? `background-color: ${color};`
    : `background: linear-gradient(135deg, ${BRAND.colors.primary} 0%, ${BRAND.colors.primaryDark} 100%);`
  const widthStyle = fullWidth ? 'display: block; width: 100%; box-sizing: border-box;' : 'display: inline-block;'

  return `
    <a href="${url}" style="${bgStyle} ${widthStyle} color: white; text-decoration: none; padding: 16px 32px; border-radius: 8px; font-weight: 600; font-size: 16px; letter-spacing: 0.025em; text-align: center;">
      ${text}
    </a>
  `
}

/**
 * Get notification icon based on type
 */
function getNotificationIcon(type: NotificationAlertData['notificationType']): string {
  const icons: Record<string, string> = {
    approval: '✅',
    rejection: '❌',
    request: '📬',
    alert: '⚠️',
    info: 'ℹ️',
  }
  return icons[type] || 'ℹ️'
}

/**
 * Wrap content in full email HTML structure
 */
function wrapEmailHtml(content: string, options: {
  headerOptions?: Parameters<typeof getEmailHeader>[0];
  footerOptions?: Parameters<typeof getEmailFooter>[0];
} = {}): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${BRAND.logo.text}</title>
    <style>
        ${getEmailStyles()}
    </style>
</head>
<body>
    <div class="email-container">
        ${getEmailHeader(options.headerOptions)}
        ${content}
        ${getEmailFooter(options.footerOptions)}
    </div>
</body>
</html>`
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

    // Add BCC for welcome emails to admin
    const shouldBccAdmin = template === 'welcome';

    // Prepare Resend payload
    const resendPayload = {
      from: from || 'KStoryBridge <noreply@kstorybridge.com>',
      to: [to],
      subject: subject,
      html: emailHtml,
      text: emailText,
      reply_to: replyTo,
      ...(shouldBccAdmin && { bcc: 'admin@kstorybridge.com' }),
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

// ============================================
// EMAIL TEMPLATES
// ============================================

function getEmailTemplates() {
  return {
    /**
     * WELCOME TEMPLATE
     * Sent to new buyers and creators after signup
     */
    welcome: (data: WelcomeTemplateData) => {
      const { userName, accountType, dashboardUrl, loginUrl } = data

      // Use account-type specific URLs if not explicitly provided
      const defaultDashboardUrl = accountType === 'creator'
        ? 'https://creator.kstorybridge.com/home'
        : 'https://dashboard.kstorybridge.com'
      const defaultLoginUrl = accountType === 'creator'
        ? 'https://creator.kstorybridge.com/signin'
        : 'https://dashboard.kstorybridge.com/signin'

      const finalDashboardUrl = dashboardUrl || defaultDashboardUrl
      const finalLoginUrl = loginUrl || defaultLoginUrl

      const accountTypeText = accountType === 'buyer' ? 'Content Buyer' : 'Content Creator'
      const welcomeMessage = accountType === 'buyer'
        ? 'You now have access to premium Korean content for your business needs.'
        : 'Welcome to the global marketplace for Korean content. Your stories deserve a worldwide audience, and we\'re here to help you reach international media buyers and partners.'

      const nextSteps = accountType === 'buyer'
        ? [
          'Browse our catalog of premium Korean content',
          'Save your favorite titles to your watchlist',
          'Submit requests for content that matches your needs',
          'Connect directly with creators and rights holders'
        ]
        : [
          'Add your first title to our global catalog',
          'Complete your creator profile to build trust',
          'Explore subscription plans for enhanced visibility',
          'Connect with international media buyers seeking Korean content'
        ]

      const content = `
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
                ${getCtaButton('Get Started Now', finalDashboardUrl)}
            </div>

            <div class="main-text">
                <p>If you have any questions or need assistance, don't hesitate to reach out to our support team. We're here to help you succeed!</p>
            </div>
        </div>
      `

      const html = wrapEmailHtml(content, { footerOptions: { loginUrl: finalLoginUrl } })

      const text = `
Welcome to KStoryBridge!

Hello ${userName}!

Your ${accountTypeText} account has been successfully created.

Thank you for joining KStoryBridge, the premier platform for Korean content discovery and collaboration.

${welcomeMessage}

What's Next?
${nextSteps.map((step, index) => `${index + 1}. ${step}`).join('\n')}

Get started: ${finalDashboardUrl}

If you have any questions or need assistance, don't hesitate to reach out to our support team at ${BRAND.contact.support}

Best regards,
The KStoryBridge Team

---
© ${BRAND.year} The Story Bridge, LLC. All rights reserved.
You're receiving this email because you created an account with us.
`

      return { html, text }
    },

    /**
     * OFFICIAL UPDATE TEMPLATE
     * For platform announcements, feature updates, and policy changes
     */
    official_update: (data: OfficialUpdateData) => {
      const { userName, updateTitle, updateContent, keyChanges, ctaText, ctaUrl } = data

      const content = `
        <div class="content">
            <h1 class="greeting">📢 ${updateTitle}</h1>

            <div class="main-text">
                <p>Hi ${userName},</p>
                <p>${updateContent}</p>
            </div>

            ${keyChanges && keyChanges.length > 0 ? `
            <div class="features-section">
                <h3 class="features-title">Key Changes</h3>
                <ul class="features-list">
                    ${keyChanges.map(change => `<li>${change}</li>`).join('')}
                </ul>
            </div>
            ` : ''}

            ${ctaText && ctaUrl ? `
            <div class="cta-section">
                ${getCtaButton(ctaText, ctaUrl)}
            </div>
            ` : ''}

            <div class="main-text">
                <p>If you have any questions about these changes, our support team is here to help.</p>
            </div>
        </div>
      `

      const html = wrapEmailHtml(content)

      const text = `
📢 ${updateTitle}

Hi ${userName},

${updateContent}

${keyChanges && keyChanges.length > 0 ? `
Key Changes:
${keyChanges.map(change => `• ${change}`).join('\n')}
` : ''}

${ctaText && ctaUrl ? `${ctaText}: ${ctaUrl}` : ''}

If you have any questions about these changes, contact us at ${BRAND.contact.support}

---
© ${BRAND.year} The Story Bridge, LLC. All rights reserved.
`

      return { html, text }
    },

    /**
     * TRANSACTION NOTIFICATION TEMPLATE
     * Sent to admins when a payment is received
     */
    transaction_notification: (data: TransactionTemplateData) => {
      const { userEmail, userName, plan, price, tierUpdateSuccess, errorDetails, timestamp } = data

      const statusBadge = tierUpdateSuccess
        ? '<span class="success-badge">SUCCESS</span>'
        : '<span class="error-badge">FAILED</span>'

      const formattedDate = new Date(timestamp).toLocaleString('en-US', {
        dateStyle: 'medium',
        timeStyle: 'long',
        timeZone: 'America/Los_Angeles'
      })

      const content = `
        <div class="content">
            <h1 class="greeting">💳 New Payment Received</h1>

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
                    <span class="info-value" style="font-size: 24px; font-weight: 700; color: ${BRAND.colors.primary};">$${price.toFixed(2)}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Tier Update Status:</span>
                    <span class="info-value">${statusBadge}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Transaction Time:</span>
                    <span class="info-value">${formattedDate}</span>
                </div>
            </div>

            ${!tierUpdateSuccess && errorDetails ? `
            <div class="error-box">
                <div style="font-weight: 600; color: #dc2626; margin-bottom: 8px;">⚠️ Tier Update Failed</div>
                <div style="color: #991b1b; font-size: 14px;">${errorDetails}</div>
                <div style="margin-top: 12px; color: #991b1b; font-size: 14px;">
                    <strong>Action Required:</strong> Please manually update the user's tier in the dashboard or check the webhook logs.
                </div>
            </div>
            ` : ''}

            ${tierUpdateSuccess ? `
            <p style="color: ${BRAND.colors.success}; font-weight: 600; margin: 24px 0;">
                ✅ User tier has been successfully updated in the database.
            </p>
            ` : ''}

            <div class="cta-section">
                ${getCtaButton('View in Stripe Dashboard', 'https://dashboard.stripe.com')}
            </div>
        </div>
      `

      const html = wrapEmailHtml(content, {
        headerOptions: { title: '💳 Payment Notification', showTagline: false },
        footerOptions: { showUnsubscribe: false }
      })

      const text = `
PAYMENT NOTIFICATION - KStoryBridge

New payment received:

Customer Name: ${userName}
Customer Email: ${userEmail}
Plan Purchased: ${plan}
Amount Paid: $${price.toFixed(2)}
Tier Update Status: ${tierUpdateSuccess ? 'SUCCESS' : 'FAILED'}
Transaction Time: ${formattedDate}

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
    },

    /**
     * PAYMENT CONFIRMATION TEMPLATE
     * Sent to users after successful payment
     */
    payment_confirmation: (data: PaymentConfirmationData) => {
      const { userName, userEmail, plan, price, nextBillingDate } = data

      const planFeatures = plan.toLowerCase() === 'suite'
        ? [
          'Access to all pitch decks and materials',
          'Premium title analytics and insights',
          'Advanced search and discovery filters',
          'Early access to new titles',
          'Dedicated account manager',
          '1-on-1 consultation calls',
          'Custom reports and API access'
        ]
        : [
          'Access to all pitch decks and materials',
          'Premium title analytics and insights',
          'Advanced search and discovery filters',
          'Priority email support',
          'Export title data'
        ]

      const content = `
        <div class="content">
            <h1 class="greeting">Welcome to ${plan}, ${userName}!</h1>
            <p class="subtitle">Thank you for upgrading your account</p>

            <div class="context-box">
                <div style="font-size: 16px; font-weight: 600; color: #0f766e; margin-bottom: 16px;">
                    ✅ Payment Confirmed
                </div>
                <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #99f6e4;">
                    <span style="color: ${BRAND.colors.textSecondary}; font-size: 14px;">Plan</span>
                    <span style="color: ${BRAND.colors.textPrimary}; font-weight: 600; font-size: 14px;">${plan}</span>
                </div>
                <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #99f6e4;">
                    <span style="color: ${BRAND.colors.textSecondary}; font-size: 14px;">Amount Charged</span>
                    <span style="font-size: 24px; font-weight: 700; color: #0f766e;">$${price.toFixed(2)}</span>
                </div>
                <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #99f6e4;">
                    <span style="color: ${BRAND.colors.textSecondary}; font-size: 14px;">Next Billing Date</span>
                    <span style="color: ${BRAND.colors.textPrimary}; font-weight: 600; font-size: 14px;">${nextBillingDate}</span>
                </div>
                <div style="display: flex; justify-content: space-between; padding: 8px 0;">
                    <span style="color: ${BRAND.colors.textSecondary}; font-size: 14px;">Account Email</span>
                    <span style="color: ${BRAND.colors.textPrimary}; font-weight: 600; font-size: 14px;">${userEmail}</span>
                </div>
            </div>

            <div class="features-section">
                <h3 class="features-title">🎉 Features Now Unlocked</h3>
                <ul class="features-list">
                    ${planFeatures.map(feature => `<li>${feature}</li>`).join('')}
                </ul>
            </div>

            <div class="cta-section">
                ${getCtaButton('Start Exploring Premium Content', 'https://dashboard.kstorybridge.com/buyers/titles')}
            </div>

            <div class="info-box" style="text-align: center;">
                <p style="color: ${BRAND.colors.textSecondary}; font-size: 14px; margin-bottom: 8px;">Questions about your subscription?</p>
                <a href="mailto:${BRAND.contact.support}" style="color: ${BRAND.colors.primary}; font-weight: 600; text-decoration: none;">${BRAND.contact.support}</a>
            </div>
        </div>
      `

      const html = wrapEmailHtml(content, {
        headerOptions: { title: BRAND.logo.text, showTagline: false }
      })

      const text = `
Welcome to KStoryBridge ${plan}!

Hello ${userName}!

Thank you for upgrading your account. Your payment has been confirmed.

PAYMENT DETAILS
---------------
Plan: ${plan}
Amount Charged: $${price.toFixed(2)}
Next Billing Date: ${nextBillingDate}
Account Email: ${userEmail}

FEATURES NOW UNLOCKED
---------------------
${planFeatures.map(feature => `✓ ${feature}`).join('\n')}

Start exploring premium content: https://dashboard.kstorybridge.com/buyers/titles

Questions about your subscription? Contact us at ${BRAND.contact.support}

---
© ${BRAND.year} The Story Bridge, LLC. All rights reserved.
Thank you for being a valued member of KStoryBridge.
`

      return { html, text }
    },

    /**
     * NOTIFICATION ALERT TEMPLATE
     * For title approvals/rejections, requests, and alerts
     */
    notification_alert: (data: NotificationAlertData) => {
      const { userName, notificationType, title, message, contextBox, ctaText, ctaUrl } = data

      const icon = getNotificationIcon(notificationType)
      const headerTitle = notificationType === 'approval' ? '🎉 Good News!'
        : notificationType === 'rejection' ? '📋 Update Required'
        : notificationType === 'request' ? '📬 New Request'
        : notificationType === 'alert' ? '⚠️ Action Required'
        : 'ℹ️ Notification'

      const content = `
        <div class="content">
            <h1 class="greeting">${icon} ${title}</h1>

            <div class="main-text">
                <p>Hi ${userName},</p>
                <p>${message}</p>
            </div>

            ${contextBox ? `
            <div class="highlight-box">
                <div style="font-weight: 600; color: ${BRAND.colors.textPrimary}; margin-bottom: 8px;">${contextBox.title}</div>
                <div style="color: ${BRAND.colors.textSecondary}; font-size: 14px;">${contextBox.content}</div>
            </div>
            ` : ''}

            ${ctaText && ctaUrl ? `
            <div class="cta-section">
                ${getCtaButton(ctaText, ctaUrl)}
            </div>
            ` : ''}

            <div class="main-text">
                <p>If you have any questions, don't hesitate to reach out to our support team.</p>
            </div>
        </div>
      `

      const html = wrapEmailHtml(content, {
        headerOptions: { title: headerTitle, showTagline: false }
      })

      const text = `
${icon} ${title}

Hi ${userName},

${message}

${contextBox ? `
${contextBox.title}
${contextBox.content}
` : ''}

${ctaText && ctaUrl ? `${ctaText}: ${ctaUrl}` : ''}

If you have any questions, contact us at ${BRAND.contact.support}

---
© ${BRAND.year} The Story Bridge, LLC. All rights reserved.
`

      return { html, text }
    }
  }
}