import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@kstorybridge/ui";
import { Button } from "@kstorybridge/ui";
import { Sparkles } from "lucide-react";

interface OnboardingModalProps {
  open: boolean;
  onStart: () => void;
  onSkip: () => void;
}

export default function OnboardingModal({ open, onStart, onSkip }: OnboardingModalProps) {
  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-[500px] bg-white" hideCloseButton>
        <DialogHeader>
          <div className="flex items-center justify-center mb-4">
            <div className="w-16 h-16 bg-gradient-to-br from-hanok-teal to-blue-500 rounded-full flex items-center justify-center">
              <Sparkles className="w-8 h-8 text-white" />
            </div>
          </div>
          <DialogTitle className="text-center text-2xl font-bold text-gray-900">
            Welcome to KStoryBridge!
          </DialogTitle>
        </DialogHeader>

        <div className="py-6 space-y-4">
          <p className="text-center text-gray-600 text-base leading-relaxed">
            Discover premium Korean content and connect with creators in just 30 seconds.
          </p>

          <div className="bg-gradient-to-r from-hanok-teal/10 to-blue-50 rounded-xl p-4 space-y-2">
            <p className="text-sm font-medium text-gray-900">✨ Quick Tour Highlights:</p>
            <ul className="text-sm text-gray-700 space-y-1 ml-4">
              <li>• Search with AI Chat</li>
              <li>• Save Titles You Love</li>
              <li>• Access Premium Content</li>
              <li>• Contact Creators Directly</li>
            </ul>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <Button
            variant="outline"
            onClick={onSkip}
            className="w-full border-gray-300 hover:bg-gray-100"
          >
            Skip Tour
          </Button>
          <Button
            onClick={onStart}
            className="w-full bg-hanok-teal hover:bg-hanok-teal/90 text-white"
          >
            Take Tour (30s)
          </Button>
        </div>

        <p className="text-xs text-center text-gray-500 mt-2">
          You can restart the tour anytime from your profile settings
        </p>
      </DialogContent>
    </Dialog>
  );
}