import { Button } from '@/components/ui/button';
import { Icon } from '@iconify/react';

interface EmptyStateProps {
  icon: string;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({
  icon,
  title,
  description,
  actionLabel,
  onAction,
}: EmptyStateProps) {
  return (
    <div className="text-center py-12">
      <Icon icon={icon} className="h-16 w-16 text-gray-300 mx-auto mb-4" />
      <p className="text-gray-500 text-lg mb-2">{title}</p>
      {description && (
        <p className="text-gray-400 text-sm mb-6">{description}</p>
      )}
      {actionLabel && onAction && (
        <Button
          variant="outline"
          onClick={onAction}
          className="border-gray-300"
        >
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
