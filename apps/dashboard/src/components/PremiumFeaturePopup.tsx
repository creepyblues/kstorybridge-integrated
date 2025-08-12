import { useState } from "react";
import { Button, Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, useToast } from "@kstorybridge/ui";

import { Crown, Sparkles, X } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
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
    }
  }, [isOpen, featureName]);

  const handleRequest = async () => {
    // Check if we should bypass auth for localhost development
    const shouldBypassAuth = () => {
      const isLocalhost = window.location.hostname === 'localhost';
      const bypassEnabled = import.meta.env.VITE_DISABLE_AUTH_LOCALHOST === 'true';
      const isDev = import.meta.env.DEV;
      return isLocalhost && (bypassEnabled || isDev);
    };

    // For localhost auth bypass, use a mock user ID when no real user exists
    const effectiveUser = user || (shouldBypassAuth() ? {
      id: '550e8400-e29b-41d4-a716-446655440000',
      email: 'sungho@dadble.com',
      user_metadata: { full_name: 'Sungho Lee', company: 'Dadble' }
    } : null);

    if (!effectiveUser) {
      console.error('❌ No user available for request');
      return;
    }

    try {
      setLoading(true);
      
      
      // For localhost development with auth bypass, skip database and send Slack notification directly
      if (shouldBypassAuth() && titleId && requestType) {
        // Send Slack notification if this is a pitch request
        if (requestType === 'pitch' && titleName) {
          try {
            await notifyPitchRequest({
              userFullName: effectiveUser.user_metadata?.full_name || effectiveUser.email || 'Unknown User',
              userEmail: effectiveUser.email || 'unknown@email.com',
              titleName: titleName,
              titleId: titleId,
              requestType: requestType,
              company: effectiveUser.user_metadata?.company || undefined
            });
          } catch (slackError) {
            console.warn('Failed to send Slack notification:', slackError);
          }
        }
        
        // Skip database operations for localhost and go directly to success
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
        
        setLoading(false);
        return; // Skip the database logic below
      }

      // Production: If we have titleId and requestType, try to save to request table
      if (titleId && requestType) {
        try {
          const { data: requestData, error: requestError } = await supabase
            .from('request')
            .insert({
              user_id: effectiveUser.id,
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
            // Send Slack notification if this is a pitch request
            if (requestType === 'pitch' && requestData?.id && titleName) {
              try {
                await notifyPitchRequest({
                  userFullName: effectiveUser.user_metadata?.full_name || effectiveUser.email || 'Unknown User',
                  userEmail: effectiveUser.email || 'unknown@email.com',
                  titleName: titleName,
                  titleId: titleId,
                  requestType: requestType,
                  company: effectiveUser.user_metadata?.company || undefined
                });
              } catch (slackError) {
                console.warn('Failed to send Slack notification:', slackError);
                // Don't fail the request if Slack notification fails
              }
            }
          }
        } catch (dbError) {
          console.warn('Database operation failed for request table, falling back to user_buyers:', dbError);
          // Continue to fallback logic below
        }
      }

      // Production: Always also save to user_buyers table for backwards compatibility and tracking
      // Skip for localhost development
      if (shouldBypassAuth()) {
        setLoading(false);
        return;
      }
      
      try {
        // First check if user_buyers record exists, if not create it
        const { data: existingRecord, error: fetchError } = await supabase
          .from('user_buyers')
          .select('*')
          .eq('email', effectiveUser.email)
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
              email: effectiveUser.email,
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
            .eq('email', effectiveUser.email);

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
              <div className="flex justify-center mb-4">
                <div className="relative">
                  <Crown className="h-16 w-16 text-sunrise-coral animate-pulse" />
                  <Sparkles className="h-6 w-6 text-hanok-teal absolute -top-1 -right-1 animate-bounce" />
                </div>
              </div>
              <h2 className="text-2xl font-bold text-midnight-ink mb-2">
                Premium Feature
              </h2>
              <p className="text-gray-600">
                {featureName} - Submit a request to access this premium feature
              </p>
            </div>
            
            {/* Content */}
            <div className="text-center space-y-6 px-6 pb-6">
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
            
            {/* Close Button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 bg-white hover:bg-gray-100 rounded-full p-2 shadow-lg transition-colors duration-200 z-10"
              aria-label="Close modal"
            >
              <X className="h-5 w-5" />
            </button>
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
            {featureName} - Submit a request to access this premium feature
          </DialogDescription>
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
    </>
  );
}