import { useNavigate, useSearchParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { Button } from '@kstorybridge/ui';
import { supabase } from '@/integrations/supabase/client';
import { sendWelcomeEmail } from '@/services/emailService';
import { X, Clock } from 'lucide-react';

const SigninPageSimple = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [showComingSoon, setShowComingSoon] = useState(false);

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

      // Send welcome email after email verification (for email signups only)
      if (accountType && user.email) {
        try {
          console.log('📧 EMAIL VERIFICATION: Sending welcome email after email verification');

          if (accountType === 'buyer') {
            // Get buyer profile data for welcome email
            const { data: buyerProfile } = await supabase
              .from('user_buyers')
              .select('full_name')
              .eq('id', user.id)
              .maybeSingle();

            if (buyerProfile?.full_name) {
              await sendWelcomeEmail({
                userName: buyerProfile.full_name,
                userEmail: user.email,
                accountType: 'buyer',
                dashboardUrl: `${window.location.origin}/buyers/chat`,
                loginUrl: `${window.location.origin}/signin`
              });
              console.log('✅ EMAIL VERIFICATION: Welcome email sent to verified buyer');
            }
          } else if (accountType === 'creator') {
            // Get creator profile data for welcome email
            const { data: creatorProfile } = await supabase
              .from('user_creators')
              .select('full_name')
              .eq('id', user.id)
              .maybeSingle();

            if (creatorProfile?.full_name) {
              await sendWelcomeEmail({
                userName: creatorProfile.full_name,
                userEmail: user.email,
                accountType: 'creator',
                dashboardUrl: `${window.location.origin}/creators/home`,
                loginUrl: `${window.location.origin}/signin`
              });
              console.log('✅ EMAIL VERIFICATION: Welcome email sent to verified creator');
            }
          }
        } catch (emailError) {
          console.error('⚠️ EMAIL VERIFICATION: Failed to send welcome email (non-blocking):', emailError);
          // Don't fail the verification flow for email issues
        }
      }

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
    setShowComingSoon(true);
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
          <h2 className="text-3xl lg:text-4xl font-bold text-midnight-ink mb-6">
            Welcome Back
          </h2>
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
              onClick={() => setShowComingSoon(true)}
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

      {/* Coming Soon Popup */}
      {showComingSoon && (
        <div
          className="fixed inset-0 bg-black bg-opacity-75 z-[9999] flex items-center justify-center"
          onClick={() => setShowComingSoon(false)}
          style={{
            animation: 'fadeIn 0.2s ease-out',
            backdropFilter: 'blur(4px)'
          }}
        >
          <div
            className="bg-gradient-to-b from-white to-porcelain-blue-50 border-porcelain-blue-200 rounded-2xl shadow-2xl max-w-md w-[90vw] relative overflow-hidden"
            onClick={(e) => e.stopPropagation()}
            style={{
              animation: 'slideIn 0.3s ease-out',
              transform: 'translateY(0)'
            }}
          >
            {/* Header */}
            <div className="text-center pb-4 p-6">
              <div className="flex justify-center mb-4">
                <div className="relative">
                  <Clock className="h-16 w-16 text-sunrise-coral animate-pulse" />
                </div>
              </div>
              <h2 className="text-2xl font-bold text-midnight-ink mb-2">
                Creator Dashboard Coming Soon
              </h2>
              <p className="text-gray-600">
                We're working hard to bring you an amazing creator experience
              </p>
            </div>

            {/* Content */}
            <div className="text-center space-y-6 px-6 pb-6">
              <div className="space-y-4">
                <p className="text-midnight-ink-600 text-lg leading-relaxed">
                  Our creator dashboard is currently under development. We'll notify you as soon as it's ready!
                </p>
              </div>

              <div className="space-y-4">
                <Button
                  onClick={() => setShowComingSoon(false)}
                  className="w-full bg-hanok-teal hover:bg-hanok-teal/90 text-white px-8 py-4 text-lg rounded-full font-medium shadow-lg hover:shadow-xl transition-all duration-300"
                >
                  Got it!
                </Button>
              </div>
            </div>

            {/* Close Button */}
            <button
              onClick={() => setShowComingSoon(false)}
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 bg-white hover:bg-gray-100 rounded-full p-2 shadow-lg transition-colors duration-200 z-10"
              aria-label="Close modal"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SigninPageSimple;