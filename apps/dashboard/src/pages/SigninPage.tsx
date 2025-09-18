import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const SigninPage = () => {
  const navigate = useNavigate();

  // Redirect to account type selection for all general signin requests
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);

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