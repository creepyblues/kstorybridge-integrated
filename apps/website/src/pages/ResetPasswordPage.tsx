import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@kstorybridge/ui';
import { Input } from '@kstorybridge/ui';
import { Label } from '@kstorybridge/ui';
import { Card, CardContent } from '@kstorybridge/ui';
import { useToast } from '../hooks/use-toast';
import { supabase } from '../integrations/supabase/client';
import UniversalHeader from '../components/UniversalHeader';
import Footer from '../components/Footer';

const ResetPasswordPage = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isValidSession, setIsValidSession] = useState(false);
  const [isCheckingSession, setIsCheckingSession] = useState(true);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Check if we have a valid password reset session
  useEffect(() => {
    const checkSession = async () => {
      try {
        // First check if we have hash parameters (Supabase uses hash for password reset)
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const accessToken = hashParams.get('access_token') || searchParams.get('access_token');
        const refreshToken = hashParams.get('refresh_token') || searchParams.get('refresh_token');
        const type = hashParams.get('type') || searchParams.get('type');
        
        console.log('Reset password session check:', { 
          hasAccessToken: !!accessToken, 
          hasRefreshToken: !!refreshToken,
          type: type,
          hash: window.location.hash 
        });
        
        // If we have tokens from the URL, set the session
        if (accessToken) {
          const { data, error: sessionError } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken || ''
          });
          
          if (sessionError) {
            console.error('Set session error:', sessionError);
            setIsValidSession(false);
          } else if (data?.session) {
            console.log('Password reset session established');
            setIsValidSession(true);
            // Clear the hash from URL for security
            window.history.replaceState(null, '', window.location.pathname);
          } else {
            setIsValidSession(false);
          }
        } else {
          // Check if we already have a valid session
          const { data: { session }, error } = await supabase.auth.getSession();
          
          if (error) {
            console.error('Session check error:', error);
            setIsValidSession(false);
          } else if (session?.user) {
            // Check if this is a recovery session
            const isRecovery = type === 'recovery' || session.user.recovery_sent_at;
            if (isRecovery) {
              console.log('Valid recovery session found');
              setIsValidSession(true);
            } else {
              console.log('Regular session found, not a recovery session');
              setIsValidSession(false);
            }
          } else {
            console.log('No session found');
            setIsValidSession(false);
          }
        }
      } catch (error) {
        console.error('Unexpected error checking session:', error);
        setIsValidSession(false);
      } finally {
        setIsCheckingSession(false);
      }
    };

    checkSession();
  }, [searchParams]);

  const validatePassword = (pwd: string): string[] => {
    const errors: string[] = [];
    
    if (pwd.length < 8) {
      errors.push('Password must be at least 8 characters long');
    }
    if (!/(?=.*[a-z])/.test(pwd)) {
      errors.push('Password must contain at least one lowercase letter');
    }
    if (!/(?=.*[A-Z])/.test(pwd)) {
      errors.push('Password must contain at least one uppercase letter');
    }
    if (!/(?=.*\d)/.test(pwd)) {
      errors.push('Password must contain at least one number');
    }
    
    return errors;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage(''); // Clear any previous errors

    try {
      // Validate password
      const passwordErrors = validatePassword(password);
      if (passwordErrors.length > 0) {
        const errorMsg = passwordErrors.join('. ');
        setErrorMessage(errorMsg);
        toast({
          title: "Password Requirements",
          description: errorMsg,
          variant: "destructive",
          duration: 8000
        });
        return;
      }

      // Check password confirmation
      if (password !== confirmPassword) {
        const errorMsg = "Passwords do not match. Please try again.";
        setErrorMessage(errorMsg);
        toast({
          title: "Password Mismatch",
          description: errorMsg,
          variant: "destructive"
        });
        return;
      }

      // First ensure we have a valid session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (!session) {
        console.error('No active session for password update');
        const errorMsg = "Your reset session has expired. Please request a new password reset link.";
        setErrorMessage(errorMsg);
        toast({
          title: "Session Expired",
          description: errorMsg,
          variant: "destructive",
          duration: 6000
        });
        
        // Redirect after showing error
        setTimeout(() => {
          navigate('/forgot-password', { replace: true });
        }, 3000);
        return;
      }

      console.log('Updating password for user:', session.user.email);
      
      // Show progress toast
      toast({
        title: "Updating Password...",
        description: "Please wait while we update your password.",
        duration: 3000
      });
      
      // Update the password
      const { data, error } = await supabase.auth.updateUser({
        password: password
      });

      if (error) {
        console.error('Password update error:', error);
        
        // Provide more specific error messages
        let errorMsg = error.message;
        if (error.message.includes('JWT')) {
          errorMsg = "Your reset link has expired. Please request a new one.";
        } else if (error.message.includes('same password')) {
          errorMsg = "New password must be different from your current password.";
        } else if (error.message.includes('password')) {
          errorMsg = "Password update failed. Please check your password requirements and try again.";
        }
        
        setErrorMessage(errorMsg);
        toast({
          title: "Update Failed",
          description: errorMsg,
          variant: "destructive",
          duration: 6000
        });
        
        // If token expired, redirect to forgot password
        if (error.message.includes('JWT') || error.message.includes('expired')) {
          setTimeout(() => {
            navigate('/forgot-password', { replace: true });
          }, 3000);
        }
      } else {
        console.log('Password update successful:', data);
        
        // Set success state
        setIsSuccess(true);
        
        toast({
          title: "Password Updated Successfully!",
          description: "Your password has been changed. Redirecting to sign in page...",
          duration: 6000
        });
        
        // Wait a moment before signing out to ensure the update is processed
        setTimeout(async () => {
          // Sign out to force fresh login with new password
          await supabase.auth.signOut();
          
          // Redirect to signin page
          navigate('/signin', { 
            replace: true,
            state: { message: 'Password updated successfully. Please sign in with your new password.' }
          });
        }, 3000); // Increased delay to let user see success message
      }
    } catch (error) {
      console.error('Unexpected error during password update:', error);
      const errorMsg = "Something went wrong. Please try again.";
      setErrorMessage(errorMsg);
      toast({
        title: "Unexpected Error",
        description: errorMsg,
        variant: "destructive"
      });
    } finally {
      // Only stop loading if not successful (success state handles its own loading)
      if (!isSuccess) {
        setIsLoading(false);
      }
    }
  };

  // Loading state while checking session
  if (isCheckingSession) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-white to-porcelain-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-hanok-teal mx-auto mb-4"></div>
          <p className="text-lg text-midnight-ink">Verifying reset link...</p>
        </div>
      </div>
    );
  }

  // Invalid session state
  if (!isValidSession) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-white to-porcelain-blue-50">
        <UniversalHeader />
        
        <main className="flex-1">
          <section className="py-16 lg:py-24">
            <div className="max-w-7xl mx-auto px-6">
              <div className="max-w-md mx-auto text-center">
                <div className="mb-6">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mb-4">
                    <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.232 13.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                  </div>
                </div>
                
                <h1 className="text-4xl lg:text-5xl font-bold text-midnight-ink mb-6">
                  Invalid Reset Link
                </h1>
                <p className="text-xl text-midnight-ink-600 mb-8">
                  This password reset link is invalid or has expired. Please request a new one.
                </p>
                
                <div className="space-y-4">
                  <Button 
                    onClick={() => navigate('/forgot-password')}
                    className="w-full h-12 text-base bg-hanok-teal hover:bg-hanok-teal-600 text-white font-medium rounded-full transition-all duration-300 shadow-lg hover:shadow-xl"
                  >
                    Request New Reset Link
                  </Button>
                  
                  <Button 
                    variant="outline"
                    onClick={() => navigate('/signin')}
                    className="w-full h-12 text-base border-midnight-ink-200 text-midnight-ink hover:bg-gray-50 rounded-full transition-all duration-300"
                  >
                    Back to Sign In
                  </Button>
                </div>
              </div>
            </div>
          </section>
        </main>
        
        <Footer />
      </div>
    );
  }

  // Success state - show success message
  if (isSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-white to-porcelain-blue-50">
        <UniversalHeader />
        
        <main className="flex-1">
          <section className="py-16 lg:py-24">
            <div className="max-w-7xl mx-auto px-6">
              <div className="max-w-md mx-auto text-center">
                {/* Success Icon */}
                <div className="mb-8">
                  <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-6">
                    <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                </div>
                
                <h1 className="text-4xl lg:text-5xl font-bold text-midnight-ink mb-6">
                  Password Updated!
                </h1>
                <p className="text-xl text-midnight-ink-600 mb-8">
                  Your password has been successfully changed. You'll be redirected to the sign-in page in a moment.
                </p>
                
                {/* Progress indicator */}
                <div className="bg-white rounded-2xl p-6 shadow-lg">
                  <div className="flex items-center justify-center mb-4">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-hanok-teal mr-3"></div>
                    <span className="text-midnight-ink">Redirecting to sign-in page...</span>
                  </div>
                  <p className="text-sm text-midnight-ink-500">
                    Please use your new password to sign in.
                  </p>
                </div>
              </div>
            </div>
          </section>
        </main>
        
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-porcelain-blue-50">
      <UniversalHeader />
      
      <main className="flex-1">
        <section className="py-16 lg:py-24">
          <div className="max-w-7xl mx-auto px-6">
            <div className="max-w-md mx-auto">
              {/* Header Section */}
              <div className="text-center mb-12">
                <h1 className="text-4xl lg:text-5xl font-bold text-midnight-ink mb-6">
                  Set New Password
                </h1>
                <p className="text-xl text-midnight-ink-600">
                  Choose a strong password for your account
                </p>
              </div>

              {/* Reset Form */}
              <Card className="border-0 shadow-lg rounded-2xl hover:shadow-xl transition-shadow duration-300 bg-white">
                <CardContent className="p-8">
                  {/* Error Message Display */}
                  {errorMessage && (
                    <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                      <div className="flex items-start">
                        <div className="flex-shrink-0">
                          <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <div className="ml-3 flex-1">
                          <h3 className="text-sm font-medium text-red-800">
                            Password Reset Error
                          </h3>
                          <div className="mt-2 text-sm text-red-700">
                            <p>{errorMessage}</p>
                          </div>
                        </div>
                        <div className="ml-auto pl-3">
                          <button
                            type="button"
                            onClick={() => setErrorMessage('')}
                            className="inline-flex text-red-400 hover:text-red-500"
                          >
                            <span className="sr-only">Dismiss</span>
                            <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  <form onSubmit={handleSubmit} className="space-y-6">
                    {/* New Password Field */}
                    <div className="space-y-2">
                      <Label htmlFor="password" className="text-sm font-medium text-midnight-ink">
                        New Password
                      </Label>
                      <div className="relative">
                        <Input
                          id="password"
                          type={showPassword ? "text" : "password"}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="h-12 text-base border-midnight-ink-200 focus:border-hanok-teal focus:ring-2 focus:ring-hanok-teal focus:ring-opacity-50 rounded-lg pr-12"
                          placeholder="Enter new password"
                          required
                          disabled={isLoading}
                        />
                        <button
                          type="button"
                          className="absolute inset-y-0 right-0 pr-3 flex items-center"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          <svg
                            className="h-5 w-5 text-gray-400 hover:text-gray-600"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            {showPassword ? (
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L6.05 6.05m3.828 3.828l4.242 4.242M4.929 19.071L19.071 4.93" />
                            ) : (
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            )}
                          </svg>
                        </button>
                      </div>
                      <div className="mt-2">
                        <p className="text-xs text-midnight-ink-500 mb-2">
                          Password requirements:
                        </p>
                        {password && (
                          <div className="space-y-1 text-xs">
                            {[
                              { test: password.length >= 8, text: "At least 8 characters" },
                              { test: /(?=.*[a-z])/.test(password), text: "One lowercase letter" },
                              { test: /(?=.*[A-Z])/.test(password), text: "One uppercase letter" },
                              { test: /(?=.*\d)/.test(password), text: "One number" }
                            ].map((req, index) => (
                              <div key={index} className={`flex items-center ${req.test ? 'text-green-600' : 'text-red-500'}`}>
                                <svg className="w-3 h-3 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                  {req.test ? (
                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                  ) : (
                                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                  )}
                                </svg>
                                {req.text}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Confirm Password Field */}
                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword" className="text-sm font-medium text-midnight-ink">
                        Confirm New Password
                      </Label>
                      <div className="relative">
                        <Input
                          id="confirmPassword"
                          type={showConfirmPassword ? "text" : "password"}
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          className="h-12 text-base border-midnight-ink-200 focus:border-hanok-teal focus:ring-2 focus:ring-hanok-teal focus:ring-opacity-50 rounded-lg pr-12"
                          placeholder="Confirm new password"
                          required
                          disabled={isLoading}
                        />
                        <button
                          type="button"
                          className="absolute inset-y-0 right-0 pr-3 flex items-center"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        >
                          <svg
                            className="h-5 w-5 text-gray-400 hover:text-gray-600"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            {showConfirmPassword ? (
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L6.05 6.05m3.828 3.828l4.242 4.242M4.929 19.071L19.071 4.93" />
                            ) : (
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            )}
                          </svg>
                        </button>
                      </div>
                      {confirmPassword && (
                        <div className="mt-2">
                          <div className={`flex items-center text-xs ${password === confirmPassword ? 'text-green-600' : 'text-red-500'}`}>
                            <svg className="w-3 h-3 mr-2" fill="currentColor" viewBox="0 0 20 20">
                              {password === confirmPassword ? (
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              ) : (
                                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                              )}
                            </svg>
                            {password === confirmPassword ? 'Passwords match' : 'Passwords do not match'}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Submit Button */}
                    <Button 
                      type="submit" 
                      className="w-full h-12 text-base bg-hanok-teal hover:bg-hanok-teal-600 text-white font-medium rounded-full transition-all duration-300 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed" 
                      disabled={isLoading || !password || !confirmPassword}
                    >
                      {isLoading ? (
                        <div className="flex items-center justify-center">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          <span>
                            {isSuccess ? 'Password Updated!' : 'Updating Password...'}
                          </span>
                        </div>
                      ) : (
                        'Update Password'
                      )}
                    </Button>
                    
                    {/* Progress indicator when loading */}
                    {isLoading && !isSuccess && (
                      <div className="mt-4 text-center">
                        <p className="text-sm text-midnight-ink-500">
                          Please wait while we securely update your password...
                        </p>
                      </div>
                    )}
                  </form>
                </CardContent>
              </Card>

              {/* Security Info */}
              <div className="mt-8 text-center">
                <p className="text-sm text-midnight-ink-500">
                  After updating your password, you'll be signed out and redirected to the sign-in page.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>
      
      <Footer />
    </div>
  );
};

export default ResetPasswordPage;