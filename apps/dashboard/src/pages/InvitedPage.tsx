import { useAuth } from '@/hooks/useAuth';
import { Button } from '@kstorybridge/ui';

const InvitedPage = () => {
  const { signOut } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-porcelain-blue-50 flex items-center justify-center px-6">
      <div className="max-w-md mx-auto text-center">
        <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mb-6 mx-auto">
          <svg className="w-8 h-8 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        
        <h1 className="text-3xl font-bold text-midnight-ink mb-4">
          Account Under Review
        </h1>
        
        <p className="text-lg text-midnight-ink-600 mb-8">
          Thank you for signing up! Your account is currently being reviewed by our team. 
          You'll receive an email notification once your access has been approved.
        </p>
        
        <div className="space-y-4">
          <p className="text-sm text-midnight-ink-500">
            This process typically takes 1-2 business days. If you have any questions, 
            please don't hesitate to reach out to our support team.
          </p>
          
          <div className="pt-4">
            <a 
              href="mailto:support@kstorybridge.com" 
              className="text-hanok-teal hover:text-hanok-teal-600 font-medium text-sm"
            >
              support@kstorybridge.com
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

export default InvitedPage;