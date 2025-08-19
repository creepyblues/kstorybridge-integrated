import { Link } from 'react-router-dom';
import { Button, Card, CardContent, Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@kstorybridge/ui';
import { useTierAccess } from '@/hooks/useTierAccess';

const BuyersPricing = () => {
  const { tier, loading } = useTierAccess();

  // Map tiers to their corresponding plan names
  const tierToPlan: Record<string, string> = {
    invited: 'free',
    basic: 'free', // Free = 'basic' in tier field  
    pro: 'pro',
    suite: 'suite'
  };

  const currentPlan = tier ? tierToPlan[tier] || 'free' : 'free';

  // Tier hierarchy for comparison
  const tierHierarchy: Record<string, number> = {
    invited: 0,
    basic: 1,
    pro: 2,
    suite: 3
  };

  const plans = [
    {
      id: 'free',
      name: 'Free',
      tagline: 'For content scouts',
      description: 'Browse Korean titles and get basic information to start your discovery.',
      price: '$0',
      priceUnit: '/month',
      features: [
        'Browse limited title catalog',
        'Access basic title info'
      ],
      tierLevel: 'basic' // Free = 'basic' in tier field
    },
    {
      id: 'pro',
      name: 'Pro',
      tagline: 'For active buyers',
      description: 'Full title access with premium insights and direct connections.',
      price: '$250',
      priceUnit: '/month',
      features: [
        'Everything in Free, plus:',
        'Full title catalog access',
        'Exclusive top titles',
        'Personalized recommendations',
        'Rights holder contact'
      ],
      tierLevel: 'pro'
    },
    {
      id: 'suite',
      name: 'Suite',
      tagline: 'For studios & networks',
      description: 'Custom solutions with expert guidance.',
      price: 'Custom',
      priceUnit: 'Contact for pricing',
      features: [
        'Everything in Pro, plus:',
        'Custom monthly recommendations',
        'Expert pitch presentations',
        'Priority support'
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
      <div className="max-w-7xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-midnight-ink mb-6">
            Flexible Plans for Your Needs
          </h1>
          <p className="text-xl text-midnight-ink-600 max-w-3xl mx-auto">
            Choose the plan that best fits your content acquisition strategy
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid lg:grid-cols-3 gap-6">
          {plans.map((plan) => (
            <Card 
              key={plan.id}
              className={`border-0 shadow-lg rounded-3xl hover:shadow-xl transition-all duration-300 bg-slate-50 overflow-hidden h-full flex flex-col ${
                tier === plan.tierLevel ? 'ring-2 ring-hanok-teal' : ''
              }`}
            >
              <CardContent className="p-0 h-full flex flex-col">
                <div className={`p-6 rounded-t-3xl flex flex-col ${
                  tier === plan.tierLevel ? 'bg-hanok-teal/10' : 'bg-slate-100'
                }`}>
                  <div className="text-sm text-slate-600 font-medium mb-2 h-5">
                    {plan.tagline}
                  </div>
                  <h3 className="text-4xl font-bold text-sunrise-coral mb-4 h-12">
                    {plan.name}
                  </h3>
                  <p className="text-slate-600 text-sm mb-6 h-10 line-clamp-2">
                    {plan.description}
                  </p>
                  
                  <div className="mb-6">
                    <div className="text-3xl font-bold text-midnight-ink h-10">
                      {plan.price}
                    </div>
                    <div className="text-slate-500 text-sm h-5">
                      {plan.priceUnit}
                    </div>
                  </div>
                  
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
                  ) : tierHierarchy[tier || 'invited'] > tierHierarchy[plan.tierLevel] ? (
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
                  ) : (
                    <Link to="/contact">
                      <Button className="w-full bg-slate-600 hover:bg-slate-700 text-white py-3 rounded-2xl font-medium transition-colors duration-300">
                        Upgrade Now
                      </Button>
                    </Link>
                  )}
                </div>
                
                <div className="p-6 bg-white flex-grow">
                  <h4 className="font-bold text-midnight-ink mb-4 h-6">
                    {plan.features[0].includes('Everything') ? plan.features[0] : 'Features you\'ll love:'}
                  </h4>
                  <div className="space-y-3">
                    {(plan.features[0].includes('Everything') ? plan.features.slice(1) : plan.features).map((feature, idx) => (
                      <div key={idx} className="flex items-start space-x-3">
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


        {/* Contact Section */}
        <div className="mt-20 text-center bg-gradient-to-r from-hanok-teal/10 to-porcelain-blue/10 rounded-3xl p-12">
          <h2 className="text-3xl font-bold text-midnight-ink mb-4">
            Have questions about our plans?
          </h2>
          <p className="text-xl text-midnight-ink-600 mb-8">
            Our team is here to help you find the perfect plan for your needs
          </p>
          <Link to="/contact">
            <Button 
              size="lg" 
              className="bg-hanok-teal hover:bg-hanok-teal-600 text-white px-12 py-6 text-lg rounded-full font-medium shadow-lg hover:shadow-xl transition-all duration-300"
            >
              Contact Sales
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default BuyersPricing;