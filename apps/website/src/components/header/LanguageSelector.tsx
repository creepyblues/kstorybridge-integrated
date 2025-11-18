
import { Button } from '@kstorybridge/ui';
import { Globe } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { trackLanguageChange } from '@/utils/analytics';

interface LanguageSelectorProps {
  isMobile?: boolean;
}

const LanguageSelector = ({ isMobile = false }: LanguageSelectorProps) => {
  const { i18n } = useTranslation();
  const language = i18n.language === 'ko' ? 'KR' : i18n.language.toUpperCase(); // 'ko' -> 'KR', 'en' -> 'EN'

  const handleLanguageToggle = () => {
    const newLanguage = language === 'EN' ? 'KR' : 'EN';
    const oldLanguage = language;
    const langCode = newLanguage === 'KR' ? 'ko' : 'en';
    i18n.changeLanguage(langCode);
    trackLanguageChange(oldLanguage, newLanguage);
  };

  if (isMobile) {
    return (
      <Button
        id="mobile-language-toggle-btn"
        variant="outline"
        size="sm"
        onClick={handleLanguageToggle}
        className="bg-gray-900 text-white border-gray-900 hover:bg-gray-800"
      >
        <Globe className="w-4 h-4 mr-1" />
        {language}
      </Button>
    );
  }

  return (
    <Button
      id="header-language-toggle-btn"
      variant="outline"
      size="sm"
      onClick={handleLanguageToggle}
      className="flex items-center space-x-1 bg-gray-900 border-gray-900 text-white hover:bg-gray-800"
    >
      <Globe className="w-4 h-4" />
      <span>{language}</span>
    </Button>
  );
};

export default LanguageSelector;
