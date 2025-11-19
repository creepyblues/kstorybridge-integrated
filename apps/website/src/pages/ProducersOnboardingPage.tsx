import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import UniversalHeader from '../components/UniversalHeader';
import { Button } from '@kstorybridge/ui';
import { Card, CardContent } from '../components/ui/card';
import { ArrowRight, CheckCircle, Play } from 'lucide-react';
import Footer from '../components/Footer';

const ProducersOnboardingPage = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);

  const steps = [
    {
      title: "Discover Korean IP",
      description: "Browse our extensive catalog of Korean webtoons, novels, and manhwa with detailed information about each title.",
      icon: "🔍",
      details: [
        "Access thousands of verified Korean titles",
        "View popularity metrics and audience data",
        "Get cultural context and adaptation insights",
        "Filter by genre, format, and market performance"
      ]
    },
    {
      title: "Analyze Market Potential",
      description: "Get detailed insights and analytics to evaluate each title's potential for your target market.",
      icon: "📊",
      details: [
        "Review audience demographics and engagement",
        "See adaptation recommendations",
        "Compare similar successful adaptations",
        "Get market timing and trend analysis"
      ]
    },
    {
      title: "Connect with Rights Holders",
      description: "Connect directly with verified rights holders who have the authority to make deals.",
      icon: "🤝",
      details: [
        "Direct contact with decision-makers",
        "Verified ownership and rights information",
        "Clear chain of title documentation",
        "Skip intermediaries and agents"
      ]
    },
    {
      title: "Negotiate & Close Deals",
      description: "Get expert support to navigate Korean entertainment contracts and cultural nuances.",
      icon: "✅",
      details: [
        "Expert mediation for complex negotiations",
        "Cultural and legal guidance",
        "Standard contract templates",
        "Deal structure recommendations"
      ]
    }
  ];

  const handleGetStarted = () => {
    window.location.href = `${import.meta.env.VITE_DASHBOARD_URL || 'http://localhost:8081'}/signup`;
  };

  const handleNextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleGetStarted();
    }
  };

  const handlePrevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-porcelain-blue-50">
      <UniversalHeader />
      
      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative py-12 sm:py-16 lg:py-20 overflow-hidden">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-8">
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-6 text-midnight-ink leading-tight">
                How <span className="text-hanok-teal">KStoryBridge</span> Works for Producers
              </h1>
              <p className="text-lg sm:text-xl text-midnight-ink-600 mb-8 leading-relaxed max-w-3xl mx-auto">
                From discovery to deal closure - your complete guide to acquiring Korean IP
              </p>
            </div>

            {/* Progress Bar */}
            <div className="max-w-4xl mx-auto mb-12">
              <div className="flex items-center justify-between mb-4">
                {steps.map((_, index) => (
                  <div key={index} className="flex items-center">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${
                      index <= currentStep 
                        ? 'bg-hanok-teal text-white' 
                        : 'bg-gray-200 text-gray-500'
                    }`}>
                      {index + 1}
                    </div>
                    {index < steps.length - 1 && (
                      <div className={`flex-1 h-1 mx-4 transition-colors ${
                        index < currentStep ? 'bg-hanok-teal' : 'bg-gray-200'
                      }`} />
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Current Step Card */}
            <Card className="max-w-4xl mx-auto shadow-xl border-0 rounded-3xl overflow-hidden">
              <CardContent className="p-0">
                <div className="bg-gradient-to-r from-hanok-teal to-hanok-teal-600 p-8 text-white">
                  <div className="flex items-center mb-4">
                    <div className="text-4xl mr-4">{steps[currentStep].icon}</div>
                    <div>
                      <div className="text-sm opacity-90 mb-1">Step {currentStep + 1} of {steps.length}</div>
                      <h2 className="text-3xl font-bold">{steps[currentStep].title}</h2>
                    </div>
                  </div>
                  <p className="text-xl opacity-95 leading-relaxed">
                    {steps[currentStep].description}
                  </p>
                </div>
                
                <div className="p-8 bg-white">
                  <h3 className="text-xl font-bold text-midnight-ink mb-6">What you'll get:</h3>
                  <div className="grid md:grid-cols-2 gap-4 mb-8">
                    {steps[currentStep].details.map((detail, index) => (
                      <div key={index} className="flex items-start space-x-3">
                        <CheckCircle className="w-5 h-5 text-hanok-teal mt-0.5 flex-shrink-0" />
                        <span className="text-midnight-ink-700">{detail}</span>
                      </div>
                    ))}
                  </div>

                  {/* Navigation Buttons */}
                  <div className="flex items-center justify-between">
                    <Button
                      onClick={handlePrevStep}
                      variant="outline"
                      disabled={currentStep === 0}
                      className="px-6 py-3"
                    >
                      Previous
                    </Button>
                    
                    <div className="flex items-center space-x-2 text-sm text-gray-500">
                      <span>{currentStep + 1} of {steps.length}</span>
                    </div>
                    
                    <Button
                      onClick={handleNextStep}
                      className="bg-hanok-teal hover:bg-hanok-teal-600 text-white px-6 py-3"
                    >
                      {currentStep === steps.length - 1 ? 'Get Started' : 'Next Step'}
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Quick Overview Section */}
        <section className="py-12 sm:py-16 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-midnight-ink mb-6">
                Why Choose KStoryBridge?
              </h2>
            </div>
            
            <div className="grid lg:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="w-16 h-16 bg-hanok-teal/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <span className="text-hanok-teal text-2xl">⚡</span>
                </div>
                <h3 className="text-xl font-bold text-midnight-ink mb-4">Faster Deal Flow</h3>
                <p className="text-midnight-ink-600">
                  Skip intermediaries and connect directly with rights holders to close deals faster.
                </p>
              </div>

              <div className="text-center">
                <div className="w-16 h-16 bg-sunrise-coral/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <span className="text-sunrise-coral text-2xl">🎯</span>
                </div>
                <h3 className="text-xl font-bold text-midnight-ink mb-4">Better Targeting</h3>
                <p className="text-midnight-ink-600">
                  Get detailed analytics and cultural insights to make smarter acquisition decisions.
                </p>
              </div>

              <div className="text-center">
                <div className="w-16 h-16 bg-porcelain-blue/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <span className="text-porcelain-blue-600 text-2xl">🛡️</span>
                </div>
                <h3 className="text-xl font-bold text-midnight-ink mb-4">Risk Reduction</h3>
                <p className="text-midnight-ink-600">
                  Verified ownership, clear rights information, and expert legal guidance.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-12 sm:py-16 bg-gradient-to-r from-hanok-teal to-hanok-teal-600">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6">
              Ready to Find Your Next Hit?
            </h2>
            <p className="text-xl text-hanok-teal-100 mb-8 max-w-2xl mx-auto">
              Join hundreds of content producers already using KStoryBridge to discover and acquire Korean IP.
            </p>
            <Button 
              onClick={handleGetStarted}
              size="lg" 
              className="bg-white text-hanok-teal hover:bg-gray-50 px-12 py-6 text-lg rounded-full font-bold shadow-lg hover:shadow-xl transition-all duration-300"
            >
              Start Browsing Korean IP
            </Button>
          </div>
        </section>
      </main>
      
      <Footer />
    </div>
  );
};

export default ProducersOnboardingPage;