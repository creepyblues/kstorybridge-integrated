import { useState } from "react";
import { Button, Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@kstorybridge/ui";
import { useToast } from "@/hooks/use-toast";
import { Crown, Sparkles, X } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { trackPremiumFeatureRequest, trackEvent, trackTierUpgrade, trackPremiumPopupInteraction } from "@/utils/analytics";
import { sendAdminNotification } from "@/utils/emailService";
import { notifyPitchRequest, notifyContactCreator } from "@/utils/slack";
import { useTierAccess } from "@/hooks/useTierAccess";
import { EmailService } from "@/services/emailService";
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
  const { tier, canAccessPremiumContent } = useTierAccess();
  const [loading, setLoading] = useState(false);
  const [requested, setRequested] = useState(false);
  const [contactMessage, setContactMessage] = useState("");
  const [messageSent, setMessageSent] = useState(false);
  
  // Debug props received
  useEffect(() => {
    console.log('🎯 PremiumFeaturePopup props received:', {
      isOpen,
      featureName,
      titleId,
      requestType,
      titleName
    });
  }, [isOpen, featureName, titleId, requestType, titleName]);

  // Track when premium popup is shown
  useEffect(() => {
    if (isOpen) {
      trackEvent('premium_popup_viewed', 'premium_features', featureName);
      trackPremiumPopupInteraction('show', featureName, user?.user_metadata?.tier || 'basic');
    }
  }, [isOpen, featureName, user]);

  // Handle upgrade button click with comprehensive tracking
  const handleUpgradeClick = () => {
    const currentTier = user?.user_metadata?.tier || 'basic';

    // Track premium popup interaction
    trackPremiumPopupInteraction('upgrade_click', featureName, currentTier, {
      title_id: titleId,
      title_name: titleName,
      request_type: requestType
    });

    // Track tier upgrade intent
    trackTierUpgrade('pro', currentTier, 'premium_popup', {
      source_feature: featureName,
      title_id: titleId,
      title_name: titleName
    });

    // Navigate to pricing page
    window.location.href = '/buyers/plan';
  };

  // Handle send contact message for Pro+ users
  const handleSendMessage = async () => {
    if (!user || !titleId || !titleName) {
      console.error('❌ Missing required data for contact message');
      return;
    }

    // Validate message
    if (!contactMessage.trim()) {
      toast({
        title: "Message Required",
        description: "Please enter a message before sending.",
        variant: "destructive"
      });
      return;
    }

    if (contactMessage.length > 500) {
      toast({
        title: "Message Too Long",
        description: "Please keep your message under 500 characters.",
        variant: "destructive"
      });
      return;
    }

    try {
      setLoading(true);

      // Send email notification
      const emailService = EmailService.getInstance();
      const emailResult = await emailService.sendContactCreatorMessage({
        requestorEmail: user.email || '',
        requestorName: user.user_metadata?.full_name || user.email || '',
        titleName: titleName,
        titleId: titleId,
        message: contactMessage,
        requestDate: new Date().toLocaleString()
      });

      // Send Slack notification
      await notifyContactCreator({
        userFullName: user.user_metadata?.full_name || user.email || 'Unknown User',
        userEmail: user.email || 'unknown@email.com',
        titleName: titleName,
        titleId: titleId,
        message: contactMessage,
        company: user.user_metadata?.buyer_company || undefined
      });

      if (emailResult.success) {
        setMessageSent(true);
        toast({
          title: "Message Sent!",
          description: "The rights holder will receive your message shortly."
        });
      } else {
        throw new Error(emailResult.error || 'Failed to send message');
      }
    } catch (error) {
      console.error('❌ Error sending contact message:', error);
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRequest = async () => {

    if (!user) {
      console.error('❌ No user available for request');
      return;
    }

    try {
      setLoading(true);
      
      

      // Production: If we have titleId and requestType, try to save to request table
      if (titleId && requestType) {
        console.log('💾 Attempting to save request to database:', {
          user_id: user.id,
          title_id: titleId,
          type: requestType,
          feature_name: featureName
        });
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
            console.error('❌ Request table insertion failed:', requestError);
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
            console.log('✅ Request successfully saved to database:', requestData);
            // Send Slack notification for both pitch and contact requests
            if ((requestType === 'pitch' || requestType === 'contact') && requestData?.id && titleName) {
              try {
                await notifyPitchRequest({
                  userFullName: user.user_metadata?.full_name || user.email || 'Unknown User',
                  userEmail: user.email || 'unknown@email.com',
                  titleName: titleName,
                  titleId: titleId,
                  requestType: requestType,
                  company: user.user_metadata?.company || undefined
                });
              } catch (slackError) {
                console.warn('Failed to send Slack notification:', slackError);
                // Don't fail the request if Slack notification fails
              }

              // Send email notification to support@kstorybridge.com for pitch requests
              if (requestType === 'pitch') {
                try {
                  const { EmailService } = await import('@/services/emailService');
                  const emailService = EmailService.getInstance();
                  await emailService.sendPitchDeckRequestEmail({
                    requestorEmail: user.email || '',
                    requestorName: user.user_metadata?.full_name || user.email || '',
                    titleName: titleName,
                    titleId: titleId,
                    requestDate: new Date().toLocaleString()
                  });
                } catch (emailError) {
                  console.warn('Failed to send email notification:', emailError);
                  // Don't fail the request if email fails
                }
              }
            }
          }
        } catch (dbError) {
          console.warn('Database operation failed for request table, falling back to user_buyers:', dbError);
          // Continue to fallback logic below
        }
      }

      // Production: Always also save to user_buyers table for backwards compatibility and tracking
      
      try {
        // First check if user_buyers record exists, if not create it
        const { data: existingRecord, error: fetchError } = await supabase
          .from('user_buyers')
          .select('*')
          .eq('id', user.id)
          .maybeSingle();

        if (fetchError && fetchError.code !== 'PGRST116') {
          // PGRST116 means "no rows found", which is expected for new users
          console.warn('Could not access user_buyers table:', fetchError);
          // Don't throw error, just continue without database tracking
        } else if (!existingRecord) {
          // Create new user_buyers record
          const { error: insertError } = await supabase
            .from('user_buyers')
            .insert({
              id: user.id,
              email: user.email,
              full_name: user.user_metadata?.full_name || user.email,
              buyer_company: user.user_metadata?.buyer_company || null,
              buyer_role: user.user_metadata?.buyer_role || null,
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
            .eq('id', user.id);

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
    <>
      {/* Manual Premium Feature Modal */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-75 z-[9999] flex items-center justify-center"
          onClick={onClose}
          style={{ 
            animation: 'fadeIn 0.2s ease-out',
            backdropFilter: 'blur(4px)'
          }}
        >
          <div 
            className="bg-gradient-to-b from-white to-porcelain-blue-50 border-porcelain-blue-200 rounded-2xl shadow-2xl max-w-md w-[90vw] relative overflow-hidden"
            onClick={(e) => e.stopPropagation()}
            style={{ 
              animation: 'slideIn 0.3s ease-out',
              transform: 'translateY(0)'
            }}
          >
            {/* Header */}
            <div className="text-center pb-4 p-6">
              {featureName !== "Pitch deck not available" && (
                <div className="flex justify-center mb-4">
                  <div className="relative">
                    <Crown className="h-16 w-16 text-sunrise-coral animate-pulse" />
                    <Sparkles className="h-6 w-6 text-hanok-teal absolute -top-1 -right-1 animate-bounce" />
                  </div>
                </div>
              )}
              {featureName === "Pitch deck not available" ? (
                <p className="text-gray-700 text-base leading-relaxed pt-6">
                  Pitch deck is not available for this title yet. If you want to ask for a pitch deck, click Request below.
                </p>
              ) : (
                <>
                  <h2 className="text-2xl font-bold text-midnight-ink mb-2">
                    Premium Feature
                  </h2>
                  <p className="text-gray-600">
                    This feature is for premium members only.
                  </p>
                </>
              )}
            </div>
            
            {/* Content */}
            <div className="text-center space-y-6 px-6 pb-6">
              {!requested && !messageSent ? (
                <>
                  <div className="space-y-4">
                    {/* Contact Creator form for Pro+ users */}
                    {featureName === "Contact Creator" && canAccessPremiumContent ? (
                      <div className="space-y-4 text-left">
                        <div>
                          <label htmlFor="contact-message" className="block text-sm font-medium text-gray-700 mb-2">
                            Message to Rights Holder
                          </label>
                          <textarea
                            id="contact-message"
                            rows={4}
                            value={contactMessage}
                            onChange={(e) => setContactMessage(e.target.value)}
                            placeholder="Enter your message here..."
                            maxLength={500}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-hanok-teal focus:border-transparent resize-none"
                          />
                          <div className="flex justify-between items-center mt-1">
                            <span className="text-xs text-gray-500">
                              {contactMessage.length} / 500
                            </span>
                          </div>
                        </div>
                        <Button
                          id="premium-popup-send-message-btn"
                          onClick={handleSendMessage}
                          disabled={loading || !contactMessage.trim() || contactMessage.length > 500}
                          className="w-full bg-gradient-to-r from-hanok-teal to-emerald-600 hover:from-hanok-teal/90 hover:to-emerald-700 text-white px-8 py-4 text-lg rounded-full font-bold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 relative overflow-hidden group disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {loading ? "Sending..." : "Send Message"}
                        </Button>
                      </div>
                    ) : featureName === "Pitch deck not available" ? (
                      <Button
                        id="premium-popup-request-btn"
                        onClick={handleRequest}
                        disabled={loading}
                        className="w-full bg-gradient-to-r from-hanok-teal to-emerald-600 hover:from-hanok-teal/90 hover:to-emerald-700 text-white px-8 py-4 text-lg rounded-full font-bold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 relative overflow-hidden group disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {loading ? "Submitting..." : "Request"}
                      </Button>
                    ) : (
                      <Button
                        id="premium-popup-upgrade-btn"
                        onClick={handleUpgradeClick}
                        className="w-full bg-gradient-to-r from-hanok-teal to-emerald-600 hover:from-hanok-teal/90 hover:to-emerald-700 text-white px-8 py-4 text-lg rounded-full font-bold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 relative overflow-hidden group"
                      >
                        {/* Shine effect */}
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 translate-x-[-100%] group-hover:translate-x-[200%] transition-transform duration-700"></div>

                        {/* Text */}
                        <span className="relative z-10">🚀 Upgrade to Pro</span>
                      </Button>
                    )}
                  </div>
                </>
              ) : (
                <div className="space-y-4 py-4">
                  {featureName !== "Pitch deck not available" && (
                    <div className="flex justify-center">
                      <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                        <Crown className="h-8 w-8 text-green-600" />
                      </div>
                    </div>
                  )}
                  <div className="space-y-2">
                    <h3 className="text-xl font-bold text-midnight-ink">
                      {messageSent
                        ? "Message Sent!"
                        : featureName === "Pitch deck not available"
                        ? "Request Submitted!"
                        : "Thank you for your request!"
                      }
                    </h3>
                    <p className="text-midnight-ink-600">
                      {messageSent
                        ? "The rights holder will receive your message shortly."
                        : featureName === "Pitch deck not available"
                        ? "Thanks for your request, we'll let you know as soon as the pitch deck becomes available"
                        : "We'll notify you when this premium feature becomes available."
                      }
                    </p>
                  </div>

                  {/* Close Button */}
                  <Button
                    onClick={() => {
                      onClose();
                      setRequested(false);
                      setMessageSent(false);
                      setContactMessage("");
                    }}
                    variant="outline"
                    className="w-full border-gray-300 hover:bg-gray-100"
                  >
                    Close
                  </Button>
                </div>
              )}
            </div>

            {/* X Close Button - Hidden in success state */}
            {!requested && !messageSent && (
              <button
                onClick={() => {
                  onClose();
                  setContactMessage("");
                }}
                className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 bg-white hover:bg-gray-100 rounded-full p-2 shadow-lg transition-colors duration-200 z-10"
                aria-label="Close modal"
              >
                <X className="h-5 w-5" />
              </button>
            )}
          </div>
        </div>
      )}
      
      {/* Hidden Dialog Component as fallback */}
      <Dialog open={false} onOpenChange={onClose}>
        <DialogContent className="max-w-md bg-gradient-to-b from-white to-porcelain-blue-50 border-porcelain-blue-200 rounded-2xl hidden">
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
          <DialogDescription className="text-center text-gray-600">
            This feature is for premium members only.
          </DialogDescription>
        </DialogHeader>
        
        <div className="text-center space-y-6">
          {!requested ? (
            <>
              <div className="space-y-4">
                <Button
                  id="premium-popup-upgrade-btn"
                  onClick={handleUpgradeClick}
                  className="w-full bg-gradient-to-r from-hanok-teal to-emerald-600 hover:from-hanok-teal/90 hover:to-emerald-700 text-white px-8 py-4 text-lg rounded-full font-bold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 relative overflow-hidden group"
                >
                  {/* Shine effect */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 translate-x-[-100%] group-hover:translate-x-[200%] transition-transform duration-700"></div>

                  {/* Text */}
                  <span className="relative z-10">🚀 Upgrade to Pro</span>
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
    </>
  );
}
