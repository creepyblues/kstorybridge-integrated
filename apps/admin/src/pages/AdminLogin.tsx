import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { Eye, EyeOff, Shield, AlertCircle } from 'lucide-react';
import { testSupabaseConnection, testAdminEmailExists } from '@/utils/testSupabase';
import ConnectionStatus from '@/components/ConnectionStatus';

export default function AdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<string>('');
  const [isRetrying, setIsRetrying] = useState(false);
  const [isConnectionHealthy, setIsConnectionHealthy] = useState<boolean | null>(null);
  
  const { signIn } = useAdminAuth();
  const navigate = useNavigate();

  // Test Supabase connection on component mount
  useEffect(() => {
    const runConnectionTest = async () => {
      setConnectionStatus('🔄 Testing connection...');
      const result = await testSupabaseConnection();
      if (result.success) {
        setConnectionStatus('✅ Connected to Supabase');
        setError(''); // Clear any previous errors
      } else {
        setConnectionStatus('❌ Connection issues detected');
        if (result.details?.title_error?.message?.includes('401') || 
            result.details?.admin_error?.message?.includes('401')) {
          setError('Database authentication issue detected. The system is attempting to resolve this automatically.');
        } else {
          setError('Database connection failed. Please try again later.');
        }
      }
    };
    
    runConnectionTest();
  }, []);

  const retryConnection = async () => {
    setIsRetrying(true);
    setError('');
    setConnectionStatus('🔄 Retrying connection...');
    
    const result = await testSupabaseConnection();
    if (result.success) {
      setConnectionStatus('✅ Connected to Supabase');
    } else {
      setConnectionStatus('❌ Connection still failing');
      setError('Unable to establish database connection. Please contact IT support.');
    }
    setIsRetrying(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    // First check if the email exists in admin table
    const adminCheck = await testAdminEmailExists(email);
    if (adminCheck.error && adminCheck.error.message?.includes('401')) {
      setError('Database authentication issue. Please wait a moment and try again.');
      setIsLoading(false);
      return;
    }
    if (!adminCheck.exists) {
      setError(`Email ${email} is not authorized for admin access. Contact IT support.`);
      setIsLoading(false);
      return;
    }

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
          <div className="mt-3 flex justify-center">
            <ConnectionStatus 
              showRetryButton={true}
              onConnectionChange={setIsConnectionHealthy}
            />
          </div>
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
                    <div className="flex-1">
                      <p className="text-red-600 text-sm">{error}</p>
                      {(error.includes('connection') || error.includes('authentication issue')) && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={retryConnection}
                          disabled={isRetrying}
                          className="mt-2 text-xs h-7"
                        >
                          {isRetrying ? 'Retrying...' : 'Retry Connection'}
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              )}

              <Button
                type="submit"
                disabled={isLoading || isConnectionHealthy === false}
                className="w-full bg-hanok-teal hover:bg-hanok-teal/90 text-white py-3 rounded-xl font-medium transition-colors disabled:opacity-50"
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