
import { Button } from '@kstorybridge/ui';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@kstorybridge/ui';
import { Globe } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { trackLanguageChange } from '@/utils/analytics';

interface LanguageSelectorProps {
  isMobile?: boolean;
}

const LanguageSelector = ({ isMobile = false }: LanguageSelectorProps) => {
  const { i18n } = useTranslation();
  const language = i18n.language === 'ko' ? 'KR' : i18n.language.toUpperCase(); // 'ko' -> 'KR', 'en' -> 'EN'

  const handleLanguageChange = (newLanguage: 'EN' | 'KR') => {
    const oldLanguage = language;
    const langCode = newLanguage === 'KR' ? 'ko' : 'en'; // 'KR' -> 'ko', 'EN' -> 'en'
    i18n.changeLanguage(langCode);
    trackLanguageChange(oldLanguage, newLanguage);
  };

  if (isMobile) {
    return (
      <div className="flex space-x-2">
        <Button
          id="mobile-language-en-btn"
          variant={language === 'EN' ? 'outline' : 'ghost'}
          size="sm"
          onClick={() => handleLanguageChange('EN')}
          className={language === 'EN' ? 'bg-gray-900 text-white border-gray-900 hover:bg-gray-800' : 'text-gray-700 hover:bg-gray-100'}
        >
          EN
        </Button>
        <Button
          id="mobile-language-kr-btn"
          variant={language === 'KR' ? 'outline' : 'ghost'}
          size="sm"
          onClick={() => handleLanguageChange('KR')}
          className={language === 'KR' ? 'bg-gray-900 text-white border-gray-900 hover:bg-gray-800' : 'text-gray-700 hover:bg-gray-100'}
        >
          KR
        </Button>
      </div>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button id="header-language-selector-btn" variant="outline" size="sm" className="flex items-center space-x-1 bg-gray-900 border-gray-900 text-white hover:bg-gray-800">
          <Globe className="w-4 h-4" />
          <span>{language}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="bg-white border border-gray-200 shadow-lg">
        <DropdownMenuItem
          onClick={() => handleLanguageChange('EN')}
          className={language === 'EN' ? 'bg-gray-100 text-gray-900 focus:bg-gray-100 focus:text-gray-900' : 'text-gray-900 hover:bg-gray-50 focus:bg-gray-50 focus:text-gray-900'}
        >
          <span className="text-gray-900">English</span>
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => handleLanguageChange('KR')}
          className={language === 'KR' ? 'bg-gray-100 text-gray-900 focus:bg-gray-100 focus:text-gray-900' : 'text-gray-900 hover:bg-gray-50 focus:bg-gray-50 focus:text-gray-900'}
        >
          <span className="text-gray-900">한국어</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default LanguageSelector;
