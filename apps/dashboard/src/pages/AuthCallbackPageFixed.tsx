import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import type { Session, User } from '@supabase/supabase-js';
import { useToast } from '@/hooks/use-toast';
import { getOAuthAccountType, getDashboardPath, getSignupPath } from '@/utils/oauthUtils';
import { markOAuthCompletion } from '@/utils/oauthUtils';
import { trackOAuthCallbackError } from '@/services/authErrorTracking';

const STORAGE_KEY = 'sb-dlrnrgcoguxlkkcitlpd-auth-token';

/**
 * Simplified OAuth Callback Handler
 *
 * This replaces the over-engineered callback handlers with a straightforward approach:
 * 1. Exchange OAuth code for session
 * 2. Get account type from URL params (primary) or metadata (fallback)
 * 3. Redirect to appropriate signup completion or dashboard
 *
 * No complex timeouts, circuit breakers, or fallback mechanisms that cause issues.
 */
const AuthCallbackPageFixed = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const processedRef = useRef(false);

  const SESSION_RACE_TIMEOUT = 4500;
  const EVENT_WAIT_TIMEOUT = 7000;
  const EXCHANGE_TIMEOUT = 6000;
  const USER_FETCH_TIMEOUT = 5000;

  useEffect(() => {
    // Prevent double processing
    if (processedRef.current) return;
    processedRef.current = true;

    const processOAuthCallback = async () => {
      console.log('🚀 OAuth Callback: Starting simplified processing');
      console.log('🌐 URL:', window.location.href);

      try {
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get('code');
        let accountType = urlParams.get('account_type');
        const flow = urlParams.get('flow');

        console.log('📋 OAuth params:', { code: !!code, accountType, flow, search: window.location.search });

        // 1. Try to read the session quickly, but don't stall forever
        console.log('🔍 Checking for existing session first...');

        let session: Session | null = null;
        let user: User | null = null;

        const readSessionFromStorage = (label: string): Session | null => {
          try {
            const raw = localStorage.getItem(STORAGE_KEY);

            if (!raw) {
              console.log(`🗄️ Storage check (${label}): no stored session`);
              return null;
            }

            const parsed = JSON.parse(raw);
            const storedSession = parsed?.currentSession || parsed?.session || null;

            if (storedSession?.user) {
              console.log(`✅ Storage check (${label}): session found for ${storedSession.user.email}`);
              return storedSession as Session;
            }

            console.log(`ℹ️ Storage check (${label}): session present but user missing`);
            return null;
          } catch (error) {
            console.warn(`⚠️ Storage check (${label}): failed to parse`, error);
            return null;
          }
        };

        const waitForStorageSession = async (
          label: string,
          maxWaitMs = EVENT_WAIT_TIMEOUT,
          intervalMs = 400
        ): Promise<Session | null> => {
          const attempts = Math.ceil(maxWaitMs / intervalMs);
          for (let attempt = 0; attempt < attempts; attempt++) {
            const storedSession = readSessionFromStorage(`${label}-poll-${attempt + 1}`);
            if (storedSession?.user) {
              return storedSession;
            }
            await new Promise(resolve => setTimeout(resolve, intervalMs));
          }
          console.warn(`⏱️ Storage wait (${label}): timed out after ${maxWaitMs}ms`);
          return null;
        };

        const fetchUserDirectly = async (label: string): Promise<User | null> => {
          const timeoutMarker = Symbol('user-fetch-timeout');
          console.log(`🔎 fetchUserDirectly(${label}): requesting current user`);
          try {
            const result = await Promise.race([
              supabase.auth.getUser(),
              new Promise(resolve => setTimeout(() => resolve(timeoutMarker), USER_FETCH_TIMEOUT))
            ]);

            if (result === timeoutMarker) {
              console.warn(`⏱️ fetchUserDirectly(${label}): timed out after ${USER_FETCH_TIMEOUT}ms`);
              return null;
            }

            const { data, error } = result as Awaited<ReturnType<typeof supabase.auth.getUser>>;

            if (error) {
              console.warn(`⚠️ fetchUserDirectly(${label}):`, error);
              return null;
            }

            if (data?.user) {
              console.log(`✅ fetchUserDirectly(${label}): user ${data.user.email}`);
              return data.user;
            }

            console.log(`ℹ️ fetchUserDirectly(${label}): no user returned`);
            return null;
          } catch (directError) {
            console.warn(`⚠️ fetchUserDirectly(${label}): threw error`, directError);
            return null;
          }
        };

        const maybeFetchUser = async (label: string) => {
          if (user) return;
          const directUser = await fetchUserDirectly(label);
          if (directUser) {
            user = directUser;
          }
        };

        const getSessionQuickly = async (label: string): Promise<Session | null> => {
          console.log(`⏱️ getSessionQuickly(${label}): attempting Supabase session read`);
          try {
            const sessionResult = await Promise.race([
              supabase.auth.getSession(),
              new Promise<null>((resolve) =>
                setTimeout(() => resolve(null), SESSION_RACE_TIMEOUT)
              )
            ]);

            if (!sessionResult) {
              console.warn(`⏱️ getSessionQuickly(${label}): timed out after ${SESSION_RACE_TIMEOUT}ms`);
              return null;
            }

            if ('data' in sessionResult) {
              const sessionData = sessionResult.data.session ?? null;
              console.log(`✅ getSessionQuickly(${label}): session ${sessionData ? 'found' : 'missing'}`);
              return sessionData;
            }

            console.warn(`⚠️ getSessionQuickly(${label}): unexpected result shape`, sessionResult);
            return null;
          } catch (sessionError) {
            console.warn(`⚠️ getSessionQuickly(${label}): threw error, continuing`, sessionError);
            return null;
          }
        };

        const waitForSignedInEvent = async (label: string): Promise<Session | null> => {
          console.log(`🛎️ waitForSignedInEvent(${label}): waiting for auth state change`);
          return new Promise<Session | null>((resolve) => {
            const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
              if (event === 'SIGNED_IN' && session?.user) {
                console.log(`✅ waitForSignedInEvent(${label}): received SIGNED_IN event`);
                clearTimeout(timeoutId);
                subscription.unsubscribe();
                resolve(session);
              }
            });

            const timeoutId = setTimeout(() => {
              console.warn(`⏱️ waitForSignedInEvent(${label}): timeout after ${EVENT_WAIT_TIMEOUT}ms`);
              subscription.unsubscribe();
              resolve(null);
            }, EVENT_WAIT_TIMEOUT);
          });
        };

        const performExchange = async (authCode: string) => {
          console.log('🔁 Starting exchangeCodeForSession with timeout guard');
          type ExchangeResponse = Awaited<ReturnType<typeof supabase.auth.exchangeCodeForSession>>;
          const timeoutMarker = Symbol('exchange-timeout');
          const outcome = await Promise.race([
            supabase.auth.exchangeCodeForSession(authCode),
            new Promise(resolve => setTimeout(() => resolve(timeoutMarker), EXCHANGE_TIMEOUT))
          ]);

          if (outcome === timeoutMarker) {
            console.warn(`⏱️ exchangeCodeForSession timed out after ${EXCHANGE_TIMEOUT}ms`);
            return null;
          }

          return outcome as ExchangeResponse;
        };

        session = readSessionFromStorage('initial-storage');
        user = session?.user ?? null;

        if (!user) {
          session = await getSessionQuickly('initial');
          user = session?.user ?? null;
        }

        if (!user) {
          const storageSession = await waitForStorageSession('post-initial-storage', 2000);
          if (storageSession?.user) {
            session = storageSession;
            user = storageSession.user;
          }
        }

        if (!user) {
          await maybeFetchUser('initial-direct-fetch');
        }

        if (!user) {
          const eventSession = await waitForSignedInEvent('initial');
          if (eventSession?.user) {
            session = eventSession;
            user = eventSession.user;
          } else {
            const storageSession = await waitForStorageSession('post-event-storage');
            if (storageSession?.user) {
              session = storageSession;
              user = storageSession.user;
            }
          }
        }

        if (!user) {
          await maybeFetchUser('post-event-direct-fetch');
        }

        // 2. If we still do not have a user, attempt the PKCE exchange directly
        if (!user && code) {
          console.log('🔄 No existing session, exchanging OAuth code...');

          const exchangeResult = await performExchange(code);
          const { data, error } = exchangeResult ?? { data: null, error: null };

          if (!exchangeResult) {
            console.warn('ℹ️ Exchange timed out, will rely on stored session');
          }

          if (error) {
            // Supabase returns a specific error if the code was already processed (auto detect)
            const alreadyHandled = error.message?.toLowerCase().includes('authorization code already used');
            if (!alreadyHandled) {
              console.error('❌ OAuth code exchange failed:', error.message);

              // Track OAuth code exchange failure
              await trackOAuthCallbackError(
                error,
                'callback_exchange',
                {
                  email: user?.email,
                  accountType: accountType as 'buyer' | 'creator' | undefined,
                  oauthProvider: 'google',
                  errorCode: (error as any).code
                }
              );

              toast({
                title: "Authentication Failed",
                description: error.message,
                variant: "destructive"
              });
              navigate('/signin?error=oauth_failed');
              return;
            }

            console.warn('ℹ️ OAuth code already consumed, re-fetching session');
          }

          if (data?.session?.user) {
            console.log('✅ exchangeCodeForSession returned session');
          } else {
            console.warn('ℹ️ exchangeCodeForSession did not return session, falling back to getSession');
          }

          if (data?.session?.user) {
            session = data.session;
            user = data.session.user;
          } else {
            // Fallback: Supabase may have already stored the session, so try reading once more
            const retrySession = await getSessionQuickly('post-exchange-retry');
            session = retrySession;
            user = retrySession?.user ?? null;

            if (!user) {
              const eventSession = await waitForSignedInEvent('post-exchange');
              if (eventSession?.user) {
                session = eventSession;
                user = eventSession.user;
              } else {
                const storageSession = await waitForStorageSession('post-exchange-storage');
                if (storageSession?.user) {
                  session = storageSession;
                  user = storageSession.user;
                }
              }
            }
          }
        }

        if (!user) {
          await maybeFetchUser('post-exchange-direct-fetch');
        }

        // Final safeguard – if session still missing, try one last lightweight fetch
        if (!user) {
          console.log('🔁 Final session fetch attempt...');
          const finalSession = session ?? await getSessionQuickly('final');
          session = finalSession;
          user = finalSession?.user ?? null;

          if (!user) {
            console.log('⏳ Waiting briefly before one more session check');
            await new Promise(resolve => setTimeout(resolve, 600));
            const postWaitSession = await getSessionQuickly('post-wait');
            session = postWaitSession;
            user = postWaitSession?.user ?? null;

            if (!user) {
              const eventSession = await waitForSignedInEvent('final-post-wait');
              if (eventSession?.user) {
                session = eventSession;
                user = eventSession.user;
              } else {
                const storageSession = await waitForStorageSession('final-storage');
                if (storageSession?.user) {
                  session = storageSession;
                  user = storageSession.user;
                }
              }
            }
          }
        }

        if (!user) {
          console.log('🗃️ Storage recovery: final attempt before failing');
          const storageSession = await waitForStorageSession('final-recovery', 4000);
          if (storageSession?.user) {
            session = storageSession;
            user = storageSession.user;
          }
        }

        if (!user) {
          await maybeFetchUser('final-direct-fetch');
        }

        if (!user) {
          console.error('❌ No user found after OAuth processing');

          // Track session initialization failure
          await trackOAuthCallbackError(
            new Error('No user found after OAuth processing'),
            'session_init',
            {
              accountType: accountType as 'buyer' | 'creator' | undefined,
              oauthProvider: 'google',
              sessionValid: false
            }
          );

          navigate('/signin?error=no_user');
          return;
        }

        console.log('✅ OAuth session established for:', user.email);

        // 2. Determine account type (simple logic)
        // Resolve account type using simple detector that respects URL, metadata, and storage fallbacks
        console.log('🔎 Invoking simple account type detection helper...');
        const detection = getOAuthAccountType(user, urlParams);
        const finalAccountType = detection.accountType;

        console.log('🎯 Account type detection result:', {
          finalAccountType,
          source: detection.source
        });
        console.log('🔍 Detection context:', {
          metadataType: user.user_metadata?.account_type,
          hasSessionStorage: typeof window !== 'undefined' ? sessionStorage.getItem('oauth_account_type') : undefined
        });

        console.log('🎯 Final account type resolved to:', finalAccountType);

        if (!finalAccountType) {
          console.log('❓ No account type found, redirecting to account type selection');
          const selectionUrl = `${window.location.origin}/account-type-selection?oauth=true&email=${encodeURIComponent(user.email ?? '')}`;
          console.log('🧭 Redirecting to account type selection:', selectionUrl);
          const forceSelectionRedirect = () => window.location.assign(selectionUrl);
          forceSelectionRedirect();
          setTimeout(forceSelectionRedirect, 250);
          setTimeout(forceSelectionRedirect, 1000);
          setTimeout(() => console.log('🧭 Post-selection redirect location:', window.location.href), 1100);
          return;
        }

        // 3. Update user metadata with account type (TESTING - with detailed logging)
        console.log('🔄 TESTING: About to update user metadata with account_type:', finalAccountType);
        console.log('🔄 TESTING: User ID:', user.id);
        console.log('🔄 TESTING: User email:', user.email);

        try {
          const updateResult = await supabase.auth.updateUser({
            data: { account_type: finalAccountType }
          });

          console.log('✅ TESTING: Metadata update SUCCESS');
          console.log('✅ TESTING: Update result:', updateResult);

          // Verify the update worked
          const { data: verifyUser } = await supabase.auth.getUser();
          console.log('✅ TESTING: Verified metadata after update:', verifyUser.user?.user_metadata);

        } catch (metadataError) {
          console.error('❌ TESTING: Metadata update FAILED:', metadataError);
          console.error('❌ TESTING: Error details:', {
            message: metadataError.message,
            code: metadataError.code,
            status: metadataError.status
          });
        }

        // 4. Mark OAuth completion for legacy system bypass
        markOAuthCompletion();

        // 5. Route based on flow type
        if (flow === 'signup') {
          // OAuth signup - redirect to complete profile
          const signupPath = getSignupPath(finalAccountType);
          const signupUrl = `${window.location.origin}${signupPath}?complete=true&user_id=${user.id}&email=${encodeURIComponent(user.email ?? '')}`;
          console.log('📝 OAuth signup - redirecting to:', signupUrl);
          const forceSignupRedirect = () => window.location.assign(signupUrl);
          forceSignupRedirect();
          setTimeout(forceSignupRedirect, 250);
          setTimeout(forceSignupRedirect, 1000);
          setTimeout(() => console.log('🧭 Post-signup redirect location:', window.location.href), 1100);
          return;
        } else {
          // OAuth signin - redirect to dashboard
          const dashboardUrl = `${window.location.origin}${getDashboardPath(finalAccountType)}`;
          console.log('🏠 OAuth signin - redirecting to:', dashboardUrl);
          const forceSigninRedirect = () => window.location.assign(dashboardUrl);
          forceSigninRedirect();
          setTimeout(forceSigninRedirect, 250);
          setTimeout(forceSigninRedirect, 1000);
          setTimeout(() => console.log('🧭 Post-signin redirect location:', window.location.href), 1100);
          return;
        }

      } catch (error) {
        console.error('❌ Unexpected error in OAuth callback:', error);

        // Track unexpected OAuth callback error
        await trackOAuthCallbackError(
          error,
          'callback_exchange',
          {
            accountType: accountType as 'buyer' | 'creator' | undefined,
            oauthProvider: 'google',
            errorMessage: error instanceof Error ? error.message : 'Unexpected error in OAuth callback'
          }
        );

        toast({
          title: "Authentication Error",
          description: "Something went wrong during authentication. Please try again.",
          variant: "destructive"
        });
        navigate('/signin?error=unexpected');
      }
    };

    processOAuthCallback();
  }, [navigate, toast]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-porcelain-blue-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-hanok-teal mx-auto mb-4"></div>
        <h2 className="text-xl font-semibold text-midnight-ink mb-2">
          Completing Authentication
        </h2>
        <p className="text-midnight-ink-600">
          Please wait while we process your login...
        </p>
      </div>
    </div>
  );
};

export default AuthCallbackPageFixed;
