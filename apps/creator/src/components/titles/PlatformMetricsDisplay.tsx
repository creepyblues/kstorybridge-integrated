import React from 'react'
import { useTranslation } from 'react-i18next'
import { Eye, Users, ExternalLink } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

export interface TitlePlatform {
  id: string
  title_id: string
  platform_name: string
  platform_url?: string
  views?: number
  subscribers?: number
  other_metrics?: Record<string, any>
  created_at: string
  updated_at: string
}

interface PlatformMetricsDisplayProps {
  platforms: TitlePlatform[]
}

/**
 * PlatformMetricsDisplay Component
 *
 * Displays platform-specific metrics (Naver, Kakao, Lezhin, etc.)
 * from title_platforms table
 */
export const PlatformMetricsDisplay: React.FC<PlatformMetricsDisplayProps> = ({ platforms }) => {
  const { t } = useTranslation(['titles'])

  if (!platforms || platforms.length === 0) {
    return (
      <div className="text-sm text-gray-500 italic">
        {t('titles:detail.noPlatforms', 'No platform metrics available')}
      </div>
    )
  }

  const formatNumber = (num: number | null | undefined) => {
    if (!num) return '0'
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`
    return num.toLocaleString()
  }

  const getPlatformDisplayName = (platformName: string) => {
    const platformMap: Record<string, string> = {
      naver: 'Naver Series',
      kakao: 'Kakao Page',
      lezhin: 'Lezhin Comics',
      ridibooks: 'Ridibooks',
      munpia: 'Munpia',
      joara: 'Joara',
      kakaowebtoon: 'Kakao Webtoon',
      other: 'Other Platform'
    }
    return platformMap[platformName.toLowerCase()] || platformName
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {platforms.map((platform) => (
          <div
            key={platform.id}
            className="border border-gray-300 rounded-lg p-4 hover:border-gray-400 transition-colors"
          >
            {/* Platform Name */}
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-semibold text-gray-900">
                {getPlatformDisplayName(platform.platform_name)}
              </h4>
              {platform.platform_url && (
                <a
                  href={platform.platform_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-700"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
              )}
            </div>

            {/* Metrics */}
            <div className="space-y-2">
              {platform.views !== null && platform.views !== undefined && (
                <div className="flex items-center gap-2 text-sm">
                  <Eye className="w-4 h-4 text-blue-600" />
                  <span className="text-gray-600">Views:</span>
                  <span className="font-medium text-gray-900">
                    {formatNumber(platform.views)}
                  </span>
                </div>
              )}

              {platform.subscribers !== null && platform.subscribers !== undefined && (
                <div className="flex items-center gap-2 text-sm">
                  <Users className="w-4 h-4 text-green-600" />
                  <span className="text-gray-600">Subscribers:</span>
                  <span className="font-medium text-gray-900">
                    {formatNumber(platform.subscribers)}
                  </span>
                </div>
              )}

              {/* Other Metrics (JSONB) */}
              {platform.other_metrics && Object.keys(platform.other_metrics).length > 0 && (
                <div className="mt-2 pt-2 border-t border-gray-200">
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(platform.other_metrics).map(([key, value]) => (
                      <Badge
                        key={key}
                        variant="outline"
                        className="text-xs border-gray-300 text-gray-700"
                      >
                        {key}: {String(value)}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
