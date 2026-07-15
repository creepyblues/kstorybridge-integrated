import { useTranslation } from 'react-i18next';
import { useLocation } from 'react-router-dom';
import { getDashboardUrl, getCreatorUrl } from '../../config/urls';
import { trackSigninCtaClicked } from '../../utils/analytics';

const SignInDropdown = () => {
  const { t } = useTranslation('common');
  const { pathname } = useLocation();

  const isCreatorsRoute = pathname.startsWith('/creators');
  const isProducersRoute = pathname.startsWith('/producers');

  if (!isCreatorsRoute && !isProducersRoute) return null;

  const signinUrl = isCreatorsRoute
    ? `${getCreatorUrl()}/signin`
    : `${getDashboardUrl()}/signin`;
  const accountType = isCreatorsRoute ? 'creator' : 'buyer';

  return (
    <a
      href={signinUrl}
      onClick={() => {
        const ctaPosition = window.matchMedia('(min-width: 768px)').matches
          ? 'header_desktop'
          : 'header_mobile';
        trackSigninCtaClicked(accountType, ctaPosition);
      }}
      className="font-medium text-midnight-ink hover:text-hanok-teal transition-colors"
    >
      {t('nav.signin').toUpperCase()}
    </a>
  );
};

export default SignInDropdown;
