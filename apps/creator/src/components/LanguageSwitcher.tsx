import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'

interface LanguageSwitcherProps {
  size?: 'xs' | 'sm'
}

export function LanguageSwitcher({ size = 'sm' }: LanguageSwitcherProps) {
  const { i18n } = useTranslation()

  const isEnglish = i18n.language === 'en' || i18n.language.startsWith('en-')

  const setLanguage = (lang: 'en' | 'ko') => {
    i18n.changeLanguage(lang)
  }

  return (
    <div
      className={cn(
        'inline-flex items-center rounded-full bg-gray-100 p-0.5',
        size === 'xs' ? 'text-xs' : 'text-sm'
      )}
    >
      <button
        onClick={() => setLanguage('en')}
        className={cn(
          'rounded-full font-medium transition-all duration-200',
          size === 'xs' ? 'px-2.5 py-1' : 'px-3 py-1.5',
          isEnglish
            ? 'bg-white text-gray-900 shadow-sm'
            : 'text-gray-500 hover:text-gray-700'
        )}
      >
        EN
      </button>
      <button
        onClick={() => setLanguage('ko')}
        className={cn(
          'rounded-full font-medium transition-all duration-200',
          size === 'xs' ? 'px-2.5 py-1' : 'px-3 py-1.5',
          !isEnglish
            ? 'bg-white text-gray-900 shadow-sm'
            : 'text-gray-500 hover:text-gray-700'
        )}
      >
        한
      </button>
    </div>
  )
}
