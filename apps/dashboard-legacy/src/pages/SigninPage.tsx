import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

const SigninPage = () => {
  const navigate = useNavigate();

  // Redirect to account type selection for all general signin requests
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const verified = urlParams.get('verified') === 'true';

    if (verified) {
      (async () => {
        try {
          console.log('✅ SIGNIN: Email verification detected, determining account type');
          const { data: { session } } = await supabase.auth.getSession();

          const suffix = '?verified=true';

          // Always route to buyer signin after email verification
          navigate(`/signin/buyer${suffix}`, { replace: true });
        } catch (error) {
          console.error('❌ SIGNIN: Failed to route after verification, defaulting to buyer signin', error);
          navigate('/signin/buyer?verified=true', { replace: true });
        } finally {
          await supabase.auth.signOut().catch(() => {});
        }
      })();
      return;
    }

    // Preserve any existing query parameters and add source=signin
    const searchParams = window.location.search;
    const separator = searchParams ? '&' : '?';
    const newUrl = `/account-type-selection${searchParams}${separator}source=signin`;

    console.log('🔄 SIGNIN: General signin access, redirecting to account type selection');
    navigate(newUrl);
  }, [navigate]);

  // Return loading state while redirecting
  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-porcelain-blue-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-hanok-teal mx-auto mb-4"></div>
        <h2 className="text-xl font-semibold text-midnight-ink mb-2">
          Redirecting...
        </h2>
        <p className="text-midnight-ink-600">
          Please wait while we direct you to the sign in page.
        </p>
      </div>
    </div>
  );
};

export default SigninPage;
