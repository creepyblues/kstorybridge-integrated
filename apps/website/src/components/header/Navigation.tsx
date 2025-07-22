
import { Link, useLocation } from 'react-router-dom';
import { useLanguage } from '../../contexts/LanguageContext';

interface NavigationProps {
  isLoggedIn: boolean;
  isMobile?: boolean;
  onLinkClick?: () => void;
}

const Navigation = ({ isLoggedIn, isMobile = false, onLinkClick }: NavigationProps) => {
  const { t } = useLanguage();
  const location = useLocation();

  const navItems = [
    { name: t('nav.creators'), path: '/creators' },
    { name: t('nav.buyers'), path: '/buyers' },
    { name: 'About', path: '/about' },
  ];

  const isActive = (path: string) => location.pathname === path;

  // Don't show navigation items if user is logged in
  if (isLoggedIn) {
    return null;
  }

  const baseClasses = "text-sm font-medium transition-colors hover:text-primary";
  const containerClasses = isMobile ? "flex flex-col space-y-4" : "flex items-center space-x-8";

  return (
    <nav className={containerClasses}>
      {navItems.map((item) => (
        <Link
          key={item.name}
          to={item.path}
          className={`${baseClasses} ${
            isActive(item.path) ? 'text-primary' : 'text-gray-700'
          }`}
          onClick={onLinkClick}
        >
          {item.name}
        </Link>
      ))}
    </nav>
  );
};

export default Navigation;
