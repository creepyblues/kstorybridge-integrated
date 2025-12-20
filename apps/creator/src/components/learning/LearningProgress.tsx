import { useTranslation } from 'react-i18next'
import { Icon } from '@iconify/react'

interface LearningProgressProps {
  completed: number
  total: number
}

export function LearningProgress({ completed, total }: LearningProgressProps) {
  const { t } = useTranslation(['content'])
  const progressPercent = total > 0 ? (completed / total) * 100 : 0

  return (
    <div className="flex items-center gap-4 p-4 bg-white rounded-xl border border-gray-200">
      <div className="p-2 rounded-lg bg-sunrise-coral/10">
        <Icon icon="solar:chart-2-bold-duotone" className="h-5 w-5 text-sunrise-coral" />
      </div>
      <div className="flex-1">
        <div className="flex items-center justify-between mb-1">
          <span className="text-sm font-medium text-gray-900">
            {t('content:learningCenter.progress', { defaultValue: 'Your Progress' })}
          </span>
          <span className="text-sm text-gray-500">
            {completed}/{total} {t('content:learningCenter.completed', { defaultValue: 'completed' })}
          </span>
        </div>
        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-sunrise-coral to-orange-400 rounded-full transition-all duration-500"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>
    </div>
  )
}
