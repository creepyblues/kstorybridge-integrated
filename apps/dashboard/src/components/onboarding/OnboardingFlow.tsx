import { useState, useEffect } from "react";
import { Dialog, DialogContent } from "@kstorybridge/ui";
import { Button } from "@kstorybridge/ui";
import { MessageSquare, Heart, FileText, Users, X, ArrowRight, ArrowLeft } from "lucide-react";

interface OnboardingFlowProps {
  open: boolean;
  onComplete: () => void;
  onSkip: () => void;
}

const ONBOARDING_STEPS = [
  {
    step: 1,
    icon: MessageSquare,
    title: "Search with AI Chat",
    description: "Ask Jinu, our AI assistant, to find the perfect Korean content for your needs. Get instant, smart recommendations tailored to your preferences.",
    color: "from-blue-500 to-cyan-500",
    duration: 5000
  },
  {
    step: 2,
    icon: Heart,
    title: "Save Titles You Love",
    description: "Build your personal collection of titles by saving favorites. Keep track of content you're interested in and easily access them anytime.",
    color: "from-pink-500 to-rose-500",
    duration: 5000
  },
  {
    step: 3,
    icon: FileText,
    title: "Access Premium Content",
    description: "Upgrade to Pro to unlock pitch decks, detailed analytics, and exclusive content. Get deeper insights before making decisions.",
    color: "from-purple-500 to-indigo-500",
    duration: 10000
  },
  {
    step: 4,
    icon: Users,
    title: "Contact Creators Directly",
    description: "Connect with content creators and rights holders directly through our platform. Build relationships and close deals faster with Pro access.",
    color: "from-orange-500 to-red-500",
    duration: 10000
  }
];

export default function OnboardingFlow({ open, onComplete, onSkip }: OnboardingFlowProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [progress, setProgress] = useState(0);

  const step = ONBOARDING_STEPS[currentStep];
  const Icon = step?.icon;
  const isLastStep = currentStep === ONBOARDING_STEPS.length - 1;

  // Auto-advance progress bar
  useEffect(() => {
    if (!open || !step) return;

    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + (100 / (step.duration / 100));
      });
    }, 100);

    return () => clearInterval(interval);
  }, [open, currentStep, step]);

  // Auto-advance to next step when progress reaches 100%
  useEffect(() => {
    if (progress >= 100 && !isLastStep) {
      const timeout = setTimeout(() => {
        handleNext();
      }, 500);
      return () => clearTimeout(timeout);
    }
  }, [progress, isLastStep]);

  const handleNext = () => {
    if (isLastStep) {
      onComplete();
    } else {
      setCurrentStep((prev) => prev + 1);
      setProgress(0);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
      setProgress(0);
    }
  };

  if (!step) return null;

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-[600px] bg-white" hideCloseButton>
        {/* Close button */}
        <button
          onClick={onSkip}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Step indicator */}
        <div className="flex items-center justify-center gap-2 mb-6">
          {ONBOARDING_STEPS.map((s, idx) => (
            <div
              key={s.step}
              className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                idx === currentStep
                  ? 'bg-hanok-teal'
                  : idx < currentStep
                  ? 'bg-hanok-teal/50'
                  : 'bg-gray-200'
              }`}
            />
          ))}
        </div>

        {/* Content */}
        <div className="py-8 space-y-6">
          {/* Icon */}
          <div className="flex items-center justify-center">
            <div className={`w-20 h-20 bg-gradient-to-br ${step.color} rounded-full flex items-center justify-center shadow-lg`}>
              <Icon className="w-10 h-10 text-white" />
            </div>
          </div>

          {/* Title */}
          <h3 className="text-center text-2xl font-bold text-gray-900">
            {step.title}
          </h3>

          {/* Description */}
          <p className="text-center text-gray-600 text-base leading-relaxed px-4">
            {step.description}
          </p>

          {/* Progress bar */}
          <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
            <div
              className="bg-gradient-to-r from-hanok-teal to-blue-500 h-full rounded-full transition-all duration-100"
              style={{ width: `${progress}%` }}
            />
          </div>

          {/* Step counter */}
          <p className="text-center text-sm text-gray-500">
            Step {step.step} of {ONBOARDING_STEPS.length}
          </p>
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between gap-4">
          <Button
            variant="outline"
            onClick={handleBack}
            disabled={currentStep === 0}
            className="border-gray-300 hover:bg-gray-100"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>

          <Button
            onClick={handleNext}
            className="bg-hanok-teal hover:bg-hanok-teal/90 text-white"
          >
            {isLastStep ? (
              <>
                Get Started
                <ArrowRight className="w-4 h-4 ml-2" />
              </>
            ) : (
              <>
                Next
                <ArrowRight className="w-4 h-4 ml-2" />
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}