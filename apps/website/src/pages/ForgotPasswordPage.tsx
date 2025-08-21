import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@kstorybridge/ui';
import { Input } from '@kstorybridge/ui';
import { Label } from '@kstorybridge/ui';
import { Card, CardContent } from '@kstorybridge/ui';
import { useToast } from '../hooks/use-toast';
import { supabase } from '../integrations/supabase/client';
import UniversalHeader from '../components/UniversalHeader';
import Footer from '../components/Footer';

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isEmailSent, setIsEmailSent] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (!email.trim()) {
        toast({
          title: "Error",
          description: "Please enter your email address",
          variant: "destructive"
        });
        return;
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        toast({
          title: "Invalid Email",
          description: "Please enter a valid email address",
          variant: "destructive"
        });
        return;
      }

      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) {
        console.error('Password reset error:', error);
        toast({
          title: "Reset Error",
          description: error.message,
          variant: "destructive"
        });
      } else {
        setIsEmailSent(true);
        toast({
          title: "Reset Email Sent",
          description: "Please check your email for password reset instructions",
          duration: 6000
        });
      }
    } catch (error) {
      console.error('Unexpected error during password reset:', error);
      toast({
        title: "Unexpected Error",
        description: "Something went wrong. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isEmailSent) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-white to-porcelain-blue-50">
        <UniversalHeader />
        
        <main className="flex-1">
          <section className="py-16 lg:py-24">
            <div className="max-w-7xl mx-auto px-6">
              <div className="max-w-md mx-auto">
                {/* Success Message */}
                <div className="text-center mb-12">
                  <div className="mb-6">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
                      <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                    </div>
                  </div>
                  <h1 className="text-4xl lg:text-5xl font-bold text-midnight-ink mb-6">
                    Check Your Email
                  </h1>
                  <p className="text-xl text-midnight-ink-600 mb-4">
                    We've sent password reset instructions to:
                  </p>
                  <p className="text-lg font-medium text-hanok-teal mb-8">
                    {email}
                  </p>
                  <div className="text-sm text-midnight-ink-500 space-y-2">
                    <p>If you don't see the email in your inbox, please check your spam folder.</p>
                    <p>The reset link will expire in 1 hour for security.</p>
                  </div>
                </div>

                {/* Actions */}
                <Card className="border-0 shadow-lg rounded-2xl hover:shadow-xl transition-shadow duration-300 bg-white">
                  <CardContent className="p-8 text-center space-y-4">
                    <p className="text-midnight-ink-600 mb-6">
                      Didn't receive the email?
                    </p>
                    
                    <Button 
                      onClick={() => {
                        setIsEmailSent(false);
                        setEmail('');
                      }}
                      className="w-full h-12 text-base bg-hanok-teal hover:bg-hanok-teal-600 text-white font-medium rounded-full transition-all duration-300 shadow-lg hover:shadow-xl mb-4"
                    >
                      Try Again
                    </Button>

                    <div className="border-t border-midnight-ink-100 pt-6">
                      <p className="text-center text-midnight-ink-600">
                        Remember your password?{' '}
                        <Link 
                          to="/signin" 
                          className="font-medium text-hanok-teal hover:text-hanok-teal-600 transition-colors"
                        >
                          Sign in instead
                        </Link>
                      </p>
                    </div>
                  </CardContent>
                </Card>
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
                  Reset Password
                </h1>
                <p className="text-xl text-midnight-ink-600">
                  Enter your email address and we'll send you instructions to reset your password
                </p>
              </div>

              {/* Reset Form */}
              <Card className="border-0 shadow-lg rounded-2xl hover:shadow-xl transition-shadow duration-300 bg-white">
                <CardContent className="p-8">
                  <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Email Field */}
                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-sm font-medium text-midnight-ink">
                        Email address
                      </Label>
                      <Input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="h-12 text-base border-midnight-ink-200 focus:border-hanok-teal focus:ring-2 focus:ring-hanok-teal focus:ring-opacity-50 rounded-lg"
                        placeholder="Enter your email address"
                        required
                        disabled={isLoading}
                      />
                    </div>

                    {/* Submit Button */}
                    <Button 
                      type="submit" 
                      className="w-full h-12 text-base bg-hanok-teal hover:bg-hanok-teal-600 text-white font-medium rounded-full transition-all duration-300 shadow-lg hover:shadow-xl" 
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <div className="flex items-center justify-center">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Sending Reset Email...
                        </div>
                      ) : (
                        'Send Reset Instructions'
                      )}
                    </Button>
                  </form>

                  {/* Back to Sign In */}
                  <div className="mt-8 pt-6 border-t border-midnight-ink-100">
                    <p className="text-center text-midnight-ink-600">
                      Remember your password?{' '}
                      <Link 
                        to="/signin" 
                        className="font-medium text-hanok-teal hover:text-hanok-teal-600 transition-colors"
                      >
                        Sign in instead
                      </Link>
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Additional Info */}
              <div className="mt-8 text-center">
                <p className="text-sm text-midnight-ink-500">
                  For security reasons, the reset link will expire in 1 hour.
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

export default ForgotPasswordPage;