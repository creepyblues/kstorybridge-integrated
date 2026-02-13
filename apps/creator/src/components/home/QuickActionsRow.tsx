import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Icon } from '@iconify/react'

interface QuickAction {
  title: string
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
      icon: 'solar:add-circle-bold-duotone',
      href: '/titles/quick-add',
      color: 'bg-sunrise-coral/10 text-sunrise-coral hover:bg-sunrise-coral/20',
    },
    {
      title: t('common:home.quickActions.viewTitles'),
      icon: 'solar:book-2-bold-duotone',
      href: '/titles',
      color: 'bg-blue-500/10 text-blue-600 hover:bg-blue-500/20',
    },
    {
      title: t('common:home.quickActions.learnMore'),
      icon: 'solar:square-academic-cap-bold-duotone',
      href: '/learning-center',
      color: 'bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20',
    },
  ]

  return (
    <div className="flex flex-wrap gap-2">
      {quickActions.map((action) => (
        <button
          key={action.href}
          onClick={() => navigate(action.href)}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-colors ${action.color}`}
        >
          <Icon icon={action.icon} className="h-4 w-4" />
          {action.title}
        </button>
      ))}
    </div>
  )
}
