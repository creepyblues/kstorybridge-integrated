import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@kstorybridge/ui";
import { OnboardingService } from "@/services/onboardingService";

interface WelcomeVideoDialogProps {
  open: boolean;
  onClose: () => void;
  userId: string;
  userEmail: string;
}

/**
 * WelcomeVideoDialog Component
 *
 * Displays the "How KStoryBridge Works" YouTube video to first-time users.
 * Automatically tracks video viewing in the user_onboarding table.
 *
 * Features:
 * - Auto-opens on first login
 * - Marks video as seen when closed
 * - Never shows again after being seen
 * - Same video as Profile page "How KStoryBridge works?" button
 *
 * @param open - Controls dialog visibility
 * @param onClose - Callback when dialog is closed
 * @param userId - Current user's ID for tracking
 * @param userEmail - Current user's email for onboarding record
 */
export default function WelcomeVideoDialog({ open, onClose, userId, userEmail }: WelcomeVideoDialogProps) {

  const handleClose = async () => {
    console.log('🎥 WELCOME VIDEO: User closed video dialog');

    // Mark video as seen in database
    try {
      const success = await OnboardingService.markWelcomeVideoAsSeen(userId, userEmail);
      if (success) {
        console.log('✅ WELCOME VIDEO: Successfully marked as seen');
      } else {
        console.warn('⚠️ WELCOME VIDEO: Failed to mark as seen, but allowing close');
      }
    } catch (error) {
      console.error('❌ WELCOME VIDEO: Error marking as seen:', error);
      // Allow close even if tracking fails (non-blocking)
    }

    // Close dialog
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose} modal={true}>
      <DialogContent
        className="max-w-4xl bg-white border-2 border-gray-300"
        style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          backgroundColor: 'white',
          zIndex: 100,
          maxWidth: '56rem',
          width: '90vw'
        }}
      >
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-gray-900">
            Welcome to KStoryBridge!
          </DialogTitle>
          <DialogDescription className="text-gray-600">
            Watch this quick video to learn how KStoryBridge helps you discover and acquire Korean content.
          </DialogDescription>
        </DialogHeader>

        <div className="w-full mt-4" style={{ height: '450px' }}>
          <iframe
            className="w-full h-full rounded-lg"
            src="https://www.youtube.com/embed/BJS2m-MfOFg"
            title="How KStoryBridge Works"
            width="100%"
            height="450"
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
          />
        </div>

        <p className="text-xs text-center text-gray-500 mt-4">
          You can watch this video again anytime from your Profile page
        </p>
      </DialogContent>
    </Dialog>
  );
}
