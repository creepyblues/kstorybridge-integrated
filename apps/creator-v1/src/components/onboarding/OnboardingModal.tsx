console.log('📦 DEBUG: OnboardingModal.tsx module is loading');

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@kstorybridge/ui";
import { Button } from "@kstorybridge/ui";
import { Sparkles } from "lucide-react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { useLayoutEffect } from "react";

interface OnboardingModalProps {
  open: boolean;
  onStart: () => void;
  onSkip: () => void;
}

console.log('🎯 DEBUG: OnboardingModal component definition loaded');

export default function OnboardingModal({ open, onStart, onSkip }: OnboardingModalProps) {
  // DEBUG: Confirm component is rendering
  console.log('🔍 DEBUG: OnboardingModal render, open =', open);

  // Use useLayoutEffect to inject styles synchronously before browser paint
  // This runs AFTER DOM mutations but BEFORE the browser paints, ensuring styles apply before visibility
  useLayoutEffect(() => {
    console.log('⚡ DEBUG: useLayoutEffect running, open =', open);

    if (open) {
      console.log('🎨 DEBUG: Injecting z-index override styles to DOM');

      const style = document.createElement('style');
      style.id = 'onboarding-modal-override';
      style.textContent = `
        [data-radix-dialog-overlay] {
          z-index: 99998 !important;
          position: fixed !important;
          inset: 0 !important;
          background: rgba(0, 0, 0, 0.5) !important;
          pointer-events: auto !important;
        }
        [data-radix-dialog-content] {
          z-index: 99999 !important;
          pointer-events: auto !important;
        }
      `;
      document.head.appendChild(style);

      return () => {
        const existingStyle = document.getElementById('onboarding-modal-override');
        if (existingStyle) {
          console.log('🧹 DEBUG: Cleaning up modal override styles');
          existingStyle.remove();
        }
      };
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={() => {}} modal={true}>
      <DialogContent className="sm:max-w-[500px] bg-white [&>button]:hidden z-[99999]"
        style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          backgroundColor: 'white',
          pointerEvents: 'auto'
        }}>

        <DialogHeader>
          <div className="flex items-center justify-center mb-4">
            <div className="w-16 h-16 bg-gradient-to-br from-hanok-teal to-blue-500 rounded-full flex items-center justify-center">
              <Sparkles className="w-8 h-8 text-white" />
            </div>
          </div>
          <DialogTitle className="text-center text-2xl font-bold text-gray-900">
            Welcome to KStoryBridge!
          </DialogTitle>
          <DialogDescription className="text-center text-gray-600 text-base leading-relaxed">
            Discover premium Korean content and connect with creators in just 30 seconds.
          </DialogDescription>
        </DialogHeader>

        <div className="py-6 space-y-4">

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
            onClick={() => {
              console.log('⏭️ DEBUG: Skip Tour button clicked!');
              onSkip();
            }}
            className="w-full border-gray-300 hover:bg-gray-100"
          >
            Skip Tour
          </Button>
          <Button
            onClick={() => {
              console.log('🔘 DEBUG: Take Tour button clicked!');
              onStart();
            }}
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