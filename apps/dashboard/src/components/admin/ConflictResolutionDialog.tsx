/**
 * Conflict Resolution Dialog
 *
 * Shows when updating title fields that have existing data.
 * Allows admin to choose: Use Existing, Use New, or Merge Both.
 */

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Icon } from '@iconify/react';
import { type FieldConflict, type MergeStrategy } from '@/services/weeklyTitleService';

interface ConflictResolutionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  conflicts: FieldConflict[];
  onResolve: (resolutions: FieldConflict[]) => void;
  isApplying?: boolean;
}

export function ConflictResolutionDialog({
  open,
  onOpenChange,
  conflicts,
  onResolve,
  isApplying = false,
}: ConflictResolutionDialogProps) {
  const [resolutions, setResolutions] = useState<FieldConflict[]>(conflicts);

  // Update resolutions when conflicts change
  useState(() => {
    setResolutions(conflicts);
  });

  const handleStrategyChange = (field: string, strategy: MergeStrategy) => {
    setResolutions((prev) =>
      prev.map((c) => (c.field === field ? { ...c, strategy } : c))
    );
  };

  const handleApply = () => {
    onResolve(resolutions);
  };

  const formatValue = (value: string | string[] | object | null): string => {
    if (value === null || value === undefined) return '(empty)';
    if (Array.isArray(value)) {
      if (value.length === 0) return '(empty)';
      return value.join(', ');
    }
    if (typeof value === 'object') {
      const json = JSON.stringify(value, null, 2);
      return json.length > 200 ? json.slice(0, 200) + '...' : json;
    }
    const str = String(value);
    return str.length > 200 ? str.slice(0, 200) + '...' : str;
  };

  const strategyOptions: { value: MergeStrategy; label: string; icon: string }[] = [
    { value: 'use_existing', label: 'Use Existing', icon: 'solar:database-bold-duotone' },
    { value: 'use_new', label: 'Use New', icon: 'solar:document-add-bold-duotone' },
    { value: 'merge', label: 'Merge Both', icon: 'solar:layers-bold-duotone' },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Icon icon="solar:danger-triangle-bold-duotone" className="h-5 w-5 text-amber-500" />
            Resolve Data Conflicts
          </DialogTitle>
        </DialogHeader>

        <div className="py-4">
          <p className="text-sm text-gray-600 mb-4">
            The following fields have existing data. Choose how to handle each conflict:
          </p>

          <div className="space-y-6">
            {resolutions.map((conflict) => (
              <div
                key={conflict.field}
                className="border border-gray-200 rounded-xl p-4 bg-gray-50"
              >
                {/* Field Name */}
                <div className="flex items-center gap-2 mb-3">
                  <Icon icon="solar:text-field-bold-duotone" className="h-4 w-4 text-gray-500" />
                  <Label className="font-semibold text-gray-900">
                    {conflict.displayName}
                  </Label>
                </div>

                {/* Value Comparison */}
                <div className="grid grid-cols-2 gap-4 mb-4">
                  {/* Existing Value */}
                  <div className="bg-white border border-gray-200 rounded-lg p-3">
                    <div className="flex items-center gap-1 mb-2">
                      <Icon icon="solar:database-bold-duotone" className="h-3 w-3 text-blue-500" />
                      <span className="text-xs font-medium text-blue-600 uppercase">
                        Existing
                      </span>
                    </div>
                    <div className="text-sm text-gray-700 whitespace-pre-wrap break-words max-h-32 overflow-y-auto">
                      {formatValue(conflict.existingValue)}
                    </div>
                  </div>

                  {/* New Value */}
                  <div className="bg-white border border-gray-200 rounded-lg p-3">
                    <div className="flex items-center gap-1 mb-2">
                      <Icon icon="solar:document-add-bold-duotone" className="h-3 w-3 text-green-500" />
                      <span className="text-xs font-medium text-green-600 uppercase">
                        New
                      </span>
                    </div>
                    <div className="text-sm text-gray-700 whitespace-pre-wrap break-words max-h-32 overflow-y-auto">
                      {formatValue(conflict.newValue)}
                    </div>
                  </div>
                </div>

                {/* Strategy Selection */}
                <div className="flex items-center gap-2">
                  {strategyOptions.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => handleStrategyChange(conflict.field, option.value)}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-medium transition-colors ${
                        conflict.strategy === option.value
                          ? 'bg-hanok-teal text-white border-hanok-teal'
                          : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      <Icon icon={option.icon} className="h-4 w-4" />
                      {option.label}
                    </button>
                  ))}
                </div>

                {/* Merge Preview */}
                {conflict.strategy === 'merge' && (
                  <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                    <div className="flex items-center gap-1 mb-1">
                      <Icon icon="solar:info-circle-bold-duotone" className="h-3 w-3 text-amber-600" />
                      <span className="text-xs font-medium text-amber-700">
                        Merge Preview
                      </span>
                    </div>
                    <div className="text-xs text-amber-800">
                      Existing content will be followed by new content, separated by a blank line.
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isApplying}
            className="border-gray-300"
          >
            Cancel
          </Button>
          <Button
            onClick={handleApply}
            disabled={isApplying}
            className="bg-hanok-teal hover:bg-hanok-teal/90"
          >
            {isApplying ? (
              <>
                <Icon icon="solar:refresh-circle-bold-duotone" className="h-4 w-4 mr-2 animate-spin" />
                Applying...
              </>
            ) : (
              <>
                <Icon icon="solar:check-circle-bold-duotone" className="h-4 w-4 mr-2" />
                Apply Changes
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default ConflictResolutionDialog;
