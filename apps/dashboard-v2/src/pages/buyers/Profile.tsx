import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useTierAccess } from '@/contexts/TierContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';
import { signOut } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { BuyerLayout } from '@/components/layout/BuyerLayout';
import { ProBadge } from '@/components/tier/ProBadge';
import { Loader2, User, Mail, Building, Briefcase, Linkedin, LogOut } from 'lucide-react';

interface BuyerProfile {
  email: string;
  full_name: string;
  buyer_company?: string;
  buyer_role?: string;
  linkedin_url?: string;
  tier: 'basic' | 'invited' | 'pro' | 'suite';
  created_at: string;
}

export default function Profile() {
  const { user } = useAuth();
  const { tier, loading: tierLoading } = useTierAccess();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [profile, setProfile] = useState<BuyerProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/signin');
    } catch (error) {
      console.error('Sign out error:', error);
      toast({
        title: 'Error',
        description: 'Failed to sign out. Please try again.',
        variant: 'destructive',
      });
    }
  };

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user?.email) return;

      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('user_buyers')
          .select('*')
          .eq('email', user.email.toLowerCase())
          .maybeSingle();

        if (error) {
          console.error('Error fetching profile:', error);
          throw new Error('Failed to fetch profile');
        }

        if (data) {
          setProfile(data as BuyerProfile);
        }
      } catch (error: any) {
        console.error('Profile fetch error:', error);
        toast({
          title: 'Error',
          description: error.message || 'Failed to load profile',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [user?.email, toast]);

  if (loading || tierLoading) {
    return (
      <BuyerLayout>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </div>
      </BuyerLayout>
    );
  }

  if (!profile) {
    return (
      <BuyerLayout>
        <div className="flex flex-col items-center justify-center py-12">
          <p className="text-gray-500 text-lg mb-4">Profile not found</p>
          <Button variant="outline" onClick={() => navigate('/buyers/titles')}>
            Go to Titles
          </Button>
        </div>
      </BuyerLayout>
    );
  }

  return (
    <BuyerLayout>
      <div className="max-w-4xl mx-auto">
        {/* Page Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-black">Profile</h1>
          <p className="text-sm text-gray-600 mt-1">Manage your account and subscription</p>
        </div>
        {/* Profile Header */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                <div className="bg-hanok-teal/10 rounded-full p-4">
                  <User className="h-12 w-12 text-hanok-teal" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-black mb-1">
                    {profile.full_name}
                  </h2>
                  <div className="flex items-center gap-2 text-gray-600">
                    <Mail className="h-4 w-4" />
                    <span className="text-sm">{profile.email}</span>
                  </div>
                </div>
              </div>
              <ProBadge tier={tier} size="lg" />
            </div>
          </CardContent>
        </Card>

        {/* Account Information */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <h3 className="text-lg font-bold text-black mb-4">Account Information</h3>
            <div className="space-y-4">
              {/* Company */}
              {profile.buyer_company && (
                <div className="flex items-start gap-3">
                  <Building className="h-5 w-5 text-gray-400 mt-0.5" />
                  <div>
                    <div className="text-sm text-gray-500">Company</div>
                    <div className="text-base text-black">{profile.buyer_company}</div>
                  </div>
                </div>
              )}

              {/* Role */}
              {profile.buyer_role && (
                <div className="flex items-start gap-3">
                  <Briefcase className="h-5 w-5 text-gray-400 mt-0.5" />
                  <div>
                    <div className="text-sm text-gray-500">Role</div>
                    <div className="text-base text-black">{profile.buyer_role}</div>
                  </div>
                </div>
              )}

              {/* LinkedIn */}
              {profile.linkedin_url && (
                <div className="flex items-start gap-3">
                  <Linkedin className="h-5 w-5 text-gray-400 mt-0.5" />
                  <div>
                    <div className="text-sm text-gray-500">LinkedIn</div>
                    <a
                      href={profile.linkedin_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-base text-hanok-teal hover:underline"
                    >
                      View Profile
                    </a>
                  </div>
                </div>
              )}

              {/* Member Since */}
              <div className="flex items-start gap-3">
                <User className="h-5 w-5 text-gray-400 mt-0.5" />
                <div>
                  <div className="text-sm text-gray-500">Member Since</div>
                  <div className="text-base text-black">
                    {new Date(profile.created_at).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tier Information */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <h3 className="text-lg font-bold text-black mb-4">Subscription Tier</h3>
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-2xl font-bold text-black capitalize">{tier}</span>
                  <ProBadge tier={tier} size="md" />
                </div>
                <p className="text-sm text-gray-600">
                  {tier === 'basic' && 'Access to basic features and browse titles'}
                  {tier === 'invited' && 'Invited user with limited access'}
                  {tier === 'pro' && 'Access to pitch decks and premium features'}
                  {tier === 'suite' && 'Full access to all features and priority support'}
                </p>
              </div>
            </div>

            {/* Tier Benefits */}
            <div className="border-t border-gray-200 pt-4 mt-4">
              <div className="text-sm font-medium text-gray-700 mb-2">Your Benefits:</div>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-center gap-2">
                  <span className="text-green-500">✓</span>
                  Browse all titles
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-500">✓</span>
                  AI chatbot assistance
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-500">✓</span>
                  Save favorite titles
                </li>
                {(tier === 'pro' || tier === 'suite') && (
                  <>
                    <li className="flex items-center gap-2">
                      <span className="text-green-500">✓</span>
                      Access to pitch decks
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-green-500">✓</span>
                      Premium title analytics
                    </li>
                  </>
                )}
                {tier === 'suite' && (
                  <>
                    <li className="flex items-center gap-2">
                      <span className="text-green-500">✓</span>
                      Priority support
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-green-500">✓</span>
                      Early access to new titles
                    </li>
                  </>
                )}
              </ul>
            </div>

            {/* Upgrade CTA (if not Suite) */}
            {tier !== 'suite' && (
              <div className="border-t border-gray-200 pt-4 mt-4">
                <Button
                  onClick={() => navigate('/buyers/plan')}
                  className="w-full bg-pro-purple hover:bg-pro-purple/90"
                >
                  Upgrade to {tier === 'basic' || tier === 'invited' ? 'Pro' : 'Suite'}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Account Actions */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <h3 className="text-lg font-bold text-black mb-4">Account Actions</h3>
            <p className="text-sm text-gray-600 mb-4">
              Sign out of your account. You'll need to sign in again to access your dashboard.
            </p>
            <Button
              variant="outline"
              onClick={handleSignOut}
              className="border-gray-300 hover:bg-gray-100"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </CardContent>
        </Card>

      </div>
    </BuyerLayout>
  );
}
