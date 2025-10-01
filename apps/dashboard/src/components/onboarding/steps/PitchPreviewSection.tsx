import { useState } from "react";
import { Button } from "@kstorybridge/ui";
import { FileText, Loader2, ExternalLink } from "lucide-react";

interface PitchPreviewSectionProps {
  onComplete: () => void;
}

export default function PitchPreviewSection({ onComplete }: PitchPreviewSectionProps) {
  const [showPitch, setShowPitch] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Sample pitch data (in real usage, this would come from the title)
  const samplePitch = {
    title: "Business Proposal",
    pitchUrl: "https://images.unsplash.com/photo-1557804506-669a67965ba0?w=800"
  };

  const handleViewPitch = () => {
    setIsLoading(true);

    // Simulate pitch loading
    setTimeout(() => {
      setShowPitch(true);
      setIsLoading(false);

      // Complete the step after viewing
      setTimeout(() => {
        onComplete();
      }, 1500);
    }, 800);
  };

  return (
    <div className="space-y-4">
      {/* Pitch Card */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex items-start justify-between gap-3 mb-4">
          <div>
            <h4 className="font-semibold text-midnight-ink mb-1">{samplePitch.title}</h4>
            <p className="text-sm text-midnight-ink-600">Sample Pitch Deck Available</p>
          </div>
          <span className="text-xs font-medium px-2.5 py-0.5 rounded-full bg-red-500 text-white">
            Pitch Available
          </span>
        </div>

        {/* View Pitch Button */}
        {!showPitch && (
          <Button
            onClick={handleViewPitch}
            disabled={isLoading}
            className="w-full bg-hanok-teal hover:bg-hanok-teal/90 text-white"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Loading Pitch...
              </>
            ) : (
              <>
                <FileText className="w-4 h-4 mr-2" />
                View Pitch Deck
              </>
            )}
          </Button>
        )}

        {/* Pitch Preview */}
        {showPitch && (
          <div className="space-y-3 animate-in fade-in duration-300">
            {/* Pitch Image Preview */}
            <div className="relative rounded-lg overflow-hidden bg-gradient-to-br from-porcelain-blue-100 to-hanok-teal/10">
              <img
                src={samplePitch.pitchUrl}
                alt="Pitch Deck Preview"
                className="w-full h-48 object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
              <div className="absolute bottom-3 left-3 right-3 text-white">
                <p className="text-xs font-medium mb-1">Pitch Deck Preview</p>
                <p className="text-[10px] opacity-90">Full presentation available in title details</p>
              </div>
            </div>

            {/* Pitch Info */}
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="flex items-start gap-2">
                <FileText className="w-4 h-4 text-hanok-teal flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-midnight-ink mb-1">
                    Professional Pitch Deck
                  </p>
                  <p className="text-xs text-midnight-ink-600 leading-relaxed">
                    Pitch decks provide comprehensive information about the title, including story overview, market potential, and adaptation opportunities.
                  </p>
                </div>
              </div>
            </div>

            {/* Full View Link (simulation) */}
            <Button
              variant="outline"
              className="w-full border-gray-300 hover:bg-gray-100"
              disabled
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              Open Full Pitch Deck
            </Button>
          </div>
        )}
      </div>

      {/* Success Message */}
      {showPitch && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-3 animate-in fade-in duration-300">
          <p className="text-sm text-green-800 text-center">
            ✓ Great! You've seen how pitch decks work
          </p>
        </div>
      )}

      {/* Instructions */}
      <p className="text-center text-sm text-gray-600">
        {!showPitch && !isLoading && (
          'Click to view a sample pitch deck presentation'
        )}
        {isLoading && (
          <span className="text-hanok-teal">Loading pitch deck...</span>
        )}
        {showPitch && (
          <span className="text-hanok-teal font-medium">Pitch decks help you evaluate titles for licensing!</span>
        )}
      </p>

      <p className="text-xs text-gray-500 text-center">
        This shows the actual pitch viewing experience
      </p>
    </div>
  );
}
