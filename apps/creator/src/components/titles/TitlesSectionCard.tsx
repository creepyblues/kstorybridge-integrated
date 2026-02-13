import { ReactNode } from 'react'

interface TitlesSectionCardProps {
  borderColor: string
  bgTint: string
  title: string
  count: number
  children: ReactNode
  className?: string
}

export function TitlesSectionCard({
  borderColor,
  bgTint,
  title,
  count,
  children,
  className = '',
}: TitlesSectionCardProps) {
  return (
    <div className={`${bgTint} border border-gray-200 rounded-2xl p-5 sm:p-6 ${className}`}>
      <div className="mb-5">
        <div className="flex items-center gap-3">
          <h2 className={`border-l-4 ${borderColor} pl-3 text-xl font-semibold text-black`}>{title}</h2>
          <span className="text-sm text-gray-500">({count})</span>
        </div>
      </div>
      <div>{children}</div>
    </div>
  )
}
