import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import PageHeader from '../components/PageHeader';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { useToast } from '../hooks/use-toast';
import { titlesService, type Title } from '../services/titlesService';
import Footer from '../components/Footer';

const BuyersPage = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [titlesWithPitches, setTitlesWithPitches] = useState<Title[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const loadTitlesWithPitches = async () => {
      try {
        setLoading(true);
        const titles = await titlesService.getTitlesWithPitches(6);
        setTitlesWithPitches(titles);
      } catch (error) {
        console.error('Error loading titles with pitches:', error);
      } finally {
        setLoading(false);
      }
    };

    loadTitlesWithPitches();
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

  const formatGenre = (genre: string | null) => {
    if (!genre) return '';
    return genre.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  const mockCovers = [
    { title: "Webtoon Title 1", genre: "Romance", blur: true },
    { title: "Novel Series 2", genre: "Action", blur: true },
    { title: "Game IP 3", genre: "Fantasy", blur: true },
    { title: "Webtoon Title 4", genre: "Thriller", blur: true },
    { title: "Novel Series 5", genre: "Sci-Fi", blur: true },
    { title: "Game IP 6", genre: "Horror", blur: true }
  ];

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

        {/* Stats Strip */}
        <section className="py-16 bg-hanok-teal">
          <div className="max-w-7xl mx-auto px-6">
            <div className="grid md:grid-cols-3 gap-12 text-center">
              <div className="space-y-3">
                <div className="text-4xl lg:text-5xl font-bold text-white">42 → 5</div>
                <div className="text-lg text-white/90 font-medium">days for chain-of-title verification</div>
              </div>
              <div className="space-y-3">
                <div className="text-4xl lg:text-5xl font-bold text-white">12 → 1</div>
                <div className="text-lg text-white/90 font-medium">clicks to schedule Korean creator calls</div>
              </div>
              <div className="space-y-3">
                <div className="text-4xl lg:text-5xl font-bold text-white">$3K → $0</div>
                <div className="text-lg text-white/90 font-medium">translation costs with smart summaries</div>
              </div>
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
          </div>
        </section>

        {/* Catalogue Preview */}
        <section className="py-20 bg-white">
          <div className="max-w-7xl mx-auto px-6">
            <div className="text-center mb-16">
              <h2 className="text-4xl lg:text-5xl font-bold text-midnight-ink mb-6">
                The Biggest IP Catalogue
              </h2>
              <p className="text-xl text-midnight-ink-600 leading-relaxed max-w-2xl mx-auto">
                Get access to verified Korean content with proven market performance
              </p>
            </div>
            
            {loading ? (
              <div className="text-center text-midnight-ink-600 py-8 mb-16">Loading titles...</div>
            ) : (
              <div className="grid md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-6 mb-16">
                {titlesWithPitches.map((title) => (
                  <Card key={title.title_id} className="bg-white rounded-xl border-0 shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300 cursor-pointer group">
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
                    <CardContent className="p-3">
                      <h3 className="text-sm font-bold text-midnight-ink mb-1 line-clamp-2">
                        {title.title_name_en || title.title_name_kr}
                      </h3>
                      {title.title_name_en && title.title_name_kr && (
                        <p className="text-xs text-midnight-ink-500 mb-1 line-clamp-1">{title.title_name_kr}</p>
                      )}
                      <p className="text-xs text-midnight-ink-600 mb-2 line-clamp-2">
                        {title.tagline || title.pitch || 'Korean story with pitch available'}
                      </p>
                      {title.genre && (
                        <div className="inline-block bg-hanok-teal/10 text-hanok-teal px-2 py-1 rounded-full text-xs font-medium">
                          {formatGenre(title.genre)}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
            
            {!loading && titlesWithPitches.length === 0 && (
              <div className="text-center text-midnight-ink-600 py-8 mb-16">No titles with pitches available.</div>
            )}
            
            <div className="text-center">
              <Link to="/signup">
                <Button id="buyers-catalogue-join-btn" size="lg" className="bg-hanok-teal hover:bg-hanok-teal-600 text-white px-12 py-6 text-lg rounded-full font-medium shadow-lg hover:shadow-xl transition-all duration-300">
                  Join to View Full Catalogue
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
            
            <div className="grid lg:grid-cols-3 gap-8">
              <Card className="text-center border-0 shadow-lg rounded-2xl hover:shadow-xl transition-shadow duration-300 bg-white">
                <CardContent className="p-10">
                  <h3 className="text-2xl font-bold text-midnight-ink mb-4">Free Preview</h3>
                  <div className="text-5xl font-bold text-midnight-ink mb-8">$0</div>
                  <div className="space-y-4 text-left mb-10">
                    <div className="flex items-start space-x-3">
                      <span className="text-hanok-teal font-bold text-lg">•</span>
                      <span className="text-midnight-ink-600">Browse public catalogue</span>
                    </div>
                    <div className="flex items-start space-x-3">
                      <span className="text-hanok-teal font-bold text-lg">•</span>
                      <span className="text-midnight-ink-600">Basic content info</span>
                    </div>
                    <div className="flex items-start space-x-3">
                      <span className="text-hanok-teal font-bold text-lg">•</span>
                      <span className="text-midnight-ink-600">Limited contact access</span>
                    </div>
                  </div>
                  <Link to="/signup">
                    <Button id="buyers-pricing-free-btn" variant="outline" className="w-full border-2 border-hanok-teal text-hanok-teal hover:bg-hanok-teal hover:text-white py-4 rounded-full font-medium transition-colors duration-300">
                      Start Free
                    </Button>
                  </Link>
                </CardContent>
              </Card>

              <Card className="relative border-2 border-hanok-teal shadow-xl rounded-2xl hover:shadow-2xl transition-shadow duration-300 transform scale-105 bg-white">
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <span className="bg-hanok-teal text-white px-6 py-2 rounded-full text-sm font-bold shadow-lg">
                    Most Popular
                  </span>
                </div>
                <CardContent className="p-10 text-center">
                  <h3 className="text-2xl font-bold text-midnight-ink mb-4">Pro Scout</h3>
                  <div className="text-5xl font-bold text-hanok-teal mb-2">$199</div>
                  <div className="text-midnight-ink-500 mb-8">/mo</div>
                  
                  <div className="space-y-4 text-left mb-10">
                    <div className="flex items-start space-x-3">
                      <span className="text-hanok-teal font-bold text-lg">•</span>
                      <span className="text-midnight-ink-600">Full catalogue access</span>
                    </div>
                    <div className="flex items-start space-x-3">
                      <span className="text-hanok-teal font-bold text-lg">•</span>
                      <span className="text-midnight-ink-600">Advanced analytics</span>
                    </div>
                    <div className="flex items-start space-x-3">
                      <span className="text-hanok-teal font-bold text-lg">•</span>
                      <span className="text-midnight-ink-600">Direct creator contact</span>
                    </div>
                    <div className="flex items-start space-x-3">
                      <span className="text-hanok-teal font-bold text-lg">•</span>
                      <span className="text-midnight-ink-600">Pitch deck access</span>
                    </div>
                  </div>
                  <Link to="/signup">
                    <Button id="buyers-pricing-pro-btn" className="w-full bg-hanok-teal hover:bg-hanok-teal-600 text-white py-4 rounded-full font-medium shadow-lg hover:shadow-xl transition-all duration-300">
                      Start Pro Trial
                    </Button>
                  </Link>
                </CardContent>
              </Card>

              <Card className="text-center border-0 shadow-lg rounded-2xl hover:shadow-xl transition-shadow duration-300 bg-white">
                <CardContent className="p-10">
                  <h3 className="text-2xl font-bold text-midnight-ink mb-4">Enterprise</h3>
                  <div className="text-5xl font-bold text-midnight-ink mb-8">Custom</div>
                  <div className="space-y-4 text-left mb-10">
                    <div className="flex items-start space-x-3">
                      <span className="text-hanok-teal font-bold text-lg">•</span>
                      <span className="text-midnight-ink-600">Everything in Pro</span>
                    </div>
                    <div className="flex items-start space-x-3">
                      <span className="text-hanok-teal font-bold text-lg">•</span>
                      <span className="text-midnight-ink-600">Custom integrations</span>
                    </div>
                    <div className="flex items-start space-x-3">
                      <span className="text-hanok-teal font-bold text-lg">•</span>
                      <span className="text-midnight-ink-600">Dedicated account manager</span>
                    </div>
                    <div className="flex items-start space-x-3">
                      <span className="text-hanok-teal font-bold text-lg">•</span>
                      <span className="text-midnight-ink-600">Priority support</span>
                    </div>
                  </div>
                  <Link to="/signup">
                    <Button id="buyers-pricing-enterprise-btn" variant="outline" className="w-full border-2 border-midnight-ink text-midnight-ink hover:bg-midnight-ink hover:text-white py-4 rounded-full font-medium transition-colors duration-300">
                      Contact Sales
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 bg-gradient-to-r from-hanok-teal to-porcelain-blue-600">
          <div className="max-w-7xl mx-auto px-6 text-center">
            <div className="max-w-4xl mx-auto space-y-8">
              <h2 className="text-4xl lg:text-5xl font-bold text-white mb-6 leading-tight">
                Ready to Scout Your Next Hit?
              </h2>
              <p className="text-xl text-white/90 leading-relaxed mb-12">
                Join executives from Top Streaming platforms and Hollywood Studios already discovering Korean IP on KStoryBridge.
              </p>
              <Link to="/signup">
                <Button id="buyers-cta-scout-catalogue-btn" size="lg" className="bg-white text-hanok-teal hover:bg-snow-white px-12 py-6 text-lg rounded-full font-medium shadow-lg hover:shadow-xl transition-all duration-300">
                  Scout Catalogue Now
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