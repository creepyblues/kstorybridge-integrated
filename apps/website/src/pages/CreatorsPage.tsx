
import { Link } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { useLanguage } from '../contexts/LanguageContext';
import { ArrowRight, CheckCircle, BookOpen, Users, TrendingUp, Shield, Zap, Globe } from 'lucide-react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import KoreanPattern from '../components/KoreanPattern';

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
    <div className="min-h-screen bg-white">
      <Header />
      
      {/* Hero Section */}
      <section className="relative py-32 px-4 lg:px-8 overflow-hidden">
        <div className="absolute inset-0 opacity-5">
          <KoreanPattern />
        </div>
        
        <div className="container mx-auto relative z-10">
          <div className="max-w-4xl mx-auto text-center space-y-8">
            <h1 className="text-5xl lg:text-7xl font-bold leading-tight">
              Turn Your Korean Stories Into{' '}
              <span className="text-primary">Global Hits</span>
            </h1>
            
            <p className="text-xl lg:text-2xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              Connect directly with international studios, streamers, and publishers. 
              Get discovered, get paid, get global.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-8">
              <Button asChild size="lg" className="bg-primary hover:bg-primary/90 text-white px-8 py-4 text-lg rounded-full">
                <Link to="/signup" className="flex items-center gap-2">
                  Start Selling <ArrowRight className="w-5 h-5" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="border-2 border-gray-300 px-8 py-4 text-lg rounded-full hover:bg-gray-50">
                <Link to="/pricing">
                  See Pricing
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-24 bg-gray-50 px-4 lg:px-8">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl lg:text-5xl font-bold mb-6">
              Why Creators Choose Story Bridge
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Built by creators, for creators. Everything you need to succeed globally.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {benefits.map((benefit, index) => (
              <Card key={index} className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 rounded-2xl group">
                <CardHeader className="text-center pb-4">
                  <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-primary group-hover:text-white transition-all duration-300">
                    <benefit.icon className="w-8 h-8 text-primary group-hover:text-white" />
                  </div>
                  <CardTitle className="text-xl font-bold">
                    {benefit.title}
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-center">
                  <p className="text-gray-600 leading-relaxed">
                    {benefit.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Process Section */}
      <section className="py-24 px-4 lg:px-8">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl lg:text-5xl font-bold mb-6">
              Your Path to Global Success
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Four simple steps to start licensing your Korean IP worldwide
            </p>
          </div>
          
          <div className="max-w-4xl mx-auto">
            {process.map((item, index) => (
              <div key={index} className="flex flex-col md:flex-row items-center gap-8 mb-16 last:mb-0">
                <div className="flex-shrink-0">
                  <div className="w-24 h-24 bg-primary rounded-full flex items-center justify-center text-white text-2xl font-bold shadow-lg">
                    {item.step}
                  </div>
                </div>
                <div className="flex-1 text-center md:text-left">
                  <h3 className="text-2xl lg:text-3xl font-bold mb-4">{item.title}</h3>
                  <p className="text-xl text-gray-600 leading-relaxed">{item.description}</p>
                </div>
                {index < process.length - 1 && (
                  <div className="hidden md:block w-full h-px bg-gray-200 absolute right-0 transform translate-y-12"></div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-gray-50 px-4 lg:px-8">
        <div className="container mx-auto">
          <div className="max-w-4xl mx-auto">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="text-4xl lg:text-5xl font-bold mb-8">
                  Everything You Need to Succeed
                </h2>
                <div className="space-y-4">
                  {features.map((feature, index) => (
                    <div key={index} className="flex items-center gap-3">
                      <CheckCircle className="w-6 h-6 text-primary flex-shrink-0" />
                      <span className="text-lg text-gray-700">{feature}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="bg-gradient-to-br from-primary to-secondary rounded-2xl p-8 text-white">
                <h3 className="text-2xl font-bold mb-4">Ready to Get Started?</h3>
                <p className="text-lg mb-6 opacity-90">
                  Join hundreds of Korean creators already earning from their stories globally.
                </p>
                <Button asChild size="lg" variant="secondary" className="bg-white text-primary hover:bg-gray-100 rounded-full">
                  <Link to="/signup" className="flex items-center gap-2">
                    Create Account <ArrowRight className="w-5 h-5" />
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Success Stories */}
      <section className="py-24 px-4 lg:px-8">
        <div className="container mx-auto text-center">
          <h2 className="text-4xl lg:text-5xl font-bold mb-6">
            Join Our Success Stories
          </h2>
          <p className="text-xl text-gray-600 mb-12 max-w-2xl mx-auto">
            Korean creators are already making millions through Story Bridge partnerships
          </p>
          
          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto mb-12">
            <div className="text-center">
              <div className="text-4xl font-bold text-primary mb-2">$2.5M+</div>
              <div className="text-gray-600">Total Creator Earnings</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-primary mb-2">150+</div>
              <div className="text-gray-600">Active Creators</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-primary mb-2">89%</div>
              <div className="text-gray-600">Success Rate</div>
            </div>
          </div>
          
          <Button asChild size="lg" className="bg-primary hover:bg-primary/90 text-white px-8 py-4 text-lg rounded-full">
            <Link to="/signup" className="flex items-center gap-2">
              Start Your Success Story <ArrowRight className="w-5 h-5" />
            </Link>
          </Button>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default CreatorsPage;
