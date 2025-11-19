
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

  const currentLanguage = i18n.language === 'ko' ? '한글' : 'EN';

  if (isMobile) {
    return (
      <Button
        id="mobile-language-toggle-btn"
        size="sm"
        onClick={toggleLanguage}
        className="bg-gray-500 hover:bg-gray-600 text-white border-0 px-2 py-1"
      >
        <Globe className="w-4 h-4 mr-1" />
        {currentLanguage}
      </Button>
    );
  }

  return (
    <Button
      id="header-language-toggle-btn"
      size="sm"
      onClick={toggleLanguage}
      className="bg-gray-500 hover:bg-gray-600 text-white border-0 px-2 py-1"
    >
      <Globe className="w-4 h-4 mr-1" />
      {currentLanguage}
    </Button>
  );
};

export default LanguageSelector;
