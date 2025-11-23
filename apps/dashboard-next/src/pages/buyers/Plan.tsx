import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useTierAccess } from '@/contexts/TierContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { BuyerLayout } from '@/components/layout/BuyerLayout';
import { Check, Sparkles, Crown, CreditCard } from 'lucide-react';

interface TierPlan {
  tier: 'basic' | 'pro' | 'suite';
  name: string;
  price: string;
  priceId: string; // Stripe Price ID (to be added)
  description: string;
  icon: any;
  color: string;
  features: string[];
  popular?: boolean;
}

const plans: TierPlan[] = [
  {
    tier: 'basic',
    name: 'Basic',
    price: 'Free',
    priceId: '', // No payment required
    description: 'Get started with basic features',
    icon: null,
    color: 'border-gray-300',
    features: [
      'Browse all titles',
      'AI chatbot assistance',
      'Save favorite titles',
      'Basic title information',
      'Community support',
    ],
  },
  {
    tier: 'pro',
    name: 'Pro',
    price: '$99/month',
    priceId: 'price_pro_monthly', // TODO: Replace with actual Stripe Price ID
    description: 'Unlock premium features and pitch decks',
    icon: Sparkles,
    color: 'border-pro-purple',
    popular: true,
    features: [
      'Everything in Basic',
      'Access to pitch decks',
      'Premium title analytics',
      'Advanced search filters',
      'Priority email support',
      'Export title data',
    ],
  },
  {
    tier: 'suite',
    name: 'Suite',
    price: '$299/month',
    priceId: 'price_suite_monthly', // TODO: Replace with actual Stripe Price ID
    description: 'Full access with priority support',
    icon: Crown,
    color: 'border-yellow-500',
    features: [
      'Everything in Pro',
      'Early access to new titles',
      'Dedicated account manager',
      '1-on-1 consultation calls',
      'Custom reports',
      'API access',
      'White-label options',
    ],
  },
];

export default function Plan() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { tier: currentTier } = useTierAccess();

  const handleSelectPlan = async (plan: TierPlan) => {
    if (!user?.email) {
      navigate('/signin');
      return;
    }

    // If already on this tier, go back
    if (plan.tier === currentTier) {
      navigate('/buyers/profile');
      return;
    }

    // Basic tier - no payment needed
    if (plan.tier === 'basic') {
      navigate('/buyers/profile');
      return;
    }

    // For Pro/Suite - redirect to checkout
    // TODO: Implement Stripe checkout
    console.log('TODO: Redirect to Stripe checkout for', plan.tier, plan.priceId);
    navigate('/buyers/checkout?tier=' + plan.tier);
  };

  return (
    <BuyerLayout>
      <div className="max-w-6xl mx-auto p-6 space-y-8">
        {/* Header */}
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-br from-hanok-teal to-hanok-teal/80 p-3 rounded-2xl shadow-lg">
              <CreditCard className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl lg:text-4xl font-bold text-hanok-teal">Choose Your Plan</h1>
              <p className="text-lg text-gray-600 mt-1">Flexible Subscription Options</p>
            </div>
          </div>
          <p className="text-gray-600 text-base">
            Unlock the full power of KStoryBridge with our flexible plans. Upgrade or downgrade anytime to match your needs.
          </p>
        </div>

        {/* Current Tier Badge */}
        {currentTier && (
          <div className="text-center mb-8">
            <span className="inline-block px-4 py-2 bg-hanok-teal/10 text-hanok-teal rounded-full text-sm font-medium">
              Current Plan: <span className="font-bold capitalize">{currentTier}</span>
            </span>
          </div>
        )}

        {/* Plans Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {plans.map((plan) => {
            const Icon = plan.icon;
            const isCurrentTier = plan.tier === currentTier;

            return (
              <Card
                key={plan.tier}
                className={`relative ${plan.color} ${
                  plan.popular ? 'border-2' : ''
                } ${isCurrentTier ? 'bg-gray-50' : 'bg-white'}`}
              >
                {/* Popular Badge */}
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <span className="bg-pro-purple text-white px-3 py-1 rounded-full text-xs font-semibold">
                      Most Popular
                    </span>
                  </div>
                )}

                <CardContent className="p-6">
                  {/* Icon & Name */}
                  <div className="text-center mb-6">
                    {Icon && (
                      <div className="inline-flex items-center justify-center w-12 h-12 bg-gray-100 rounded-full mb-3">
                        <Icon className="h-6 w-6 text-gray-700" />
                      </div>
                    )}
                    <h3 className="text-2xl font-bold text-black mb-2">{plan.name}</h3>
                    <p className="text-sm text-gray-600 mb-4">{plan.description}</p>
                    <div className="text-3xl font-bold text-hanok-teal">{plan.price}</div>
                    {plan.price !== 'Free' && (
                      <div className="text-sm text-gray-500">per month</div>
                    )}
                  </div>

                  {/* Features */}
                  <ul className="space-y-3 mb-6">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-start gap-2 text-sm text-gray-700">
                        <Check className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>

                  {/* CTA Button */}
                  <Button
                    onClick={() => handleSelectPlan(plan)}
                    disabled={isCurrentTier}
                    className={`w-full ${
                      isCurrentTier
                        ? 'bg-gray-300 cursor-not-allowed'
                        : plan.popular
                        ? 'bg-pro-purple hover:bg-pro-purple/90'
                        : 'bg-black hover:bg-gray-800'
                    }`}
                  >
                    {isCurrentTier
                      ? 'Current Plan'
                      : plan.tier === 'basic'
                      ? 'Downgrade to Basic'
                      : `Upgrade to ${plan.name}`}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* FAQ Section */}
        <Card className="max-w-3xl mx-auto">
          <CardContent className="p-6">
            <h3 className="text-lg font-bold text-black mb-4">Frequently Asked Questions</h3>
            <div className="space-y-4">
              <div>
                <div className="font-medium text-black mb-1">Can I change plans anytime?</div>
                <div className="text-sm text-gray-600">
                  Yes! You can upgrade or downgrade your plan at any time. Changes take effect
                  immediately, and we'll prorate any charges.
                </div>
              </div>
              <div>
                <div className="font-medium text-black mb-1">What payment methods do you accept?</div>
                <div className="text-sm text-gray-600">
                  We accept all major credit cards (Visa, Mastercard, American Express) via
                  Stripe's secure payment processing.
                </div>
              </div>
              <div>
                <div className="font-medium text-black mb-1">Is there a free trial?</div>
                <div className="text-sm text-gray-600">
                  The Basic plan is free forever. For Pro and Suite plans, we offer a 14-day
                  money-back guarantee.
                </div>
              </div>
              <div>
                <div className="font-medium text-black mb-1">Can I cancel anytime?</div>
                <div className="text-sm text-gray-600">
                  Yes, you can cancel your subscription at any time. You'll retain access until the
                  end of your billing period.
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </BuyerLayout>
  );
}
