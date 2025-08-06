import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent } from './ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { useToast } from '../hooks/use-toast';
import { supabase } from '../integrations/supabase/client';
import { trackSignup, trackFormSubmission, trackButtonClick } from '@/utils/analytics';
import { notifyBuyerSignup, notifyCreatorSignup } from '../utils/slack';

type AccountType = 'buyer' | 'creator';

interface SignupFormProps {
  accountType: AccountType;
}

interface BuyerFormData {
  email: string;
  password: string;
  fullName: string;
  buyerCompany: string;
  buyerRole: string;
  linkedinUrl: string;
}

interface CreatorFormData {
  email: string;
  password: string;
  fullName: string;
  penNameOrStudio: string;
  ipOwnerRole: string;
  ipOwnerCompany: string;
  websiteUrl: string;
}

const SignupForm: React.FC<SignupFormProps> = ({ accountType }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  
  const [buyerFormData, setBuyerFormData] = useState<BuyerFormData>({
    email: '',
    password: '',
    fullName: '',
    buyerCompany: '',
    buyerRole: '',
    linkedinUrl: ''
  });

  const [creatorFormData, setCreatorFormData] = useState<CreatorFormData>({
    email: '',
    password: '',
    fullName: '',
    penNameOrStudio: '',
    ipOwnerRole: '',
    ipOwnerCompany: '',
    websiteUrl: ''
  });
  
  const { toast } = useToast();
  const navigate = useNavigate();

  // List of common consumer email providers to exclude
  const consumerEmailProviders = [
    'gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'aol.com',
    'icloud.com', 'protonmail.com', 'mail.com', 'yandex.com', 'zoho.com',
    'live.com', 'msn.com', 'comcast.net', 'verizon.net', 'att.net',
    'sbcglobal.net', 'cox.net', 'charter.net', 'earthlink.net', 'me.com'
  ];

  const isWorkEmail = (email: string) => {
    const domain = email.split('@')[1]?.toLowerCase();
    return domain && !consumerEmailProviders.includes(domain);
  };

  const handleGoogleSignUp = async () => {
    setIsGoogleLoading(true);
    trackButtonClick('Google Signup', `${accountType}_signup_page`);
    
    try {
      const redirectUrl = `${window.location.origin}/`;
      
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          }
        }
      });
      
      if (error) {
        console.error('Google signup error:', error);
        toast({
          title: "Google Signup Error",
          description: error.message,
          variant: "destructive"
        });
      } else {
        // Track successful Google signup initiation
        trackSignup(accountType, 'google');
      }
    } catch (error) {
      console.error('Unexpected error during Google signup:', error);
      toast({
        title: "Unexpected Error",
        description: "Something went wrong. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const formData = accountType === 'buyer' ? buyerFormData : creatorFormData;

    try {
      // Validate required fields
      const requiredFieldsValid = accountType === 'buyer' 
        ? formData.email && formData.password && formData.fullName && (formData as BuyerFormData).buyerCompany
        : formData.email && formData.password && formData.fullName;

      if (!requiredFieldsValid) {
        toast({
          title: "Error",
          description: "Please fill in all required fields",
          variant: "destructive"
        });
        return;
      }

      // Validate work email for buyers only
      if (accountType === 'buyer' && !isWorkEmail(formData.email)) {
        toast({
          title: "Work Email Required",
          description: "Please use a work email address. Personal email providers are not allowed.",
          variant: "destructive"
        });
        return;
      }

      const redirectUrl = `${window.location.origin}/`;
      
      // Prepare metadata for the trigger
      const metadata = accountType === 'buyer' 
        ? {
            full_name: formData.fullName,
            account_type: 'buyer',
            buyer_company: (formData as BuyerFormData).buyerCompany,
            buyer_role: (formData as BuyerFormData).buyerRole || null,
            linkedin_url: (formData as BuyerFormData).linkedinUrl || null,
            invitation_status: 'invited'
          }
        : {
            full_name: formData.fullName,
            account_type: 'ip_owner',
            pen_name: (formData as CreatorFormData).penNameOrStudio || null,
            ip_owner_role: (formData as CreatorFormData).ipOwnerRole || null,
            ip_owner_company: (formData as CreatorFormData).ipOwnerCompany || null,
            website_url: (formData as CreatorFormData).websiteUrl || null,
            invitation_status: 'invited'
          };
      
      const { data, error } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          emailRedirectTo: redirectUrl,
          data: metadata
        }
      });
      
      if (error) {
        console.error('Signup error:', error);
        trackFormSubmission(`${accountType}_signup_form`, false);
        toast({
          title: "Signup Error",
          description: error.message,
          variant: "destructive"
        });
        return;
      }
      
      if (data.user) {
        // Only do profile checking for buyers (as in original code)
        if (accountType === 'buyer') {
          const checkProfile = async () => {
            const maxAttempts = 3; // Reduced from 5
            const baseDelay = 3000; // Increased base delay
            
            for (let attempt = 0; attempt < maxAttempts; attempt++) {
              try {
                console.log(`🔍 Buyer profile check attempt ${attempt + 1}/${maxAttempts}`);
                
                const { data: buyerProfile, error: profileError } = await supabase
                  .from('user_buyers')
                  .select('id, full_name, buyer_company')
                  .eq('id', data.user.id)
                  .maybeSingle(); // Use maybeSingle() instead of single() to avoid errors when no record exists
                
                if (profileError) {
                  console.warn(`⚠️ Profile check error (attempt ${attempt + 1}):`, profileError);
                  
                  // If it's a 406 or similar error, don't retry
                  if (profileError.code === 'PGRST116' || profileError.message?.includes('406')) {
                    console.log('❌ API error detected, stopping profile checks');
                    break;
                  }
                } else if (buyerProfile) {
                  console.log('✅ Trigger worked! Profile created successfully:', buyerProfile);
                  return true;
                }
                
                // If this isn't the last attempt, wait before retrying
                if (attempt < maxAttempts - 1) {
                  const delay = baseDelay * Math.pow(1.5, attempt); // Exponential backoff
                  console.log(`⏳ Profile not found yet, waiting ${delay}ms before retry...`);
                  await new Promise(resolve => setTimeout(resolve, delay));
                }
              } catch (error) {
                console.error(`❌ Unexpected error in profile check attempt ${attempt + 1}:`, error);
                
                // If this isn't the last attempt, wait before retrying
                if (attempt < maxAttempts - 1) {
                  const delay = baseDelay * Math.pow(1.5, attempt);
                  await new Promise(resolve => setTimeout(resolve, delay));
                }
              }
            }
            
            console.log('❌ Profile not found after all attempts - this is normal for database triggers');
            return false;
          };
          
          // Don't await this - let it run in background
          checkProfile().catch(error => {
            console.error('Profile check failed:', error);
          });
        }
        
        // Track successful signup
        trackSignup(accountType, 'email');
        trackFormSubmission(`${accountType}_signup_form`, true);
        
        // Send Slack notification
        console.log('🔔 Attempting to send Slack notification for:', accountType, 'signup');
        try {
          if (accountType === 'buyer') {
            console.log('🔔 Sending buyer signup notification...');
            await notifyBuyerSignup({
              fullName: formData.fullName,
              email: formData.email,
              company: (formData as BuyerFormData).buyerCompany,
              role: (formData as BuyerFormData).buyerRole,
              linkedinUrl: (formData as BuyerFormData).linkedinUrl,
            });
          } else {
            console.log('🔔 Sending creator signup notification...');
            await notifyCreatorSignup({
              fullName: formData.fullName,
              email: formData.email,
              penName: (formData as CreatorFormData).penNameOrStudio,
              company: (formData as CreatorFormData).ipOwnerCompany,
              role: (formData as CreatorFormData).ipOwnerRole,
              websiteUrl: (formData as CreatorFormData).websiteUrl,
            });
          }
          console.log('✅ Slack notification completed successfully');
        } catch (slackError) {
          // Don't fail the signup if Slack notification fails
          console.error('❌ Failed to send Slack notification:', slackError);
        }
        
        toast({
          title: "Success!",
          description: "Account created successfully! Please check your email for verification."
        });
        
        setTimeout(() => {
          navigate('/');
        }, 2000);
      }
    } catch (error) {
      console.error('Unexpected error during signup:', error);
      toast({
        title: "Unexpected Error",
        description: "Something went wrong. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const updateFormData = (field: string, value: string) => {
    if (accountType === 'buyer') {
      setBuyerFormData(prev => ({ ...prev, [field]: value }));
    } else {
      setCreatorFormData(prev => ({ ...prev, [field]: value }));
    }
  };

  const formData = accountType === 'buyer' ? buyerFormData : creatorFormData;
  const isBuyer = accountType === 'buyer';
  const isCreator = accountType === 'creator';

  return (
    <>
      {/* Header Section */}
      <div className="text-center mb-12">
        <h1 className="text-4xl lg:text-5xl font-bold mb-6 leading-tight text-midnight-ink">
          Create Your <span className="text-hanok-teal">{isBuyer ? 'Buyer' : 'Creator'}</span> Account
        </h1>
        <p className="text-xl text-midnight-ink-600 leading-relaxed max-w-lg mx-auto">
          {isBuyer 
            ? 'Join the marketplace to discover and license Korean IP content'
            : 'Join the marketplace to showcase and license your Korean IP content'
          }
        </p>
      </div>

      {/* Form Card */}
      <Card className="border-0 shadow-lg rounded-2xl hover:shadow-xl transition-shadow duration-300 bg-white">
        <CardContent className="p-8 md:p-12">
          {/* Switch Account Type Button */}
          <div className="mb-8 text-center">
            <p className="text-sm text-midnight-ink-600 mb-4">
              {isBuyer 
                ? 'Are you a content creator instead?'
                : 'Looking to discover content instead?'
              }
            </p>
            <Button 
              id="signup-switch-account-type-btn"
              asChild
              size="lg"
              className="bg-sunrise-coral hover:bg-sunrise-coral-600 text-white px-8 py-3 text-base font-semibold rounded-full transition-all duration-300"
            >
              <Link to={isBuyer ? '/signup/creator' : '/signup/buyer'}>
                Switch to {isBuyer ? 'Creator' : 'Buyer'} Signup
              </Link>
            </Button>
          </div>

          {/* Google Sign Up Button - Temporarily disabled */}

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Basic Information */}
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-midnight-ink">Basic Information</h3>
              
              <div>
                <Label htmlFor="fullName" className="text-base mb-2 block text-midnight-ink">Full Name *</Label>
                <Input
                  id="fullName"
                  value={formData.fullName}
                  onChange={(e) => updateFormData('fullName', e.target.value)}
                  required
                  className="h-12 text-base border-midnight-ink-200 focus:border-hanok-teal focus:ring-hanok-teal rounded-lg"
                  placeholder="Enter your full name"
                />
              </div>

              <div>
                <Label htmlFor="email" className="text-base mb-2 block text-midnight-ink">
                  {isBuyer ? 'Work Email *' : 'Email *'}
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => updateFormData('email', e.target.value)}
                  required
                  className="h-12 text-base border-midnight-ink-200 focus:border-hanok-teal focus:ring-hanok-teal rounded-lg"
                  placeholder={isBuyer ? "your.name@company.com" : "your.email@example.com"}
                />
                {isBuyer && (
                  <p className="text-sm text-midnight-ink-500 mt-2">
                    Personal email providers are not allowed
                  </p>
                )}
                {isCreator && (
                  <p className="text-sm text-midnight-ink-500 mt-2">
                    You can use any email address including personal emails
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="password" className="text-base mb-2 block text-midnight-ink">Password *</Label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => updateFormData('password', e.target.value)}
                  required
                  minLength={6}
                  className="h-12 text-base border-midnight-ink-200 focus:border-hanok-teal focus:ring-hanok-teal rounded-lg"
                  placeholder="Create a secure password"
                />
              </div>
            </div>

            {/* Account-specific Information */}
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-midnight-ink">
                {isBuyer ? 'Company Information' : 'Creative Information'}
              </h3>
              
              {isBuyer ? (
                <>
                  <div>
                    <Label htmlFor="buyerCompany" className="text-base mb-2 block text-midnight-ink">Company *</Label>
                    <Input
                      id="buyerCompany"
                      value={(formData as BuyerFormData).buyerCompany}
                      onChange={(e) => updateFormData('buyerCompany', e.target.value)}
                      required
                      className="h-12 text-base border-midnight-ink-200 focus:border-hanok-teal focus:ring-hanok-teal rounded-lg"
                      placeholder="Your company name"
                    />
                  </div>

                  <div>
                    <Label htmlFor="buyerRole" className="text-base mb-2 block text-midnight-ink">Role</Label>
                    <Select 
                      value={(formData as BuyerFormData).buyerRole}
                      onValueChange={(value) => updateFormData('buyerRole', value)}
                    >
                      <SelectTrigger className="h-12 text-base border-midnight-ink-200 focus:border-hanok-teal focus:ring-hanok-teal rounded-lg">
                        <SelectValue placeholder="Select your role (optional)" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="producer">Producer</SelectItem>
                        <SelectItem value="executive">Executive</SelectItem>
                        <SelectItem value="agent">Agent</SelectItem>
                        <SelectItem value="content_scout">Content Scout</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="linkedinUrl" className="text-base mb-2 block text-midnight-ink">LinkedIn URL (Optional)</Label>
                    <Input
                      id="linkedinUrl"
                      type="url"
                      value={(formData as BuyerFormData).linkedinUrl}
                      onChange={(e) => updateFormData('linkedinUrl', e.target.value)}
                      className="h-12 text-base border-midnight-ink-200 focus:border-hanok-teal focus:ring-hanok-teal rounded-lg"
                      placeholder="https://linkedin.com/in/yourprofile"
                    />
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <Label htmlFor="penNameOrStudio" className="text-base mb-2 block text-midnight-ink">Pen Name</Label>
                    <Input
                      id="penNameOrStudio"
                      value={(formData as CreatorFormData).penNameOrStudio}
                      onChange={(e) => updateFormData('penNameOrStudio', e.target.value)}
                      className="h-12 text-base border-midnight-ink-200 focus:border-hanok-teal focus:ring-hanok-teal rounded-lg"
                      placeholder="Your pen name (optional)"
                    />
                  </div>

                  <div>
                    <Label htmlFor="ipOwnerRole" className="text-base mb-2 block text-midnight-ink">Role</Label>
                    <Select 
                      value={(formData as CreatorFormData).ipOwnerRole}
                      onValueChange={(value) => updateFormData('ipOwnerRole', value)}
                    >
                      <SelectTrigger className="h-12 text-base border-midnight-ink-200 focus:border-hanok-teal focus:ring-hanok-teal rounded-lg">
                        <SelectValue placeholder="Select your role (optional)" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="author">Author</SelectItem>
                        <SelectItem value="agent">Agent</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="ipOwnerCompany" className="text-base mb-2 block text-midnight-ink">Company/Agency (Optional)</Label>
                    <Input
                      id="ipOwnerCompany"
                      value={(formData as CreatorFormData).ipOwnerCompany}
                      onChange={(e) => updateFormData('ipOwnerCompany', e.target.value)}
                      className="h-12 text-base border-midnight-ink-200 focus:border-hanok-teal focus:ring-hanok-teal rounded-lg"
                      placeholder="Your company or agency"
                    />
                  </div>

                  <div>
                    <Label htmlFor="websiteUrl" className="text-base mb-2 block text-midnight-ink">Website URL (Optional)</Label>
                    <Input
                      id="websiteUrl"
                      type="url"
                      value={(formData as CreatorFormData).websiteUrl}
                      onChange={(e) => updateFormData('websiteUrl', e.target.value)}
                      className="h-12 text-base border-midnight-ink-200 focus:border-hanok-teal focus:ring-hanok-teal rounded-lg"
                      placeholder="https://yourwebsite.com"
                    />
                  </div>
                </>
              )}
            </div>

            <Button 
              id="signup-form-submit-btn"
              type="submit" 
              className="w-full h-14 text-lg font-semibold bg-hanok-teal hover:bg-hanok-teal-600 text-white rounded-full transition-all duration-300 shadow-lg hover:shadow-xl" 
              disabled={isLoading}
            >
              {isLoading ? 'Creating Account...' : `Create ${isBuyer ? 'Buyer' : 'Creator'} Account`}
            </Button>
          </form>
        </CardContent>
      </Card>
    </>
  );
};

export default SignupForm;