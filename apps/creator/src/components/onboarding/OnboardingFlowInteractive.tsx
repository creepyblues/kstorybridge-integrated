import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@kstorybridge/ui";
import { Button } from "@kstorybridge/ui";
import { MessageSquare, Heart, Users, FileText, X, ArrowRight, ArrowLeft } from "lucide-react";
import MiniChatWidget from "./steps/MiniChatWidget";
import RealTitleCard from "./steps/RealTitleCard";
import ContactCreatorSection from "./steps/ContactCreatorSection";
import PitchPreviewSection from "./steps/PitchPreviewSection";

interface OnboardingFlowInteractiveProps {
  open: boolean;
  onComplete: () => void;
  onSkip: () => void;
}

// Interactive 4-step onboarding with REAL product features
const ONBOARDING_STEPS = [
  {
    step: 1,
    icon: MessageSquare,
    title: "Search with AI Chat",
    description: "Try our AI assistant! Ask about Korean content and get real recommendations.",
    color: "from-blue-500 to-cyan-500"
  },
  {
    step: 2,
    icon: Heart,
    title: "Save Titles You Love",
    description: "Save a real title to your favorites - this will actually save to your account!",
    color: "from-pink-500 to-rose-500"
  },
  {
    step: 3,
    icon: Users,
    title: "Contact Creators",
    description: "See how to contact creators directly - experience our tier-based access system.",
    color: "from-purple-500 to-indigo-500"
  },
  {
    step: 4,
    icon: FileText,
    title: "View Pitch Decks",
    description: "Learn how to access professional pitch decks for Korean content.",
    color: "from-emerald-500 to-teal-500"
  }
];

export default function OnboardingFlowInteractive({ open, onComplete, onSkip }: OnboardingFlowInteractiveProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [stepCompleted, setStepCompleted] = useState(false);

  const step = ONBOARDING_STEPS[currentStep];
  const Icon = step?.icon;
  const isLastStep = currentStep === ONBOARDING_STEPS.length - 1;

  // Reset step completion when step changes
  useEffect(() => {
    setStepCompleted(false);
  }, [currentStep]);

  // Handle step completion from child components
  const handleStepComplete = () => {
    setStepCompleted(true);
  };

  const handleNext = () => {
    if (isLastStep) {
      onComplete();
    } else {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  if (!step) return null;

  return (
    <Dialog open={open} onOpenChange={(isOpen) => { if (!isOpen) { onSkip(); } }}>
      <DialogContent className="sm:max-w-[600px] bg-white z-[100000]"
        style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          backgroundColor: 'white',
          pointerEvents: 'auto',
          zIndex: 100000
        }}>

        {/* Close button */}
        <button
          onClick={onSkip}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors z-10"
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

        {/* Hidden title and description for accessibility */}
        <DialogTitle className="sr-only">
          {step.title}
        </DialogTitle>
        <DialogDescription className="sr-only">
          Interactive onboarding step {step.step} of {ONBOARDING_STEPS.length}: {step.title}
        </DialogDescription>

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

          {/* Real Step Components */}
          <div className="px-4">
            {currentStep === 0 && <MiniChatWidget onComplete={handleStepComplete} />}
            {currentStep === 1 && <RealTitleCard onComplete={handleStepComplete} />}
            {currentStep === 2 && <ContactCreatorSection onComplete={handleStepComplete} />}
            {currentStep === 3 && <PitchPreviewSection onComplete={handleStepComplete} />}
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
            disabled={!stepCompleted}
            className="bg-hanok-teal hover:bg-hanok-teal/90 text-white disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLastStep ? (
              <>
                Complete Tour
                <ArrowRight className="w-4 h-4 ml-2" />
              </>
            ) : (
              <>
                {stepCompleted ? 'Next Step' : 'Complete action to continue'}
                <ArrowRight className="w-4 h-4 ml-2" />
              </>
            )}
          </Button>
        </div>

        {/* Help text for required actions */}
        {!stepCompleted && (
          <p className="text-center text-xs text-gray-500 mt-2">
            Complete the interaction above to continue
          </p>
        )}
      </DialogContent>
    </Dialog>
  );
}
