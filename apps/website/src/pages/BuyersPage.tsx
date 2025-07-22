
import { useState } from 'react';
import { Link } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import KoreanPattern from '../components/KoreanPattern';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { useToast } from '../hooks/use-toast';

const BuyersPage = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

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

  const mockCovers = [
    { title: "Webtoon Title 1", genre: "Romance", blur: true },
    { title: "Novel Series 2", genre: "Action", blur: true },
    { title: "Game IP 3", genre: "Fantasy", blur: true },
    { title: "Webtoon Title 4", genre: "Thriller", blur: true },
    { title: "Novel Series 5", genre: "Sci-Fi", blur: true },
    { title: "Game IP 6", genre: "Horror", blur: true }
  ];

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Header />
      
      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative py-24 lg:py-32 overflow-hidden bg-gradient-to-b from-white to-gray-50/50">
          <KoreanPattern />
          
          <div className="container mx-auto px-6 lg:px-8 relative">
            <div className="max-w-4xl mx-auto text-center">
              <h1 className="text-5xl lg:text-7xl font-bold mb-8 text-gray-900 leading-tight tracking-tight">
                Scout Korean Hits with 
                <span className="block text-primary mt-2">Confidence</span>
              </h1>
              <p className="text-xl lg:text-2xl text-gray-600 mb-12 leading-relaxed max-w-3xl mx-auto">
                Find the high-potential Korean webtoons and novels without the paperwork drag.
              </p>
              
              <Link to="/signup">
                <Button size="lg" className="bg-primary hover:bg-primary/90 text-white px-12 py-6 text-lg rounded-xl font-medium shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
                  Request VIP Access
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* Stats Strip */}
        <section className="py-20 bg-primary">
          <div className="container mx-auto px-6 lg:px-8">
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
        <section className="py-24 bg-white">
          <div className="container mx-auto px-6 lg:px-8">
            <div className="max-w-6xl mx-auto">
              <div className="text-center mb-20">
                <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6 tracking-tight">
                  Why Buyers Choose KStoryBridge
                </h2>
                <div className="w-16 h-1 bg-primary mx-auto rounded-full"></div>
              </div>
              
              <div className="grid lg:grid-cols-3 gap-12">
                <div className="text-center group">
                  <div className="w-20 h-20 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-8 group-hover:bg-primary/20 transition-colors duration-300">
                    <span className="text-primary text-3xl">🔍</span>
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-6">Smart Discovery</h3>
                  <p className="text-gray-600 text-lg leading-relaxed">
                    Filter by genre, engagement metrics, audience, fan size, and monetization potential. Find your next hit in minutes.
                  </p>
                </div>

                <div className="text-center group">
                  <div className="w-20 h-20 bg-secondary/10 rounded-2xl flex items-center justify-center mx-auto mb-8 group-hover:bg-secondary/20 transition-colors duration-300">
                    <span className="text-secondary text-3xl">📈</span>
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-6">Data Sheets</h3>
                  <p className="text-gray-600 text-lg leading-relaxed">
                    Instant access to performance data: views, engagement, revenue, and fan sentiment analysis.
                  </p>
                </div>

                <div className="text-center group">
                  <div className="w-20 h-20 bg-accent/20 rounded-2xl flex items-center justify-center mx-auto mb-8 group-hover:bg-accent/30 transition-colors duration-300">
                    <span className="text-gray-900 text-3xl">🤝</span>
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-6">Smart Summary</h3>
                  <p className="text-gray-600 text-lg leading-relaxed">
                    Quickly understand if it's the right one for you with smart summary and pitch deck.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Process Section */}
        <section className="py-24 bg-gray-50">
          <div className="container mx-auto px-6 lg:px-8">
            <div className="max-w-5xl mx-auto">
              <div className="text-center mb-20">
                <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6 tracking-tight">
                  How Buyers Find Their Next Hit
                </h2>
                <div className="w-16 h-1 bg-primary mx-auto rounded-full"></div>
              </div>
              
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
                <div className="text-center space-y-6">
                  <div className="relative">
                    <div className="w-16 h-16 bg-primary text-white rounded-2xl flex items-center justify-center text-xl font-bold mx-auto shadow-lg">
                      01
                    </div>
                  </div>
                  <div className="space-y-3">
                    <h3 className="text-xl font-bold text-gray-900">Browse & Discover</h3>
                    <p className="text-gray-600 leading-relaxed">AI-curated recommendations based on your preferences and market trends</p>
                  </div>
                </div>
                
                <div className="text-center space-y-6">
                  <div className="relative">
                    <div className="w-16 h-16 bg-primary text-white rounded-2xl flex items-center justify-center text-xl font-bold mx-auto shadow-lg">
                      02
                    </div>
                  </div>
                  <div className="space-y-3">
                    <h3 className="text-xl font-bold text-gray-900">Analyze & Evaluate</h3>
                    <p className="text-gray-600 leading-relaxed">Get detailed analytics, audience insights, and adaptation potential scores</p>
                  </div>
                </div>
                
                <div className="text-center space-y-6">
                  <div className="relative">
                    <div className="w-16 h-16 bg-primary text-white rounded-2xl flex items-center justify-center text-xl font-bold mx-auto shadow-lg">
                      03
                    </div>
                  </div>
                  <div className="space-y-3">
                    <h3 className="text-xl font-bold text-gray-900">Connect & Negotiate</h3>
                    <p className="text-gray-600 leading-relaxed">Direct access to verified rights holders and creators</p>
                  </div>
                </div>
                
                <div className="text-center space-y-6">
                  <div className="relative">
                    <div className="w-16 h-16 bg-primary text-white rounded-2xl flex items-center justify-center text-xl font-bold mx-auto shadow-lg">
                      04
                    </div>
                  </div>
                  <div className="space-y-3">
                    <h3 className="text-xl font-bold text-gray-900">Secure & Adapt</h3>
                    <p className="text-gray-600 leading-relaxed">Verified chain of title with seamless rights acquisition</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Catalogue Preview */}
        <section className="py-24 bg-white">
          <div className="container mx-auto px-6 lg:px-8">
            <div className="max-w-6xl mx-auto">
              <div className="text-center mb-16">
                <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6 tracking-tight">
                  The Biggest IP Catalogue
                </h2>
                <p className="text-xl text-gray-600 leading-relaxed max-w-2xl mx-auto">
                  Get access to verified Korean content with proven market performance
                </p>
                <div className="w-16 h-1 bg-primary mx-auto mt-6 rounded-full"></div>
              </div>
              
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
                {mockCovers.map((item, index) => (
                  <Card key={index} className="relative overflow-hidden group cursor-pointer hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 border-0 shadow-lg rounded-2xl">
                    <CardContent className="p-0">
                      <div className="h-72 bg-gradient-to-br from-primary/10 to-secondary/10 relative">
                        <div className={`absolute inset-0 ${item.blur ? 'blur-sm' : ''} flex items-center justify-center`}>
                          <div className="text-center p-8">
                            <div className="w-20 h-24 bg-gray-200 rounded-xl mx-auto mb-6 shadow-sm"></div>
                            <h3 className="font-bold text-gray-900 mb-3 text-lg">{item.title}</h3>
                            <span className="text-sm text-gray-600 bg-white px-4 py-2 rounded-full shadow-sm font-medium">{item.genre}</span>
                          </div>
                        </div>
                        {item.blur && (
                          <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                            <div className="text-white text-center space-y-3">
                              <div className="text-3xl">🔒</div>
                              <p className="text-sm font-medium">VIP Access Required</p>
                            </div>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
              
              <div className="text-center">
                <Link to="/signup">
                  <Button size="lg" className="bg-primary hover:bg-primary/90 text-white px-12 py-6 text-lg rounded-xl font-medium shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
                    Join to View Full Catalogue
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Pricing Section */}
        <section className="py-24 bg-gray-50">
          <div className="container mx-auto px-6 lg:px-8">
            <div className="max-w-6xl mx-auto">
              <div className="text-center mb-20">
                <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6 tracking-tight">
                  Flexible Plans for Your Needs
                </h2>
                <div className="w-16 h-1 bg-primary mx-auto rounded-full"></div>
              </div>
              
              <div className="grid lg:grid-cols-3 gap-8">
                <Card className="text-center border-0 shadow-lg rounded-2xl hover:shadow-xl transition-shadow duration-300">
                  <CardContent className="p-10">
                    <h3 className="text-2xl font-bold text-gray-900 mb-4">Free Preview</h3>
                    <div className="text-5xl font-bold text-gray-900 mb-8">$0</div>
                    <div className="space-y-4 text-left mb-10">
                      <div className="flex items-start space-x-3">
                        <span className="text-primary font-bold text-lg">•</span>
                        <span className="text-gray-600">Browse public catalogue</span>
                      </div>
                      <div className="flex items-start space-x-3">
                        <span className="text-primary font-bold text-lg">•</span>
                        <span className="text-gray-600">Basic content info</span>
                      </div>
                      <div className="flex items-start space-x-3">
                        <span className="text-primary font-bold text-lg">•</span>
                        <span className="text-gray-600">Limited contact access</span>
                      </div>
                    </div>
                    <Link to="/signup">
                      <Button variant="outline" className="w-full border-2 border-gray-200 hover:border-primary hover:text-primary py-4 rounded-xl font-medium transition-colors duration-300">
                        Start Free
                      </Button>
                    </Link>
                  </CardContent>
                </Card>

                <Card className="relative border-2 border-primary shadow-xl rounded-2xl hover:shadow-2xl transition-shadow duration-300 transform scale-105">
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <span className="bg-primary text-white px-6 py-2 rounded-full text-sm font-bold shadow-lg">
                      Most Popular
                    </span>
                  </div>
                  <CardContent className="p-10 text-center">
                    <h3 className="text-2xl font-bold text-gray-900 mb-4">Pro Scout</h3>
                    <div className="text-5xl font-bold text-primary mb-2">$199</div>
                    <div className="text-gray-500 mb-8">/mo</div>
                    
                    <div className="space-y-4 text-left mb-10">
                      <div className="flex items-start space-x-3">
                        <span className="text-primary font-bold text-lg">•</span>
                        <span className="text-gray-600">Full catalogue access</span>
                      </div>
                      <div className="flex items-start space-x-3">
                        <span className="text-primary font-bold text-lg">•</span>
                        <span className="text-gray-600">Advanced analytics</span>
                      </div>
                      <div className="flex items-start space-x-3">
                        <span className="text-primary font-bold text-lg">•</span>
                        <span className="text-gray-600">Direct creator contact</span>
                      </div>
                      <div className="flex items-start space-x-3">
                        <span className="text-primary font-bold text-lg">•</span>
                        <span className="text-gray-600">Pitch deck access</span>
                      </div>
                    </div>
                    <Link to="/signup">
                      <Button className="w-full bg-primary hover:bg-primary/90 text-white py-4 rounded-xl font-medium shadow-lg hover:shadow-xl transition-all duration-300">
                        Start Pro Trial
                      </Button>
                    </Link>
                  </CardContent>
                </Card>

                <Card className="text-center border-0 shadow-lg rounded-2xl hover:shadow-xl transition-shadow duration-300">
                  <CardContent className="p-10">
                    <h3 className="text-2xl font-bold text-gray-900 mb-4">Enterprise</h3>
                    <div className="text-5xl font-bold text-gray-900 mb-8">Custom</div>
                    <div className="space-y-4 text-left mb-10">
                      <div className="flex items-start space-x-3">
                        <span className="text-primary font-bold text-lg">•</span>
                        <span className="text-gray-600">Everything in Pro</span>
                      </div>
                      <div className="flex items-start space-x-3">
                        <span className="text-primary font-bold text-lg">•</span>
                        <span className="text-gray-600">Custom integrations</span>
                      </div>
                      <div className="flex items-start space-x-3">
                        <span className="text-primary font-bold text-lg">•</span>
                        <span className="text-gray-600">Dedicated account manager</span>
                      </div>
                      <div className="flex items-start space-x-3">
                        <span className="text-primary font-bold text-lg">•</span>
                        <span className="text-gray-600">Priority support</span>
                      </div>
                    </div>
                    <Link to="/signup">
                      <Button variant="outline" className="w-full border-2 border-gray-900 text-gray-900 hover:bg-gray-900 hover:text-white py-4 rounded-xl font-medium transition-colors duration-300">
                        Contact Sales
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-24 bg-gradient-to-r from-primary via-primary to-secondary">
          <div className="container mx-auto px-6 lg:px-8 text-center">
            <div className="max-w-4xl mx-auto space-y-8">
              <h2 className="text-4xl lg:text-5xl font-bold text-white mb-6 tracking-tight leading-tight">
                Ready to Scout Your Next Hit?
              </h2>
              <p className="text-xl text-white/90 leading-relaxed">
                Join executives from Netflix, Crunchyroll, and Top Hollywood Studios already discovering Korean IP on KStoryBridge.
              </p>
              <Link to="/signup">
                <Button size="lg" className="bg-white text-primary hover:bg-gray-50 px-12 py-6 text-lg rounded-xl font-medium shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
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
