
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { useLanguage } from '../contexts/LanguageContext';
import { ArrowRight, CheckCircle, Globe, Users, Zap, Star, Play, BookOpen, Award } from 'lucide-react';
import PageLayout from '../components/PageLayout';
import HeroSection from '../components/HeroSection';
import FeatureCard from '../components/FeatureCard';
import ProcessStep from '../components/ProcessStep';

const HomePage = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();

  const features = [{
    icon: Globe,
    title: "Global Reach",
    description: "Connect Korean creators with international buyers across film, TV, and digital platforms."
  }, {
    icon: Users,
    title: "Verified Community",
    description: "Work-email verified professionals ensure quality connections and serious inquiries."
  }, {
    icon: Zap,
    title: "Fast Licensing",
    description: "Streamlined process from discovery to deal, cutting months off traditional timelines."
  }];

  const stats = [{
    number: "500+",
    label: "Korean Stories"
  }, {
    number: "100+",
    label: "Global Studios"
  }, {
    number: "30+",
    label: "Countries Reached"
  }, {
    number: "95%",
    label: "Success Rate"
  }];

  const processSteps = [
    {
      step: "1",
      title: "Verify Rights",
      description: "Upload proof of ownership"
    },
    {
      step: "2", 
      title: "Publish Pitch",
      description: "AI-generated pitch decks"
    },
    {
      step: "3",
      title: "Match & Meet", 
      description: "Connect with executives"
    }
  ];

  const testimonials = [{
    quote: "KStoryBridge helped us discover our next big hit. The platform made connecting with Korean creators seamless.",
    author: "Sarah Chen",
    role: "Content Acquisition, Netflix"
  }, {
    quote: "Finally, a platform that understands both Korean storytelling culture and global market needs.",
    author: "Kim Min-jun",
    role: "Webtoon Creator"
  }];

  return (
    <PageLayout background="gradient">{/* Hero Section */}
      <HeroSection 
        title="Where Korean Stories Meet Global Screens"
        subtitle="List, discover, and license verified IP fast. The premier marketplace connecting Korean creators with international buyers."
        size="large"
        primaryCta={{
          text: "Get Started",
          onClick: () => navigate('/signup')
        }}
        className="py-32"
      />
      
      {/* Stats Section */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-4xl lg:text-5xl font-bold text-primary mb-2">
                  {stat.number}
                </div>
                <div className="text-gray-600 text-lg">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 px-4 lg:px-8">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl lg:text-5xl font-bold mb-6">
              The Future of IP Licensing
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Built for the modern entertainment industry, designed for global collaboration.
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {features.map((feature, index) => (
              <FeatureCard
                key={index}
                icon={feature.icon}
                title={feature.title}
                description={feature.description}
                variant="hover-primary"
                iconSize="large"
              />
            ))}
          </div>
        </div>
      </section>

      {/* Process Section */}
      <section className="py-24 bg-gray-50 px-4 lg:px-8">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl lg:text-5xl font-bold mb-6">
              Simple. Fast. Effective.
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              From discovery to deal in three simple steps
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-12 max-w-4xl mx-auto">
            {processSteps.map((step, index) => (
              <ProcessStep
                key={index}
                step={step.step}
                title={step.title}
                description={step.description}
                variant="large"
              />
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-24 px-4 lg:px-8">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl lg:text-5xl font-bold mb-6">
              Trusted by Industry Leaders
            </h2>
          </div>
          
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="border-0 shadow-lg rounded-2xl p-8">
                <CardContent className="space-y-6">
                  <div className="flex text-accent mb-4">
                    {[...Array(5)].map((_, i) => <Star key={i} className="w-5 h-5 fill-current" />)}
                  </div>
                  <blockquote className="text-xl text-gray-700 leading-relaxed">
                    "{testimonial.quote}"
                  </blockquote>
                  <div className="text-gray-600">
                    <div className="font-semibold">{testimonial.author}</div>
                    <div className="text-sm">{testimonial.role}</div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-primary px-4 lg:px-8">
        <div className="container mx-auto text-center">
          <div className="max-w-3xl mx-auto space-y-8">
            <h2 className="text-4xl lg:text-5xl font-bold text-white">
              Ready to Bridge Stories Across Cultures?
            </h2>
            <p className="text-xl text-white/90 leading-relaxed">
              Join the global community of creators and buyers shaping the future of entertainment.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-8">
              <Button 
                size="lg" 
                variant="secondary" 
                className="bg-white text-primary hover:bg-gray-100 px-8 py-4 text-lg rounded-full"
                onClick={() => navigate('/signup')}
              >
                Get Started For Free <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </div>
          </div>
        </div>
      </section>
    </PageLayout>
  );
};

export default HomePage;
