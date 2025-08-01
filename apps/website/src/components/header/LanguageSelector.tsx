
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
          variant={language === 'EN' ? 'default' : 'outline'} 
          size="sm"
          onClick={() => handleLanguageChange('EN')}
        >
          EN
        </Button>
        <Button 
          variant={language === 'KR' ? 'default' : 'outline'} 
          size="sm"
          onClick={() => handleLanguageChange('KR')}
        >
          KR
        </Button>
      </div>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="flex items-center space-x-1">
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
