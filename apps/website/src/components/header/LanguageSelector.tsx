
import { useTranslation } from 'react-i18next';
import { trackLanguageChange } from '@/utils/analytics';

interface LanguageSelectorProps {
  isMobile?: boolean;
}

const LanguageSelector = ({ isMobile = false }: LanguageSelectorProps) => {
  const { i18n } = useTranslation();

  const changeLanguage = (newLang: string) => {
    if (i18n.language === newLang) return; // Don't change if already selected

    const oldLang = i18n.language === 'en' ? 'EN' : 'KR';
    const newLangDisplay = newLang === 'en' ? 'EN' : 'KR';
    i18n.changeLanguage(newLang);
    trackLanguageChange(oldLang, newLangDisplay);
  };

  return (
    <div className="flex items-center gap-1 p-1 bg-gray-100 rounded-full border border-gray-200">
      <button
        id={isMobile ? "mobile-language-en-btn" : "header-language-en-btn"}
        onClick={() => changeLanguage('en')}
        className={`px-3 py-1.5 text-xs font-medium rounded-full transition-all ${
          i18n.language === 'en'
            ? 'bg-hanok-teal text-white shadow-sm'
            : 'text-gray-600 hover:text-gray-900'
        }`}
      >
        EN
      </button>
      <button
        id={isMobile ? "mobile-language-ko-btn" : "header-language-ko-btn"}
        onClick={() => changeLanguage('ko')}
        className={`px-3 py-1.5 text-xs font-medium rounded-full transition-all ${
          i18n.language === 'ko'
            ? 'bg-hanok-teal text-white shadow-sm'
            : 'text-gray-600 hover:text-gray-900'
        }`}
      >
        한
      </button>
    </div>
  );
};

export default LanguageSelector;
