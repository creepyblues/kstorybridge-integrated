import { ArrowRight, CheckCircle, Globe, Shield, TrendingUp, Zap, Rocket, Star } from 'lucide-react';
import { Link } from 'react-router-dom';
import Footer from '../components/Footer';
import PageHeader from '../components/PageHeader';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { useLanguage } from '../contexts/LanguageContext';

const CreatorsPage = () => {
  const { t } = useLanguage();

  const benefits = [
    {
      icon: Globe,
      title: "Global Exposure",
      description: "Get your content in front of international buyers from Netflix, Amazon, Disney, and other major platforms."
    },
    {
      icon: Shield,
      title: "Real-Time Analytics",
      description: "Track exactly who's viewing your titles and requesting more information."
    },
    {
      icon: TrendingUp,
      title: "Premium Packaging",
      description: "Professional pitch materials tailored to buyer needs that actually close deals."
    },
    {
      icon: Zap,
      title: "Concierge Support",
      description: "Optional Development Suite handles negotiations and deal-making on your terms."
    }
  ];

  const process = [
    {
      step: "01",
      title: "Create Your Profile",
      description: "Set up your professional creator profile and get verified to access global buyers."
    },
    {
      step: "02",
      title: "Showcase Your IP",
      description: "Upload your stories, characters, and concepts with compelling descriptions and visuals using our professional guidelines."
    },
    {
      step: "03",
      title: "Connect with Buyers",
      description: "Receive inquiries from verified international buyers and negotiate directly or with expert support."
    },
    {
      step: "04",
      title: "Close the Deal",
      description: "Secure agreements on your terms with professional guidance every step of the way."
    }
  ];

  const features = [
    "Direct access to major platform buyers.",
    "Professional pitch materials that close deals.",
    "Real-time tracking of content views and inquiries.",
    "Expert negotiation support for deals on your terms.",
    "Complete management from creation to contract in one place."
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-porcelain-blue-50">
      <PageHeader />

      {/* Hero Section */}
      <section className="relative py-16 lg:py-24 overflow-hidden">
        <div className="max-w-7xl mx-auto px-6">
          <div className="max-w-4xl mx-auto text-center space-y-8">
            <h1 className="text-5xl lg:text-6xl font-bold leading-tight text-midnight-ink">
              Turn Your Korean Stories Into{' '}
              <span className="text-hanok-teal block mt-2">Global Hits</span>
            </h1>

            <p className="text-xl lg:text-2xl text-midnight-ink-600 max-w-3xl mx-auto leading-relaxed">
              Connect directly with international studios, streamers, and publishers.
              Get discovered, get paid, get global.
            </p>

            <div className="flex justify-center pt-8">
              <Button id="creators-hero-get-started-btn" asChild size="lg" className="bg-sunrise-coral hover:bg-sunrise-coral-600 text-white px-8 py-4 text-lg rounded-full">
                <Link to="/signup/creator">
                  Get Started
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 bg-porcelain-blue-100">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl lg:text-5xl font-bold mb-6 text-midnight-ink">
              Why Creators Choose KStoryBridge
            </h2>
            <p className="text-xl text-midnight-ink-600 max-w-3xl mx-auto">
              Built by creators, for creators. Everything you need to succeed globally.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {benefits.map((benefit, index) => (
              <Card key={index} className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 rounded-2xl group bg-white">
                <CardHeader className="text-center pb-4">
                  <div className="w-16 h-16 bg-hanok-teal/10 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-hanok-teal group-hover:text-white transition-all duration-300">
                    <benefit.icon className="w-8 h-8 text-hanok-teal group-hover:text-white" />
                  </div>
                  <CardTitle className="text-xl font-bold text-midnight-ink">
                    {benefit.title}
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-center">
                  <p className="text-midnight-ink-600 leading-relaxed">
                    {benefit.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Process Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl lg:text-5xl font-bold mb-6 text-midnight-ink">
              Your Path to Global Success
            </h2>
            <p className="text-xl text-midnight-ink-600 max-w-2xl mx-auto">
              Four simple steps to start licensing your Korean IP worldwide
            </p>
          </div>

          <div className="max-w-5xl mx-auto">
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              {process.map((item, index) => (
                <div key={index} className="text-center space-y-6">
                  <div className="w-20 h-20 bg-hanok-teal rounded-full flex items-center justify-center text-white text-xl font-bold mx-auto shadow-lg">
                    {item.step}
                  </div>
                  <div className="space-y-3">
                    <h3 className="text-xl font-bold text-midnight-ink">{item.title}</h3>
                    <p className="text-midnight-ink-600 leading-relaxed">{item.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-porcelain-blue-100">
        <div className="max-w-7xl mx-auto px-6">
          <div className="max-w-6xl mx-auto">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="text-4xl lg:text-5xl font-bold mb-8 text-midnight-ink">
                  Everything You Need to Succeed
                </h2>
                <div className="space-y-4">
                  {features.map((feature, index) => (
                    <div key={index} className="flex items-center gap-3">
                      <CheckCircle className="w-6 h-6 text-hanok-teal flex-shrink-0" />
                      <span className="text-lg text-midnight-ink-600">{feature}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="relative bg-gradient-to-br from-hanok-teal via-hanok-teal to-porcelain-blue-600 rounded-2xl p-8 text-white overflow-hidden shadow-2xl border border-white/10">
                {/* Background decoration */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full transform translate-x-16 -translate-y-16"></div>
                <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full transform -translate-x-12 translate-y-12"></div>
                
                {/* Floating stars decoration */}
                <Star className="absolute top-4 right-6 w-4 h-4 text-white/30" />
                <Star className="absolute top-12 right-12 w-3 h-3 text-white/20" />
                <Star className="absolute bottom-16 right-8 w-3 h-3 text-white/25" />
                
                <div className="relative z-10">
                  {/* Main icon */}
                  <div className="w-16 h-16 bg-white/15 rounded-full flex items-center justify-center mb-6 backdrop-blur-sm">
                    <Rocket className="w-8 h-8 text-white" />
                  </div>
                  
                  <h3 className="text-3xl font-bold mb-4 leading-tight">Ready to Get Started?</h3>
                  <p className="text-lg mb-8 opacity-90 leading-relaxed">
                    Join hundreds of Korean creators already earning from their stories globally.
                  </p>
                  
                  {/* Enhanced button */}
                  <Button 
                    id="creators-features-create-account-btn" 
                    asChild 
                    size="lg" 
                    className="bg-white text-hanok-teal hover:bg-white/95 rounded-full font-semibold text-lg px-8 py-4 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
                  >
                    <Link to="/signup/creator" className="flex items-center gap-3">
                      <Rocket className="w-5 h-5" />
                      Create Account 
                      <ArrowRight className="w-5 h-5" />
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Success Stories - Hidden */}
      {/* 
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <h2 className="text-4xl lg:text-5xl font-bold mb-6 text-midnight-ink">
            Join Our Success Stories
          </h2>
          <p className="text-xl text-midnight-ink-600 mb-12 max-w-2xl mx-auto">
            Korean creators are already making millions through Story Bridge partnerships
          </p>

          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto mb-12">
            <div className="text-center">
              <div className="text-4xl font-bold text-hanok-teal mb-2">$2.5M+</div>
              <div className="text-midnight-ink-600">Total Creator Earnings</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-hanok-teal mb-2">150+</div>
              <div className="text-midnight-ink-600">Active Creators</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-hanok-teal mb-2">89%</div>
              <div className="text-midnight-ink-600">Success Rate</div>
            </div>
          </div>

          <Button id="creators-cta-get-started-btn" asChild size="lg" className="bg-hanok-teal hover:bg-hanok-teal-600 text-white px-8 py-4 text-lg rounded-full">
            <Link to="/signup/creator">
              Get Started
            </Link>
          </Button>
        </div>
      </section>
      */}
      <Footer />
    </div>
  );
};

export default CreatorsPage;