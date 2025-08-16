import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../integrations/supabase/client';
import { useToast } from '../hooks/use-toast';

const AuthCallbackPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // Get the session from the URL hash
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Auth callback error:', error);
          toast({
            title: "Authentication Error",
            description: error.message,
            variant: "destructive"
          });
          navigate('/signin');
          return;
        }

        if (session?.user) {
          const user = session.user;
          
          // Check if user profile exists in either table
          console.log('🔍 AUTH CALLBACK: Checking profiles for user:', { id: user.id, email: user.email });
          
          // Try both email and id as keys since different tables might use different schemas
          const [buyerProfileById, buyerProfileByEmail, ipOwnerProfileById, ipOwnerProfileByEmail] = await Promise.all([
            supabase
              .from('user_buyers')
              .select('*')
              .eq('id', user.id)
              .maybeSingle(),
            supabase
              .from('user_buyers')
              .select('*')
              .eq('email', user.email)
              .maybeSingle(),
            supabase
              .from('user_ipowners')
              .select('*')
              .eq('id', user.id)
              .maybeSingle(),
            supabase
              .from('user_ipowners')
              .select('*')
              .eq('email', user.email)
              .maybeSingle()
          ]);
          
          console.log('🔍 AUTH CALLBACK: Profile query results:', {
            buyerById: buyerProfileById,
            buyerByEmail: buyerProfileByEmail,
            ipOwnerById: ipOwnerProfileById,
            ipOwnerByEmail: ipOwnerProfileByEmail
          });
          
          // Use whichever query returned data
          const buyerProfile = buyerProfileById.data ? buyerProfileById : buyerProfileByEmail;
          const ipOwnerProfile = ipOwnerProfileById.data ? ipOwnerProfileById : ipOwnerProfileByEmail;

          // If profile exists in either table, user has completed signup
          if (buyerProfile.data || ipOwnerProfile.data) {
            // User has completed profile, redirect to dashboard
            const dashboardUrl = import.meta.env.VITE_DASHBOARD_URL || 'http://localhost:8081';
            window.location.href = dashboardUrl;
          } else {
            // No profile exists, need to complete signup
            // Store OAuth user data in session storage for the signup form
            sessionStorage.setItem('oauthUser', JSON.stringify({
              id: user.id,
              email: user.email,
              fullName: user.user_metadata?.full_name || user.user_metadata?.name || '',
              isOAuth: true
            }));
            
            // Determine account type from URL params or default to buyer
            const urlParams = new URLSearchParams(window.location.search);
            const accountType = urlParams.get('account_type') || 'buyer';
            
            // Redirect to appropriate signup completion page
            navigate(`/signup/${accountType}?complete=true`, { replace: true });
          }
        } else {
          // No session found
          navigate('/signin');
        }
      } catch (error) {
        console.error('Unexpected error in auth callback:', error);
        toast({
          title: "Unexpected Error",
          description: "Something went wrong. Please try again.",
          variant: "destructive"
        });
        navigate('/signin');
      }
    };

    handleAuthCallback();
  }, [navigate, toast]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-porcelain-blue-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-hanok-teal mx-auto mb-4"></div>
        <p className="text-lg text-midnight-ink">Completing authentication...</p>
      </div>
    </div>
  );
};

export default AuthCallbackPage;