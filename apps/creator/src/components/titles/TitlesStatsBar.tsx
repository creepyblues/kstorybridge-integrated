import { useTranslation } from 'react-i18next'
import { Icon } from '@iconify/react'

interface TitlesStatsBarProps {
  draftsCount: number
  pendingCount: number
  rejectedCount: number
  publishedCount: number
}

export function TitlesStatsBar({
  draftsCount,
  pendingCount,
  rejectedCount,
  publishedCount,
}: TitlesStatsBarProps) {
  const { t } = useTranslation(['titles'])

  const stats = [
    {
      label: t('titles:stats.inProgress', 'In Progress'),
      count: draftsCount,
      icon: 'solar:pen-bold-duotone',
      bgColor: 'bg-amber-500/10',
      iconColor: 'text-amber-600',
    },
    {
      label: t('titles:stats.pending', 'Pending Review'),
      count: pendingCount,
      icon: 'solar:clock-circle-bold-duotone',
      bgColor: 'bg-blue-500/10',
      iconColor: 'text-blue-600',
    },
    {
      label: t('titles:stats.needsRevision', 'Needs Revision'),
      count: rejectedCount,
      icon: 'solar:danger-triangle-bold-duotone',
      bgColor: 'bg-red-500/10',
      iconColor: 'text-red-600',
    },
    {
      label: t('titles:stats.published', 'Published'),
      count: publishedCount,
      icon: 'solar:verified-check-bold-duotone',
      bgColor: 'bg-green-500/10',
      iconColor: 'text-green-600',
    },
  ]

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className="bg-white border border-gray-200 rounded-xl p-4 hover:border-sunrise-coral/30 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${stat.bgColor}`}>
              <Icon icon={stat.icon} className={`h-5 w-5 ${stat.iconColor}`} />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">{stat.count}</div>
              <div className="text-xs text-gray-500">{stat.label}</div>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
