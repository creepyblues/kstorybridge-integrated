import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { Eye, EyeOff, Shield, AlertCircle } from 'lucide-react';
// Removed connection testing dependencies - authenticate first approach

export default function AdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  // Simplified state - no connection testing needed
  
  const { signIn } = useAdminAuth();
  const navigate = useNavigate();

  // No connection testing needed - authenticate first

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    // Skip admin check before authentication - let auth flow handle it

    const { error } = await signIn(email, password);
    
    if (error) {
      console.error('Login error details:', error);
      
      // Provide specific error messages based on error code
      if (error.message?.includes('Invalid login credentials')) {
        setError('Invalid email or password. Please check your credentials.');
      } else if (error.message?.includes('Email not confirmed')) {
        setError('Email not confirmed. Please check your email for confirmation link.');
      } else if (error.message?.includes('Too many requests')) {
        setError('Too many login attempts. Please wait a few minutes and try again.');
      } else {
        setError(`Login failed: ${error.message || 'Unknown error occurred'}`);
      }
    } else {
      navigate('/titles');
    }
    
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-porcelain-blue-50 flex items-center justify-center px-6">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-hanok-teal rounded-full flex items-center justify-center">
              <Shield className="w-8 h-8 text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-midnight-ink mb-2">Admin Portal</h1>
          <p className="text-midnight-ink-600">KStoryBridge Administration</p>
          <p className="text-sm text-midnight-ink-500 mt-2">
            Secure admin authentication
          </p>
        </div>

        <Card className="bg-white border-porcelain-blue-200 shadow-lg rounded-2xl">
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-xl text-midnight-ink">Sign In</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-midnight-ink font-medium">
                  Email Address
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@kstorybridge.com"
                  required
                  className="bg-porcelain-blue-50 border-porcelain-blue-200 rounded-xl focus:ring-hanok-teal focus:border-hanok-teal"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-midnight-ink font-medium">
                  Password
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    required
                    className="bg-porcelain-blue-50 border-porcelain-blue-200 rounded-xl focus:ring-hanok-teal focus:border-hanok-teal pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-midnight-ink-400 hover:text-midnight-ink-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
                    <p className="text-red-600 text-sm">{error}</p>
                  </div>
                </div>
              )}

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full bg-hanok-teal hover:bg-hanok-teal/90 text-white py-3 rounded-xl font-medium transition-colors"
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Signing In...
                  </div>
                ) : (
                  'Sign In'
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="text-center mt-6">
          <p className="text-midnight-ink-500 text-sm">
            Authorized personnel only. Contact IT support if you need access.
          </p>
        </div>
      </div>
    </div>
  );
}