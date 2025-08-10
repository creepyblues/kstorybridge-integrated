
import { Button } from '../ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import { Globe } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import { trackLanguageChange } from '@/utils/analytics';

interface LanguageSelectorProps {
  isMobile?: boolean;
}

const LanguageSelector = ({ isMobile = false }: LanguageSelectorProps) => {
  const { language, setLanguage } = useLanguage();

  const handleLanguageChange = (newLanguage: 'EN' | 'KR') => {
    const oldLanguage = language;
    setLanguage(newLanguage);
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
          className={language === 'EN' ? 'bg-hanok-teal text-white border-hanok-teal hover:bg-hanok-teal/90' : ''}
        >
          EN
        </Button>
        <Button 
          id="mobile-language-kr-btn"
          variant={language === 'KR' ? 'outline' : 'ghost'} 
          size="sm"
          onClick={() => handleLanguageChange('KR')}
          className={language === 'KR' ? 'bg-hanok-teal text-white border-hanok-teal hover:bg-hanok-teal/90' : ''}
        >
          KR
        </Button>
      </div>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button id="header-language-selector-btn" variant="outline" size="sm" className="flex items-center space-x-1 border-gray-300 text-gray-700 hover:bg-gray-50">
          <Globe className="w-4 h-4" />
          <span>{language}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="bg-white border border-gray-200 shadow-lg">
        <DropdownMenuItem onClick={() => handleLanguageChange('EN')}>
          English
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleLanguageChange('KR')}>
          한국어
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default LanguageSelector;
