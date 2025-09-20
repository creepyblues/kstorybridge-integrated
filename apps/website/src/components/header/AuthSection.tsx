
import { trackButtonClick } from '@/utils/analytics';
import { Button } from '@kstorybridge/ui';
import { User } from '@supabase/supabase-js';
import { getDashboardUrl } from '../../config/urls';
import { useLanguage } from '../../contexts/LanguageContext';

interface AuthSectionProps {
  user: User | null;
  userProfile: any;
  onSignOut: () => void;
  isMobile?: boolean;
}

const AuthSection = ({ user, userProfile, onSignOut, isMobile = false }: AuthSectionProps) => {
  const { t } = useLanguage();

  const formatAccountType = (accountType: string) => {
    if (accountType === 'creator') return 'Creator';
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
          id="header-signout-btn"
          onClick={() => {
            trackButtonClick('Sign Out', 'header');
            onSignOut();
          }}
          variant="outline"
          size="sm"
          className={`border-gray-300 text-gray-700 hover:bg-gray-50 ${isMobile ? "w-full" : ""}`}
        >
          Sign Out
        </Button>
      </div>
    );
  }

  const containerClasses = isMobile ? "flex flex-col space-y-2" : "flex space-x-2";
  const buttonClasses = isMobile ? "w-full" : "";

  const handleSignInClick = () => {
    trackButtonClick('Sign In', 'header');
    window.location.href = `${getDashboardUrl()}/signin`;
  };

  return (
    <div className={containerClasses}>
      <Button
        id="header-signin-btn"
        className={`border-2 border-hanok-teal text-hanok-teal bg-white hover:bg-hanok-teal hover:text-white transition-colors rounded-md px-4 py-2 font-medium ${buttonClasses}`}
        onClick={handleSignInClick}
      >
        Sign In
      </Button>
    </div>
  );
};

export default AuthSection;
