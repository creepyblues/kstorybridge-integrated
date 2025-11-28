import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { signUpWithEmail, signInWithOAuth } from '@/lib/auth';
import { Loader2 } from 'lucide-react';

export default function SignUp() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    full_name: '',
    buyer_company: '',
    buyer_role: '',
    linkedin_url: '',
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleEmailSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Validate required fields
    if (!formData.full_name.trim()) {
      toast({
        title: 'Error',
        description: 'Full name is required',
        variant: 'destructive',
      });
      setLoading(false);
      return;
    }

    if (!formData.email.trim()) {
      toast({
        title: 'Error',
        description: 'Email is required',
        variant: 'destructive',
      });
      setLoading(false);
      return;
    }

    if (!formData.password) {
      toast({
        title: 'Error',
        description: 'Password is required',
        variant: 'destructive',
      });
      setLoading(false);
      return;
    }

    if (formData.password.length < 6) {
      toast({
        title: 'Error',
        description: 'Password must be at least 6 characters',
        variant: 'destructive',
      });
      setLoading(false);
      return;
    }

    if (!formData.buyer_company.trim()) {
      toast({
        title: 'Error',
        description: 'Company is required',
        variant: 'destructive',
      });
      setLoading(false);
      return;
    }

    if (!formData.buyer_role) {
      toast({
        title: 'Error',
        description: 'Role is required',
        variant: 'destructive',
      });
      setLoading(false);
      return;
    }

    try {
      await signUpWithEmail(formData.email, formData.password, {
        full_name: formData.full_name,
        buyer_company: formData.buyer_company,
        buyer_role: formData.buyer_role,
        linkedin_url: formData.linkedin_url,
      });

      toast({
        title: 'Check your email',
        description: 'We sent you a verification link. Please verify your email to sign in.',
      });

      setTimeout(() => {
        navigate('/signin');
      }, 2000);
    } catch (error: any) {
      toast({
        title: 'Sign Up Failed',
        description: error.message || 'Please try again',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleOAuthSignUp = async () => {
    try {
      await signInWithOAuth('buyer', 'signup');
      // User will be redirected to Google OAuth
    } catch (error: any) {
      toast({
        title: 'OAuth Sign Up Failed',
        description: error.message || 'Please try again',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-white to-porcelain-blue-50 px-4 py-12">
      <Card className="w-full max-w-md shadow-xl border-0">
        <CardHeader className="space-y-1 pb-6">
          <CardTitle className="text-3xl font-bold text-midnight-ink">Producer Sign Up</CardTitle>
          <CardDescription className="text-base text-midnight-ink-600">
            Create your producer account
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <Button
            type="button"
            className="w-full h-14 bg-white hover:bg-gray-50 text-gray-900 border border-gray-300 shadow-sm text-base font-medium"
            onClick={handleOAuthSignUp}
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

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-gray-300" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="bg-white px-3 text-gray-500">or</span>
            </div>
          </div>

          <form onSubmit={handleEmailSignUp} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="full_name">
                Full Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="full_name"
                name="full_name"
                type="text"
                placeholder="John Doe"
                value={formData.full_name}
                onChange={handleInputChange}
                required
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">
                Work Email <span className="text-red-500">*</span>
              </Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="you@company.com"
                value={formData.email}
                onChange={handleInputChange}
                required
                disabled={loading}
              />
              <p className="text-xs text-gray-500">
                Personal email domains (Gmail, Yahoo, etc.) are not allowed
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">
                Password <span className="text-red-500">*</span>
              </Label>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="••••••••"
                value={formData.password}
                onChange={handleInputChange}
                required
                disabled={loading}
                minLength={6}
              />
              <p className="text-xs text-gray-500">
                At least 6 characters
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="buyer_company">Company <span className="text-red-500">*</span></Label>
              <Input
                id="buyer_company"
                name="buyer_company"
                type="text"
                placeholder="ABC Studios"
                value={formData.buyer_company}
                onChange={handleInputChange}
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="buyer_role">Role <span className="text-red-500">*</span></Label>
              <select
                id="buyer_role"
                name="buyer_role"
                value={formData.buyer_role}
                onChange={handleInputChange}
                disabled={loading}
                className="flex h-10 w-full rounded-md border border-gray-300 bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <option value="">Select role</option>
                <option value="producer">Producer</option>
                <option value="executive">Executive</option>
                <option value="agent">Agent</option>
                <option value="content_scout">Content Scout</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="linkedin_url">LinkedIn URL</Label>
              <Input
                id="linkedin_url"
                name="linkedin_url"
                type="url"
                placeholder="https://linkedin.com/in/yourprofile"
                value={formData.linkedin_url}
                onChange={handleInputChange}
                disabled={loading}
              />
            </div>

            <Button
              type="submit"
              className="w-full h-14 bg-hanok-teal hover:bg-hanok-teal/90 text-white text-base font-medium"
              disabled={loading}
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {loading ? 'Creating Account...' : 'Create Account'}
            </Button>
          </form>

          <div className="text-center text-sm text-gray-600">
            Already have a producer account?{' '}
            <Link to="/signin" className="text-hanok-teal hover:text-hanok-teal/80 font-medium">
              Sign in here
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
