import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface LowPriorityBadgeProps {
  /** Title priority: '1'=High, '2'=Medium, '3'=Low. Null/unset is treated as Low. */
  priority?: string | null;
  className?: string;
}

/**
 * Admin-only warning sticker for Low-priority (or unset) titles.
 *
 * Low/null titles are hidden from buyer lists, search, AI tools, and the pitch
 * PDF, so admins need a clear visual cue when one shows up in an admin surface.
 * Renders nothing for High/Medium titles. Mirrors the HIGH PRIORITY badge in
 * TitleHero.tsx.
 */
export function LowPriorityBadge({ priority, className }: LowPriorityBadgeProps) {
  if (priority !== '3' && priority) return null;

  return (
    <Badge className={cn('bg-red-500 text-white text-xs', className)}>
      LOW PRIORITY
    </Badge>
  );
}
