import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { completeOAuthProfile } from '@/lib/auth';
import { Icon } from '@iconify/react';
import { sendWelcomeEmail } from '@/services/emailService';
import { notifyBuyerSignup } from '@/utils/slack';
import { getTrialSessionId } from '@/contexts/TrialContext';
import { trackSignup } from '@/utils/analytics';

// 🚨 AUTH ISOLATION BOUNDARY
// This page handles profile completion only - no business logic

export default function CompleteProfile() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, session } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    full_name: '',
    buyer_company: '',
    buyer_role: '',
    linkedin_url: '',
  });

  // 🚨 CRITICAL: Prefer authenticated user data over sessionStorage to prevent tampering
  // SessionStorage is only used as fallback during OAuth redirect timing edge cases
  const storedUserId = sessionStorage.getItem('oauth_user_id');
  const storedEmail = sessionStorage.getItem('oauth_user_email');

  // Always prefer authenticated user data - sessionStorage is backup only
  const userId = user?.id ?? storedUserId;
  const email = user?.email ?? storedEmail;

  // Track form view on mount
  useEffect(() => {
    trackSignup('form_viewed', 'google');
  }, []);

  useEffect(() => {
    if (user && user.user_metadata?.full_name) {
      setFormData((prev) => ({
        ...prev,
        full_name: user.user_metadata.full_name,
      }));
    }
  }, [user]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (!userId || !email) {
      toast({
        title: 'Error',
        description: 'Missing user information. Please try signing up again.',
        variant: 'destructive',
      });
      setLoading(false);
      return;
    }

    if (!formData.full_name.trim()) {
      toast({
        title: 'Error',
        description: 'Full name is required',
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
      // Get trial session ID if user came from trial
      const trialSessionId = getTrialSessionId();

      await completeOAuthProfile(userId, email, {
        full_name: formData.full_name,
        buyer_company: formData.buyer_company,
        buyer_role: formData.buyer_role,
        linkedin_url: formData.linkedin_url,
        trial_session_id: trialSessionId || undefined,
      }, session);

      // Track successful OAuth signup completion
      trackSignup('completed', 'google', { role: formData.buyer_role });

      // Send Slack notification (non-blocking)
      notifyBuyerSignup({
        fullName: formData.full_name,
        email: email,
        company: formData.buyer_company,
        role: formData.buyer_role,
        authType: 'google',
        linkedinUrl: formData.linkedin_url,
      }).catch(console.warn);

      // Send welcome email (non-blocking)
      sendWelcomeEmail({
        userName: formData.full_name,
        userEmail: email.toLowerCase(),
        accountType: 'buyer',
        dashboardUrl: `${window.location.origin}/buyers/home`,
        loginUrl: `${window.location.origin}/signin`,
      }).catch((err) => {
        // Log but don't block - welcome email is not critical
        console.warn('Welcome email failed:', err);
      });

      // Clear OAuth sessionStorage after successful profile creation
      sessionStorage.removeItem('oauth_user_id');
      sessionStorage.removeItem('oauth_user_email');

      toast({
        title: 'Profile Created!',
        description: 'Welcome to KStoryBridge',
      });

      navigate('/buyers/home');
    } catch (error: any) {
      // Track signup error
      trackSignup('error', 'google', {
        error: error.message?.substring(0, 50) || 'Unknown error'
      });

      toast({
        title: 'Profile Creation Failed',
        description: error.message || 'Please try again',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-12">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl">Complete Your Profile</CardTitle>
          <CardDescription>
            Almost done! Tell us a bit about yourself
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
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

            <Button type="submit" className="w-full" disabled={loading}>
              {loading && <Icon icon="solar:refresh-circle-bold-duotone" className="mr-2 h-4 w-4 animate-spin" />}
              Complete Profile
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
