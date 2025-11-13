import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Globe } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LanguageSwitcherProps {
  size?: 'xs' | 'sm';
}

export function LanguageSwitcher({ size = 'sm' }: LanguageSwitcherProps) {
  const { i18n } = useTranslation();

  const toggleLanguage = () => {
    const newLang = i18n.language === 'en' ? 'ko' : 'en';
    i18n.changeLanguage(newLang);
  };

  const currentLanguage = i18n.language === 'ko' ? '한국어' : 'English';

  return (
    <Button
      variant="outline"
      size={size === 'xs' ? 'sm' : 'sm'}
      onClick={toggleLanguage}
      className={cn(
        'border-gray-300 hover:bg-gray-100',
        size === 'xs' && 'h-7 px-2 text-xs'
      )}
    >
      <Globe className={cn(size === 'xs' ? 'h-3 w-3 mr-1.5' : 'h-4 w-4 mr-2')} />
      {currentLanguage}
    </Button>
  );
}
