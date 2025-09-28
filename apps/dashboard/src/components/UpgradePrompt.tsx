import { useState } from 'react';
import { Crown, X, ArrowRight, Star, Zap, Shield } from 'lucide-react';
import { Button } from '@kstorybridge/ui';
import { Surface, Stack, Inline } from '@/components/design-system';
import { useTierAccess } from '@/hooks/useTierAccess';
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
    icon: Star,
    title: 'Unlock Unlimited Saves',
    description: 'Save unlimited titles and organize them with Pro features',
    ctaText: 'Upgrade to Pro',
    benefits: ['Unlimited saved titles', 'Advanced filtering', 'Export collections']
  },
  contact: {
    icon: Crown,
    title: 'Connect with Creators',
    description: 'Upgrade to Pro to contact creators and rights holders directly',
    ctaText: 'Unlock Contact Info',
    benefits: ['Direct creator contact', 'Exclusive networking', 'Priority responses']
  },
  premium_content: {
    icon: Zap,
    title: 'Access Premium Content',
    description: 'Unlock pitch decks, detailed analytics, and exclusive insights',
    ctaText: 'View Premium Content',
    benefits: ['Pitch deck access', 'Market analytics', 'Exclusive content']
  },
  chat: {
    icon: Crown,
    title: 'Enhanced AI Features',
    description: 'Get advanced search, personalized recommendations, and more',
    ctaText: 'Upgrade for Better AI',
    benefits: ['Advanced AI search', 'Personalized recs', 'Priority support']
  },
  general: {
    icon: Shield,
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
  const { tier, isBasicTier } = useTierAccess();
  const navigate = useNavigate();

  // Don't show if user is not basic tier or if dismissed
  if (!isBasicTier || isDismissed) {
    return null;
  }

  const config = CONTEXT_CONFIG[context];
  const Icon = config.icon;

  const handleUpgrade = async () => {
    // Trigger appropriate conversion email
    if (user?.email && user?.user_metadata?.full_name) {
      try {
        if (context === 'contact') {
          await triggerContactAttemptEmail(
            user.id,
            user.email,
            user.user_metadata.full_name,
            tier
          );
        } else if (context === 'premium_content' && titleName) {
          await triggerPremiumContentEmail(
            user.id,
            user.email,
            user.user_metadata.full_name,
            tier,
            titleName
          );
        }
      } catch (error) {
        console.warn('Failed to trigger conversion email:', error);
      }
    }

    // Navigate to pricing page
    navigate('/buyers/pricing');
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
    sm: 'sm',
    md: 'md',
    lg: 'lg'
  };

  if (variant === 'banner') {
    return (
      <Surface variant="outlined" padding={paddingClasses[size]} className="border-pro-purple-200 bg-pro-purple-50">
        <Inline gap="sm" align="center" justify="between">
          <Inline gap="sm" align="center">
            <Icon className="h-5 w-5 text-pro-purple" />
            <span className={`font-medium text-pro-purple ${sizeClasses[size]}`}>
              {customMessage || config.description}
            </span>
          </Inline>
          <Inline gap="sm" align="center">
            <Button
              onClick={handleUpgrade}
              className="bg-pro-purple hover:bg-pro-purple-600 text-white"
              size={size === 'sm' ? 'sm' : 'default'}
            >
              {config.ctaText}
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
            {dismissible && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDismiss}
                className="text-gray-400 hover:text-gray-600 p-1"
              >
                <X className="w-4 h-4" />
              </Button>
            )}
          </Inline>
        </Inline>
      </Surface>
    );
  }

  if (variant === 'inline') {
    return (
      <Inline gap="sm" align="center" className="text-gray-600">
        <Icon className="h-4 w-4 text-pro-purple" />
        <span className={sizeClasses[size]}>
          {customMessage || config.description}
        </span>
        <Button
          onClick={handleUpgrade}
          variant="outline"
          size="sm"
          className="border-pro-purple-300 text-pro-purple hover:bg-pro-purple-50"
        >
          {config.ctaText}
        </Button>
      </Inline>
    );
  }

  // Default callout variant
  return (
    <Surface variant="outlined" padding={paddingClasses[size]} className="border-pro-purple-200 bg-gradient-to-r from-pro-purple-50 to-purple-50">
      <Stack gap="md">
        {dismissible && (
          <Inline justify="end">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDismiss}
              className="text-gray-400 hover:text-gray-600 p-1"
            >
              <X className="w-4 h-4" />
            </Button>
          </Inline>
        )}

        <Inline gap="md" align="start">
          <div className="flex-shrink-0">
            <div className="w-12 h-12 bg-pro-purple rounded-full flex items-center justify-center">
              <Icon className="w-6 h-6 text-white" />
            </div>
          </div>

          <Stack gap="sm" className="flex-1">
            <h3 className={`font-bold text-gray-900 ${sizeClasses[size]}`}>
              {config.title}
            </h3>
            <p className={`text-gray-600 ${size === 'sm' ? 'text-sm' : 'text-base'}`}>
              {customMessage || config.description}
              {titleName && ` for "${titleName}"`}
            </p>

            {size !== 'sm' && (
              <Stack gap="xs" className="text-sm text-gray-600">
                {config.benefits.map((benefit, index) => (
                  <Inline key={index} gap="xs" align="center">
                    <div className="w-1.5 h-1.5 bg-pro-purple rounded-full" />
                    <span>{benefit}</span>
                  </Inline>
                ))}
              </Stack>
            )}

            <div className="pt-2">
              <Button
                onClick={handleUpgrade}
                className="bg-pro-purple hover:bg-pro-purple-600 text-white"
                size={size === 'sm' ? 'sm' : 'default'}
              >
                <Crown className="w-4 h-4 mr-2" />
                {config.ctaText}
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </Stack>
        </Inline>
      </Stack>
    </Surface>
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