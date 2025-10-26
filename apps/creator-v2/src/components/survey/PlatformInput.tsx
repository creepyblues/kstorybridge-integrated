import React from 'react'
import { X, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

export interface PlatformData {
  id: string // Temporary ID for form management
  platform_name: string
  platform_url: string
  views?: number
  subscribers?: number
  other_metrics?: Record<string, any>
}

interface PlatformInputProps {
  platforms: PlatformData[]
  onChange: (platforms: PlatformData[]) => void
  error?: string
}

const PLATFORM_OPTIONS = [
  { value: 'naver', label: 'Naver Webtoon' },
  { value: 'kakao', label: 'Kakao Page' },
  { value: 'lezhin', label: 'Lezhin Comics' },
  { value: 'ridibooks', label: 'Ridibooks' },
  { value: 'toomics', label: 'Toomics' },
  { value: 'bomtoon', label: 'Bomtoon' },
  { value: 'ktoon', label: 'KToon' },
  { value: 'kakaopage', label: 'Kakao Page' },
  { value: 'munpia', label: 'Munpia' },
  { value: 'joara', label: 'Joara' },
  { value: 'novelpia', label: 'Novelpia' },
  { value: 'other', label: 'Other Platform' },
]

/**
 * PlatformInput Component
 *
 * Dynamic form for managing multiple platform entries
 * Allows adding/removing platforms with URL and metrics
 *
 * @param platforms - Current list of platforms
 * @param onChange - Callback when platforms list changes
 * @param error - Validation error message
 */
export const PlatformInput: React.FC<PlatformInputProps> = ({
  platforms,
  onChange,
  error,
}) => {
  const addPlatform = () => {
    const newPlatform: PlatformData = {
      id: `temp-${Date.now()}`,
      platform_name: '',
      platform_url: '',
      views: 0,
      subscribers: 0,
    }
    onChange([...platforms, newPlatform])
  }

  const removePlatform = (id: string) => {
    onChange(platforms.filter((p) => p.id !== id))
  }

  const updatePlatform = (id: string, field: keyof PlatformData, value: any) => {
    onChange(
      platforms.map((p) =>
        p.id === id
          ? { ...p, [field]: value }
          : p
      )
    )
  }

  const formatNumber = (value: string): number => {
    const num = parseInt(value.replace(/,/g, ''), 10)
    return isNaN(num) ? 0 : num
  }

  const displayNumber = (value?: number): string => {
    return value ? value.toLocaleString() : '0'
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label className="text-base font-medium">
          Publishing Platforms {platforms.length > 0 && `(${platforms.length})`}
        </Label>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={addPlatform}
          className="border-gray-300"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Platform
        </Button>
      </div>

      {platforms.length === 0 ? (
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
          <p className="text-sm text-gray-500 mb-4">
            No platforms added yet. Add where your title is published.
          </p>
          <Button
            type="button"
            variant="outline"
            onClick={addPlatform}
            className="border-gray-300"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add First Platform
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {platforms.map((platform, index) => (
            <div
              key={platform.id}
              className="border border-gray-300 rounded-lg p-4 space-y-4 bg-gray-50"
            >
              <div className="flex items-start justify-between">
                <span className="text-sm font-medium text-gray-700">
                  Platform {index + 1}
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removePlatform(platform.id)}
                  className="h-6 w-6 p-0 hover:bg-gray-200"
                >
                  <X className="w-4 h-4" />
                  <span className="sr-only">Remove platform</span>
                </Button>
              </div>

              {/* Platform Name Selection */}
              <div className="space-y-2">
                <Label htmlFor={`platform-name-${platform.id}`}>
                  Platform Name <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={platform.platform_name}
                  onValueChange={(value) =>
                    updatePlatform(platform.id, 'platform_name', value)
                  }
                >
                  <SelectTrigger
                    id={`platform-name-${platform.id}`}
                    className="bg-white border-gray-300"
                  >
                    <SelectValue placeholder="Select platform" />
                  </SelectTrigger>
                  <SelectContent>
                    {PLATFORM_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Platform URL */}
              <div className="space-y-2">
                <Label htmlFor={`platform-url-${platform.id}`}>
                  Platform URL <span className="text-red-500">*</span>
                </Label>
                <Input
                  id={`platform-url-${platform.id}`}
                  type="url"
                  placeholder="https://..."
                  value={platform.platform_url}
                  onChange={(e) =>
                    updatePlatform(platform.id, 'platform_url', e.target.value)
                  }
                  className="bg-white border-gray-300"
                />
              </div>

              {/* Metrics Row */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor={`platform-views-${platform.id}`}>
                    Total Views
                  </Label>
                  <Input
                    id={`platform-views-${platform.id}`}
                    type="text"
                    placeholder="0"
                    value={displayNumber(platform.views)}
                    onChange={(e) =>
                      updatePlatform(
                        platform.id,
                        'views',
                        formatNumber(e.target.value)
                      )
                    }
                    className="bg-white border-gray-300"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor={`platform-subscribers-${platform.id}`}>
                    Subscribers
                  </Label>
                  <Input
                    id={`platform-subscribers-${platform.id}`}
                    type="text"
                    placeholder="0"
                    value={displayNumber(platform.subscribers)}
                    onChange={(e) =>
                      updatePlatform(
                        platform.id,
                        'subscribers',
                        formatNumber(e.target.value)
                      )
                    }
                    className="bg-white border-gray-300"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {error && <p className="text-sm text-red-600">{error}</p>}

      <p className="text-xs text-gray-500">
        Add all platforms where your title is currently published. Include URLs and metrics
        if available.
      </p>
    </div>
  )
}
