/**
 * AdminColumnHint Component
 * Shows the database column name in gray text for admin users only.
 * Format: {column_name}
 */

import { useAdminAuth } from '@/hooks/useAdminAuth'

interface AdminColumnHintProps {
  column: string
  className?: string
}

export function AdminColumnHint({ column, className = '' }: AdminColumnHintProps) {
  const { isAdmin } = useAdminAuth()

  if (!isAdmin) {
    return null
  }

  return (
    <span className={`text-gray-400 text-xs font-normal ml-1 ${className}`}>
      {'{'}
      {column}
      {'}'}
    </span>
  )
}

/**
 * Wrapper component for Label with admin column hint
 * Usage: <LabelWithColumn label="Title Name" column="title_name_kr" required />
 */
interface LabelWithColumnProps {
  label: string
  column: string
  required?: boolean
  htmlFor?: string
  className?: string
}

export function LabelWithColumn({
  label,
  column,
  required = false,
  htmlFor,
  className = ''
}: LabelWithColumnProps) {
  const { isAdmin } = useAdminAuth()

  return (
    <label
      htmlFor={htmlFor}
      className={`text-sm font-semibold text-black flex items-center gap-1 flex-wrap ${className}`}
    >
      {label}
      {required && <span className="text-sunrise-coral">*</span>}
      {isAdmin && (
        <span className="text-gray-400 text-xs font-normal">
          {'{'}
          {column}
          {'}'}
        </span>
      )}
    </label>
  )
}
