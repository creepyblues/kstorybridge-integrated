import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Crown, Sparkles } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { trackPremiumFeatureRequest, trackEvent } from "@/utils/analytics";
import { sendAdminNotification } from "@/utils/emailService";
import { testRequestTable, debugAuthAndRLS } from "@/utils/debugRequest";
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
      
      console.log('=== DEBUG: Starting handleRequest ===');
      console.log('User:', user.id);
      console.log('TitleId:', titleId);
      console.log('RequestType:', requestType);
      console.log('TitleName:', titleName);
      
      // Test if request table is accessible
      await testRequestTable();
      
      // Test authentication and RLS
      await debugAuthAndRLS();
      
      // Check authentication state
      console.log('=== DEBUG: Authentication Check ===');
      const { data: { user: currentUser }, error: authError } = await supabase.auth.getUser();
      console.log('Current auth user:', currentUser);
      console.log('Auth error:', authError);
      console.log('User from hook:', user);
      console.log('User IDs match:', currentUser?.id === user.id);
      
      // If we have titleId and requestType, try to save to request table
      if (titleId && requestType) {
        console.log('=== DEBUG: Attempting to save to request table ===');
        try {
          const insertData = {
            user_id: user.id,
            title_id: titleId,
            type: requestType
          };
          console.log('Insert data:', insertData);

          const { data: requestData, error: requestError } = await supabase
            .from('request')
            .insert(insertData)
            .select('id')
            .single();

          console.log('Supabase response - Data:', requestData);
          console.log('Supabase response - Error:', requestError);

          if (requestError) {
            console.error('=== DEBUG: Error saving to request table ===');
            console.error('Error details:', requestError);
            console.error('Error code:', requestError.code);
            console.error('Error message:', requestError.message);
            console.error('Error hint:', requestError.hint);
            
            // Handle specific error cases
            if (requestError.code === '23505') {
              // Unique constraint violation - user already made this request
              console.log('User has already made this request type for this title');
              toast({
                title: "Request Already Submitted",
                description: "You have already submitted this type of request for this title.",
                variant: "destructive"
              });
              setLoading(false);
              return; // Exit early, don't continue with fallback
            } else if (requestError.code === '42P01') {
              console.log('❌ Request table does not exist - migration not applied');
              toast({
                title: "Database Setup Required",
                description: "The request table hasn't been created yet. Please contact support.",
                variant: "destructive"
              });
            } else if (requestError.code === '42501') {
              console.log('❌ Permission denied to request table');
              toast({
                title: "Permission Error",
                description: "You don't have permission to submit requests. Please contact support.",
                variant: "destructive"
              });
            }
            
            console.warn('Error saving to request table, falling back to user_buyers:', requestError);
            // If request table doesn't exist or has an error, fall back to user_buyers table
            // This ensures the feature works even if migration hasn't been applied yet
          } else {
            // Successfully saved to request table
            console.log('=== DEBUG: Request saved successfully ===');
            console.log('Request data:', requestData);
            
            // Send admin notification email if this is a pitch request
            if (requestType === 'pitch' && requestData?.id && titleName) {
              try {
                // Get user profile for requestor name
                const { data: profile, error: profileError } = await supabase
                  .from('profiles')
                  .select('full_name')
                  .eq('id', user.id)
                  .single();

                const requestorName = profile?.full_name || user.email || 'Unknown User';

                await sendAdminNotification({
                  requestId: requestData.id,
                  titleId,
                  userId: user.id,
                  type: requestType,
                  requestorName,
                  titleName
                });
              } catch (emailError) {
                console.warn('Failed to send admin notification email:', emailError);
                // Don't fail the request if email fails
              }
            }
          }
        } catch (dbError) {
          console.error('=== DEBUG: Database exception ===');
          console.error('DB Error:', dbError);
          console.warn('Database operation failed for request table, falling back to user_buyers:', dbError);
          // Continue to fallback logic below
        }
      } else {
        console.log('=== DEBUG: Skipping request table insert ===');
        console.log('TitleId exists:', !!titleId);
        console.log('RequestType exists:', !!requestType);
        console.log('Actual titleId:', titleId);
        console.log('Actual requestType:', requestType);
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
                    "REQUEST"
                  )}
                </Button>
                
                <Button
                  id="premium-popup-cancel-btn"
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