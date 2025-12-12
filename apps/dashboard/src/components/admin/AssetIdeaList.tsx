import React from 'react';
import { Icon } from '@iconify/react';
import { AssetGenerationCard } from './AssetGenerationCard';
import type { MarketingAsset, AssetCategory } from '@/types/asset-generation';

interface AssetIdeaListProps {
  assets: MarketingAsset[];
  isLoading?: boolean;
}

interface AssetsByCategory {
  social_media: MarketingAsset[];
  ad_creative: MarketingAsset[];
  pitch_material: MarketingAsset[];
}

/**
 * AssetIdeaList Component
 * Displays marketing assets grouped by category
 */
export function AssetIdeaList({ assets, isLoading }: AssetIdeaListProps) {
  // Group assets by category
  const groupedAssets: AssetsByCategory = React.useMemo(() => {
    return assets.reduce(
      (acc, asset) => {
        const category = asset.asset_category;
        if (category in acc) {
          acc[category].push(asset);
        }
        return acc;
      },
      {
        social_media: [],
        ad_creative: [],
        pitch_material: [],
      } as AssetsByCategory
    );
  }, [assets]);

  const getCategoryIcon = (category: AssetCategory) => {
    switch (category) {
      case 'social_media':
        return <Icon icon="solar:gallery-bold-duotone" className="w-5 h-5" />;
      case 'ad_creative':
        return <Icon icon="solar:videocamera-bold-duotone" className="w-5 h-5" />;
      case 'pitch_material':
        return <Icon icon="solar:presentation-graph-bold-duotone" className="w-5 h-5" />;
    }
  };

  const getCategoryTitle = (category: AssetCategory) => {
    switch (category) {
      case 'social_media':
        return 'Social Media Assets';
      case 'ad_creative':
        return 'Ad Creative Assets';
      case 'pitch_material':
        return 'Pitch Material Assets';
    }
  };

  const getCategoryDescription = (category: AssetCategory) => {
    switch (category) {
      case 'social_media':
        return 'Instagram stories, posts, and social media content';
      case 'ad_creative':
        return 'Marketing ads, promotional materials, and campaigns';
      case 'pitch_material':
        return 'Pitch decks, one-sheets, and presentation materials';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-3"></div>
          <p className="text-sm text-gray-500">Loading assets...</p>
        </div>
      </div>
    );
  }

  if (assets.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="bg-gray-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
          <Icon icon="solar:gallery-bold-duotone" className="w-8 h-8 text-gray-400" />
        </div>
        <h3 className="text-lg font-medium text-black mb-2">No Assets Generated Yet</h3>
        <p className="text-sm text-gray-500">
          Select a title and analyze its pitch to generate asset ideas.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Social Media Assets */}
      {groupedAssets.social_media.length > 0 && (
        <CategorySection
          category="social_media"
          title={getCategoryTitle('social_media')}
          description={getCategoryDescription('social_media')}
          icon={getCategoryIcon('social_media')}
          assets={groupedAssets.social_media}
        />
      )}

      {/* Ad Creative Assets */}
      {groupedAssets.ad_creative.length > 0 && (
        <CategorySection
          category="ad_creative"
          title={getCategoryTitle('ad_creative')}
          description={getCategoryDescription('ad_creative')}
          icon={getCategoryIcon('ad_creative')}
          assets={groupedAssets.ad_creative}
        />
      )}

      {/* Pitch Material Assets */}
      {groupedAssets.pitch_material.length > 0 && (
        <CategorySection
          category="pitch_material"
          title={getCategoryTitle('pitch_material')}
          description={getCategoryDescription('pitch_material')}
          icon={getCategoryIcon('pitch_material')}
          assets={groupedAssets.pitch_material}
        />
      )}
    </div>
  );
}

interface CategorySectionProps {
  category: AssetCategory;
  title: string;
  description: string;
  icon: React.ReactNode;
  assets: MarketingAsset[];
}

function CategorySection({ title, description, icon, assets }: CategorySectionProps) {
  const [isExpanded, setIsExpanded] = React.useState(true);

  const completedCount = assets.filter((a) => a.status === 'completed').length;
  const pendingCount = assets.filter((a) => a.status === 'pending').length;
  const generatingCount = assets.filter((a) => a.status === 'generating').length;

  return (
    <div className="border border-gray-300 rounded-2xl overflow-hidden">
      {/* Category Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-6 py-4 bg-gray-50 hover:bg-gray-100 transition-colors flex items-center justify-between"
      >
        <div className="flex items-center gap-3">
          <div className="text-gray-700">{icon}</div>
          <div className="text-left">
            <h3 className="text-base font-semibold text-black">{title}</h3>
            <p className="text-xs text-gray-500">{description}</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3 text-xs">
            <span className="text-green-600 font-medium">
              {completedCount} completed
            </span>
            {generatingCount > 0 && (
              <span className="text-blue-600 font-medium">
                {generatingCount} generating
              </span>
            )}
            {pendingCount > 0 && (
              <span className="text-gray-500">
                {pendingCount} pending
              </span>
            )}
          </div>
          <svg
            className={`w-5 h-5 text-gray-400 transition-transform ${
              isExpanded ? 'rotate-180' : ''
            }`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>

      {/* Assets Grid */}
      {isExpanded && (
        <div className="p-6 bg-transparent">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {assets.map((asset) => (
              <AssetGenerationCard key={asset.id} asset={asset} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
