import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { BuyerLayout } from '@/components/layout/BuyerLayout';
import { Icon } from '@iconify/react';
import { FormatSpotlightCard } from '@/components/format-spotlight';
import {
  FORMAT_DISPLAY_NAMES,
  FORMAT_ICONS,
  FORMAT_DESCRIPTIONS,
  type FormatType,
} from '@/services/formatFitService';
import { getFormatSpotlightData, getMicrodramaSpotlightFromFeaturedSection } from '@/services/formatFitService';
import { trackFormatSpotlightView, trackFormatSpotlightCardClick } from '@/utils/analytics';
import { useAuth } from '@/hooks/useAuth';
import { useEffect } from 'react';

const VALID_FORMATS: FormatType[] = ['film', 'tv_series', 'animation', 'microdrama', 'audio_drama'];

export default function FormatSpotlight() {
  const { formatType } = useParams<{ formatType: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const validFormat = VALID_FORMATS.includes(formatType as FormatType)
    ? (formatType as FormatType)
    : null;

  const isMicrodrama = validFormat === 'microdrama';
  const userEmail = user?.email;

  useEffect(() => {
    if (validFormat) {
      trackFormatSpotlightView(validFormat);
    }
  }, [validFormat]);

  const { data, isLoading, error } = useQuery({
    queryKey: isMicrodrama
      ? ['microdrama-spotlight-featured', userEmail]
      : ['format-spotlight', validFormat],
    queryFn: isMicrodrama
      ? () => getMicrodramaSpotlightFromFeaturedSection(userEmail!)
      : () => getFormatSpotlightData(validFormat!),
    // Microdrama needs the user's email to auto-generate missing analysis.
    enabled: isMicrodrama ? !!userEmail : !!validFormat,
    // Always refetch on mount so admin reorders/curation changes show immediately
    // (overrides the app-wide 5-min staleTime).
    staleTime: 0,
    refetchOnMount: 'always',
  });

  if (!validFormat) {
    return (
      <BuyerLayout>
        <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 py-4 sm:py-6">
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
              <Icon icon="solar:danger-triangle-bold-duotone" className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Invalid Format</h3>
            <p className="text-gray-600 text-sm text-center max-w-md">
              The format type "{formatType}" is not recognized.
            </p>
          </div>
        </div>
      </BuyerLayout>
    );
  }

  const icon = FORMAT_ICONS[validFormat];
  const displayName = FORMAT_DISPLAY_NAMES[validFormat];
  const description = FORMAT_DESCRIPTIONS[validFormat];

  const handleCardClick = (titleId: string, rank: number) => {
    trackFormatSpotlightCardClick(titleId, validFormat, rank);
    navigate(`/buyers/titles/${titleId}`);
  };

  return (
    <BuyerLayout>
      <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 py-4 sm:py-6 space-y-6">
        {/* Header */}
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-br from-hanok-teal to-hanok-teal/80 p-3 rounded-2xl shadow-lg">
              <span className="text-2xl">{icon}</span>
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-hanok-teal">
                {displayName} Spotlight
              </h1>
              <p className="text-base sm:text-lg text-gray-600 mt-1">{description}</p>
            </div>
          </div>
          <p className="text-sm sm:text-base text-gray-600">
            Top Korean titles ranked by AI-analyzed {displayName.toLowerCase()} adaptation potential.
          </p>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex flex-col items-center justify-center py-20">
            <Icon icon="solar:refresh-circle-bold-duotone" className="h-12 w-12 text-hanok-teal animate-spin mb-4" />
            <p className="text-gray-600 text-sm">Analyzing {displayName.toLowerCase()} potential...</p>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="p-6 bg-red-50 border border-red-200 rounded-2xl">
            <p className="text-red-800 font-semibold mb-2">Failed to load spotlight data</p>
            <p className="text-red-600 text-sm">Please try again later or contact support if the problem persists.</p>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && !error && data && data.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
              <span className="text-2xl">{icon}</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Titles Found</h3>
            <p className="text-gray-600 text-sm text-center max-w-md">
              No titles currently meet the threshold for {displayName.toLowerCase()} adaptation. Check back as more titles are analyzed.
            </p>
          </div>
        )}

        {/* Cards */}
        {!isLoading && !error && data && data.length > 0 && (
          <div className="space-y-4">
            {data.map((item, index) => (
              <FormatSpotlightCard
                key={item.title.title_id}
                title={item.title}
                analysis={item.analysis}
                formatType={validFormat}
                rank={index + 1}
                note={item.note}
                onCardClick={(titleId) => handleCardClick(titleId, index + 1)}
              />
            ))}
          </div>
        )}
      </div>
    </BuyerLayout>
  );
}
