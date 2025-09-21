import { useNavigate, useSearchParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { Button } from '@kstorybridge/ui';
import { supabase } from '@/integrations/supabase/client';

const SigninPageSimple = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [isRedirecting, setIsRedirecting] = useState(false);

  // Check if this is an email verification redirect
  useEffect(() => {
    const verified = searchParams.get('verified');
    const isEmailVerification = verified === 'true';

    if (isEmailVerification) {
      console.log('📧 EMAIL VERIFICATION: Detected email verification redirect');
      setIsRedirecting(true);
      redirectBasedOnAccountType();
    }
  }, [searchParams]);

  const redirectBasedOnAccountType = async () => {
    try {
      console.log('🔍 EMAIL VERIFICATION: Getting user session to determine account type');
      const { data: { session }, error } = await supabase.auth.getSession();

      if (error) {
        console.error('❌ EMAIL VERIFICATION: Session error:', error);
        setIsRedirecting(false);
        return;
      }

      if (!session?.user) {
        console.warn('⚠️ EMAIL VERIFICATION: No session found, showing account type selector');
        setIsRedirecting(false);
        return;
      }

      const user = session.user;
      const accountType = user.user_metadata?.account_type;

      console.log('👤 EMAIL VERIFICATION: User found:', {
        email: user.email,
        accountType,
        metadata: user.user_metadata
      });

      if (accountType === 'buyer') {
        console.log('✅ EMAIL VERIFICATION: Redirecting to buyer signin');
        navigate('/signin/buyer?verified=true');
      } else if (accountType === 'creator') {
        console.log('✅ EMAIL VERIFICATION: Redirecting to creator signin');
        navigate('/signin/creator?verified=true');
      } else {
        console.warn('⚠️ EMAIL VERIFICATION: Unknown account type, showing selector');
        setIsRedirecting(false);
      }
    } catch (error) {
      console.error('❌ EMAIL VERIFICATION: Error during redirect:', error);
      setIsRedirecting(false);
    }
  };

  const handleCreatorLogin = () => {
    navigate('/signin/creator');
  };

  const handleBuyerLogin = () => {
    navigate('/signin/buyer');
  };

  // Show loading state during email verification redirect
  if (isRedirecting) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-white to-porcelain-blue-50 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-hanok-teal mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-midnight-ink mb-2">
            Email Verified!
          </h2>
          <p className="text-midnight-ink-600">
            Redirecting you to the appropriate signin page...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-porcelain-blue-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-12">
          <h1 className="text-4xl lg:text-5xl font-bold text-midnight-ink mb-6">
            Welcome Back
          </h1>
        </div>

        <div className="space-y-6">
          {/* Creator Login Button */}
          <Button
            onClick={handleCreatorLogin}
            className="w-full h-16 text-lg font-medium text-white rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl"
            style={{ backgroundColor: '#FF6B6B', borderColor: '#FF6B6B' }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#FF5252';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#FF6B6B';
            }}
          >
            <div className="flex items-center justify-center">
              <div className="font-semibold">Creator Login</div>
            </div>
          </Button>

          {/* Buyer Login Button */}
          <Button
            onClick={handleBuyerLogin}
            className="w-full h-16 text-lg font-medium bg-hanok-teal hover:bg-hanok-teal/90 text-white rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl"
          >
            <div className="flex items-center justify-center">
              <div className="font-semibold">Buyer Login</div>
            </div>
          </Button>
        </div>

        {/* Footer */}
        <div className="mt-12 text-center">
          <p className="text-midnight-ink-600 mb-4">
            Don't have an account?
          </p>
          <div className="space-y-2">
            <Button
              variant="outline"
              onClick={() => navigate('/signup/creator')}
              className="w-full text-midnight-ink hover:bg-midnight-ink-50"
              style={{ borderColor: '#FF6B6B' }}
            >
              Sign up as Creator
            </Button>
            <Button
              variant="outline"
              onClick={() => navigate('/signup/buyer')}
              className="w-full text-midnight-ink hover:bg-midnight-ink-50"
              style={{ borderColor: '#4C9C9B' }}
            >
              Sign up as Buyer
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SigninPageSimple;