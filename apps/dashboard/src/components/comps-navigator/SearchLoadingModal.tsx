/**
 * SearchLoadingModal Component
 *
 * Modal wrapper for EnhancedSearchLoading that ensures the loading
 * progress is visible regardless of scroll position.
 */

import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { EnhancedSearchLoading } from './EnhancedSearchLoading';

interface SearchLoadingModalProps {
  isOpen: boolean;
  compDescriptions?: Record<string, string> | null;
}

export function SearchLoadingModal({ isOpen, compDescriptions }: SearchLoadingModalProps) {
  return (
    <Dialog open={isOpen}>
      <DialogContent
        className="max-w-md rounded-2xl"
        hideCloseButton
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        {/* Accessibility: Hidden title for screen readers */}
        <DialogTitle className="sr-only">Searching for Matches</DialogTitle>
        <DialogDescription className="sr-only">
          Please wait while we find Korean titles matching your comp combination
        </DialogDescription>

        <EnhancedSearchLoading compDescriptions={compDescriptions} />
      </DialogContent>
    </Dialog>
  );
}

export default SearchLoadingModal;
