import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Icon } from '@iconify/react'
import { Card, CardContent } from '@/components/ui/card'

interface QuickAction {
  title: string
  description: string
  icon: string
  href: string
  color: string
}

export function QuickActionsRow() {
  const { t } = useTranslation(['common', 'titles'])
  const navigate = useNavigate()

  const quickActions: QuickAction[] = [
    {
      title: t('common:home.quickActions.addTitle'),
      description: t('common:home.quickActions.addTitleDesc'),
      icon: 'solar:add-circle-bold-duotone',
      href: '/titles/add-title',
      color: 'bg-sunrise-coral/10 text-sunrise-coral',
    },
    {
      title: t('common:home.quickActions.viewTitles'),
      description: t('common:home.quickActions.viewTitlesDesc'),
      icon: 'solar:book-2-bold-duotone',
      href: '/titles',
      color: 'bg-blue-500/10 text-blue-600',
    },
    {
      title: t('common:home.quickActions.learnMore'),
      description: t('common:home.quickActions.learnMoreDesc'),
      icon: 'solar:square-academic-cap-bold-duotone',
      href: '/learning-center',
      color: 'bg-emerald-500/10 text-emerald-600',
    },
  ]

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
      {quickActions.map((action) => (
        <Card
          key={action.href}
          className="bg-white border-gray-200 shadow-none rounded-2xl hover:border-sunrise-coral/30 hover:shadow-md transition-all duration-200 cursor-pointer group"
          onClick={() => navigate(action.href)}
        >
          <CardContent className="p-5">
            <div className="flex items-start gap-4">
              <div className={`p-3 rounded-xl ${action.color}`}>
                <Icon icon={action.icon} className="h-6 w-6" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-gray-900 group-hover:text-sunrise-coral transition-colors">
                  {action.title}
                </h3>
                <p className="text-sm text-gray-500 mt-0.5 line-clamp-2">
                  {action.description}
                </p>
              </div>
              <Icon
                icon="solar:arrow-right-linear"
                className="h-5 w-5 text-gray-300 group-hover:text-sunrise-coral group-hover:translate-x-1 transition-all"
              />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
