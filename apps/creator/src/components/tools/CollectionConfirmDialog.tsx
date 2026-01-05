/**
 * CollectionConfirmDialog Component
 *
 * Pre-collection confirmation dialog that shows all fields that could be
 * overwritten during intelligence collection. Displays current database
 * values grouped by category.
 */

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Icon } from '@iconify/react';
import {
  parseUrl,
  getPlatformDisplayName,
  getFieldsByCategory,
  formatFieldValue,
  type CollectibleField,
} from '@/services/intelligenceService';

interface Title {
  title_id?: string;
  title_name_kr?: string | null;
  title_name_en?: string | null;
  views?: number | null;
  likes?: number | null;
  rating?: number | null;
  rating_count?: number | null;
  chapters?: number | null;
  synopsis_kr?: string | null;
  genre?: string | string[] | null;
  keywords?: string[] | null;
  story_author?: string | null;
  title_image?: string | null;
  age_rating?: string | null;
  completed?: boolean | null;
}

interface CollectionConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  url: string;
  currentTitle: Title | null;
  onConfirm: () => void;
  isCollecting?: boolean;
}

// Category display configuration
const CATEGORY_CONFIG = {
  metrics: {
    label: 'Metrics',
    icon: 'solar:chart-2-bold-duotone',
    description: 'View counts, ratings, and engagement metrics',
  },
  content: {
    label: 'Content',
    icon: 'solar:document-text-bold-duotone',
    description: 'Synopsis, genre, and content details',
  },
  metadata: {
    label: 'Metadata',
    icon: 'solar:info-circle-bold-duotone',
    description: 'Author, cover image, and other metadata',
  },
};

function FieldRow({ field, value }: { field: CollectibleField; value: unknown }) {
  const formattedValue = formatFieldValue(field.key, value);
  const hasValue = value != null && value !== '' && (Array.isArray(value) ? value.length > 0 : true);

  return (
    <div className="flex justify-between items-start py-2 border-b border-gray-100 last:border-0">
      <span className="text-sm text-gray-600">{field.label}</span>
      <span
        className={`text-sm text-right max-w-[60%] ${
          hasValue ? 'text-gray-900' : 'text-gray-400 italic'
        }`}
      >
        {hasValue ? formattedValue : 'Not set'}
      </span>
    </div>
  );
}

function CategorySection({
  category,
  fields,
  title,
}: {
  category: 'metrics' | 'content' | 'metadata';
  fields: CollectibleField[];
  title: Title | null;
}) {
  const config = CATEGORY_CONFIG[category];

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Icon icon={config.icon} className="h-4 w-4 text-[#4C9C9B]" />
        <h4 className="font-medium text-gray-900">{config.label}</h4>
      </div>
      <p className="text-xs text-gray-500 mb-2">{config.description}</p>
      <div className="bg-gray-50 rounded-lg p-3">
        {fields.map((field) => (
          <FieldRow
            key={field.key}
            field={field}
            value={title?.[field.dbField as keyof Title]}
          />
        ))}
      </div>
    </div>
  );
}

export function CollectionConfirmDialog({
  open,
  onOpenChange,
  url,
  currentTitle,
  onConfirm,
  isCollecting = false,
}: CollectionConfirmDialogProps) {
  const parsedUrl = url?.trim() ? parseUrl(url) : null;
  const platformName = parsedUrl ? getPlatformDisplayName(parsedUrl.platform) : 'Unknown';
  const isValidPlatform = parsedUrl?.valid && parsedUrl.platform !== 'unknown';

  const { metrics, content, metadata } = getFieldsByCategory();

  const handleConfirm = () => {
    onConfirm();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Icon icon="solar:database-bold-duotone" className="h-5 w-5 text-[#4C9C9B]" />
            Confirm Data Collection
          </DialogTitle>
          <DialogDescription>
            {isValidPlatform ? (
              <>
                Collecting data from <strong>{platformName}</strong> may overwrite the following
                fields. Review current values before proceeding.
              </>
            ) : (
              <>
                The URL entered is not from a supported platform. Collection may not work correctly.
              </>
            )}
          </DialogDescription>
        </DialogHeader>

        {/* URL Preview */}
        <div className="bg-gray-100 rounded-lg p-3 text-sm">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-gray-500">Platform:</span>
            <span className={isValidPlatform ? 'text-[#4C9C9B] font-medium' : 'text-orange-500'}>
              {platformName}
            </span>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-gray-500 flex-shrink-0">URL:</span>
            <span className="text-gray-700 break-all text-xs">{url || '(none)'}</span>
          </div>
        </div>

        {/* Title Info */}
        {currentTitle && (
          <div className="text-sm text-gray-600">
            <span className="font-medium">Title:</span>{' '}
            {currentTitle.title_name_kr || currentTitle.title_name_en || 'Untitled'}
          </div>
        )}

        {/* Fields by Category */}
        <div className="space-y-6 mt-2">
          <CategorySection category="metrics" fields={metrics} title={currentTitle} />
          <CategorySection category="content" fields={content} title={currentTitle} />
          <CategorySection category="metadata" fields={metadata} title={currentTitle} />
        </div>

        {/* Warning */}
        <div className="flex items-start gap-2 p-3 bg-amber-50 rounded-lg border border-amber-200">
          <Icon icon="solar:danger-triangle-bold-duotone" className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-amber-800">
            <strong>Note:</strong> After collection, you'll be able to select which specific fields
            to update. No data will be overwritten without your explicit confirmation.
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isCollecting}
            className="border-gray-300 hover:bg-gray-100"
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={isCollecting || !isValidPlatform}
            className="bg-[#4C9C9B] text-white hover:bg-[#3a7a7a]"
          >
            {isCollecting ? (
              <>
                <Icon icon="solar:refresh-circle-bold-duotone" className="h-4 w-4 mr-2 animate-spin" />
                Collecting...
              </>
            ) : (
              <>
                <Icon icon="solar:database-bold-duotone" className="h-4 w-4 mr-2" />
                Proceed with Collection
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default CollectionConfirmDialog;
