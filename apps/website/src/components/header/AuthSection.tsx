
import { Link } from 'react-router-dom';
import { Button } from '../ui/button';
import { useLanguage } from '../../contexts/LanguageContext';
import { User } from '@supabase/supabase-js';

interface AuthSectionProps {
  user: User | null;
  userProfile: any;
  onSignOut: () => void;
  isMobile?: boolean;
}

const AuthSection = ({ user, userProfile, onSignOut, isMobile = false }: AuthSectionProps) => {
  const { t } = useLanguage();

  const formatAccountType = (accountType: string) => {
    if (accountType === 'ip_owner') return 'Creator';
    if (accountType === 'buyer') return 'Buyer';
    return accountType?.replace('_', ' ') || '';
  };

  if (user) {
    const containerClasses = isMobile ? "flex flex-col space-y-2" : "flex items-center space-x-4";
    
    return (
      <div className={containerClasses}>
        <span className="font-bold text-gray-900">
          {user.user_metadata?.full_name || user.email}
          {userProfile?.account_type && (
            <span className="ml-2 text-sm font-normal text-gray-600">
              ({formatAccountType(userProfile.account_type)})
            </span>
          )}
        </span>
        <Button 
          onClick={onSignOut} 
          variant="outline" 
          size="sm"
          className={isMobile ? "w-full" : ""}
        >
          Sign Out
        </Button>
      </div>
    );
  }

  const containerClasses = isMobile ? "flex flex-col space-y-2" : "flex space-x-2";
  const buttonClasses = isMobile ? "w-full" : "";

  return (
    <div className={containerClasses}>
      <Button 
        asChild 
        variant="outline" 
        className={`border-primary text-primary hover:bg-primary hover:text-white ${buttonClasses}`}
      >
        <Link to="/signin">
          Sign In
        </Link>
      </Button>
      <Button 
        asChild 
        className={`bg-primary hover:bg-primary/90 text-white ${buttonClasses}`}
      >
        <Link to="/signup">
          Get Started
        </Link>
      </Button>
    </div>
  );
};

export default AuthSection;
