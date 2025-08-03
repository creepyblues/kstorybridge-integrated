import { Link } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { useLanguage } from '../contexts/LanguageContext';
import { ArrowRight, CheckCircle, BookOpen, Users, TrendingUp, Shield, Zap, Globe } from 'lucide-react';
import PageHeader from '../components/PageHeader';

const CreatorsPage = () => {
  const { t } = useLanguage();

  const benefits = [
    {
      icon: Globe,
      title: "Global Exposure",
      description: "Showcase your work to international buyers from Netflix, Amazon, Disney, and more."
    },
    {
      icon: Shield,
      title: "IP Protection",
      description: "Your content is secure with verified buyers and protected licensing agreements."
    },
    {
      icon: TrendingUp,
      title: "Higher Revenue",
      description: "Direct connections mean better deals and higher royalties for your creative work."
    },
    {
      icon: Zap,
      title: "Fast Deals",
      description: "From first contact to signed contract in weeks, not months or years."
    }
  ];

  const process = [
    {
      step: "01",
      title: "Create Your Profile",
      description: "Set up your creator profile and showcase your best work with professional presentation tools."
    },
    {
      step: "02",
      title: "Upload Your IP",
      description: "Add your stories, characters, and concepts with detailed descriptions and visual assets."
    },
    {
      step: "03",
      title: "Connect with Buyers",
      description: "Receive inquiries from verified international buyers and negotiate directly."
    },
    {
      step: "04",
      title: "Close the Deal",
      description: "Finalize licensing agreements with legal support and secure payment processing."
    }
  ];

  const features = [
    "Professional portfolio builder",
    "Direct buyer messaging",
    "Legal contract templates",
    "Royalty tracking tools",
    "Market analytics dashboard",
    "24/7 support in Korean & English"
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
              Why Creators Choose Story Bridge
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
              <div className="bg-gradient-to-br from-hanok-teal to-porcelain-blue-600 rounded-2xl p-8 text-white">
                <h3 className="text-2xl font-bold mb-4">Ready to Get Started?</h3>
                <p className="text-lg mb-6 opacity-90">
                  Join hundreds of Korean creators already earning from their stories globally.
                </p>
                <Button id="creators-features-create-account-btn" asChild size="lg" variant="secondary" className="bg-white text-hanok-teal hover:bg-snow-white rounded-full">
                  <Link to="/signup/creator" className="flex items-center gap-2">
                    Create Account <ArrowRight className="w-5 h-5" />
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Success Stories */}
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
    </div>
  );
};

export default CreatorsPage;