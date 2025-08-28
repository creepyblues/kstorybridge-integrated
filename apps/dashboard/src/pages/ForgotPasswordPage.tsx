import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@kstorybridge/ui';
import { Input } from '@kstorybridge/ui';
import { Label } from '@kstorybridge/ui';
import { Card, CardContent } from '@kstorybridge/ui';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

const ForgotPasswordPage = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [emailSent, setEmailSent] = useState(false);
  
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email) {
      toast({
        title: "Email Required",
        description: "Please enter your email address.",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`
      });

      if (error) {
        console.error('Password reset error:', error);
        toast({
          title: "Reset Failed",
          description: error.message,
          variant: "destructive"
        });
      } else {
        setEmailSent(true);
        toast({
          title: "Reset Email Sent",
          description: "Please check your email for password reset instructions.",
          duration: 5000
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

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-porcelain-blue-50">
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
                  Enter your email to receive reset instructions
                </p>
              </div>

              {/* Reset Form */}
              <Card className="border-0 shadow-lg rounded-2xl hover:shadow-xl transition-shadow duration-300 bg-white">
                <CardContent className="p-8">
                  {emailSent ? (
                    <div className="text-center">
                      <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      <h3 className="text-lg font-semibold text-midnight-ink mb-2">
                        Check Your Email
                      </h3>
                      <p className="text-midnight-ink-600 mb-6">
                        We've sent password reset instructions to <strong>{email}</strong>
                      </p>
                      <p className="text-sm text-midnight-ink-500 mb-6">
                        Didn't receive the email? Check your spam folder or try again with a different email address.
                      </p>
                      <Button
                        onClick={() => {
                          setEmailSent(false);
                          setEmail('');
                        }}
                        className="w-full h-12 text-base bg-hanok-teal hover:bg-hanok-teal-600 text-white font-medium rounded-full"
                      >
                        Send Another Email
                      </Button>
                    </div>
                  ) : (
                    <form onSubmit={handleSubmit} className="space-y-6">
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
                          placeholder="Enter your email"
                          required
                        />
                      </div>

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
                          'Send Reset Email'
                        )}
                      </Button>
                    </form>
                  )}

                  {/* Back to Sign In */}
                  <div className="mt-8 pt-6 border-t border-midnight-ink-100">
                    <p className="text-center text-midnight-ink-600">
                      Remember your password?{' '}
                      <Link 
                        to="/signin" 
                        className="font-medium text-hanok-teal hover:text-hanok-teal-600 transition-colors"
                      >
                        Back to Sign In
                      </Link>
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default ForgotPasswordPage;