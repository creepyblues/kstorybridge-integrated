import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@kstorybridge/ui';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@kstorybridge/ui';
import { Badge } from '@kstorybridge/ui';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

const AccountTypeSelectionPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [userEmail, setUserEmail] = useState('');

  useEffect(() => {
    // Get user email from URL params or current session
    const urlEmail = searchParams.get('email');
    if (urlEmail) {
      setUserEmail(urlEmail);
    } else if (user?.email) {
      setUserEmail(user.email);
    } else {
      // If no user info available, redirect to signin
      navigate('/signin');
    }
  }, [searchParams, user, navigate]);

  const handleAccountTypeSelection = async (accountType: 'buyer' | 'creator') => {
    setIsLoading(true);

    try {
      console.log(`🎯 Account Type Selection: User selected ${accountType}`);

      // Get current user to verify session
      const { data: { user: currentUser }, error: sessionError } = await supabase.auth.getUser();

      if (sessionError || !currentUser) {
        console.error('❌ No valid session found during account type selection');
        toast({
          title: "Session Error",
          description: "Please sign in again to continue.",
          variant: "destructive"
        });
        navigate('/signin');
        return;
      }

      // Update user metadata with selected account type
      console.log(`🔄 Updating user metadata with account_type: ${accountType}`);
      const { error: updateError } = await supabase.auth.updateUser({
        data: {
          ...currentUser.user_metadata,
          account_type: accountType,
          oauth_completion_pending: 'true'
        }
      });

      if (updateError) {
        console.error('❌ Failed to update user metadata:', updateError);
        toast({
          title: "Update Error",
          description: "Failed to update account type. Please try again.",
          variant: "destructive"
        });
        return;
      }

      console.log(`✅ Successfully updated user metadata with account_type: ${accountType}`);

      // Redirect to appropriate signup completion page
      const signupUrl = accountType === 'buyer'
        ? `/signup/buyer?complete=true&user_id=${currentUser.id}&email=${encodeURIComponent(currentUser.email || '')}`
        : `/signup/creator?complete=true&user_id=${currentUser.id}&email=${encodeURIComponent(currentUser.email || '')}`;

      console.log(`🚀 Redirecting to signup completion: ${signupUrl}`);
      navigate(signupUrl);

    } catch (error) {
      console.error('❌ Error during account type selection:', error);
      toast({
        title: "Error",
        description: "Something went wrong. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-porcelain-blue-50 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-midnight-ink mb-2">
            Welcome to KStoryBridge!
          </h1>
          <p className="text-midnight-ink-600 mb-2">
            You don't have an account yet with us.
          </p>
          <p className="text-midnight-ink-600">
            Please select which type of account you'd like to create:
          </p>
          {userEmail && (
            <Badge variant="outline" className="mt-2">
              {userEmail}
            </Badge>
          )}
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Buyer Account Option */}
          <Card className="border-2 hover:border-hanok-teal transition-colors cursor-pointer">
            <CardHeader className="text-center">
              <CardTitle className="text-hanok-teal">
                🎬 Media Buyer
              </CardTitle>
              <CardDescription>
                For producers, executives, and content scouts
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-sm text-midnight-ink-600">
                <p className="font-medium mb-2">Perfect for:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Content producers and executives</li>
                  <li>Entertainment industry professionals</li>
                  <li>Media buyers seeking Korean content</li>
                  <li>Content scouts and acquisition teams</li>
                </ul>
              </div>

              <div className="text-sm text-midnight-ink-600">
                <p className="font-medium mb-2">Requirements:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Work email address required</li>
                  <li>Company and role information</li>
                </ul>
              </div>

              <Button
                onClick={() => handleAccountTypeSelection('buyer')}
                disabled={isLoading}
                className="w-full bg-hanok-teal hover:bg-hanok-teal/90"
              >
                {isLoading ? 'Setting up...' : 'Continue as Media Buyer'}
              </Button>
            </CardContent>
          </Card>

          {/* Creator Account Option */}
          <Card className="border-2 hover:border-hanok-teal transition-colors cursor-pointer">
            <CardHeader className="text-center">
              <CardTitle className="text-hanok-teal">
                ✍️ Content Creator
              </CardTitle>
              <CardDescription>
                For authors, creators, and agents
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-sm text-midnight-ink-600">
                <p className="font-medium mb-2">Perfect for:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Authors and storytellers</li>
                  <li>Content creators and writers</li>
                  <li>Literary agents and representatives</li>
                  <li>IP owners and rights holders</li>
                </ul>
              </div>

              <div className="text-sm text-midnight-ink-600">
                <p className="font-medium mb-2">Requirements:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Any email address accepted</li>
                  <li>Pen name and role information</li>
                  <li>Account approval required</li>
                </ul>
              </div>

              <Button
                onClick={() => handleAccountTypeSelection('creator')}
                disabled={isLoading}
                className="w-full bg-hanok-teal hover:bg-hanok-teal/90"
              >
                {isLoading ? 'Setting up...' : 'Continue as Creator'}
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="text-center mt-8">
          <p className="text-sm text-midnight-ink-500">
            Already have an account?
            <Button
              variant="link"
              onClick={() => navigate('/signin')}
              className="text-hanok-teal hover:text-hanok-teal/80 p-0 ml-1"
            >
              Sign in here
            </Button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default AccountTypeSelectionPage;