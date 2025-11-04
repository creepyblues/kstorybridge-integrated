import { useState, useEffect } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { Button } from '@kstorybridge/ui';
import { Card, CardContent } from '@kstorybridge/ui';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { isInOAuthFlow } from '@/utils/oauthUtils';
import { trackSignupError, trackValidationError, trackProfileCreationError } from '@/services/authErrorTracking';

import type { AccountType, BuyerFormData, CreatorFormData, SignupState } from './types';
import {
  validateBuyerForm,
  validateCreatorForm,
  validateBuyerRole,
  validateCreatorRole,
  normalizeCreatorRole
} from './validation';
import { signupBuyer, handleOAuthSignup, completeOAuthProfile } from './signupService';
import { BuyerSignupForm } from './BuyerSignupForm';
import { CreatorSignupForm } from './CreatorSignupForm';
import { OAuthProviders } from './OAuthProviders';

interface SignupFormContainerProps {
  accountType: AccountType;
}

export const SignupFormContainer: React.FC<SignupFormContainerProps> = ({ accountType }) => {
  const [searchParams] = useSearchParams();
  // Check sessionStorage for OAuth completion (NO URL parameters per CLAUDE.md)
  const isOAuthCompletion = typeof window !== 'undefined' && sessionStorage.getItem('oauth_signup_complete') === 'true';

  const [state, setState] = useState<SignupState>({
    isLoading: false,
    isGoogleLoading: false,
    isOAuthUser: isOAuthCompletion,
    oAuthUserId: null,
    rejectionAlert: null,
    passwordError: null,
    roleError: null
  });

  const [showRoleValidation, setShowRoleValidation] = useState(false);

  const [buyerFormData, setBuyerFormData] = useState<BuyerFormData>({
    email: '',
    password: '',
    full_name: '',
    buyer_company: '',
    buyer_role: '',
    linkedin_url: '',
    tier: 'basic'
  });

  const [creatorFormData, setCreatorFormData] = useState<CreatorFormData>({
    email: '',
    password: '',
    full_name: '',
    pen_name: '',
    ip_owner_role: 'author', // Default to 'author' since it's now required
    ip_owner_company: '',
    website_url: '',
    invitation_status: 'invited'
  });

  const { toast } = useToast();
  const navigate = useNavigate();
  const { user, session } = useAuth();

  // For OAuth completion, populate form with user data
  useEffect(() => {
    if (isOAuthCompletion && user) {
      console.log('🔄 OAuth completion: Pre-filling form with user data', user);

      if (accountType === 'buyer') {
        setBuyerFormData(prev => ({
          ...prev,
          email: user.email || '',
          full_name: user.user_metadata?.full_name || '',
          // Password not needed for OAuth users
          password: ''
        }));
      } else {
        setCreatorFormData(prev => ({
          ...prev,
          email: user.email || '',
          full_name: user.user_metadata?.full_name || '',
          pen_name: user.user_metadata?.pen_name || '',
          ip_owner_role: normalizeCreatorRole(user.user_metadata?.ip_owner_role) || '',
          // Password not needed for OAuth users
          password: ''
        }));
      }
    }
  }, [isOAuthCompletion, user, accountType]);

  const updateState = (updates: Partial<SignupState>) => {
    setState(prev => ({ ...prev, ...updates }));
  };

  const updateBuyerForm = (updates: Partial<BuyerFormData>) => {
    setBuyerFormData(prev => ({ ...prev, ...updates }));
  };

  const updateCreatorForm = (updates: Partial<CreatorFormData>) => {
    setCreatorFormData(prev => ({ ...prev, ...updates }));
  };

  const handleSubmit = async () => {
    try {
      updateState({ isLoading: true, passwordError: null, roleError: null });
      setShowRoleValidation(true); // Show role validation errors if any

      // Handle OAuth completion differently from regular signup
      if (isOAuthCompletion && user) {
        console.log('🔄 Processing OAuth profile completion');

        if (accountType === 'buyer') {
          // For OAuth completion, we only need profile data validation
          if (!buyerFormData.full_name || !buyerFormData.buyer_company || !buyerFormData.buyer_role) {
            const validationError = "Please fill in all required fields (name, company, role)";

            // Track validation error
            await trackValidationError(
              validationError,
              buyerFormData.email || user.email || '',
              'buyer',
              {
                failureType: 'signup_oauth',
                fullName: buyerFormData.full_name,
                company: buyerFormData.buyer_company,
                oauthProvider: 'google'
              }
            );

            toast({
              title: "Validation Error",
              description: validationError,
              variant: "destructive"
            });
            return;
          }

          const roleError = validateBuyerRole(buyerFormData.buyer_role);
          if (roleError) {
            updateState({ roleError });
            return;
          }

          // Complete OAuth profile - improved handling for false timeouts
          console.log('🔄 Starting OAuth profile completion...');

          try {
            // Wrap profile completion with timeout to prevent infinite hangs
            const profilePromise = completeOAuthProfile(buyerFormData, user, session);
            const timeoutPromise = new Promise((_, reject) =>
              setTimeout(() => reject(new Error('Profile creation timeout - please try again')), 30000)
            );

            const result = await Promise.race([profilePromise, timeoutPromise]);

            if (!result.success) {
              console.error('❌ OAuth profile completion failed:', result.error);

              // Track profile creation failure
              await trackProfileCreationError(
                new Error(result.error || 'Profile creation failed'),
                buyerFormData.email || user.email || '',
                'buyer',
                {
                  fullName: buyerFormData.full_name,
                  company: buyerFormData.buyer_company,
                  oauthProvider: 'google',
                  profileExists: false
                }
              );

              toast({
                title: "Profile Creation Failed",
                description: result.error || "Failed to create buyer profile. Please try signing in or contact support.",
                variant: "destructive"
              });
              return;
            }

            // Profile creation succeeded - show success immediately
            console.log('✅ OAuth profile completion succeeded');

            // Clear OAuth sessionStorage after successful completion
            sessionStorage.removeItem('oauth_signup_complete');
            sessionStorage.removeItem('oauth_user_id');
            sessionStorage.removeItem('oauth_user_email');
            sessionStorage.removeItem('oauth_user_account_type');
            console.log('🧹 Cleared OAuth completion sessionStorage');

            toast({
              title: "Profile Created!",
              description: "Welcome to KStoryBridge! Your buyer profile has been set up.",
              variant: "default"
            });

            navigate('/buyers/chat');
            return;

          } catch (error) {
            // Only catch actual errors, not timeout races
            console.error('❌ OAuth profile completion error:', error);

            // Track profile creation error
            await trackProfileCreationError(
              error,
              buyerFormData.email || user.email || '',
              'buyer',
              {
                fullName: buyerFormData.full_name,
                company: buyerFormData.buyer_company,
                oauthProvider: 'google',
                recoveryAttempted: true,
                recoveryMethod: 'signin_redirect'
              }
            );

            // Show helpful message with signin option
            toast({
              title: "Profile Setup Issue",
              description: "Your Google account was created successfully! Please use the Sign In button below to complete your profile setup.",
              variant: "default"
            });

            // Redirect to signin page with prefilled email
            const userEmail = user?.email;
            if (userEmail) {
              console.log('🔄 Redirecting to signin with prefilled email:', userEmail);
              navigate(`/signin?email=${encodeURIComponent(userEmail)}&message=oauth_complete`);
            } else {
              navigate('/signin?message=oauth_complete');
            }
            return;
          }

        } else {
          // Creator OAuth completion
          if (!creatorFormData.full_name || !creatorFormData.pen_name || !creatorFormData.ip_owner_role) {
            toast({
              title: "Validation Error",
              description: "Please fill in all required fields (name, pen name, role)",
              variant: "destructive"
            });
            return;
          }

          const roleError = validateCreatorRole(creatorFormData.ip_owner_role);
          if (roleError) {
            updateState({ roleError });
            return;
          }

          // Complete OAuth creator profile - improved handling for false timeouts
          // NOTE: Creator auth moved to creator app - this code path is deprecated
          console.log('🔄 Starting creator OAuth profile completion...');

          try {
            // Wrap profile completion with timeout to prevent infinite hangs
            const profilePromise = completeOAuthProfile(creatorFormData as any, user, session);
            const timeoutPromise = new Promise((_, reject) =>
              setTimeout(() => reject(new Error('Profile creation timeout - please try again')), 30000)
            );

            const result = await Promise.race([profilePromise, timeoutPromise]);

            if (!result.success) {
              console.error('❌ Creator OAuth profile completion failed:', result.error);

              toast({
                title: "Profile Creation Failed",
                description: result.error || "Failed to create creator profile. Please try signing in or contact support.",
                variant: "destructive"
              });
              return;
            }

            // Profile creation succeeded - show success immediately
            console.log('✅ Creator OAuth profile completion succeeded');

            // Clear OAuth sessionStorage after successful completion
            sessionStorage.removeItem('oauth_signup_complete');
            sessionStorage.removeItem('oauth_user_id');
            sessionStorage.removeItem('oauth_user_email');
            sessionStorage.removeItem('oauth_user_account_type');
            console.log('🧹 Cleared OAuth completion sessionStorage');

            toast({
              title: "Profile Created!",
              description: "Welcome to KStoryBridge! Your creator profile has been set up.",
              variant: "default"
            });

            navigate('/creators/home');
            return;

          } catch (error) {
            // Only catch actual errors, not timeout races
            console.error('❌ Creator OAuth profile completion error:', error);

            toast({
              title: "Profile Setup Issue",
              description: "Your Google account was created successfully! Please use the Sign In button below to complete your profile setup.",
              variant: "default"
            });

            // Redirect to signin as fallback
            const emailParam = encodeURIComponent(user.email || '');
            console.log('🔄 Redirecting to signin with prefilled email:', user.email);
            navigate(`/signin?email=${emailParam}&oauth_recovery=true`);
            return;
          }
        }
      }

      // Regular signup flow (email + password)
      if (accountType === 'buyer') {
        // Validate buyer form
        const formError = validateBuyerForm(buyerFormData);
        if (formError) {
          // Track validation error
          await trackValidationError(
            formError,
            buyerFormData.email,
            'buyer',
            {
              failureType: 'signup_email',
              fullName: buyerFormData.full_name,
              company: buyerFormData.buyer_company
            }
          );

          // Show specific error message
          toast({
            title: "Cannot Create Account",
            description: formError,
            variant: "destructive"
          });
          updateState({ isLoading: false });
          return;
        }

        // Validate role
        const roleError = validateBuyerRole(buyerFormData.buyer_role);
        if (roleError) {
          updateState({ roleError, isLoading: false });
          toast({
            title: "Cannot Create Account",
            description: roleError,
            variant: "destructive"
          });
          return;
        }

        // Submit buyer signup
        const result = await signupBuyer(buyerFormData);
        if (!result.success) {
          // Track signup error
          await trackSignupError(
            new Error(result.error || 'Signup failed'),
            buyerFormData.email,
            'buyer',
            false,
            {
              stage: 'supabase_auth',
              fullName: buyerFormData.full_name,
              company: buyerFormData.buyer_company,
              profileExists: false
            }
          );

          toast({
            title: "Signup Failed",
            description: result.error || "Failed to create account",
            variant: "destructive"
          });
          return;
        }

        toast({
          title: "Account Created!",
          description: "Please check your email to verify your account.",
          variant: "default"
        });

        await supabase.auth.signOut();
        navigate('/signin/buyer?from=signup', { replace: true });

      } else {
        // Validate creator form
        const formError = validateCreatorForm(creatorFormData);
        if (formError) {
          // Track validation error
          await trackValidationError(
            formError,
            creatorFormData.email,
            'creator',
            {
              failureType: 'signup_email',
              fullName: creatorFormData.full_name,
              company: creatorFormData.ip_owner_company
            }
          );

          // Show specific error message
          toast({
            title: "Cannot Create Account",
            description: formError,
            variant: "destructive"
          });
          updateState({ isLoading: false });
          return;
        }

        // Validate creator role (now required)
        const roleError = validateCreatorRole(creatorFormData.ip_owner_role);
        if (roleError) {
          updateState({ roleError, isLoading: false });
          toast({
            title: "Cannot Create Account",
            description: roleError,
            variant: "destructive"
          });
          return;
        }

        // Submit creator signup
        // NOTE: Creator auth moved to creator app - this code path is deprecated and will never execute
        console.error('❌ Creator signup attempted in dashboard app - creator auth moved to creator app');
        toast({
          title: "Creator Signup Unavailable",
          description: "Creator signups have moved to the creator app. Please contact support.",
          variant: "destructive"
        });
        return;

        /* DEPRECATED CODE - Creator auth moved to creator app
        const result = await signupCreator(creatorFormData);
        if (!result.success) {
          // Track signup error
          await trackSignupError(
            new Error(result.error || 'Signup failed'),
            creatorFormData.email,
            'creator',
            false,
            {
              stage: 'supabase_auth',
              fullName: creatorFormData.full_name,
              company: creatorFormData.ip_owner_company,
              profileExists: false
            }
          );

          toast({
            title: "Signup Failed",
            description: result.error || "Failed to create account",
            variant: "destructive"
          });
          return;
        }

        toast({
          title: "Account Created!",
          description: "Please check your email to verify your account.",
          variant: "default"
        });

        await supabase.auth.signOut();
        navigate('/signin/creator?from=signup', { replace: true });
        */
      }

    } catch (error) {
      console.error('Signup error:', error);

      // Track unexpected errors
      const email = accountType === 'buyer' ? buyerFormData.email : creatorFormData.email;
      const fullName = accountType === 'buyer' ? buyerFormData.full_name : creatorFormData.full_name;
      await trackSignupError(
        error,
        email,
        accountType,
        state.isOAuthUser,
        {
          stage: 'supabase_auth',
          fullName: fullName,
          errorMessage: error instanceof Error ? error.message : 'Unexpected error'
        }
      );

      toast({
        title: "Signup Failed",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive"
      });
    } finally {
      updateState({ isLoading: false });
    }
  };

  const handleGoogleSignup = async () => {
    try {
      updateState({ isGoogleLoading: true });
      // Dashboard app now only handles buyer OAuth (creator auth moved to creator app)
      const result = await handleOAuthSignup('google');

      if (result.error) {
        // Track OAuth signup error
        await trackSignupError(
          new Error(result.error),
          '',
          accountType,
          true,
          {
            stage: 'supabase_auth',
            oauthProvider: 'google',
            errorMessage: result.error
          }
        );

        toast({
          title: "OAuth Error",
          description: result.error,
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Google signup error:', error);

      // Track OAuth error
      await trackSignupError(
        error,
        '',
        accountType,
        true,
        {
          stage: 'supabase_auth',
          oauthProvider: 'google',
          errorMessage: error instanceof Error ? error.message : 'Failed to initiate Google signup'
        }
      );

      toast({
        title: "OAuth Error",
        description: "Failed to initiate Google signup",
        variant: "destructive"
      });
    } finally {
      updateState({ isGoogleLoading: false });
    }
  };

  const handleDiscordSignup = async () => {
    try {
      // Dashboard app now only handles buyer OAuth (creator auth moved to creator app)
      const result = await handleOAuthSignup('discord');

      if (result.error) {
        toast({
          title: "OAuth Error",
          description: result.error,
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Discord signup error:', error);
      toast({
        title: "OAuth Error",
        description: "Failed to initiate Discord signup",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <Card className="shadow-xl border-0">
        <CardContent className="p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-midnight-ink mb-2">
              {isOAuthCompletion
                ? `Complete Your ${accountType === 'buyer' ? 'Buyer' : 'Creator'} Profile`
                : `${accountType === 'buyer' ? 'Buyer' : 'Creator'} Sign Up`
              }
            </h1>
            <p className="text-midnight-ink-600">
              {isOAuthCompletion
                ? 'Please provide some additional information to set up your profile.'
                : 'Create your account to access KStoryBridge.'
              }
            </p>
          </div>

          {state.rejectionAlert && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
              <strong className="block mb-1">Account Creation Blocked</strong>
              <p className="text-sm">{state.rejectionAlert.message}</p>
            </div>
          )}

          {!isOAuthCompletion && (
            <div className="mb-6">
              <OAuthProviders
                accountType={accountType}
                isGoogleLoading={state.isGoogleLoading}
                onGoogleSignup={handleGoogleSignup}
                onDiscordSignup={handleGoogleSignup}
              />
            </div>
          )}

          {!isOAuthCompletion && (
            <div className="flex items-center mb-6">
              <div className="flex-1 border-t border-gray-300"></div>
              <span className="px-4 text-sm text-gray-500">or</span>
              <div className="flex-1 border-t border-gray-300"></div>
            </div>
          )}

          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSubmit();
            }}
            className="space-y-6"
          >
            {accountType === 'buyer' ? (
              <BuyerSignupForm
                formData={buyerFormData}
                onChange={updateBuyerForm}
                passwordError={state.passwordError}
                roleError={state.roleError}
                hidePassword={isOAuthCompletion}
                showRoleValidation={showRoleValidation}
              />
            ) : (
              <CreatorSignupForm
                formData={creatorFormData}
                onChange={updateCreatorForm}
                passwordError={state.passwordError}
                roleError={state.roleError}
                hidePassword={isOAuthCompletion}
                showRoleValidation={showRoleValidation}
              />
            )}

            <Button
              type="submit"
              disabled={state.isLoading}
              className="w-full h-14 bg-hanok-teal hover:bg-hanok-teal/90 text-white text-base"
            >
              {state.isLoading ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                  Creating account... (this may take 10-15 seconds)
                </div>
              ) : (
                isOAuthCompletion
                  ? `Complete ${accountType === 'buyer' ? 'Buyer' : 'Creator'} Profile`
                  : `Sign up as ${accountType === 'buyer' ? 'Buyer' : 'Creator'}`
              )}
            </Button>
          </form>

          {!isOAuthCompletion ? (
            <div className="mt-6 text-center space-y-4 text-sm text-gray-600">
              <p>
                Already have an account?{' '}
                <Link to="/signin" className="text-hanok-teal hover:text-hanok-teal/80 font-medium">
                  Sign in here
                </Link>
              </p>
              <p>
                Looking for the {accountType === 'buyer' ? 'creator' : 'buyer'} signup?{' '}
                <Link
                  to={`/signup/${accountType === 'buyer' ? 'creator' : 'buyer'}`}
                  className="text-hanok-teal hover:text-hanok-teal/80 font-medium"
                >
                  Switch to {accountType === 'buyer' ? 'Creator' : 'Buyer'} Sign Up
                </Link>
              </p>
            </div>
          ) : (
            <div className="mt-6 text-center text-sm text-gray-600">
              Need to start over?{' '}
              <Link to="/signin" className="text-hanok-teal hover:text-hanok-teal/80 font-medium">
                Return to sign in
              </Link>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
