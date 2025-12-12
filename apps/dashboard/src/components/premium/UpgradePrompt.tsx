import { useState } from 'react';
import { Icon } from '@iconify/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useTierAccess } from '@/contexts/TierContext';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { triggerContactAttemptEmail, triggerPremiumContentEmail } from '@/services/emailService';

interface UpgradePromptProps {
  /** Context where the upgrade prompt is shown */
  context: 'favorites' | 'contact' | 'premium_content' | 'chat' | 'general';
  /** Optional specific title that triggered the prompt */
  titleName?: string;
  /** Whether to show the prompt inline or as a callout */
  variant?: 'inline' | 'callout' | 'banner';
  /** Custom message override */
  customMessage?: string;
  /** Whether the prompt can be dismissed */
  dismissible?: boolean;
  /** Callback when dismissed */
  onDismiss?: () => void;
  /** Size variant */
  size?: 'sm' | 'md' | 'lg';
}

const CONTEXT_CONFIG = {
  favorites: {
    icon: 'solar:star-bold-duotone',
    title: 'Unlock Unlimited Saves',
    description: 'Save unlimited titles and organize them with Pro features',
    ctaText: 'Upgrade to Pro',
    benefits: ['Unlimited saved titles', 'Advanced filtering', 'Export collections']
  },
  contact: {
    icon: 'solar:crown-bold-duotone',
    title: 'Connect with Creators',
    description: 'Upgrade to Pro to contact creators and rights holders directly',
    ctaText: 'Unlock Contact Info',
    benefits: ['Direct creator contact', 'Exclusive networking', 'Priority responses']
  },
  premium_content: {
    icon: 'solar:bolt-bold-duotone',
    title: 'Access Premium Content',
    description: 'Unlock pitch decks, detailed analytics, and exclusive insights',
    ctaText: 'View Premium Content',
    benefits: ['Pitch deck access', 'Market analytics', 'Exclusive content']
  },
  chat: {
    icon: 'solar:crown-bold-duotone',
    title: 'Enhanced AI Features',
    description: 'Get advanced search, personalized recommendations, and more',
    ctaText: 'Upgrade for Better AI',
    benefits: ['Advanced AI search', 'Personalized recs', 'Priority support']
  },
  general: {
    icon: 'solar:shield-bold-duotone',
    title: 'Unlock Pro Features',
    description: 'Get full access to premium content and exclusive features',
    ctaText: 'Upgrade to Pro',
    benefits: ['All premium features', 'Priority support', 'Advanced tools']
  }
};

export default function UpgradePrompt({
  context,
  titleName,
  variant = 'callout',
  customMessage,
  dismissible = true,
  onDismiss,
  size = 'md'
}: UpgradePromptProps) {
  const [isDismissed, setIsDismissed] = useState(false);
  const { user } = useAuth();
  const { tier } = useTierAccess();
  const navigate = useNavigate();

  // Check if user is basic tier
  const isBasicTier = tier === 'basic' || tier === 'invited';

  // Don't show if user is not basic tier or if dismissed
  if (!isBasicTier || isDismissed) {
    return null;
  }

  const config = CONTEXT_CONFIG[context];
  const iconName = config.icon;

  const handleUpgrade = async () => {
    // Trigger appropriate conversion email
    if (user?.email && user?.user_metadata?.full_name) {
      try {
        if (context === 'contact') {
          await triggerContactAttemptEmail(
            user.id,
            user.email,
            user.user_metadata.full_name,
            tier || 'basic'
          );
        } else if (context === 'premium_content' && titleName) {
          await triggerPremiumContentEmail(
            user.id,
            user.email,
            user.user_metadata.full_name,
            tier || 'basic',
            titleName
          );
        }
      } catch (error) {
        console.warn('Failed to trigger conversion email:', error);
      }
    }

    // Navigate to pricing page
    navigate('/buyers/plan');
  };

  const handleDismiss = () => {
    setIsDismissed(true);
    onDismiss?.();
  };

  const sizeClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg'
  };

  const paddingClasses = {
    sm: 'p-3',
    md: 'p-4',
    lg: 'p-6'
  };

  if (variant === 'banner') {
    return (
      <div className={`border border-purple-200 bg-purple-50 rounded-lg ${paddingClasses[size]}`}>
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Icon icon={iconName} className="h-5 w-5 text-purple-600" />
            <span className={`font-medium text-purple-600 ${sizeClasses[size]}`}>
              {customMessage || config.description}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              onClick={handleUpgrade}
              className="bg-purple-600 hover:bg-purple-700 text-white"
              size={size === 'sm' ? 'sm' : 'default'}
            >
              {config.ctaText}
              <Icon icon="solar:arrow-right-bold-duotone" className="w-4 h-4 ml-2" />
            </Button>
            {dismissible && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDismiss}
                className="text-gray-400 hover:text-gray-600 p-1"
              >
                <Icon icon="solar:close-circle-bold-duotone" className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (variant === 'inline') {
    return (
      <div className="flex items-center gap-3 text-gray-600">
        <Icon icon={iconName} className="h-4 w-4 text-purple-600" />
        <span className={sizeClasses[size]}>
          {customMessage || config.description}
        </span>
        <Button
          onClick={handleUpgrade}
          variant="outline"
          size="sm"
          className="border-purple-300 text-purple-600 hover:bg-purple-50"
        >
          {config.ctaText}
        </Button>
      </div>
    );
  }

  // Default callout variant
  return (
    <Card className="border-purple-200 bg-gradient-to-r from-purple-50 to-purple-50/50">
      <CardContent className={paddingClasses[size]}>
        <div className="space-y-4">
          {dismissible && (
            <div className="flex justify-end">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDismiss}
                className="text-gray-400 hover:text-gray-600 p-1"
              >
                <Icon icon="solar:close-circle-bold-duotone" className="w-4 h-4" />
              </Button>
            </div>
          )}

          <div className="flex items-start gap-4">
            <div className="flex-shrink-0">
              <div className="w-12 h-12 bg-purple-600 rounded-full flex items-center justify-center">
                <Icon icon={iconName} className="w-6 h-6 text-white" />
              </div>
            </div>

            <div className="flex-1 space-y-3">
              <h3 className={`font-bold text-gray-900 ${sizeClasses[size]}`}>
                {config.title}
              </h3>
              <p className={`text-gray-600 ${size === 'sm' ? 'text-sm' : 'text-base'}`}>
                {customMessage || config.description}
                {titleName && ` for "${titleName}"`}
              </p>

              {size !== 'sm' && (
                <div className="space-y-2 text-sm text-gray-600">
                  {config.benefits.map((benefit, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-purple-600 rounded-full" />
                      <span>{benefit}</span>
                    </div>
                  ))}
                </div>
              )}

              <div className="pt-2">
                <Button
                  onClick={handleUpgrade}
                  className="bg-purple-600 hover:bg-purple-700 text-white"
                  size={size === 'sm' ? 'sm' : 'default'}
                >
                  <Icon icon="solar:crown-bold-duotone" className="w-4 h-4 mr-2" />
                  {config.ctaText}
                  <Icon icon="solar:arrow-right-bold-duotone" className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Export convenience components for common use cases
export function ContactUpgradePrompt({ titleName, ...props }: Omit<UpgradePromptProps, 'context'>) {
  return <UpgradePrompt context="contact" titleName={titleName} {...props} />;
}

export function PremiumContentUpgradePrompt({ titleName, ...props }: Omit<UpgradePromptProps, 'context'>) {
  return <UpgradePrompt context="premium_content" titleName={titleName} {...props} />;
}

export function FavoritesUpgradePrompt(props: Omit<UpgradePromptProps, 'context'>) {
  return <UpgradePrompt context="favorites" {...props} />;
}

export function ChatUpgradePrompt(props: Omit<UpgradePromptProps, 'context'>) {
  return <UpgradePrompt context="chat" {...props} />;
}
