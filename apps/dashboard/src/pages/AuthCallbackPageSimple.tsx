import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

const AuthCallbackPageSimple = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const handleCallback = async () => {
      console.log('🚀 SIMPLE CALLBACK: Starting OAuth callback');

      try {
        // Simple timeout fallback
        const timeout = setTimeout(() => {
          console.log('⏰ SIMPLE CALLBACK: Timeout - redirecting to signin');
          navigate('/signin?timeout=true');
        }, 10000);

        // Handle OAuth code exchange if needed
        const urlParams = new URLSearchParams(window.location.search);
        const hasCode = urlParams.has('code');

        if (hasCode) {
          console.log('🔄 SIMPLE CALLBACK: OAuth code detected, exchanging for session...');
          // Let Supabase handle the code exchange automatically
          const { data: { session }, error } = await supabase.auth.getSession();

          if (error) {
            console.error('❌ SIMPLE CALLBACK: Code exchange error:', error);
            clearTimeout(timeout);
            navigate('/signin?code_exchange_error=true');
            return;
          }

          if (!session) {
            console.log('🔄 SIMPLE CALLBACK: No session after code exchange, waiting...');
            // Wait a bit and try again
            await new Promise(resolve => setTimeout(resolve, 1000));
            const { data: { session: retrySession } } = await supabase.auth.getSession();

            if (!retrySession) {
              console.error('❌ SIMPLE CALLBACK: Still no session after retry');
              clearTimeout(timeout);
              navigate('/signin?no_session_after_exchange=true');
              return;
            }

            console.log('✅ SIMPLE CALLBACK: Session obtained after retry');
          }
        }

        // Get final session
        const { data: { session }, error } = await supabase.auth.getSession();
        clearTimeout(timeout);

        if (error) {
          console.error('❌ SIMPLE CALLBACK: Session error:', error);
          navigate('/signin?session_error=true');
          return;
        }

        if (!session?.user) {
          console.log('❌ SIMPLE CALLBACK: No session found');
          navigate('/signin?no_session=true');
          return;
        }

        const user = session.user;
        console.log('✅ SIMPLE CALLBACK: User authenticated:', user.email);

        // Check URL params for flow type (reuse existing urlParams)
        const accountType = urlParams.get('account_type');
        const flow = urlParams.get('flow');
        const isSignin = flow === 'signin';
        const isSignup = flow === 'signup' || (!flow && accountType); // Legacy support

        console.log('🔍 SIMPLE CALLBACK: Flow detection:', { accountType, flow, isSignin, isSignup });

        if (isSignin && accountType) {
          // SIGNIN: Account-specific signin with known account type
          console.log(`🏠 SIMPLE CALLBACK: ${accountType.toUpperCase()} SIGNIN flow`);

          // Quick check if profile exists for this account type
          const profileCheck = accountType === 'buyer'
            ? await supabase.from('user_buyers').select('id').eq('email', user.email).maybeSingle()
            : await supabase.from('user_creators').select('id').eq('email', user.email).maybeSingle();

          if (profileCheck.data) {
            console.log(`✅ SIMPLE CALLBACK: ${accountType} profile found, redirecting to dashboard`);
            const dashboardUrl = accountType === 'creator' ? '/creators/home' : '/buyers/home';
            navigate(dashboardUrl);
          } else {
            console.log(`❓ SIMPLE CALLBACK: No ${accountType} profile found, redirecting to signup completion`);
            navigate(`/signup/${accountType}?complete=true&user_id=${user.id}&email=${encodeURIComponent(user.email)}`);
          }

        } else if (isSignin && !accountType) {
          // SIGNIN: Generic signin without account type (fallback for old URLs)
          console.log('🏠 SIMPLE CALLBACK: Generic SIGNIN flow');

          const [buyerCheck, creatorCheck] = await Promise.all([
            supabase.from('user_buyers').select('id').eq('email', user.email).maybeSingle(),
            supabase.from('user_creators').select('id').eq('email', user.email).maybeSingle()
          ]);

          if (creatorCheck.data) {
            console.log('✅ SIMPLE CALLBACK: Creator found, redirecting to creator dashboard');
            navigate('/creators/home');
          } else if (buyerCheck.data) {
            console.log('✅ SIMPLE CALLBACK: Buyer found, redirecting to buyer dashboard');
            navigate('/buyers/home');
          } else {
            console.log('❓ SIMPLE CALLBACK: No profile found, redirecting to signin');
            navigate('/signin?no_profile=true');
          }

        } else if (isSignup && accountType === 'creator') {
          // CREATOR SIGNUP
          console.log('📝 SIMPLE CALLBACK: Creator signup flow');
          navigate(`/signup/creator?complete=true&user_id=${user.id}&email=${encodeURIComponent(user.email)}`);

        } else if (isSignup && accountType === 'buyer') {
          // BUYER SIGNUP
          console.log('📝 SIMPLE CALLBACK: Buyer signup flow');
          navigate(`/signup/buyer?complete=true&user_id=${user.id}&email=${encodeURIComponent(user.email)}`);

        } else {
          // Unknown flow
          console.log('❓ SIMPLE CALLBACK: Unknown flow, redirecting to signin');
          navigate('/signin?unknown_flow=true');
        }

      } catch (error) {
        console.error('❌ SIMPLE CALLBACK: Unexpected error:', error);
        navigate('/signin?callback_error=true');
      }
    };

    handleCallback();
  }, [navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-porcelain-blue-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-hanok-teal mx-auto mb-4"></div>
        <h2 className="text-xl font-semibold text-midnight-ink mb-2">
          Completing Sign In
        </h2>
        <p className="text-midnight-ink-600">
          Please wait while we set up your account...
        </p>
      </div>
    </div>
  );
};

export default AuthCallbackPageSimple;