import { useNavigate, useSearchParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { sendWelcomeEmail } from '@/services/emailService';
import SigninForm from '@/components/SigninForm';

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
        console.warn('⚠️ EMAIL VERIFICATION: No session found, showing signin page');
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

      // After email verification, just stop redirecting and show the split signin page
      // User can choose which account type to sign in with
      console.log('✅ EMAIL VERIFICATION: Email verified, showing signin options');
      setIsRedirecting(false);
    } catch (error) {
      console.error('❌ EMAIL VERIFICATION: Error during redirect:', error);
      setIsRedirecting(false);
    }
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
    <div className="min-h-screen bg-gradient-to-b from-white to-porcelain-blue-50">
      <main className="flex-1">
        <section className="py-16 lg:py-24">
          <div className="max-w-7xl mx-auto px-6">
            {/* Page Title */}
            <div className="text-center mb-12">
              <h1 className="text-3xl lg:text-4xl font-bold text-midnight-ink">
                Welcome Back!
              </h1>
              <p className="text-midnight-ink-600 mt-2">
                Sign in to your account
              </p>
            </div>

            {/* Two-column signin layout */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
              {/* Left Column - Creator Sign In (Temporarily Disabled) */}
              <div className="flex flex-col">
                <SigninForm accountType="creator" hideOtherAccountTypeLink={true} disabled={true} />
              </div>

              {/* Right Column - Buyer Sign In */}
              <div className="flex flex-col">
                <SigninForm accountType="buyer" hideOtherAccountTypeLink={true} />
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default SigninPageSimple;