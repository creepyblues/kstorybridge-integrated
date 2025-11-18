
import { Button } from '@kstorybridge/ui';
import { Globe } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { trackLanguageChange } from '@/utils/analytics';

interface LanguageSelectorProps {
  isMobile?: boolean;
}

const LanguageSelector = ({ isMobile = false }: LanguageSelectorProps) => {
  const { i18n } = useTranslation();

  const toggleLanguage = () => {
    const newLang = i18n.language === 'en' ? 'ko' : 'en';
    const oldLang = i18n.language === 'en' ? 'EN' : 'KR';
    const newLangDisplay = newLang === 'en' ? 'EN' : 'KR';
    i18n.changeLanguage(newLang);
    trackLanguageChange(oldLang, newLangDisplay);
  };

  const currentLanguage = i18n.language === 'ko' ? '한국어' : 'English';

  if (isMobile) {
    return (
      <Button
        id="mobile-language-toggle-btn"
        variant="outline"
        size="sm"
        onClick={toggleLanguage}
        className="border-gray-300 hover:bg-gray-100"
      >
        <Globe className="w-4 h-4 mr-2" />
        {currentLanguage}
      </Button>
    );
  }

  return (
    <Button
      id="header-language-toggle-btn"
      variant="outline"
      size="sm"
      onClick={toggleLanguage}
      className="border-gray-300 hover:bg-gray-100"
    >
      <Globe className="w-4 h-4 mr-2" />
      {currentLanguage}
    </Button>
  );
};

export default LanguageSelector;
