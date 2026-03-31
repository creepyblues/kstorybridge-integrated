/**
 * Admin Email Templates Preview Page
 *
 * Displays all email templates with sample data for preview and testing.
 * Supports desktop/mobile viewport toggle and HTML copying.
 */

import { useState, useMemo, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Icon } from '@iconify/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

// Brand configuration (must match edge function)
const BRAND = {
  colors: {
    primary: '#4C9C9B',
    primaryDark: '#3a7a79',
    error: '#E63946',
    success: '#10B981',
    textPrimary: '#111827',
    textSecondary: '#6B7280',
    textMuted: '#9CA3AF',
    border: '#E5E7EB',
    bgLight: '#F9FAFB',
    bgWhite: '#FFFFFF',
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
};

// Template categories
interface TemplateConfig {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: 'welcome' | 'official' | 'confirmation' | 'notification';
}

const TEMPLATE_CONFIGS: TemplateConfig[] = [
  {
    id: 'welcome',
    name: 'Welcome Email',
    description: 'Sent to new users after signup',
    icon: 'solar:hand-shake-bold-duotone',
    category: 'welcome',
  },
  {
    id: 'official_update',
    name: 'Official Update',
    description: 'Platform announcements and feature updates',
    icon: 'solar:megaphone-bold-duotone',
    category: 'official',
  },
  {
    id: 'payment_confirmation',
    name: 'Payment Confirmation',
    description: 'Sent to users after successful payment',
    icon: 'solar:card-bold-duotone',
    category: 'confirmation',
  },
  {
    id: 'transaction_notification',
    name: 'Transaction Notification',
    description: 'Admin notification for transactions',
    icon: 'solar:bell-bold-duotone',
    category: 'confirmation',
  },
  {
    id: 'notification_approval',
    name: 'Title Approved',
    description: 'Notification when a title is approved',
    icon: 'solar:check-circle-bold-duotone',
    category: 'notification',
  },
  {
    id: 'notification_rejection',
    name: 'Title Rejected',
    description: 'Notification when a title needs revision',
    icon: 'solar:close-circle-bold-duotone',
    category: 'notification',
  },
  {
    id: 'notification_request',
    name: 'New Request',
    description: 'Notification for new buyer requests',
    icon: 'solar:chat-round-bold-duotone',
    category: 'notification',
  },
];

// Sample data for each template
const SAMPLE_DATA = {
  welcome: {
    buyer: {
      userName: 'John Smith',
      userEmail: 'john@example.com',
      accountType: 'buyer' as const,
      dashboardUrl: 'https://dashboard.kstorybridge.com',
      loginUrl: 'https://dashboard.kstorybridge.com/signin',
    },
    creator: {
      userName: 'Jane Kim',
      userEmail: 'jane@example.com',
      accountType: 'creator' as const,
      dashboardUrl: 'https://creator.kstorybridge.com',
      loginUrl: 'https://creator.kstorybridge.com/signin',
    },
  },
  official_update: {
    userName: 'John Smith',
    userEmail: 'john@example.com',
    updateTitle: 'Introducing the New Comps Navigator',
    updateContent: 'We\'re excited to announce our most powerful feature yet: the Comps Navigator. Now you can search for Korean content using Hollywood comparables like "Stranger Things meets Reply 1988".',
    keyChanges: [
      'Search by Hollywood comparable titles',
      'AI-powered matching with detailed explanations',
      'Save and organize your favorite searches',
      'Export results to your team',
    ],
    ctaText: 'Try Comps Navigator Now',
    ctaUrl: 'https://dashboard.kstorybridge.com/buyers/comps-navigator',
  },
  payment_confirmation: {
    userName: 'John Smith',
    userEmail: 'john@example.com',
    plan: 'Pro',
    price: 99,
    nextBillingDate: 'February 6, 2026',
  },
  transaction_notification: {
    userName: 'John Smith',
    userEmail: 'john@example.com',
    plan: 'Pro',
    price: 99,
    transactionDate: new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }),
  },
  notification_approval: {
    userName: 'Jane Creator',
    userEmail: 'jane@example.com',
    notificationType: 'approval' as const,
    title: 'Your Title Has Been Approved!',
    message: 'Congratulations! "The Last Alchemist" has been approved and is now live on the KStoryBridge marketplace. Buyers can now discover your content and reach out for licensing opportunities.',
    contextBox: {
      title: 'Title Details',
      content: 'The Last Alchemist - Romance/Fantasy Webtoon',
    },
    ctaText: 'View Your Title',
    ctaUrl: 'https://creator.kstorybridge.com/titles/123',
  },
  notification_rejection: {
    userName: 'Jane Creator',
    userEmail: 'jane@example.com',
    notificationType: 'rejection' as const,
    title: 'Updates Needed for Your Title',
    message: 'Your submission for "Mystery of the Seoul Night" requires some updates before it can be approved. Please review the feedback from our team and resubmit.',
    contextBox: {
      title: 'Feedback',
      content: 'Please provide higher resolution cover art (minimum 1200x1600px) and complete the synopsis field with at least 200 characters.',
    },
    ctaText: 'Edit Your Submission',
    ctaUrl: 'https://creator.kstorybridge.com/titles/456/edit',
  },
  notification_request: {
    userName: 'Jane Creator',
    userEmail: 'jane@example.com',
    notificationType: 'request' as const,
    title: 'New Inquiry About Your Title',
    message: 'A buyer has expressed interest in "The Last Alchemist" and would like to connect with you regarding potential licensing opportunities.',
    contextBox: {
      title: 'Buyer Information',
      content: 'Netflix Content Acquisitions - Film & TV Rights',
    },
    ctaText: 'View Request',
    ctaUrl: 'https://creator.kstorybridge.com/requests/789',
  },
};

// Shared email component generators (must match edge function)
function getEmailStyles(): string {
  return `
    body { margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: ${BRAND.colors.bgLight}; }
    .container { max-width: 600px; margin: 0 auto; background-color: ${BRAND.colors.bgWhite}; }
    .header { background: linear-gradient(135deg, ${BRAND.colors.primary} 0%, ${BRAND.colors.primaryDark} 100%); padding: 32px 24px; text-align: center; }
    .logo { font-size: 24px; font-weight: 700; color: white; margin: 0; }
    .logo-k { color: white; }
    .logo-story { color: rgba(255,255,255,0.9); }
    .logo-bridge { color: white; }
    .tagline { color: rgba(255,255,255,0.85); font-size: 12px; margin-top: 8px; }
    .content { padding: 32px 24px; }
    .footer { background-color: ${BRAND.colors.bgLight}; padding: 24px; text-align: center; border-top: 1px solid ${BRAND.colors.border}; }
    .footer-links { margin-bottom: 16px; }
    .footer-link { color: ${BRAND.colors.textSecondary}; text-decoration: none; margin: 0 12px; font-size: 13px; }
    .footer-link:hover { color: ${BRAND.colors.primary}; }
    .footer-text { color: ${BRAND.colors.textMuted}; font-size: 11px; margin: 4px 0; }
    .btn { display: inline-block; padding: 14px 28px; background-color: ${BRAND.colors.primary}; color: white !important; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 15px; }
    .btn:hover { background-color: ${BRAND.colors.primaryDark}; }
    .btn-success { background-color: ${BRAND.colors.success}; }
    .btn-error { background-color: ${BRAND.colors.error}; }
    h1, h2, h3 { color: ${BRAND.colors.textPrimary}; margin: 0; }
    p { color: ${BRAND.colors.textSecondary}; line-height: 1.6; margin: 0 0 16px; }
    .info-box { background-color: ${BRAND.colors.bgLight}; border: 1px solid ${BRAND.colors.border}; border-radius: 8px; padding: 20px; margin: 24px 0; }
    .info-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid ${BRAND.colors.border}; }
    .info-row:last-child { border-bottom: none; }
    .info-label { color: ${BRAND.colors.textMuted}; font-size: 13px; }
    .info-value { color: ${BRAND.colors.textPrimary}; font-weight: 500; font-size: 14px; }
    .steps-list { margin: 24px 0; padding: 0; list-style: none; }
    .steps-list li { padding: 12px 0 12px 36px; position: relative; border-bottom: 1px solid ${BRAND.colors.border}; color: ${BRAND.colors.textSecondary}; }
    .steps-list li:last-child { border-bottom: none; }
    .steps-list li::before { content: ''; position: absolute; left: 0; top: 50%; transform: translateY(-50%); width: 24px; height: 24px; background-color: ${BRAND.colors.primary}; border-radius: 50%; }
    .steps-list li::after { content: attr(data-step); position: absolute; left: 8px; top: 50%; transform: translateY(-50%); color: white; font-size: 12px; font-weight: 600; }
    .highlight-box { background: linear-gradient(135deg, ${BRAND.colors.primary}10 0%, ${BRAND.colors.primaryDark}10 100%); border-left: 4px solid ${BRAND.colors.primary}; padding: 16px 20px; margin: 24px 0; border-radius: 0 8px 8px 0; }
    .icon-circle { width: 64px; height: 64px; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 24px; font-size: 32px; }
    .icon-success { background-color: ${BRAND.colors.success}20; color: ${BRAND.colors.success}; }
    .icon-error { background-color: ${BRAND.colors.error}20; color: ${BRAND.colors.error}; }
    .icon-info { background-color: ${BRAND.colors.primary}20; color: ${BRAND.colors.primary}; }
  `;
}

function getEmailHeader(showTagline: boolean = true): string {
  return `
    <div class="header">
      <h1 class="logo">
        <span class="logo-k">K</span><span class="logo-story">Story</span><span class="logo-bridge">Bridge</span>
      </h1>
      ${showTagline ? `<p class="tagline">${BRAND.logo.tagline}</p>` : ''}
    </div>
  `;
}

function getEmailFooter(): string {
  return `
    <div class="footer">
      <div class="footer-links">
        <a href="${BRAND.contact.website}" class="footer-link">Visit Website</a>
        <a href="mailto:${BRAND.contact.support}" class="footer-link">Contact Support</a>
      </div>
      <p class="footer-text">${BRAND.contact.address}</p>
      <p class="footer-text">&copy; ${BRAND.year} The Story Bridge, LLC. All rights reserved.</p>
      <p class="footer-text" style="margin-top: 12px;">
        <a href="#" style="color: ${BRAND.colors.textMuted}; text-decoration: underline;">Unsubscribe</a>
        &nbsp;&bull;&nbsp;
        <a href="#" style="color: ${BRAND.colors.textMuted}; text-decoration: underline;">Email Preferences</a>
      </p>
    </div>
  `;
}

function getCtaButton(text: string, url: string, variant: 'primary' | 'success' | 'error' = 'primary'): string {
  const variantClass = variant === 'success' ? 'btn-success' : variant === 'error' ? 'btn-error' : '';
  return `<a href="${url}" class="btn ${variantClass}" style="color: white !important;">${text}</a>`;
}

function wrapEmailHtml(content: string): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>${getEmailStyles()}</style>
    </head>
    <body>
      <div class="container">
        ${getEmailHeader()}
        <div class="content">
          ${content}
        </div>
        ${getEmailFooter()}
      </div>
    </body>
    </html>
  `;
}

// Template generators
function generateWelcomeTemplate(data: { userName: string; userEmail: string; accountType: 'buyer' | 'creator'; dashboardUrl?: string; loginUrl?: string }): string {
  const isBuyer = data.accountType === 'buyer';
  const steps = isBuyer
    ? [
        'Explore our curated catalog of Korean webtoons and web novels',
        'Use the Comps Navigator to find content matching your needs',
        'Save your favorites and contact creators directly',
      ]
    : [
        'Complete your creator profile with your portfolio',
        'Submit your first title for review',
        'Connect with buyers interested in your content',
      ];

  const content = `
    <h1 style="font-size: 28px; margin-bottom: 8px;">Welcome, ${data.userName}!</h1>
    <p style="color: ${BRAND.colors.textMuted}; font-size: 14px; margin-bottom: 24px;">
      Your ${data.accountType} account is now active
    </p>

    <p>
      Thank you for joining KStoryBridge! We're excited to have you as part of our community
      connecting Korean content creators with global audiences.
    </p>

    <div class="highlight-box">
      <h3 style="font-size: 16px; margin-bottom: 12px;">Getting Started</h3>
      <ul class="steps-list">
        ${steps.map((step, i) => `<li data-step="${i + 1}">${step}</li>`).join('')}
      </ul>
    </div>

    <div style="text-align: center; margin-top: 32px;">
      ${getCtaButton('Go to Dashboard', data.dashboardUrl || '#')}
    </div>

    <p style="text-align: center; margin-top: 24px; font-size: 13px; color: ${BRAND.colors.textMuted};">
      Questions? Reply to this email or contact us at
      <a href="mailto:${BRAND.contact.support}" style="color: ${BRAND.colors.primary};">${BRAND.contact.support}</a>
    </p>
  `;

  return wrapEmailHtml(content);
}

function generateOfficialUpdateTemplate(data: typeof SAMPLE_DATA.official_update): string {
  const content = `
    <div style="text-align: center; margin-bottom: 24px;">
      <span style="display: inline-block; padding: 4px 12px; background-color: ${BRAND.colors.primary}20; color: ${BRAND.colors.primary}; border-radius: 16px; font-size: 12px; font-weight: 600;">
        PLATFORM UPDATE
      </span>
    </div>

    <h1 style="font-size: 24px; text-align: center; margin-bottom: 16px;">${data.updateTitle}</h1>

    <p>Hi ${data.userName},</p>
    <p>${data.updateContent}</p>

    ${data.keyChanges && data.keyChanges.length > 0 ? `
      <div class="info-box">
        <h3 style="font-size: 14px; margin-bottom: 16px; color: ${BRAND.colors.textPrimary};">What's New</h3>
        <ul style="margin: 0; padding-left: 20px;">
          ${data.keyChanges.map(change => `<li style="padding: 4px 0; color: ${BRAND.colors.textSecondary};">${change}</li>`).join('')}
        </ul>
      </div>
    ` : ''}

    ${data.ctaText && data.ctaUrl ? `
      <div style="text-align: center; margin-top: 32px;">
        ${getCtaButton(data.ctaText, data.ctaUrl)}
      </div>
    ` : ''}

    <p style="text-align: center; margin-top: 32px; font-size: 13px; color: ${BRAND.colors.textMuted};">
      Best regards,<br>
      The KStoryBridge Team
    </p>
  `;

  return wrapEmailHtml(content);
}

function generatePaymentConfirmationTemplate(data: typeof SAMPLE_DATA.payment_confirmation): string {
  const content = `
    <div class="icon-circle icon-success">&#10003;</div>

    <h1 style="font-size: 24px; text-align: center; margin-bottom: 8px;">Payment Confirmed!</h1>
    <p style="text-align: center; color: ${BRAND.colors.textMuted};">Thank you for your subscription, ${data.userName}</p>

    <div class="info-box">
      <div class="info-row">
        <span class="info-label">Plan</span>
        <span class="info-value">${data.plan}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Amount</span>
        <span class="info-value">$${data.price}/month</span>
      </div>
      <div class="info-row">
        <span class="info-label">Next Billing Date</span>
        <span class="info-value">${data.nextBillingDate}</span>
      </div>
    </div>

    <p style="text-align: center;">
      Your ${data.plan} subscription is now active. Enjoy unlimited access to all premium features!
    </p>

    <div style="text-align: center; margin-top: 32px;">
      ${getCtaButton('Go to Dashboard', 'https://dashboard.kstorybridge.com', 'success')}
    </div>

    <p style="text-align: center; margin-top: 24px; font-size: 12px; color: ${BRAND.colors.textMuted};">
      Manage your subscription in <a href="#" style="color: ${BRAND.colors.primary};">Account Settings</a>
    </p>
  `;

  return wrapEmailHtml(content);
}

function generateTransactionNotificationTemplate(data: typeof SAMPLE_DATA.transaction_notification): string {
  const content = `
    <div style="text-align: center; margin-bottom: 24px;">
      <span style="display: inline-block; padding: 4px 12px; background-color: ${BRAND.colors.success}20; color: ${BRAND.colors.success}; border-radius: 16px; font-size: 12px; font-weight: 600;">
        NEW TRANSACTION
      </span>
    </div>

    <h1 style="font-size: 22px; text-align: center; margin-bottom: 24px;">New Subscription Payment</h1>

    <div class="info-box">
      <div class="info-row">
        <span class="info-label">Customer</span>
        <span class="info-value">${data.userName}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Email</span>
        <span class="info-value">${data.userEmail}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Plan</span>
        <span class="info-value">${data.plan}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Amount</span>
        <span class="info-value" style="color: ${BRAND.colors.success};">$${data.price}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Date</span>
        <span class="info-value">${data.transactionDate}</span>
      </div>
    </div>

    <div style="text-align: center; margin-top: 24px;">
      ${getCtaButton('View in Admin', 'https://dashboard.kstorybridge.com/admin')}
    </div>
  `;

  return wrapEmailHtml(content);
}

function generateNotificationAlertTemplate(
  data: typeof SAMPLE_DATA.notification_approval | typeof SAMPLE_DATA.notification_rejection | typeof SAMPLE_DATA.notification_request
): string {
  const iconMap = {
    approval: { icon: '&#10003;', class: 'icon-success' },
    rejection: { icon: '!', class: 'icon-error' },
    request: { icon: '&#9993;', class: 'icon-info' },
    alert: { icon: '&#9888;', class: 'icon-info' },
    info: { icon: 'i', class: 'icon-info' },
  };

  const iconConfig = iconMap[data.notificationType] || iconMap.info;
  const buttonVariant = data.notificationType === 'approval' ? 'success' : data.notificationType === 'rejection' ? 'error' : 'primary';

  const content = `
    <div class="icon-circle ${iconConfig.class}">${iconConfig.icon}</div>

    <h1 style="font-size: 22px; text-align: center; margin-bottom: 16px;">${data.title}</h1>

    <p>Hi ${data.userName},</p>
    <p>${data.message}</p>

    ${data.contextBox ? `
      <div class="highlight-box">
        <h4 style="font-size: 13px; margin: 0 0 8px; color: ${BRAND.colors.textMuted}; text-transform: uppercase; letter-spacing: 0.5px;">${data.contextBox.title}</h4>
        <p style="margin: 0; color: ${BRAND.colors.textPrimary}; font-weight: 500;">${data.contextBox.content}</p>
      </div>
    ` : ''}

    ${data.ctaText && data.ctaUrl ? `
      <div style="text-align: center; margin-top: 32px;">
        ${getCtaButton(data.ctaText, data.ctaUrl, buttonVariant)}
      </div>
    ` : ''}

    <p style="text-align: center; margin-top: 32px; font-size: 13px; color: ${BRAND.colors.textMuted};">
      Best regards,<br>
      The KStoryBridge Team
    </p>
  `;

  return wrapEmailHtml(content);
}

// Main component
export default function EmailTemplates() {
  const { toast } = useToast();
  const [activeCategory, setActiveCategory] = useState<'welcome' | 'official' | 'confirmation' | 'notification'>('welcome');
  const [selectedTemplate, setSelectedTemplate] = useState<string>('welcome');
  const [viewport, setViewport] = useState<'desktop' | 'mobile'>('desktop');
  const [welcomeVariant, setWelcomeVariant] = useState<'buyer' | 'creator'>('buyer');
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Generate HTML for current template
  const currentHtml = useMemo(() => {
    switch (selectedTemplate) {
      case 'welcome':
        return generateWelcomeTemplate(SAMPLE_DATA.welcome[welcomeVariant]);
      case 'official_update':
        return generateOfficialUpdateTemplate(SAMPLE_DATA.official_update);
      case 'payment_confirmation':
        return generatePaymentConfirmationTemplate(SAMPLE_DATA.payment_confirmation);
      case 'transaction_notification':
        return generateTransactionNotificationTemplate(SAMPLE_DATA.transaction_notification);
      case 'notification_approval':
        return generateNotificationAlertTemplate(SAMPLE_DATA.notification_approval);
      case 'notification_rejection':
        return generateNotificationAlertTemplate(SAMPLE_DATA.notification_rejection);
      case 'notification_request':
        return generateNotificationAlertTemplate(SAMPLE_DATA.notification_request);
      default:
        return '';
    }
  }, [selectedTemplate, welcomeVariant]);

  // Update iframe content when HTML changes
  useEffect(() => {
    if (iframeRef.current) {
      const doc = iframeRef.current.contentDocument;
      if (doc) {
        doc.open();
        doc.write(currentHtml);
        doc.close();
      }
    }
  }, [currentHtml]);

  const copyHtml = () => {
    navigator.clipboard.writeText(currentHtml);
    toast({
      title: 'HTML Copied',
      description: 'Email template HTML copied to clipboard',
    });
  };

  const templatesInCategory = TEMPLATE_CONFIGS.filter(t => t.category === activeCategory);
  const currentConfig = TEMPLATE_CONFIGS.find(t => t.id === selectedTemplate);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              to="/admin"
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <Icon icon="solar:arrow-left-linear" className="h-5 w-5 text-gray-600" />
            </Link>
            <div className="flex items-center gap-2">
              <Icon icon="solar:letter-bold-duotone" className="h-6 w-6 text-hanok-teal" />
              <h1 className="text-xl font-semibold">Email Templates</h1>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setViewport(viewport === 'desktop' ? 'mobile' : 'desktop')}
              className="gap-2"
            >
              <Icon
                icon={viewport === 'desktop' ? 'solar:monitor-bold-duotone' : 'solar:smartphone-bold-duotone'}
                className="h-4 w-4"
              />
              {viewport === 'desktop' ? 'Desktop' : 'Mobile'}
            </Button>
            <Button onClick={copyHtml} className="gap-2 bg-hanok-teal hover:bg-hanok-teal/90">
              <Icon icon="solar:copy-bold-duotone" className="h-4 w-4" />
              Copy HTML
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex h-[calc(100vh-73px)]">
        {/* Left Panel - Template Selection */}
        <div className="w-80 border-r bg-white overflow-y-auto">
          <Tabs value={activeCategory} onValueChange={(v) => setActiveCategory(v as typeof activeCategory)}>
            <TabsList className="w-full justify-start gap-0 bg-gray-100 p-1 m-4 mb-0 rounded-lg" style={{ width: 'calc(100% - 32px)' }}>
              <TabsTrigger value="welcome" className="flex-1 text-xs">Welcome</TabsTrigger>
              <TabsTrigger value="official" className="flex-1 text-xs">Official</TabsTrigger>
              <TabsTrigger value="confirmation" className="flex-1 text-xs">Confirm</TabsTrigger>
              <TabsTrigger value="notification" className="flex-1 text-xs">Alert</TabsTrigger>
            </TabsList>

            <div className="p-4">
              {templatesInCategory.map(template => (
                <button
                  key={template.id}
                  onClick={() => setSelectedTemplate(template.id)}
                  className={cn(
                    'w-full text-left p-3 rounded-lg mb-2 transition-colors border',
                    selectedTemplate === template.id
                      ? 'bg-hanok-teal/10 border-hanok-teal'
                      : 'bg-white border-gray-200 hover:bg-gray-50'
                  )}
                >
                  <div className="flex items-start gap-3">
                    <Icon
                      icon={template.icon}
                      className={cn(
                        'h-5 w-5 mt-0.5',
                        selectedTemplate === template.id ? 'text-hanok-teal' : 'text-gray-400'
                      )}
                    />
                    <div>
                      <div className={cn(
                        'font-medium text-sm',
                        selectedTemplate === template.id ? 'text-hanok-teal' : 'text-gray-900'
                      )}>
                        {template.name}
                      </div>
                      <div className="text-xs text-gray-500 mt-0.5">{template.description}</div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </Tabs>

          {/* Welcome variant toggle */}
          {selectedTemplate === 'welcome' && (
            <div className="px-4 pb-4 border-t pt-4 mt-2">
              <div className="text-xs font-medium text-gray-500 mb-2">Account Type Variant</div>
              <div className="flex gap-2">
                <button
                  onClick={() => setWelcomeVariant('buyer')}
                  className={cn(
                    'flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors',
                    welcomeVariant === 'buyer'
                      ? 'bg-hanok-teal text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  )}
                >
                  Buyer
                </button>
                <button
                  onClick={() => setWelcomeVariant('creator')}
                  className={cn(
                    'flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors',
                    welcomeVariant === 'creator'
                      ? 'bg-hanok-teal text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  )}
                >
                  Creator
                </button>
              </div>
            </div>
          )}

          {/* Template info */}
          {currentConfig && (
            <Card className="mx-4 mb-4 border-gray-200">
              <CardContent className="p-4">
                <div className="text-xs font-medium text-gray-500 mb-2">Template ID</div>
                <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                  {selectedTemplate === 'notification_approval' ||
                   selectedTemplate === 'notification_rejection' ||
                   selectedTemplate === 'notification_request'
                    ? 'notification_alert'
                    : selectedTemplate}
                </code>
                <div className="text-xs font-medium text-gray-500 mt-4 mb-2">Edge Function</div>
                <code className="text-xs bg-gray-100 px-2 py-1 rounded">send-email</code>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Panel - Preview */}
        <div className="flex-1 bg-gray-100 p-6 overflow-auto">
          <div
            className={cn(
              'mx-auto bg-white rounded-lg shadow-lg overflow-hidden transition-all',
              viewport === 'desktop' ? 'max-w-[600px]' : 'max-w-[375px]'
            )}
            style={{ minHeight: '80vh' }}
          >
            <iframe
              ref={iframeRef}
              title="Email Preview"
              className="w-full h-full border-0"
              style={{ minHeight: '80vh' }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
