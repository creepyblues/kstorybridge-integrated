import { ReactNode } from 'react'
import { Icon } from '@iconify/react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface TitlesSectionCardProps {
  icon: string
  iconBgColor: string
  iconColor: string
  title: string
  count: number
  children: ReactNode
  className?: string
}

export function TitlesSectionCard({
  icon,
  iconBgColor,
  iconColor,
  title,
  count,
  children,
  className = '',
}: TitlesSectionCardProps) {
  return (
    <Card className={`bg-white border-gray-200 shadow-none rounded-2xl ${className}`}>
      <CardHeader className="pb-4">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-xl ${iconBgColor}`}>
            <Icon icon={icon} className={`h-5 w-5 ${iconColor}`} />
          </div>
          <CardTitle className="text-lg font-semibold">{title}</CardTitle>
          <span className="text-sm text-gray-500">({count})</span>
        </div>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  )
}
