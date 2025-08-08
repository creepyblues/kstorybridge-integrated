import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Crown, Sparkles } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { trackPremiumFeatureRequest, trackEvent } from "@/utils/analytics";
import { sendAdminNotification } from "@/utils/emailService";
import { notifyPitchRequest } from "@/utils/slack";
// import { testRequestTable, debugAuthAndRLS } from "@/utils/debugRequest"; // Debug imports - can be removed
import { useEffect } from "react";

interface PremiumFeaturePopupProps {
  isOpen: boolean;
  onClose: () => void;
  featureName: string;
  titleId?: string;
  requestType?: string;
  titleName?: string;
}

export default function PremiumFeaturePopup({ 
  isOpen, 
  onClose, 
  featureName,
  titleId,
  requestType,
  titleName
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
      
      // Debug logging can be removed in production
      console.log('Processing request for:', { titleId, requestType, titleName });
      
      // If we have titleId and requestType, try to save to request table
      if (titleId && requestType) {
        try {
          const { data: requestData, error: requestError } = await supabase
            .from('request')
            .insert({
              user_id: user.id,
              title_id: titleId,
              type: requestType
            })
            .select('id')
            .single();

          if (requestError) {
            // Handle specific error cases
            if (requestError.code === '23505') {
              // Unique constraint violation - user already made this request
              toast({
                title: "Request Already Submitted",
                description: "You have already submitted this type of request for this title.",
                variant: "destructive"
              });
              setLoading(false);
              return; // Exit early, don't continue with fallback
            }
            
            console.warn('Error saving to request table, falling back to user_buyers:', requestError);
            // If request table has an error, fall back to user_buyers table
          } else {
            // Successfully saved to request table
            console.log('✅ Request saved to database:', requestData?.id);
            
            // Send Slack notification if this is a pitch request
            if (requestType === 'pitch' && requestData?.id && titleName) {
              console.log('📄 Sending Slack notification for pitch request...');
              try {
                await notifyPitchRequest({
                  userFullName: user.user_metadata?.full_name || user.email || 'Unknown User',
                  userEmail: user.email || 'unknown@email.com',
                  titleName: titleName,
                  titleId: titleId,
                  requestType: requestType,
                  company: user.user_metadata?.company || undefined
                });
                console.log('✅ Slack notification sent successfully!');
              } catch (slackError) {
                console.warn('❌ Failed to send Slack notification:', slackError);
                // Don't fail the request if Slack notification fails
              }
            }
            
            // Send admin notification email if this is a pitch request
            if (requestType === 'pitch' && requestData?.id && titleName) {
              console.log('📧 Email notification would be sent here');
              console.log('Request details:', {
                requestId: requestData.id,
                titleId,
                userId: user.id,
                type: requestType,
                titleName
              });
              
              // TODO: Deploy send-admin-notification function to Supabase
              // await sendAdminNotification({...});
            }
          }
        } catch (dbError) {
          console.warn('Database operation failed for request table, falling back to user_buyers:', dbError);
          // Continue to fallback logic below
        }
      }

      // Always also save to user_buyers table for backwards compatibility and tracking
      try {
        // First check if user_buyers record exists, if not create it
        const { data: existingRecord, error: fetchError } = await supabase
          .from('user_buyers')
          .select('*')
          .eq('user_id', user.id)
          .single();

        if (fetchError && fetchError.code !== 'PGRST116') {
          // PGRST116 means "no rows found", which is expected for new users
          console.warn('Could not access user_buyers table:', fetchError);
          // Don't throw error, just continue without database tracking
        } else if (!existingRecord) {
          // Create new user_buyers record
          const { error: insertError } = await supabase
            .from('user_buyers')
            .insert({
              user_id: user.id,
              requested: true
            });

          if (insertError) {
            console.warn('Could not create user_buyers record:', insertError);
            // Don't throw error, just continue without database tracking
          }
        } else {
          // Update existing record
          const { error: updateError } = await supabase
            .from('user_buyers')
            .update({ requested: true })
            .eq('user_id', user.id);

          if (updateError) {
            console.warn('Could not update user_buyers record:', updateError);
            // Don't throw error, just continue without database tracking
          }
        }
      } catch (dbError) {
        console.warn('Database operation failed, continuing without tracking:', dbError);
        // Continue execution even if database operations fail
      }

      setRequested(true);
      
      // Track the premium feature request via analytics
      try {
        trackPremiumFeatureRequest(featureName);
      } catch (analyticsError) {
        console.warn('Analytics tracking failed:', analyticsError);
      }
      
      // Show success message for 2 seconds, then close
      setTimeout(() => {
        onClose();
        setRequested(false);
      }, 2000);

    } catch (error) {
      console.error('Unexpected error submitting request:', error);
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
          <DialogTitle className="text-2xl font-bold text-midnight-ink mb-2 text-center">
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
              </div>
              
              <div className="space-y-4">
                <Button
                  id="premium-popup-request-btn"
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
                    "Request Access"
                  )}
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