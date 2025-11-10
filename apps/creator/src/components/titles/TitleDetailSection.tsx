import React, { useState } from 'react'
import { ChevronDown, ChevronRight } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'

interface TitleDetailSectionProps {
  stepNumber: number
  title: string
  icon: React.ReactNode
  children: React.ReactNode
  defaultExpanded?: boolean
  isEmpty?: boolean
}

/**
 * TitleDetailSection Component
 *
 * Reusable collapsible section for title detail page
 * Organized by survey steps 1-5
 */
export const TitleDetailSection: React.FC<TitleDetailSectionProps> = ({
  stepNumber,
  title,
  icon,
  children,
  defaultExpanded = false,
  isEmpty = false,
}) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded)

  // Don't render empty sections
  if (isEmpty) {
    return null
  }

  return (
    <div className="mb-6">
      <Card className="bg-transparent border-gray-300 shadow-none rounded-2xl overflow-hidden">
        {/* Section Header - Clickable */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-black text-white text-sm font-semibold">
              {stepNumber}
            </div>
            <div className="flex items-center gap-2">
              <div className="text-gray-700">{icon}</div>
              <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
            </div>
          </div>
          <div className="text-gray-500">
            {isExpanded ? (
              <ChevronDown className="w-5 h-5" />
            ) : (
              <ChevronRight className="w-5 h-5" />
            )}
          </div>
        </button>

        {/* Section Content - Collapsible */}
        {isExpanded && (
          <>
            {/* Horizontal divider */}
            <div className="border-t border-gray-300" />
            <CardContent className="p-6">
              {children}
            </CardContent>
          </>
        )}
      </Card>
    </div>
  )
}

/**
 * Field Display Component
 * Renders a label-value pair for title details
 */
interface FieldDisplayProps {
  label: string
  value: React.ReactNode
  isEmpty?: boolean
  fullWidth?: boolean
}

export const FieldDisplay: React.FC<FieldDisplayProps> = ({
  label,
  value,
  isEmpty = false,
  fullWidth = false,
}) => {
  // Don't render empty fields
  if (isEmpty || value === null || value === undefined || value === '') {
    return null
  }

  return (
    <div className={fullWidth ? 'col-span-2' : ''}>
      <dt className="text-sm font-medium text-gray-500 mb-1">{label}</dt>
      <dd className="text-sm text-gray-900">{value}</dd>
    </div>
  )
}
