/**
 * CollectButton Component
 *
 * Button that triggers intelligence collection for a platform URL.
 * Shows platform icon based on parsed URL.
 */

import { useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Icon } from '@iconify/react';
import { parseUrl, getPlatformDisplayName, type SupportedPlatform } from '@/services/intelligenceService';

interface CollectButtonProps {
  url: string;
  onClick: () => void;
  isCollecting?: boolean;
  disabled?: boolean;
}

// Platform icons mapping
const PLATFORM_ICONS: Record<SupportedPlatform, string> = {
  naver_webtoon: 'simple-icons:naver',
  naver_series: 'simple-icons:naver',
  kakao: 'simple-icons:kakaotalk',
  kakao_webtoon: 'simple-icons:kakaotalk',
  manta: 'solar:book-2-bold-duotone',
  lezhin: 'solar:book-bold-duotone',
  ridibooks: 'solar:book-bold-duotone',
  bomtoon: 'solar:book-bold-duotone',
  unknown: 'solar:database-bold-duotone',
};

export function CollectButton({
  url,
  onClick,
  isCollecting = false,
  disabled = false,
}: CollectButtonProps) {
  const parsedUrl = useMemo(() => {
    if (!url || !url.trim()) {
      return null;
    }
    return parseUrl(url);
  }, [url]);

  const isValid = parsedUrl?.valid && parsedUrl.platform !== 'unknown';
  const platformName = parsedUrl ? getPlatformDisplayName(parsedUrl.platform) : '';
  const platformIcon = parsedUrl ? PLATFORM_ICONS[parsedUrl.platform] : PLATFORM_ICONS.unknown;

  return (
    <Button
      type="button"
      variant="outline"
      size="icon"
      onClick={onClick}
      disabled={disabled || isCollecting || !url?.trim()}
      className={`h-10 w-10 flex-shrink-0 ${
        isValid
          ? 'border-[#4C9C9B] text-[#4C9C9B] hover:bg-[#4C9C9B]/10'
          : 'border-gray-300 text-gray-400'
      }`}
      title={
        !url?.trim()
          ? 'Enter a URL first'
          : isCollecting
          ? 'Collecting...'
          : isValid
          ? `Collect data from ${platformName}`
          : 'Unknown platform'
      }
    >
      {isCollecting ? (
        <Icon icon="solar:refresh-circle-bold-duotone" className="h-5 w-5 animate-spin" />
      ) : (
        <Icon icon={platformIcon} className="h-5 w-5" />
      )}
    </Button>
  );
}

export default CollectButton;
