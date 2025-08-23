import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@kstorybridge/ui';
import { Input } from '@kstorybridge/ui';
import { Label } from '@kstorybridge/ui';
import { Card, CardContent } from '@kstorybridge/ui';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@kstorybridge/ui';
import { useToast } from '../hooks/use-toast';
import { supabase } from '../integrations/supabase/client';
import { getDashboardUrl } from '../config/urls';
import UniversalHeader from '../components/UniversalHeader';
import Footer from '../components/Footer';
import { User, Building, Briefcase, Linkedin, ArrowRight } from 'lucide-react';

const ProfileCompletionPage = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [existingProfile, setExistingProfile] = useState<any>(null);
  const [formData, setFormData] = useState({
    fullName: '',
    buyerCompany: '',
    buyerRole: '',
    linkedinUrl: ''
  });
  
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    const checkUserAndProfile = async () => {
      try {
        // Check if user is authenticated
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error || !session?.user) {
          console.error('No authenticated user found:', error);
          toast({
            title: "Authentication Required",
            description: "Please sign in to complete your profile.",
            variant: "destructive"
          });
          navigate('/signin');
          return;
        }

        setUser(session.user);

        // Check existing profile
        const { data: profile, error: profileError } = await supabase
          .from('user_buyers')
          .select('*')
          .eq('email', session.user.email)
          .maybeSingle();

        if (profileError) {
          console.error('Error fetching profile:', profileError);
          toast({
            title: "Profile Error",
            description: "Unable to load your profile. Please try again.",
            variant: "destructive"
          });
          return;
        }

        if (profile) {
          setExistingProfile(profile);
          // Pre-fill form with existing data
          setFormData({
            fullName: profile.full_name || session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || '',
            buyerCompany: profile.buyer_company || '',
            buyerRole: profile.buyer_role || '',
            linkedinUrl: profile.linkedin_url || ''
          });
        } else {
          // No profile exists, create basic one first
          const { error: createError } = await supabase
            .from('user_buyers')
            .insert({
              id: session.user.id,
              email: session.user.email,
              full_name: session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || 'User',
              tier: 'basic',
              created_at: new Date().toISOString()
            });

          if (createError && createError.code !== '23505') {
            console.error('Error creating basic profile:', createError);
          }

          setFormData({
            fullName: session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || '',
            buyerCompany: '',
            buyerRole: '',
            linkedinUrl: ''
          });
        }
      } catch (error) {
        console.error('Error in profile check:', error);
        toast({
          title: "Unexpected Error",
          description: "Something went wrong. Please try again.",
          variant: "destructive"
        });
        navigate('/signin');
      }
    };

    checkUserAndProfile();
  }, [toast, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Validate required fields
      if (!formData.fullName || !formData.buyerCompany) {
        toast({
          title: "Missing Information",
          description: "Please fill in all required fields (Full Name and Company).",
          variant: "destructive"
        });
        setIsLoading(false);
        return;
      }

      // Update user profile
      const { error } = await supabase
        .from('user_buyers')
        .update({
          full_name: formData.fullName,
          buyer_company: formData.buyerCompany,
          buyer_role: formData.buyerRole || null,
          linkedin_url: formData.linkedinUrl || null,
          updated_at: new Date().toISOString()
        })
        .eq('email', user.email);

      if (error) {
        console.error('Error updating profile:', error);
        toast({
          title: "Update Failed",
          description: error.message,
          variant: "destructive"
        });
        setIsLoading(false);
        return;
      }

      toast({
        title: "Profile Completed!",
        description: "Your profile has been updated successfully. Welcome to KStoryBridge!",
        duration: 5000
      });

      // Redirect to dashboard
      setTimeout(() => {
        redirectToDashboard();
      }, 2000);

    } catch (error) {
      console.error('Unexpected error:', error);
      toast({
        title: "Unexpected Error",
        description: "Something went wrong. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const redirectToDashboard = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      const dashboardUrl = getDashboardUrl();
      const sessionParams = new URLSearchParams({
        access_token: session.access_token,
        refresh_token: session.refresh_token || '',
        expires_at: session.expires_at?.toString() || '',
        token_type: session.token_type || 'bearer'
      });
      const finalUrl = `${dashboardUrl}?${sessionParams.toString()}`;
      window.location.href = finalUrl;
    }
  };

  const updateFormData = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-white to-porcelain-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-hanok-teal mx-auto mb-4"></div>
          <p className="text-lg text-midnight-ink">Loading your profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-porcelain-blue-50">
      <UniversalHeader />
      
      <main className="flex-1">
        <section className="py-16 lg:py-24">
          <div className="max-w-7xl mx-auto px-6">
            <div className="max-w-2xl mx-auto">
              {/* Header Section */}
              <div className="text-center mb-12">
                <div className="flex justify-center mb-6">
                  <User className="w-16 h-16 text-hanok-teal" />
                </div>
                <h1 className="text-4xl lg:text-5xl font-bold text-midnight-ink mb-6">
                  Complete Your Profile
                </h1>
                <p className="text-xl text-midnight-ink-600">
                  Help us personalize your experience by completing your profile information.
                </p>
                {user.email && (
                  <p className="text-sm text-midnight-ink-500 mt-4 bg-porcelain-blue-50 px-4 py-2 rounded-lg">
                    Profile for: <strong>{user.email}</strong>
                  </p>
                )}
              </div>

              {/* Progress indicator */}
              <div className="mb-8">
                <div className="flex items-center justify-center space-x-4 text-sm text-midnight-ink-600">
                  <div className="flex items-center">
                    <div className="w-8 h-8 bg-hanok-teal text-white rounded-full flex items-center justify-center text-xs font-semibold">
                      1
                    </div>
                    <span className="ml-2">Password Set</span>
                  </div>
                  <ArrowRight className="w-4 h-4 text-gray-400" />
                  <div className="flex items-center">
                    <div className="w-8 h-8 bg-hanok-teal text-white rounded-full flex items-center justify-center text-xs font-semibold">
                      2
                    </div>
                    <span className="ml-2">Complete Profile</span>
                  </div>
                  <ArrowRight className="w-4 h-4 text-gray-400" />
                  <div className="flex items-center">
                    <div className="w-8 h-8 bg-gray-300 text-gray-600 rounded-full flex items-center justify-center text-xs font-semibold">
                      3
                    </div>
                    <span className="ml-2">Access Dashboard</span>
                  </div>
                </div>
              </div>

              {/* Profile Form */}
              <Card className="border-0 shadow-lg rounded-2xl hover:shadow-xl transition-shadow duration-300 bg-white">
                <CardContent className="p-8 md:p-12">
                  <form onSubmit={handleSubmit} className="space-y-8">
                    {/* Basic Information */}
                    <div className="space-y-6">
                      <h3 className="text-lg font-semibold text-midnight-ink flex items-center">
                        <User className="w-5 h-5 mr-2 text-hanok-teal" />
                        Basic Information
                      </h3>
                      
                      <div>
                        <Label htmlFor="fullName" className="text-base mb-2 block text-midnight-ink">
                          Full Name *
                        </Label>
                        <Input
                          id="fullName"
                          value={formData.fullName}
                          onChange={(e) => updateFormData('fullName', e.target.value)}
                          required
                          className="h-12 text-base border-midnight-ink-200 focus:border-hanok-teal focus:ring-2 focus:ring-hanok-teal focus:ring-opacity-50 rounded-lg"
                          placeholder="Enter your full name"
                        />
                      </div>
                    </div>

                    {/* Company Information */}
                    <div className="space-y-6">
                      <h3 className="text-lg font-semibold text-midnight-ink flex items-center">
                        <Building className="w-5 h-5 mr-2 text-hanok-teal" />
                        Company Information
                      </h3>
                      
                      <div>
                        <Label htmlFor="buyerCompany" className="text-base mb-2 block text-midnight-ink">
                          Company *
                        </Label>
                        <Input
                          id="buyerCompany"
                          value={formData.buyerCompany}
                          onChange={(e) => updateFormData('buyerCompany', e.target.value)}
                          required
                          className="h-12 text-base border-midnight-ink-200 focus:border-hanok-teal focus:ring-2 focus:ring-hanok-teal focus:ring-opacity-50 rounded-lg"
                          placeholder="Your company name"
                        />
                      </div>

                      <div>
                        <Label htmlFor="buyerRole" className="text-base mb-2 block text-midnight-ink">
                          <Briefcase className="w-4 h-4 inline mr-1" />
                          Role (Optional)
                        </Label>
                        <Select 
                          value={formData.buyerRole}
                          onValueChange={(value) => updateFormData('buyerRole', value)}
                        >
                          <SelectTrigger className="h-12 text-base border-midnight-ink-200 focus:border-hanok-teal focus:ring-2 focus:ring-hanok-teal focus:ring-opacity-50 rounded-lg bg-white">
                            <SelectValue placeholder="Select your role (optional)" />
                          </SelectTrigger>
                          <SelectContent className="z-[100] bg-white border-midnight-ink-200 shadow-lg">
                            <SelectItem value="producer">Producer</SelectItem>
                            <SelectItem value="executive">Executive</SelectItem>
                            <SelectItem value="agent">Agent</SelectItem>
                            <SelectItem value="content_scout">Content Scout</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label htmlFor="linkedinUrl" className="text-base mb-2 block text-midnight-ink">
                          <Linkedin className="w-4 h-4 inline mr-1" />
                          LinkedIn URL (Optional)
                        </Label>
                        <Input
                          id="linkedinUrl"
                          type="url"
                          value={formData.linkedinUrl}
                          onChange={(e) => updateFormData('linkedinUrl', e.target.value)}
                          className="h-12 text-base border-midnight-ink-200 focus:border-hanok-teal focus:ring-2 focus:ring-hanok-teal focus:ring-opacity-50 rounded-lg"
                          placeholder="https://linkedin.com/in/yourprofile"
                        />
                      </div>
                    </div>

                    {/* Submit Button */}
                    <Button 
                      type="submit" 
                      className="w-full h-14 text-lg font-semibold bg-hanok-teal hover:bg-hanok-teal-600 text-white rounded-full transition-all duration-300 shadow-lg hover:shadow-xl" 
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <div className="flex items-center justify-center">
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                          Completing Profile...
                        </div>
                      ) : (
                        <div className="flex items-center justify-center">
                          Complete Profile & Access Dashboard
                          <ArrowRight className="w-5 h-5 ml-2" />
                        </div>
                      )}
                    </Button>
                  </form>

                  {/* Optional Note */}
                  <div className="mt-8 p-4 bg-porcelain-blue-50 rounded-lg">
                    <p className="text-sm text-midnight-ink-600">
                      <strong>Note:</strong> You can update this information later from your dashboard profile settings.
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Skip Option */}
              <div className="mt-6 text-center">
                <button
                  type="button"
                  onClick={redirectToDashboard}
                  className="text-sm text-midnight-ink-500 hover:text-midnight-ink-700 underline transition-colors"
                >
                  Skip for now and go to dashboard
                </button>
              </div>
            </div>
          </div>
        </section>
      </main>
      
      <Footer />
    </div>
  );
};

export default ProfileCompletionPage;