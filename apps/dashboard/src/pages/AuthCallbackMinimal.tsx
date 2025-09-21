import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

/**
 * Minimal OAuth Callback Handler - Ultimate Simplicity
 *
 * This strips away all complex logic to identify the root cause.
 * Just gets the URL params and redirects immediately.
 */
const AuthCallbackMinimal = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const handleCallback = () => {
      console.log('🔥 MINIMAL CALLBACK: Starting');
      console.log('🔥 URL:', window.location.href);

      const urlParams = new URLSearchParams(window.location.search);
      const accountType = urlParams.get('account_type');
      const flow = urlParams.get('flow');
      const code = urlParams.get('code');

      console.log('🔥 Params:', { accountType, flow, code: code ? 'present' : 'missing' });

      // Skip all OAuth processing - just redirect based on URL params
      if (flow === 'signup' && accountType) {
        const signupUrl = `/signup/${accountType}?complete=true`;
        console.log('🔥 Redirecting to:', signupUrl);
        navigate(signupUrl);
      } else if (accountType) {
        const dashboardUrl = `/${accountType}s/home`;
        console.log('🔥 Redirecting to:', dashboardUrl);
        navigate(dashboardUrl);
      } else {
        console.log('🔥 No account type, redirecting to signin');
        navigate('/signin');
      }
    };

    // Small delay to ensure React is ready
    setTimeout(handleCallback, 100);
  }, [navigate]);

  return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <h2 className="text-lg font-medium text-gray-900">
          Processing Authentication...
        </h2>
        <p className="text-gray-600 mt-2">
          Redirecting you now...
        </p>
      </div>
    </div>
  );
};

export default AuthCallbackMinimal;