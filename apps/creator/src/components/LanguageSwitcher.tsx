import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Globe } from 'lucide-react';

export function LanguageSwitcher() {
  const { i18n } = useTranslation();

  const toggleLanguage = () => {
    const newLang = i18n.language === 'en' ? 'ko' : 'en';
    i18n.changeLanguage(newLang);
  };

  const currentLanguage = i18n.language === 'ko' ? '한국어' : 'English';

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={toggleLanguage}
      className="border-gray-300 hover:bg-gray-100"
    >
      <Globe className="h-4 w-4 mr-2" />
      {currentLanguage}
    </Button>
  );
}
