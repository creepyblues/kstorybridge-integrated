import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import UniversalHeader from '../components/UniversalHeader';
import { Button } from '@kstorybridge/ui';
import { Card, CardContent } from '../components/ui/card';
import { useToast } from '../hooks/use-toast';
import FeaturedTitlesCarousel from '../components/FeaturedTitlesCarousel';
import Footer from '../components/Footer';

const BuyersPage = () => {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // Load Beehiiv script
    const script = document.createElement('script');
    script.src = 'https://subscribe-forms.beehiiv.com/embed.js';
    script.async = true;
    document.body.appendChild(script);

    return () => {
      // Cleanup script on unmount
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Simulate form submission
    await new Promise(resolve => setTimeout(resolve, 2000));
    toast({
      title: "VIP Access Request Submitted!",
      description: "Thanks, we'll be in touch within 48 hours."
    });
    setIsSubmitting(false);
  };

  const handleTitleClick = (titleId: string) => {
    navigate(`/title/${titleId}`);
  };


  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-porcelain-blue-50">
      <UniversalHeader />
      
      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative py-12 sm:py-16 lg:py-24 overflow-hidden">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto text-center">
              <h1 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-bold mb-6 sm:mb-8 text-midnight-ink leading-tight">
                <span className="text-hanok-teal">Discover Korea's Next Global Hit Before the World Does</span>
              </h1>
              <p className="text-lg sm:text-xl lg:text-2xl text-midnight-ink-600 mb-8 sm:mb-12 leading-relaxed max-w-3xl mx-auto">
                Scout Korean Hits with Confidence
              </p>
              
              <Link to="/signup">
                <Button id="buyers-hero-request-vip-btn" size="lg" className="bg-sunrise-coral hover:bg-sunrise-coral-600 text-white px-8 sm:px-12 py-4 sm:py-6 text-base sm:text-lg rounded-full font-medium shadow-lg hover:shadow-xl transition-all duration-300">
                  Request VIP Access
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* Quote Section */}
        <section className="py-12 sm:py-16 bg-hanok-teal">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <blockquote className="text-xl sm:text-2xl lg:text-3xl xl:text-4xl font-bold text-white italic leading-relaxed max-w-5xl mx-auto">
                "Done with projects falling apart because nobody could figure out who had the authority to make decisions?"
              </blockquote>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-12 sm:py-16 lg:py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-8 sm:mb-12 lg:mb-16">
              <h2 className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-bold text-midnight-ink mb-6">
                Why Buyers Choose KStoryBridge
              </h2>
            </div>
            
            <div className="grid lg:grid-cols-3 gap-12">
              <div className="text-center group">
                <div className="w-20 h-20 bg-hanok-teal/10 rounded-2xl flex items-center justify-center mx-auto mb-8 group-hover:bg-hanok-teal/20 transition-colors duration-300">
                  <span className="text-hanok-teal text-3xl">📚</span>
                </div>
                <h3 className="text-2xl font-bold text-midnight-ink mb-6">Vast IP Catalog with Adaptation Insight</h3>
                <p className="text-midnight-ink-600 text-lg leading-relaxed">
                  Access every Korean title in one place with professional cultural interpretation and adaptation insights.
                </p>
              </div>

              <div className="text-center group">
                <div className="w-20 h-20 bg-porcelain-blue/20 rounded-2xl flex items-center justify-center mx-auto mb-8 group-hover:bg-porcelain-blue/30 transition-colors duration-300">
                  <span className="text-porcelain-blue-600 text-3xl">🤝</span>
                </div>
                <h3 className="text-2xl font-bold text-midnight-ink mb-6">Direct Access to Rights Holder</h3>
                <p className="text-midnight-ink-600 text-lg leading-relaxed">
                  Connect straight to decision-makers with deal authority, skip the intermediaries and close faster.
                </p>
              </div>

              <div className="text-center group">
                <div className="w-20 h-20 bg-sunrise-coral/10 rounded-2xl flex items-center justify-center mx-auto mb-8 group-hover:bg-sunrise-coral/20 transition-colors duration-300">
                  <span className="text-sunrise-coral text-3xl">⚖️</span>
                </div>
                <h3 className="text-2xl font-bold text-midnight-ink mb-6">Expert Deal Navigation</h3>
                <p className="text-midnight-ink-600 text-lg leading-relaxed">
                  Bridge the cultural and legal gap with expert mediation—we handle complex Korean entertainment contracts, rights structures, and negotiation customs so deals actually close.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Process Section */}
        <section className="py-12 sm:py-16 lg:py-20 bg-porcelain-blue-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-8 sm:mb-12 lg:mb-16">
              <h2 className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-bold text-midnight-ink mb-6">
                How Buyers Find Their Next Hit
              </h2>
            </div>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              <div className="text-center space-y-6">
                <div className="w-16 h-16 bg-hanok-teal text-white rounded-2xl flex items-center justify-center text-xl font-bold mx-auto shadow-lg">
                  01
                </div>
                <div className="space-y-3">
                  <h3 className="text-xl font-bold text-midnight-ink">Browse & Discover</h3>
                  <p className="text-midnight-ink-600 leading-relaxed">Based on your preferences and market trends, we surface titles with breakout potential for your audience.</p>
                </div>
              </div>
              
              <div className="text-center space-y-6">
                <div className="w-16 h-16 bg-hanok-teal text-white rounded-2xl flex items-center justify-center text-xl font-bold mx-auto shadow-lg">
                  02
                </div>
                <div className="space-y-3">
                  <h3 className="text-xl font-bold text-midnight-ink">Analyze & Evaluate</h3>
                  <p className="text-midnight-ink-600 leading-relaxed">Review adaptation insights and analytics to make confident acquisition decisions.</p>
                </div>
              </div>
              
              <div className="text-center space-y-6">
                <div className="w-16 h-16 bg-hanok-teal text-white rounded-2xl flex items-center justify-center text-xl font-bold mx-auto shadow-lg">
                  03
                </div>
                <div className="space-y-3">
                  <h3 className="text-xl font-bold text-midnight-ink">Connect & Negotiate</h3>
                  <p className="text-midnight-ink-600 leading-relaxed">Reach verified rights holders directly and negotiate directly or with our expert help.</p>
                </div>
              </div>
              
              <div className="text-center space-y-6">
                <div className="w-16 h-16 bg-hanok-teal text-white rounded-2xl flex items-center justify-center text-xl font-bold mx-auto shadow-lg">
                  04
                </div>
                <div className="space-y-3">
                  <h3 className="text-xl font-bold text-midnight-ink">Secure & Adapt</h3>
                  <p className="text-midnight-ink-600 leading-relaxed">Complete rights acquisition with a clear chain of title for seamless adaptation.</p>
                </div>
              </div>
            </div>
            
            {/* Learn How It Works Button */}
            <div className="text-center mt-12">
              <Button 
                onClick={() => navigate('/buyers/onboarding')}
                size="lg" 
                className="bg-hanok-teal hover:bg-hanok-teal-600 text-white px-12 py-6 text-lg rounded-full font-medium shadow-lg hover:shadow-xl transition-all duration-300"
              >
                → Learn How It Works
              </Button>
            </div>
          </div>
        </section>

        {/* Quote Section */}
        <section className="py-12 sm:py-16 bg-hanok-teal">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <blockquote className="text-xl sm:text-2xl lg:text-3xl xl:text-4xl font-bold text-white italic leading-relaxed max-w-5xl mx-auto">
                "Tired of hearing about amazing Korean IPs only after they've already blown up and become too expensive to acquire?"
              </blockquote>
            </div>
          </div>
        </section>

        {/* Catalog Preview */}
        <section className="py-12 sm:py-16 lg:py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-8 sm:mb-12 lg:mb-16">
              <h2 className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-bold text-midnight-ink mb-6">
                The Biggest IP Catalog
              </h2>
              <p className="text-xl text-midnight-ink-600 leading-relaxed max-w-2xl mx-auto">
                Get access to verified Korean content with proven market performance
              </p>
            </div>
            
            <div className="mb-16">
              <FeaturedTitlesCarousel 
                onTitleClick={handleTitleClick}
                className=""
              />
            </div>
            
            <div className="text-center">
              <Link to="/signup">
                <Button id="buyers-catalog-join-btn" size="lg" className="bg-hanok-teal hover:bg-hanok-teal-600 text-white px-12 py-6 text-lg rounded-full font-medium shadow-lg hover:shadow-xl transition-all duration-300">
                  Join to View Full Catalog
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* Pricing Section */}
        <section className="py-12 sm:py-16 lg:py-20 bg-porcelain-blue-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-8 sm:mb-12 lg:mb-16">
              <h2 className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-bold text-midnight-ink mb-6">
                Flexible Plans for Your Needs
              </h2>
            </div>
            
            <div className="grid lg:grid-cols-3 gap-6 items-start">
              {/* Free Plan */}
              <Card className="border-0 shadow-lg rounded-3xl hover:shadow-xl transition-all duration-300 bg-white overflow-hidden h-full flex flex-col">
                <CardContent className="p-0 flex flex-col h-full">
                  <div className="bg-slate-100 p-6 rounded-t-3xl">
                    <div className="text-sm text-slate-600 font-medium mb-2">For content scouts</div>
                    <h3 className="text-4xl font-bold text-sunrise-coral mb-4">Free</h3>
                    <p className="text-slate-600 text-sm mb-6">Browse Korean titles and get basic information to start your discovery.</p>
                    
                    <div className="mb-6">
                      <div className="text-3xl font-bold text-midnight-ink">$0</div>
                      <div className="text-slate-500 text-sm">/month</div>
                    </div>
                    
                    <Link to="/signup">
                      <Button id="buyers-pricing-free-btn" className="w-full bg-slate-600 hover:bg-slate-700 text-white py-3 rounded-2xl font-medium transition-colors duration-300">
                        Get started
                      </Button>
                    </Link>
                  </div>
                  
                  <div className="p-6 bg-white flex-1">
                    <h4 className="font-bold text-midnight-ink mb-4">Features you'll love:</h4>
                    <div className="space-y-3">
                      <div className="flex items-start space-x-3">
                        <span className="text-hanok-teal text-lg">✓</span>
                        <span className="text-slate-600 text-sm">Browse limited title catalog</span>
                      </div>
                      <div className="flex items-start space-x-3">
                        <span className="text-hanok-teal text-lg">✓</span>
                        <span className="text-slate-600 text-sm">Access basic title info</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>


              {/* Pro Plan */}
              <Card className="border-0 shadow-lg rounded-3xl hover:shadow-xl transition-all duration-300 bg-white overflow-hidden h-full flex flex-col">
                <CardContent className="p-0 flex flex-col h-full">
                  <div className="bg-slate-100 p-6 rounded-t-3xl">
                    <div className="text-sm text-slate-600 font-medium mb-2">For active buyers</div>
                    <h3 className="text-4xl font-bold text-sunrise-coral mb-4">Pro</h3>
                    <p className="text-slate-600 text-sm mb-6">Full title access with premium insights and direct connections.</p>
                    
                    <div className="mb-6">
                      <div className="text-3xl font-bold text-midnight-ink">$250</div>
                      <div className="text-slate-500 text-sm">/month</div>
                    </div>
                    
                    <Link to="/signup">
                      <Button id="buyers-pricing-pro-btn" className="w-full bg-slate-600 hover:bg-slate-700 text-white py-3 rounded-2xl font-medium transition-colors duration-300">
                        Get started
                      </Button>
                    </Link>
                  </div>
                  
                  <div className="p-6 bg-white flex-1">
                    <h4 className="font-bold text-midnight-ink mb-4">Everything in Free, plus:</h4>
                    <div className="space-y-3">
                      <div className="flex items-start space-x-3">
                        <span className="text-hanok-teal text-lg">✓</span>
                        <span className="text-slate-600 text-sm">Full title catalog access</span>
                      </div>
                      <div className="flex items-start space-x-3">
                        <span className="text-hanok-teal text-lg">✓</span>
                        <span className="text-slate-600 text-sm">Exclusive top titles</span>
                      </div>
                      <div className="flex items-start space-x-3">
                        <span className="text-hanok-teal text-lg">✓</span>
                        <span className="text-slate-600 text-sm">Personalized recommendations</span>
                      </div>
                      <div className="flex items-start space-x-3">
                        <span className="text-hanok-teal text-lg">✓</span>
                        <span className="text-slate-600 text-sm">Rights holder contact</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Suite Plan */}
              <Card className="border-0 shadow-lg rounded-3xl hover:shadow-xl transition-all duration-300 bg-white overflow-hidden h-full flex flex-col">
                <CardContent className="p-0 flex flex-col h-full">
                  <div className="bg-slate-100 p-6 rounded-t-3xl">
                    <div className="text-sm text-slate-600 font-medium mb-2">For studios & networks</div>
                    <h3 className="text-4xl font-bold text-sunrise-coral mb-4">Suite</h3>
                    <p className="text-slate-600 text-sm mb-6">Custom solutions with expert guidance and dedicated support.</p>
                    
                    <div className="mb-6">
                      <div className="text-3xl font-bold text-midnight-ink">Custom</div>
                      <div className="text-slate-500 text-sm">Contact for pricing</div>
                    </div>
                    
                    <Button id="buyers-pricing-suite-btn" className="w-full bg-slate-600 hover:bg-slate-700 text-white py-3 rounded-2xl font-medium transition-colors duration-300" disabled>
                      Coming Soon
                    </Button>
                  </div>
                  
                  <div className="p-6 bg-white flex-1">
                    <h4 className="font-bold text-midnight-ink mb-4">Everything in Pro, plus:</h4>
                    <div className="space-y-3">
                      <div className="flex items-start space-x-3">
                        <span className="text-hanok-teal text-lg">✓</span>
                        <span className="text-slate-600 text-sm">Custom monthly recommendations</span>
                      </div>
                      <div className="flex items-start space-x-3">
                        <span className="text-hanok-teal text-lg">✓</span>
                        <span className="text-slate-600 text-sm">Expert pitch presentations</span>
                      </div>
                      <div className="flex items-start space-x-3">
                        <span className="text-hanok-teal text-lg">✓</span>
                        <span className="text-slate-600 text-sm">Priority support</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Newsletter Section */}
        <section className="bg-white overflow-hidden">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-8 lg:pt-10 pb-12 sm:pb-16 lg:pb-20" style={{ marginBottom: '-144px' }}>
            <iframe 
              src="https://subscribe-forms.beehiiv.com/44fe1ec1-b67e-4431-9ed2-84a8bb05dbbc" 
              className="beehiiv-embed" 
              data-test-id="beehiiv-embed" 
              frameBorder="0" 
              scrolling="no" 
              style={{
                width: '1014px',
                height: '288px',
                margin: '0 auto',
                borderRadius: '0px',
                backgroundColor: 'transparent',
                boxShadow: '0 0 #0000',
                maxWidth: '100%',
                display: 'block'
              }}
            />
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default BuyersPage;