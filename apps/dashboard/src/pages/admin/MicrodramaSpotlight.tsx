import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import AdminLayout from '@/components/layout/AdminLayout';
import { Icon } from '@iconify/react';
import { FormatSpotlightCard } from '@/components/format-spotlight';
import {
  FORMAT_DISPLAY_NAMES,
  FORMAT_ICONS,
  FORMAT_DESCRIPTIONS,
} from '@/services/formatFitService';
import { getAdminFormatSpotlightData } from '@/services/formatFitService';

const FORMAT = 'microdrama' as const;

export default function AdminMicrodramaSpotlight() {
  const navigate = useNavigate();

  const { data, isLoading, error } = useQuery({
    queryKey: ['admin-format-spotlight', FORMAT],
    queryFn: () => getAdminFormatSpotlightData(FORMAT),
  });

  const icon = FORMAT_ICONS[FORMAT];
  const displayName = FORMAT_DISPLAY_NAMES[FORMAT];
  const description = FORMAT_DESCRIPTIONS[FORMAT];

  const handleCardClick = (titleId: string) => {
    navigate(`/admin/titles?highlight=${titleId}`);
  };

  return (
    <AdminLayout>
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
            All titles ranked by AI-analyzed {displayName.toLowerCase()} adaptation potential (all priorities shown).
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
              No titles currently have a {displayName.toLowerCase()} format fit score above 50. Run Format Fit analysis on titles to populate this view.
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
                formatType={FORMAT}
                rank={index + 1}
                note={item.note}
                onCardClick={(titleId) => handleCardClick(titleId)}
              />
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
