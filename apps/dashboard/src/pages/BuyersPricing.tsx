import { Link } from 'react-router-dom';
import { Button, Card, CardContent, Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@kstorybridge/ui';
import { useTierAccess } from '@/hooks/useTierAccess';
import UpgradeToProButton from '@/components/UpgradeToProButton';

const BuyersPricing = () => {
  const { tier, loading } = useTierAccess();

  // Map tiers to their corresponding plan names
  const tierToPlan: Record<string, string> = {
    basic: 'free', // Free = 'basic' in tier field  
    pro: 'pro',
    suite: 'suite'
  };

  const currentPlan = tier ? tierToPlan[tier] || 'free' : 'free';

  // Tier hierarchy for comparison
  const tierHierarchy: Record<string, number> = {
    basic: 1,
    pro: 2,
    suite: 3
  };

  const plans = [
    {
      id: 'free',
      name: 'Free',
      tagline: '',
      description: 'Browse Korean titles with AI chatbot',
      price: '$0',
      priceUnit: '/month',
      features: [
        'Browse title catalog',
        'Access title info',
        'AI Chatbot'
      ],
      tierLevel: 'basic' // Free = 'basic' in tier field
    },
    {
      id: 'pro',
      name: 'Pro',
      tagline: '',
      description: 'Advanced AI chatbot, access to Pitch deck, contact IP holder',
      price: '$250',
      priceUnit: '/month',
      features: [
        'Everything in Free, plus:',
        'Advanced AI Chatbot',
        'Contact IP holder',
        'Access premium Pitch deck'
      ],
      tierLevel: 'pro'
    },
    {
      id: 'suite',
      name: 'Suite',
      tagline: '',
      description: 'Direct expert support with customized curation',
      price: 'Custom',
      priceUnit: 'Contact for pricing',
      features: [
        'Everything in Pro, plus:',
        'Customized Title recommendation',
        'Custom Pitch',
        'Direct Expert support'
      ],
      tierLevel: 'suite',
      comingSoon: true
    }
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">Loading pricing information...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-4 sm:py-6 lg:py-8 px-3 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8 sm:mb-12 lg:mb-16">
          <h2 className="text-xl sm:text-2xl lg:text-3xl xl:text-3xl font-bold text-midnight-ink mb-4 sm:mb-6">
            Flexible Plans for Your Needs
          </h2>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {plans.map((plan) => (
            <Card 
              key={plan.id}
              className={`border-0 shadow-lg rounded-3xl hover:shadow-xl transition-all duration-300 bg-slate-50 overflow-hidden h-full flex flex-col ${
                tier === plan.tierLevel ? 'ring-2 ring-hanok-teal' : ''
              }`}
            >
              <CardContent className="p-0 h-full flex flex-col">
                <div className={`p-4 sm:p-5 lg:p-6 rounded-t-3xl grid grid-rows-[auto_3rem_4rem_auto] gap-2 ${
                  tier === plan.tierLevel ? 'bg-hanok-teal/10' : 'bg-slate-100'
                }`}>
                  {plan.tagline && (
                    <div className="text-xs sm:text-sm text-slate-600 font-medium mb-2">
                      {plan.tagline}
                    </div>
                  )}
                  <h3 className="text-2xl sm:text-3xl lg:text-3xl font-bold text-hanok-teal">
                    {plan.name}
                  </h3>
                  <div className="h-12 flex items-start">
                    <p className="text-slate-600 text-xs sm:text-sm line-clamp-2">
                      {plan.description}
                    </p>
                  </div>

                  <div className="h-16 flex flex-col justify-center">
                    <div className="text-xl sm:text-2xl lg:text-3xl font-bold text-midnight-ink">
                      {plan.price}
                    </div>
                    <div className="text-slate-500 text-xs sm:text-sm">
                      {plan.priceUnit}
                    </div>
                  </div>
                  
                  <div className="h-14 flex items-center">
                    {/* Button Logic */}
                    {plan.comingSoon ? (
                      <Button
                        className="w-full bg-gray-300 text-gray-500 py-3 rounded-2xl font-medium cursor-default"
                        disabled
                      >
                        Coming Soon
                      </Button>
                    ) : tier === plan.tierLevel ? (
                      <Button
                        className="w-full bg-hanok-teal text-white py-3 rounded-2xl font-medium cursor-default"
                        disabled
                      >
                        Current Plan
                      </Button>
                    ) : tierHierarchy[tier || 'basic'] > tierHierarchy[plan.tierLevel] ? (
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button className="w-full bg-slate-400 hover:bg-slate-500 text-white py-3 rounded-2xl font-medium transition-colors duration-300">
                            Downgrade Plan
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Contact Us</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4">
                            <p>To discuss plan changes, please contact our team.</p>
                            <Link to="/contact">
                              <Button className="w-full bg-hanok-teal hover:bg-hanok-teal-600 text-white">
                                Contact Us
                              </Button>
                            </Link>
                          </div>
                        </DialogContent>
                      </Dialog>
                    ) : plan.id === 'pro' ? (
                      <UpgradeToProButton
                        className="w-full py-4 rounded-2xl font-bold text-lg shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105 border-2 text-white !bg-[#4C9C9B] !border-[#4C9C9B]"
                        style={{ backgroundColor: '#4C9C9B !important', borderColor: '#4C9C9B !important' }}
                      >
                        <span className="flex items-center justify-center gap-2">
                          Upgrade Now
                        </span>
                      </UpgradeToProButton>
                    ) : (
                      <Link to="/contact">
                        <Button
                          className="w-full py-4 rounded-2xl font-bold text-lg shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105 border-2 text-white !bg-[#FF6B6B] !border-[#FF6B6B]"
                          style={{ backgroundColor: '#FF6B6B !important', borderColor: '#FF6B6B !important' }}
                        >
                          <span className="flex items-center justify-center gap-2">
                            📞 Contact Us
                          </span>
                        </Button>
                      </Link>
                    )}
                  </div>
                </div>
                
                <div className="p-6 bg-white flex-grow">
                  <h4 className="font-bold text-midnight-ink mb-4 h-6">
                    {plan.features[0].includes('Everything') ? plan.features[0] : 'Features you\'ll love:'}
                  </h4>
                  <div className="space-y-3">
                    {(plan.features[0].includes('Everything') ? plan.features.slice(1) : plan.features).map((feature, idx) => (
                      <div key={idx} className="flex items-center space-x-3">
                        <span className="text-hanok-teal text-lg flex-shrink-0">✓</span>
                        <span className="text-slate-600 text-sm">{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

      </div>
    </div>
  );
};

export default BuyersPricing;