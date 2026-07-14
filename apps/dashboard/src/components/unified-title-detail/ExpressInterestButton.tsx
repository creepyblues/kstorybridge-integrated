import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Handshake, CheckCircle, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { interestService } from '@/services/interestService';
import { trackTitleContactCreatorClicked, trackTitleInterestSubmitted } from '@/utils/analytics';

interface ExpressInterestButtonProps {
  titleId: string;
  titleName: string;
  userEmail: string;
  userTier?: string;
}

export function ExpressInterestButton({
  titleId,
  titleName,
  userEmail,
  userTier,
}: ExpressInterestButtonProps) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [alreadySent, setAlreadySent] = useState(false);

  useEffect(() => {
    let cancelled = false;
    interestService.hasExpressedInterest(titleId, userEmail).then((sent) => {
      if (!cancelled) setAlreadySent(sent);
    });
    return () => {
      cancelled = true;
    };
  }, [titleId, userEmail]);

  const handleOpen = () => {
    trackTitleContactCreatorClicked(titleId, titleName, userTier || 'unknown');
    setOpen(true);
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      await interestService.submitInterest(titleId, note.trim() || undefined);
      trackTitleInterestSubmitted(titleId);
      setAlreadySent(true);
      setOpen(false);
      toast({
        title: 'Interest sent',
        description: 'Our team will follow up with next steps within 1 business day.',
        variant: 'success',
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Please try again.';
      toast({ title: 'Could not send interest', description: message, variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  if (alreadySent) {
    return (
      <Button
        variant="outline"
        className="border-gray-300 rounded-full px-6 py-3 text-base font-medium text-gray-500 cursor-default hover:bg-transparent"
        disabled
      >
        <CheckCircle className="h-4 w-4 mr-2 text-green-600" />
        Interest sent
      </Button>
    );
  }

  return (
    <>
      <Button
        className="bg-black hover:bg-gray-800 text-white rounded-full px-6 py-3 text-base font-medium"
        onClick={handleOpen}
      >
        <Handshake className="h-4 w-4 mr-2" />
        Express Interest
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle>Express interest in {titleName}</DialogTitle>
            <DialogDescription>
              Our team will connect you with the rights holder and follow up with
              next steps — licensing details, materials, and availability.
            </DialogDescription>
          </DialogHeader>

          <Textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Optional: tell us about your project, format, or timeline..."
            className="border-gray-300 min-h-[100px]"
            maxLength={2000}
            disabled={submitting}
          />

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              className="border-gray-300 hover:bg-gray-100"
              onClick={() => setOpen(false)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              className="bg-black hover:bg-gray-800 text-white"
              onClick={handleSubmit}
              disabled={submitting}
            >
              {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {submitting ? 'Sending...' : 'Send interest'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
