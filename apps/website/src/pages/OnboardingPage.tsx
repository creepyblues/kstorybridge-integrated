import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@kstorybridge/ui';
import { ArrowRight } from 'lucide-react';
import UniversalHeader from '../components/UniversalHeader';
import Footer from '../components/Footer';

const OnboardingPage = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [imageModalOpen, setImageModalOpen] = useState(false);

  // Supabase storage base URL
  const STORAGE_BASE_URL = 'https://dlrnrgcoguxlkkcitlpd.supabase.co/storage/v1/object/public/images';

  const steps = [
    {
      number: '001',
      title: 'Sign up and get verified',
      description: 'Click Sign Up in the top-right corner, register with your work email and role information, then verify your email by clicking the confirmation link we sent you.',
      image: `${STORAGE_BASE_URL}/onboarding1.svg`
    },
    {
      number: '002',
      title: 'Explore featured titles',
      description: 'Discover the world of Korean IP! Featured Titles highlight works selected based on your needs and current market trends. Browse the full catalog below.',
      image: `${STORAGE_BASE_URL}/onboarding2.svg`
    },
    {
      number: '003',
      title: 'Search for your perfect match',
      description: 'Take control with our powerful search tool. Enter any keywords - try a title, genre, tone, or even comparable works to discover your next big hit!',
      image: `${STORAGE_BASE_URL}/onboarding3.svg`
    },
    {
      number: '004',
      title: 'Deep dive into title details',
      description: 'Explore everything you need: direct links to original platforms, synopsis and keywords, genre and tone details, comparable works, and fanbase insights including views, likes, and ratings.',
      image: `${STORAGE_BASE_URL}/onboarding4.svg`
    },
    {
      number: '005',
      title: 'Request premium pitch decks',
      description: 'Upon request, we\'ll create a premium, high-quality pitch deck crafted by Hollywood producers. Each deck includes synopsis, character analysis, talent matching, comparable works, pilot ideas, and more.',
      image: `${STORAGE_BASE_URL}/onboarding5.svg`,
      samplePdfUrl: `${STORAGE_BASE_URL}/Werewolves Going Crazy Over Me-Sample.pdf`
    },
    {
      number: '006',
      title: 'Save and track your favorites',
      description: 'Easily keep track of the titles you love and get updates delivered straight to your inbox. Never miss an opportunity with your personalized watchlist.',
      image: `${STORAGE_BASE_URL}/onboarding6.svg`
    }
  ];

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      navigate('/signup');
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleStepClick = (index: number) => {
    setCurrentStep(index);
  };

  const handleImageClick = () => {
    setImageModalOpen(true);
  };

  const handleCloseModal = () => {
    setImageModalOpen(false);
  };

  return (
    <div className="min-h-screen bg-white">
      
      <UniversalHeader />

      <div className="max-w-7xl mx-auto px-6 py-12">
          {/* Header */}
          <div className="mb-16">
            <h1 className="text-5xl font-light text-gray-900 mb-4">How it works</h1>
            <p className="text-lg text-gray-600 max-w-2xl">
              Discover and license Korean content in 6 simple steps. Join the marketplace 
              connecting global media buyers with Korea's top storytellers.
            </p>
          </div>

          {/* Main Content */}
          <div className="grid lg:grid-cols-2 gap-16 items-start">
          {/* Left Column - Step Info */}
          <div className="space-y-8">
            <div className="text-sm text-gray-500 font-mono">
              Step {steps[currentStep].number}
            </div>
            
            <div className="space-y-6">
              <h2 className="text-3xl font-light text-gray-900 leading-tight">
                {steps[currentStep].title}
              </h2>
              
              <p className="text-lg text-gray-600 leading-relaxed">
                {steps[currentStep].description}
              </p>
              
              {/* Sample PDF Link for Step 005 */}
              {currentStep === 4 && steps[currentStep].samplePdfUrl && (
                <div className="mt-6 p-4 bg-gray-50 rounded-lg border">
                  <p className="text-lg font-bold text-gray-900 mb-3">
                    View the bespoke pitch deck sample now
                  </p>
                  <a 
                    href={steps[currentStep].samplePdfUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center px-4 py-2 bg-black text-white rounded-md hover:bg-gray-800 transition-colors duration-200 text-sm font-medium"
                  >
                    View Sample PDF
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </a>
                </div>
              )}
            </div>

            {/* Navigation */}
            <div className="flex items-center space-x-4 pt-8">
              <Button
                variant="outline"
                onClick={handlePrevious}
                disabled={currentStep === 0}
                className="px-6 py-2 border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed"
              >
                Previous
              </Button>
              
              <Button
                onClick={handleNext}
                className="px-6 py-2 bg-black text-white hover:bg-gray-800 flex items-center gap-2"
              >
                {currentStep === steps.length - 1 ? 'Get Started' : 'Next'}
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>

            {/* Step Indicators */}
            <div className="flex items-center space-x-2 pt-8">
              {steps.map((_, index) => (
                <button
                  key={index}
                  onClick={() => handleStepClick(index)}
                  className={`h-2 transition-all duration-300 rounded-full ${
                    index === currentStep 
                      ? 'w-8 bg-black' 
                      : 'w-2 bg-gray-300 hover:bg-gray-400'
                  }`}
                  aria-label={`Go to step ${index + 1}`}
                />
              ))}
            </div>
          </div>

          {/* Right Column - Visual */}
          <div className="bg-gray-50 rounded-2xl p-8 shadow-sm">
            <div className="aspect-[4/3] flex items-center justify-center">
              <img 
                src={steps[currentStep].image}
                alt={`Step ${currentStep + 1}: ${steps[currentStep].title}`}
                className="w-full h-full object-contain cursor-pointer hover:opacity-80 transition-opacity duration-200"
                onClick={handleImageClick}
                onError={(e) => {
                  // Fallback to placeholder if image fails to load
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                  target.parentElement?.insertAdjacentHTML('afterbegin', 
                    `<div class="w-full h-full flex items-center justify-center bg-gray-100 rounded-lg">
                      <div class="text-center">
                        <div class="text-6xl font-bold text-gray-300 mb-2">${currentStep + 1}</div>
                        <div class="text-gray-400">${steps[currentStep].title}</div>
                      </div>
                    </div>`
                  );
                }}
              />
            </div>
          </div>
          </div>
        </div>

      {/* Image Modal Overlay */}
      {imageModalOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
          onClick={handleCloseModal}
        >
          <div className="relative max-w-7xl max-h-full">
            <button
              onClick={handleCloseModal}
              className="absolute top-4 right-4 z-10 bg-white bg-opacity-20 hover:bg-opacity-30 text-white rounded-full p-2 transition-all duration-200"
              aria-label="Close image"
            >
              <X className="w-6 h-6" />
            </button>
            <img 
              src={steps[currentStep].image}
              alt={`Step ${currentStep + 1}: ${steps[currentStep].title}`}
              className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            />
            <div className="absolute bottom-4 left-4 bg-black bg-opacity-50 text-white px-4 py-2 rounded-lg">
              <p className="text-sm font-medium">
                Step {steps[currentStep].number}: {steps[currentStep].title}
              </p>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
};

export default OnboardingPage;