import React from 'react'
import { useTranslation } from 'react-i18next'
import { Trophy, Eye, BookOpen, Star } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

export interface CreatorAchievements {
  total_titles?: number
  total_views?: string
  notable_works?: string[]
  awards_received?: string[]
  industry_recognition?: string
}

interface CreatorAchievementsDisplayProps {
  achievements: CreatorAchievements | null | undefined
}

/**
 * CreatorAchievementsDisplay Component
 *
 * Displays creator achievements from JSONB field
 * Shows creator's overall track record and credentials
 */
export const CreatorAchievementsDisplay: React.FC<CreatorAchievementsDisplayProps> = ({
  achievements
}) => {
  const { t } = useTranslation(['titles'])

  if (!achievements || Object.keys(achievements).length === 0) {
    return (
      <div className="text-sm text-gray-500 italic">
        {t('titles:detail.noCreatorAchievements', 'No creator achievements available')}
      </div>
    )
  }

  const hasAnyData = achievements.total_titles ||
                     achievements.total_views ||
                     (achievements.notable_works && achievements.notable_works.length > 0) ||
                     (achievements.awards_received && achievements.awards_received.length > 0) ||
                     achievements.industry_recognition

  if (!hasAnyData) {
    return (
      <div className="text-sm text-gray-500 italic">
        {t('titles:detail.noCreatorAchievements', 'No creator achievements available')}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      {(achievements.total_titles || achievements.total_views) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {achievements.total_titles && (
            <div className="border border-gray-300 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <div className="flex-shrink-0">
                  <BookOpen className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Total Titles Created</p>
                  <p className="text-2xl font-bold text-gray-900">{achievements.total_titles}</p>
                </div>
              </div>
            </div>
          )}

          {achievements.total_views && (
            <div className="border border-gray-300 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <div className="flex-shrink-0">
                  <Eye className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Total Views Across All Works</p>
                  <p className="text-2xl font-bold text-gray-900">{achievements.total_views}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Notable Works */}
      {achievements.notable_works && achievements.notable_works.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
            <Star className="w-4 h-4 text-amber-500" />
            Notable Previous Works
          </h4>
          <div className="flex flex-wrap gap-2">
            {achievements.notable_works.map((work, index) => (
              <Badge
                key={index}
                variant="outline"
                className="text-sm border-gray-300 text-gray-700 px-3 py-1"
              >
                {work}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Awards Received */}
      {achievements.awards_received && achievements.awards_received.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
            <Trophy className="w-4 h-4 text-yellow-500" />
            Awards & Recognition (as a Creator)
          </h4>
          <div className="space-y-2">
            {achievements.awards_received.map((award, index) => (
              <div
                key={index}
                className="flex items-start gap-2 text-sm text-gray-900 bg-yellow-50 border border-yellow-200 rounded-lg p-3"
              >
                <Trophy className="w-4 h-4 text-yellow-600 flex-shrink-0 mt-0.5" />
                <span>{award}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Industry Recognition */}
      {achievements.industry_recognition && (
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-2">
            Industry Recognition & Achievements
          </h4>
          <p className="text-sm text-gray-900 leading-relaxed bg-gray-50 border border-gray-200 rounded-lg p-4">
            {achievements.industry_recognition}
          </p>
        </div>
      )}
    </div>
  )
}
