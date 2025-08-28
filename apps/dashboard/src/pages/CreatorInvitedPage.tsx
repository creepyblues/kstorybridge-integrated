import { useAuth } from '@/hooks/useAuth';
import { Button } from '@kstorybridge/ui';

const CreatorInvitedPage = () => {
  const { signOut } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-porcelain-blue-50 flex items-center justify-center px-6">
      <div className="max-w-md mx-auto text-center">
        <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mb-6 mx-auto">
          <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
          </svg>
        </div>
        
        <h1 className="text-3xl font-bold text-midnight-ink mb-4">
          Creator Account Pending
        </h1>
        
        <p className="text-lg text-midnight-ink-600 mb-8">
          Welcome to KStoryBridge! Your creator account is currently under review. 
          Our team is reviewing your application to ensure quality and authenticity.
        </p>
        
        <div className="space-y-4">
          <p className="text-sm text-midnight-ink-500">
            Once approved, you'll be able to showcase your creative works and connect 
            with buyers from around the world. We'll send you an email notification 
            when your account is ready.
          </p>
          
          <div className="pt-4">
            <a 
              href="mailto:support@kstorybridge.com" 
              className="text-hanok-teal hover:text-hanok-teal-600 font-medium text-sm"
            >
              Questions? Contact us at support@kstorybridge.com
            </a>
          </div>
          
          <div className="pt-8">
            <Button
              onClick={() => signOut()}
              variant="outline"
              className="w-full"
            >
              Sign Out
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreatorInvitedPage;