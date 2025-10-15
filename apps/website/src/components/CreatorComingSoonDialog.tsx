import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Button } from "@kstorybridge/ui";

interface CreatorComingSoonDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const CreatorComingSoonDialog = ({ open, onOpenChange }: CreatorComingSoonDialogProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-midnight-ink">
            Creator Access Coming Soon
          </DialogTitle>
          <DialogDescription className="text-base text-midnight-ink-600 pt-4">
            We're preparing an exceptional experience for Korean content creators.
            Creator signup and login will be available soon.
          </DialogDescription>
        </DialogHeader>
        <div className="flex justify-end pt-4">
          <Button
            variant="outline"
            className="border-gray-300 hover:bg-gray-100"
            onClick={() => onOpenChange(false)}
          >
            Got it
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CreatorComingSoonDialog;
