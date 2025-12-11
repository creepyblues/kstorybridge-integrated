import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { signInWithEmail, signInWithOAuth, checkBuyerProfileExists } from '@/lib/auth';
import { Loader2 } from 'lucide-react';
import { trackSignin } from '@/utils/analytics';

export default function SignIn() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Track form viewed on mount
  useEffect(() => {
    trackSignin('form_viewed', 'email');
  }, []);

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Track signin attempt
    trackSignin('attempted', 'email');

    try {
      const { user } = await signInWithEmail(email, password);

      if (!user) {
        throw new Error('Sign in failed');
      }

      // Check if buyer profile exists
      const profileExists = await checkBuyerProfileExists(user.id);

      if (!profileExists) {
        trackSignin('error', 'email', { reason: 'profile_not_found' });

        toast({
          title: 'Account Not Found',
          description: 'Your account doesn\'t exist. Please sign up first.',
          variant: 'destructive',
        });

        setTimeout(() => {
          navigate('/signup');
        }, 2000);
        return;
      }

      // Track successful signin
      trackSignin('completed', 'email');

      // Success - redirect to homepage
      toast({
        title: 'Welcome back!',
        description: 'Successfully signed in',
      });

      navigate('/buyers/home');
    } catch (error: any) {
      trackSignin('error', 'email', { error: error.message?.substring(0, 50) });

      toast({
        title: 'Sign In Failed',
        description: error.message || 'Please check your credentials and try again',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleOAuthSignIn = async () => {
    // Track OAuth signin attempt
    trackSignin('attempted', 'google');

    try {
      await signInWithOAuth('buyer', 'signin');
      // User will be redirected to Google OAuth
      // Note: 'completed' tracking happens in AuthCallback
    } catch (error: any) {
      trackSignin('error', 'google', { error: error.message?.substring(0, 50) });

      toast({
        title: 'OAuth Sign In Failed',
        description: error.message || 'Please try again',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-white to-porcelain-blue-50 px-4">
      <Card className="w-full max-w-md shadow-xl border-0">
        <CardHeader className="space-y-1 pb-6">
          <CardTitle className="text-3xl font-bold text-midnight-ink">Producer Sign In</CardTitle>
          <CardDescription className="text-base text-midnight-ink-600">
            Welcome back! Sign in to your producer account.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <form onSubmit={handleEmailSignIn} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
              />
            </div>

            <Button
              type="submit"
              className="w-full h-14 bg-hanok-teal hover:bg-hanok-teal/90 text-white text-base font-medium"
              disabled={loading}
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {loading ? 'Signing in...' : 'Sign In'}
            </Button>
          </form>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-gray-300" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="bg-white px-3 text-gray-500">or</span>
            </div>
          </div>

          <Button
            type="button"
            className="w-full h-14 bg-white hover:bg-gray-50 text-gray-900 border border-gray-300 shadow-sm text-base font-medium"
            onClick={handleOAuthSignIn}
            disabled={loading}
          >
            <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              />
            </svg>
            Continue with Google
          </Button>

          <div className="text-center">
            <Link
              to="/forgot-password"
              className="text-sm text-hanok-teal hover:text-hanok-teal/80"
            >
              Forgot your password?
            </Link>
          </div>

          <div className="text-center text-sm text-gray-600">
            Don't have a producer account?{' '}
            <Link
              to="/signup"
              className="text-hanok-teal hover:text-hanok-teal/80 font-medium"
            >
              Sign up here
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
