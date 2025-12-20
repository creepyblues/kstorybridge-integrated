import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Icon } from '@iconify/react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useAuth } from '@/hooks/useAuth'
import { Title } from '@/services/titlesService'
import { TitleDraft } from '@/services/draftService'

interface CreatorProgressCardProps {
  titles: Title[]
  drafts: TitleDraft[]
}

interface ProgressStep {
  id: string
  title: string
  description: string
  icon: string
  completed: boolean
  href?: string
}

export function CreatorProgressCard({ titles, drafts }: CreatorProgressCardProps) {
  const { t } = useTranslation(['common'])
  const navigate = useNavigate()
  const { user } = useAuth()

  const steps: ProgressStep[] = useMemo(() => {
    const hasProfile = !!(user?.user_metadata?.full_name && user?.user_metadata?.pen_name)
    const hasTitle = titles.length > 0
    const hasDraft = drafts.length > 0

    return [
      {
        id: 'profile',
        title: t('common:home.progress.completeProfile'),
        description: t('common:home.progress.completeProfileDesc'),
        icon: 'solar:user-check-bold-duotone',
        completed: hasProfile,
        href: '/profile',
      },
      {
        id: 'first-title',
        title: t('common:home.progress.addFirstTitle'),
        description: t('common:home.progress.addFirstTitleDesc'),
        icon: 'solar:document-add-bold-duotone',
        completed: hasTitle || hasDraft,
        href: '/titles/add-title',
      },
      {
        id: 'publish',
        title: t('common:home.progress.publishTitle'),
        description: t('common:home.progress.publishTitleDesc'),
        icon: 'solar:verified-check-bold-duotone',
        completed: hasTitle,
        href: '/titles',
      },
      {
        id: 'learn',
        title: t('common:home.progress.learnPlatform'),
        description: t('common:home.progress.learnPlatformDesc'),
        icon: 'solar:square-academic-cap-bold-duotone',
        completed: false, // This could be tied to learning progress later
        href: '/learning-center',
      },
    ]
  }, [titles.length, drafts.length, user?.user_metadata, t])

  const completedCount = steps.filter(s => s.completed).length
  const progressPercent = (completedCount / steps.length) * 100

  return (
    <Card className="bg-white border-gray-200 shadow-none rounded-2xl">
      <CardHeader className="pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-emerald-500/10">
            <Icon icon="solar:checklist-bold-duotone" className="h-5 w-5 text-emerald-600" />
          </div>
          <div className="flex-1">
            <CardTitle className="text-lg">{t('common:home.progress.title')}</CardTitle>
            <p className="text-sm text-gray-500 mt-0.5">
              {completedCount}/{steps.length} {t('common:home.progress.completed')}
            </p>
          </div>
        </div>
        {/* Progress Bar */}
        <div className="mt-3 h-2 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-sunrise-coral to-orange-400 rounded-full transition-all duration-500"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-3">
          {steps.map((step) => (
            <div
              key={step.id}
              onClick={() => step.href && navigate(step.href)}
              className={`flex items-start gap-3 p-3 rounded-xl transition-colors cursor-pointer ${
                step.completed
                  ? 'bg-emerald-50/50'
                  : 'hover:bg-gray-50'
              }`}
            >
              <div className={`p-1.5 rounded-lg ${
                step.completed ? 'bg-emerald-500' : 'bg-gray-200'
              }`}>
                <Icon
                  icon={step.completed ? 'solar:check-circle-bold' : step.icon}
                  className={`h-4 w-4 ${step.completed ? 'text-white' : 'text-gray-500'}`}
                />
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-medium ${
                  step.completed ? 'text-emerald-700 line-through' : 'text-gray-900'
                }`}>
                  {step.title}
                </p>
                <p className="text-xs text-gray-500 mt-0.5">{step.description}</p>
              </div>
              {!step.completed && (
                <Icon
                  icon="solar:arrow-right-linear"
                  className="h-4 w-4 text-gray-300"
                />
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
