import { useTranslation } from 'react-i18next'
import { Icon } from '@iconify/react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

interface LearningFiltersProps {
  searchQuery: string
  onSearchChange: (query: string) => void
  selectedCategory: string
  onCategoryChange: (category: string) => void
}

const categories = [
  { id: 'all', labelKey: 'all' },
  { id: 'getting-started', labelKey: 'gettingStarted' },
  { id: 'best-practices', labelKey: 'bestPractices' },
  { id: 'advanced', labelKey: 'advanced' },
]

export function LearningFilters({
  searchQuery,
  onSearchChange,
  selectedCategory,
  onCategoryChange,
}: LearningFiltersProps) {
  const { t } = useTranslation(['content'])

  return (
    <div className="mb-8 space-y-4">
      {/* Search Bar */}
      <div className="relative">
        <Icon
          icon="solar:magnifer-linear"
          className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400"
        />
        <Input
          type="text"
          placeholder={t('content:learningCenter.searchPlaceholder', {
            defaultValue: 'Search tutorials and guides...',
          })}
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-12 h-12 rounded-xl border-gray-200 focus:border-sunrise-coral/50 focus:ring-sunrise-coral/20"
        />
      </div>

      {/* Category Filters */}
      <div className="flex flex-wrap gap-2">
        {categories.map((category) => (
          <Button
            key={category.id}
            variant="ghost"
            onClick={() => onCategoryChange(category.id)}
            className={`rounded-full px-4 py-2 text-sm font-medium transition-all ${
              selectedCategory === category.id
                ? 'bg-sunrise-coral text-white hover:bg-sunrise-coral/90'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {t(`content:learningCenter.categories.${category.labelKey}`, {
              defaultValue:
                category.id === 'all'
                  ? 'All'
                  : category.id === 'getting-started'
                    ? 'Getting Started'
                    : category.id === 'best-practices'
                      ? 'Best Practices'
                      : 'Advanced',
            })}
          </Button>
        ))}
      </div>
    </div>
  )
}
