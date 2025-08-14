import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import PageHeader from '../components/PageHeader';
import { Button, Card, CardContent } from '@kstorybridge/ui';
import { useToast } from '../hooks/use-toast';
import { featuredService, type FeaturedWithTitle } from '../services/featuredService';
import Footer from '../components/Footer';

const BuyersPage = () => {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [featuredTitles, setFeaturedTitles] = useState<FeaturedWithTitle[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const loadFeaturedTitles = async () => {
      try {
        setLoading(true);
        const titles = await featuredService.getFeaturedTitles();
        setFeaturedTitles(titles);
      } catch (error) {
        console.error('Error loading featured titles:', error);
      } finally {
        setLoading(false);
      }
    };

    loadFeaturedTitles();
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

  const formatGenre = (genre: string | string[] | null) => {
    if (!genre) return '';
    if (Array.isArray(genre)) {
      return genre.map(g => g.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())).join(', ');
    }
    return genre.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
  };


  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-porcelain-blue-50">
      <PageHeader />
      
      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative py-16 lg:py-24 overflow-hidden">
          <div className="max-w-7xl mx-auto px-6">
            <div className="max-w-4xl mx-auto text-center">
              <h1 className="text-5xl lg:text-6xl font-bold mb-8 text-midnight-ink leading-tight">
                <span className="text-hanok-teal">Discover Korea's Next Global Hit Before the World Does</span>
              </h1>
              <p className="text-xl lg:text-2xl text-midnight-ink-600 mb-12 leading-relaxed max-w-3xl mx-auto">
                Scout Korean Hits with Confidence
              </p>
              
              <Link to="/signup">
                <Button id="buyers-hero-request-vip-btn" size="lg" className="bg-sunrise-coral hover:bg-sunrise-coral-600 text-white px-12 py-6 text-lg rounded-full font-medium shadow-lg hover:shadow-xl transition-all duration-300">
                  Request VIP Access
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* Quote Section */}
        <section className="py-16 bg-hanok-teal">
          <div className="max-w-7xl mx-auto px-6">
            <div className="text-center">
              <blockquote className="text-3xl lg:text-4xl font-bold text-white italic leading-relaxed max-w-5xl mx-auto">
                "Done with projects falling apart because nobody could figure out who had the authority to make decisions?"
              </blockquote>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-20 bg-white">
          <div className="max-w-7xl mx-auto px-6">
            <div className="text-center mb-16">
              <h2 className="text-4xl lg:text-5xl font-bold text-midnight-ink mb-6">
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
        <section className="py-20 bg-porcelain-blue-100">
          <div className="max-w-7xl mx-auto px-6">
            <div className="text-center mb-16">
              <h2 className="text-4xl lg:text-5xl font-bold text-midnight-ink mb-6">
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
                onClick={() => navigate('/onboarding')}
                size="lg" 
                className="bg-hanok-teal hover:bg-hanok-teal-600 text-white px-12 py-6 text-lg rounded-full font-medium shadow-lg hover:shadow-xl transition-all duration-300"
              >
                → Learn How It Works
              </Button>
            </div>
          </div>
        </section>

        {/* Quote Section */}
        <section className="py-16 bg-hanok-teal">
          <div className="max-w-7xl mx-auto px-6">
            <div className="text-center">
              <blockquote className="text-3xl lg:text-4xl font-bold text-white italic leading-relaxed max-w-5xl mx-auto">
                "Tired of hearing about amazing Korean IPs only after they've already blown up and become too expensive to acquire?"
              </blockquote>
            </div>
          </div>
        </section>

        {/* Catalog Preview */}
        <section className="py-20 bg-white">
          <div className="max-w-7xl mx-auto px-6">
            <div className="text-center mb-16">
              <h2 className="text-4xl lg:text-5xl font-bold text-midnight-ink mb-6">
                The Biggest IP Catalog
              </h2>
              <p className="text-xl text-midnight-ink-600 leading-relaxed max-w-2xl mx-auto">
                Get access to verified Korean content with proven market performance
              </p>
            </div>
            
            {loading ? (
              <div className="text-center text-midnight-ink-600 py-8 mb-16">Loading featured titles...</div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-6 mb-16">
                {featuredTitles.map((featured) => {
                  const title = featured.titles;
                  return (
                    <Card key={featured.id} className="bg-white rounded-xl border-0 shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300 group h-full flex flex-col">
                      <div className="aspect-[3/4] bg-gradient-to-br from-porcelain-blue-100 to-hanok-teal-100 flex items-center justify-center relative overflow-hidden">
                        {title.title_image ? (
                          <img 
                            src={title.title_image} 
                            alt={title.title_name_en || title.title_name_kr}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                            }}
                          />
                        ) : (
                          <>
                            {/* Placeholder illustration */}
                            <div className="w-12 h-12 bg-hanok-teal rounded-full flex items-center justify-center">
                              <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
                                <div className="w-4 h-4 bg-hanok-teal rounded opacity-60"></div>
                              </div>
                            </div>
                            <div className="absolute top-2 right-2 w-3 h-3 bg-hanok-teal rounded-full"></div>
                          </>
                        )}
                      </div>
                      <CardContent className="p-3 flex flex-col flex-grow">
                        <div className="flex-grow">
                          <h3 className="text-sm font-bold text-midnight-ink mb-1 line-clamp-2">
                            {title.title_name_en || title.title_name_kr}
                          </h3>
                          {title.title_name_en && title.title_name_kr && (
                            <p className="text-xs text-midnight-ink-500 mb-1 line-clamp-1">{title.title_name_kr}</p>
                          )}
                          <p className="text-xs text-midnight-ink-600 mb-2 line-clamp-2">
                            {title.tagline || title.pitch || 'Discover this amazing Korean story'}
                          </p>
                        </div>
                        {title.genre && (
                          <div className="mt-auto">
                            <div className="inline-block bg-hanok-teal/10 text-hanok-teal px-2 py-1 rounded-full text-xs font-medium">
                              {formatGenre(title.genre)}
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
            
            {!loading && featuredTitles.length === 0 && (
              <div className="text-center text-midnight-ink-600 py-8 mb-16">No featured titles available.</div>
            )}
            
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
        <section className="py-20 bg-porcelain-blue-100">
          <div className="max-w-7xl mx-auto px-6">
            <div className="text-center mb-16">
              <h2 className="text-4xl lg:text-5xl font-bold text-midnight-ink mb-6">
                Flexible Plans for Your Needs
              </h2>
            </div>
            
            <div className="grid lg:grid-cols-4 gap-6">
              {/* Free Plan */}
              <Card className="border-0 shadow-lg rounded-3xl hover:shadow-xl transition-all duration-300 bg-slate-50 overflow-hidden">
                <CardContent className="p-0">
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
                  
                  <div className="p-6 bg-white">
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

              {/* À la carte Plan */}
              <Card className="border-0 shadow-lg rounded-3xl hover:shadow-xl transition-all duration-300 bg-slate-50 overflow-hidden">
                <CardContent className="p-0">
                  <div className="bg-slate-100 p-6 rounded-t-3xl">
                    <div className="text-sm text-slate-600 font-medium mb-2">For selective buyers</div>
                    <h3 className="text-4xl font-bold text-sunrise-coral mb-4">à la carte</h3>
                    <p className="text-slate-600 text-sm mb-6">Pay only for what you need when exploring specific titles.</p>
                    
                    <div className="mb-6">
                      <div className="text-3xl font-bold text-midnight-ink">Pay as you go</div>
                      <div className="text-slate-500 text-sm">Per feature used</div>
                    </div>
                    
                    <Link to="/signup">
                      <Button id="buyers-pricing-alacarte-btn" className="w-full bg-slate-600 hover:bg-slate-700 text-white py-3 rounded-2xl font-medium transition-colors duration-300">
                        Get started
                      </Button>
                    </Link>
                  </div>
                  
                  <div className="p-6 bg-white">
                    <h4 className="font-bold text-midnight-ink mb-4">Everything in Free, plus:</h4>
                    <div className="space-y-3">
                      <div className="flex items-start space-x-3">
                        <span className="text-hanok-teal text-lg">✓</span>
                        <span className="text-slate-600 text-sm">Pay per premium feature</span>
                      </div>
                      <div className="flex items-start space-x-3">
                        <span className="text-hanok-teal text-lg">✓</span>
                        <span className="text-slate-600 text-sm">Contact creator access</span>
                      </div>
                      <div className="flex items-start space-x-3">
                        <span className="text-hanok-teal text-lg">✓</span>
                        <span className="text-slate-600 text-sm">Pitch deck downloads</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Pro Plan */}
              <Card className="border-0 shadow-lg rounded-3xl hover:shadow-xl transition-all duration-300 bg-slate-50 overflow-hidden">
                <CardContent className="p-0">
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
                  
                  <div className="p-6 bg-white">
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
              <Card className="border-0 shadow-lg rounded-3xl hover:shadow-xl transition-all duration-300 bg-slate-50 overflow-hidden">
                <CardContent className="p-0">
                  <div className="bg-slate-100 p-6 rounded-t-3xl">
                    <div className="text-sm text-slate-600 font-medium mb-2">For studios & networks</div>
                    <h3 className="text-4xl font-bold text-sunrise-coral mb-4">Suite</h3>
                    <p className="text-slate-600 text-sm mb-6">Custom solutions with expert guidance.</p>
                    
                    <div className="mb-6">
                      <div className="text-3xl font-bold text-midnight-ink">Custom</div>
                      <div className="text-slate-500 text-sm">Contact for pricing</div>
                    </div>
                    
                    <Button id="buyers-pricing-suite-btn" className="w-full bg-slate-600 hover:bg-slate-700 text-white py-3 rounded-2xl font-medium transition-colors duration-300" disabled>
                      Coming Soon
                    </Button>
                  </div>
                  
                  <div className="p-6 bg-white">
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

        {/* CTA Section */}
        <section className="py-20 bg-gradient-to-r from-hanok-teal to-porcelain-blue-600">
          <div className="max-w-7xl mx-auto px-6 text-center">
            <div className="max-w-4xl mx-auto space-y-8">
              <h2 className="text-4xl lg:text-5xl font-bold text-white mb-12 leading-tight">
                Ready to Scout Your Next Hit?
              </h2>
              <Link to="/signup">
                <Button id="buyers-cta-scout-catalog-btn" size="lg" className="bg-white text-hanok-teal hover:bg-snow-white px-12 py-6 text-lg rounded-full font-medium shadow-lg hover:shadow-xl transition-all duration-300">
                  Scout Catalog Now
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default BuyersPage;