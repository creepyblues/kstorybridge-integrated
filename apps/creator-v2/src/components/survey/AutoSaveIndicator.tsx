import React, { useEffect, useState, useCallback, useRef } from 'react'
import { Cloud, CloudOff, Loader2, Check } from 'lucide-react'

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error'

interface AutoSaveIndicatorProps {
  status: SaveStatus
  lastSavedAt?: string | null
  error?: string | null
}

/**
 * AutoSaveIndicator Component
 *
 * Displays auto-save status and last saved timestamp
 * Shows visual feedback during save operations
 *
 * @param status - Current save status (idle, saving, saved, error)
 * @param lastSavedAt - ISO timestamp of last successful save
 * @param error - Error message if save failed
 */
export const AutoSaveIndicator: React.FC<AutoSaveIndicatorProps> = ({
  status,
  lastSavedAt,
  error,
}) => {
  const [timeAgo, setTimeAgo] = useState<string>('')

  useEffect(() => {
    if (!lastSavedAt) {
      setTimeAgo('')
      return
    }

    const updateTimeAgo = () => {
      const now = new Date()
      const saved = new Date(lastSavedAt)
      const diffMs = now.getTime() - saved.getTime()
      const diffSeconds = Math.floor(diffMs / 1000)
      const diffMinutes = Math.floor(diffSeconds / 60)
      const diffHours = Math.floor(diffMinutes / 60)

      if (diffSeconds < 10) {
        setTimeAgo('just now')
      } else if (diffSeconds < 60) {
        setTimeAgo(`${diffSeconds} seconds ago`)
      } else if (diffMinutes < 60) {
        setTimeAgo(`${diffMinutes} ${diffMinutes === 1 ? 'minute' : 'minutes'} ago`)
      } else {
        setTimeAgo(`${diffHours} ${diffHours === 1 ? 'hour' : 'hours'} ago`)
      }
    }

    updateTimeAgo()
    const interval = setInterval(updateTimeAgo, 10000) // Update every 10 seconds

    return () => clearInterval(interval)
  }, [lastSavedAt])

  const renderIcon = () => {
    switch (status) {
      case 'saving':
        return <Loader2 className="w-4 h-4 animate-spin text-gray-500" />
      case 'saved':
        return <Check className="w-4 h-4 text-green-600" />
      case 'error':
        return <CloudOff className="w-4 h-4 text-red-600" />
      case 'idle':
      default:
        return <Cloud className="w-4 h-4 text-gray-400" />
    }
  }

  const renderText = () => {
    switch (status) {
      case 'saving':
        return <span className="text-gray-600">Saving draft...</span>
      case 'saved':
        return (
          <span className="text-green-600">
            Draft saved {timeAgo && `• ${timeAgo}`}
          </span>
        )
      case 'error':
        return (
          <span className="text-red-600" title={error || 'Failed to save draft'}>
            Save failed {error && `• ${error}`}
          </span>
        )
      case 'idle':
      default:
        return timeAgo ? (
          <span className="text-gray-500">Last saved {timeAgo}</span>
        ) : (
          <span className="text-gray-400">No draft saved yet</span>
        )
    }
  }

  return (
    <div
      className="flex items-center gap-2 text-sm transition-all duration-200"
      role="status"
      aria-live="polite"
    >
      {renderIcon()}
      {renderText()}
    </div>
  )
}

/**
 * Hook to manage auto-save functionality
 *
 * Usage:
 * ```tsx
 * const { saveStatus, lastSavedAt, triggerSave } = useAutoSave({
 *   onSave: async (data) => {
 *     await draftService.saveDraft(userId, data, currentStep)
 *   },
 *   debounceMs: 30000, // 30 seconds
 * })
 * ```
 */
interface UseAutoSaveOptions {
  onSave: (data: any) => Promise<void>
  debounceMs?: number
  enabled?: boolean
}

export const useAutoSave = ({
  onSave,
  debounceMs = 30000,
  enabled = true,
}: UseAutoSaveOptions) => {
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle')
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const triggerSave = useCallback(async (data: any, immediate = false) => {
    if (!enabled) return

    // Clear existing timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current)
      saveTimeoutRef.current = null
    }

    const executeSave = async () => {
      setSaveStatus('saving')
      setError(null)

      try {
        await onSave(data)
        setSaveStatus('saved')
        setLastSavedAt(new Date().toISOString())

        // Reset to idle after 3 seconds
        setTimeout(() => {
          setSaveStatus('idle')
        }, 3000)
      } catch (err) {
        setSaveStatus('error')
        setError(err instanceof Error ? err.message : 'Unknown error')
        console.error('Auto-save error:', err)
      }
    }

    if (immediate) {
      await executeSave()
    } else {
      // Debounce the save
      const timeout = setTimeout(executeSave, debounceMs)
      saveTimeoutRef.current = timeout
    }
  }, [enabled, onSave, debounceMs])

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
      }
    }
  }, [])

  return {
    saveStatus,
    lastSavedAt,
    error,
    triggerSave,
  }
}
