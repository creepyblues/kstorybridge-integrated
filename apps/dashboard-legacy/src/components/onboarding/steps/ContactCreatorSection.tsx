import { useState } from "react";
import { Button } from "@kstorybridge/ui";
import { Mail, Crown, Loader2 } from "lucide-react";
import { useTierAccess } from "@/hooks/useTierAccess";
import { useAuth } from "@/hooks/useAuth";

interface ContactCreatorSectionProps {
  onComplete: () => void;
}

export default function ContactCreatorSection({ onComplete }: ContactCreatorSectionProps) {
  const { user } = useAuth();
  const { tier, hasProAccess } = useTierAccess();
  const [showTierGate, setShowTierGate] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleContactClick = () => {
    if (!hasProAccess) {
      // Show tier gate for basic/invited users
      setShowTierGate(true);

      // Complete the step after showing the gate
      setTimeout(() => {
        onComplete();
      }, 2000);
    } else {
      // Pro/Suite users can proceed
      setIsProcessing(true);
      setTimeout(() => {
        setIsProcessing(false);
        onComplete();
      }, 1500);
    }
  };

  return (
    <div className="space-y-4">
      {/* Sample Creator Card */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex items-start gap-3">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-porcelain-blue-100 to-hanok-teal/10 flex items-center justify-center flex-shrink-0">
            <span className="text-2xl font-semibold text-hanok-teal">KS</span>
          </div>

          <div className="flex-1">
            <h4 className="font-semibold text-midnight-ink mb-1">Korean Story Studio</h4>
            <p className="text-sm text-midnight-ink-600 mb-2">Webtoon Creator</p>
            <p className="text-xs text-gray-500 line-clamp-2">
              Award-winning studio creating engaging romance and fantasy webtoons with millions of readers worldwide.
            </p>
          </div>
        </div>

        {/* Contact Button */}
        <div className="mt-4">
          <Button
            onClick={handleContactClick}
            disabled={isProcessing}
            className="w-full bg-pro-purple hover:bg-pro-purple/90 text-white"
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Mail className="w-4 h-4 mr-2" />
                Contact Creator
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Tier Gate Message */}
      {showTierGate && !hasProAccess && (
        <div className="bg-purple-50 border border-pro-purple/20 rounded-lg p-4 animate-in fade-in duration-300">
          <div className="flex items-start gap-3">
            <Crown className="w-5 h-5 text-pro-purple flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h5 className="font-semibold text-midnight-ink mb-1">Pro Feature</h5>
              <p className="text-sm text-midnight-ink-600 mb-3">
                Direct creator contact is available with Pro or Suite tier. Upgrade to unlock this feature and connect with creators directly.
              </p>
              <p className="text-xs text-gray-500">
                Current tier: <span className="font-medium capitalize">{tier}</span>
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Success Message for Pro/Suite */}
      {isProcessing && hasProAccess && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 animate-in fade-in duration-300">
          <p className="text-sm text-green-800 text-center">
            ✓ Contact form opened! You can now reach out to creators directly.
          </p>
        </div>
      )}

      {/* Instructions */}
      <p className="text-center text-sm text-gray-600">
        {!showTierGate && !isProcessing && (
          'Click the contact button to see how creator contact works'
        )}
        {showTierGate && !hasProAccess && (
          <span className="text-hanok-teal font-medium">This is how tier-gated features work in KStoryBridge</span>
        )}
        {isProcessing && hasProAccess && (
          <span className="text-hanok-teal font-medium">Pro tier users get direct access to creators!</span>
        )}
      </p>

      <p className="text-xs text-gray-500 text-center">
        This demonstrates the actual tier-based access control system
      </p>
    </div>
  );
}
