import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Crown, Sparkles } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { trackPremiumFeatureRequest, trackEvent } from "@/utils/analytics";
import { useEffect } from "react";

interface PremiumFeaturePopupProps {
  isOpen: boolean;
  onClose: () => void;
  featureName: string;
}

export default function PremiumFeaturePopup({ 
  isOpen, 
  onClose, 
  featureName 
}: PremiumFeaturePopupProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [requested, setRequested] = useState(false);

  // Track when premium popup is shown
  useEffect(() => {
    if (isOpen) {
      trackEvent('premium_popup_viewed', 'premium_features', featureName);
    }
  }, [isOpen, featureName]);

  const handleRequest = async () => {
    if (!user) return;

    try {
      setLoading(true);
      
      // Update the requested boolean field in user_buyers table
      const { error } = await supabase
        .from('user_buyers')
        .update({ requested: true })
        .eq('user_id', user.id);

      if (error) {
        console.error('Error updating user request:', error);
        toast({
          title: "Error",
          description: "Failed to submit request. Please try again.",
          variant: "destructive"
        });
        return;
      }

      setRequested(true);
      
      // Track the premium feature request
      trackPremiumFeatureRequest(featureName);
      
      // Show success message for 2 seconds, then close
      setTimeout(() => {
        onClose();
        setRequested(false);
      }, 2000);

    } catch (error) {
      console.error('Error submitting request:', error);
      toast({
        title: "Error",
        description: "Failed to submit request. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md bg-gradient-to-b from-white to-porcelain-blue-50 border-porcelain-blue-200 rounded-2xl">
        <DialogHeader className="text-center pb-4">
          <div className="flex justify-center mb-4">
            <div className="relative">
              <Crown className="h-16 w-16 text-sunrise-coral animate-pulse" />
              <Sparkles className="h-6 w-6 text-hanok-teal absolute -top-1 -right-1 animate-bounce" />
            </div>
          </div>
          <DialogTitle className="text-2xl font-bold text-midnight-ink mb-2">
            Premium Feature
          </DialogTitle>
        </DialogHeader>
        
        <div className="text-center space-y-6">
          {!requested ? (
            <>
              <div className="space-y-4">
                <p className="text-midnight-ink-600 text-lg leading-relaxed">
                  This feature is for premium members only.
                </p>
                <p className="text-xl font-semibold text-midnight-ink">
                  Be the first to get it now!
                </p>
              </div>
              
              <div className="space-y-4">
                <Button
                  onClick={handleRequest}
                  disabled={loading}
                  className="w-full bg-sunrise-coral hover:bg-sunrise-coral-600 text-white px-8 py-4 text-lg rounded-full font-medium shadow-lg hover:shadow-xl transition-all duration-300"
                >
                  {loading ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Requesting...
                    </div>
                  ) : (
                    "REQUEST"
                  )}
                </Button>
                
                <Button
                  onClick={onClose}
                  variant="outline"
                  className="w-full border-porcelain-blue-300 text-midnight-ink-600 hover:bg-porcelain-blue-100 rounded-full"
                >
                  Cancel
                </Button>
              </div>
            </>
          ) : (
            <div className="space-y-4 py-4">
              <div className="flex justify-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                  <Crown className="h-8 w-8 text-green-600" />
                </div>
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-bold text-midnight-ink">
                  Thank you for your request!
                </h3>
                <p className="text-midnight-ink-600">
                  We'll notify you when this premium feature becomes available.
                </p>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}