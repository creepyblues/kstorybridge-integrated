import { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { Button, Card, CardContent, CardHeader, CardTitle, Input, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, useToast } from "@kstorybridge/ui";

import { useAuth } from "@/hooks/useAuth";
import { useSessionCache } from "@/hooks/useSessionCache";
import { useDataCache } from "@/contexts/DataCacheContext";
import { directApiService } from "@/services/directApiService";
import { supabase } from "@/integrations/supabase/client";
import { Users } from "lucide-react";
import PasswordResetModal from "@/components/PasswordResetModal";

// Define types for the actual table structures
type BuyerProfile = {
  id: string;
  email: string;
  full_name: string;
  buyer_company?: string | null;
  buyer_role?: string | null;
  linkedin_url?: string | null;
  tier?: string | null;
  created_at: string;
  updated_at: string;
};

type IPOwnerProfile = {
  id: string;
  email: string;
  full_name: string;
  pen_name?: string | null;
  ip_owner_role?: string | null;
  ip_owner_company?: string | null;
  website_url?: string | null;
  tier?: string | null;
  created_at: string;
  updated_at: string;
};

type UnifiedProfile = {
  id: string;
  email: string;
  full_name: string;
  account_type: 'buyer' | 'creator';

  // Buyer fields
  buyer_company?: string | null;
  buyer_role?: string | null;
  linkedin_url?: string | null;

  // IP Owner fields
  pen_name?: string | null; // mapped from pen_name field
  ip_owner_role?: string | null;
  ip_owner_company?: string | null;
  website_url?: string | null;

  tier?: string | null;
  created_at: string;
  updated_at: string;
};


// Mock profile data for localhost development
const mockProfile: UnifiedProfile = {
  id: "550e8400-e29b-41d4-a716-446655440000",
  email: "sungho@dadble.com",
  full_name: "Sungho Lee",
  account_type: "buyer",
  buyer_company: "Dadble Inc.",
  buyer_role: "Senior Product Manager",
  linkedin_url: "https://linkedin.com/in/sungholee",
  tier: "pro",
  website_url: "https://dadble.com",
  created_at: "2024-12-01T10:00:00.000Z",
  updated_at: "2025-08-12T06:00:00.000Z",
};

export default function Profile() {
  const { user, session, signOut } = useAuth();
  const { toast } = useToast();
  const {
    isSessionValid,
    getDbConnectivityStatus,
    setDbConnectivityStatus
  } = useDataCache();
  const { } = useSessionCache(); // Initialize session cache management
  const [profile, setProfile] = useState<UnifiedProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<Partial<UnifiedProfile>>({});
  const [isPasswordResetModalOpen, setIsPasswordResetModalOpen] = useState(false);
  const [dbError, setDbError] = useState<string | null>(null);
  const [subscriptionData, setSubscriptionData] = useState<any>(null);

  const fetchProfile = useCallback(async () => {
    if (!user) {
      console.log("No user found, skipping profile fetch");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setDbError(null);

      console.log("📖 Loading profile from database (session-based policy)...", user.email);
      console.log("User metadata:", user.user_metadata);

      // First try to detect account type by checking which table has data
      let accountType = user.user_metadata?.account_type || null;
      console.log("Account type from metadata:", accountType);

      // If no account type in metadata, detect by checking database tables
      if (!accountType) {
        console.log("No account type in metadata, checking database tables...");

        // Check user_creators first
        const creatorCheck = await fetch(`https://dlrnrgcoguxlkkcitlpd.supabase.co/rest/v1/user_creators?select=id&id=eq.${user.id}&limit=1`, {
          headers: {
            'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRscm5yZ2NvZ3V4bGtrY2l0bHBkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE3OTIzMzQsImV4cCI6MjA2NzM2ODMzNH0.KWYF7TvoA0I3iyoIbyYIyTSlJcIyPH6yCfHueEEMIlA',
            'Authorization': `Bearer ${session?.access_token}`,
            'Content-Type': 'application/json',
          },
        });

        if (creatorCheck.ok) {
          const creatorData = await creatorCheck.json();
          if (creatorData.length > 0) {
            accountType = 'creator';
            console.log("Detected account type from database: creator");
          }
        }

        // If not found in creators, check buyers
        if (!accountType) {
          const buyerCheck = await fetch(`https://dlrnrgcoguxlkkcitlpd.supabase.co/rest/v1/user_buyers?select=id&id=eq.${user.id}&limit=1`, {
            headers: {
              'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRscm5yZ2NvZ3V4bGtrY2l0bHBkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE3OTIzMzQsImV4cCI6MjA2NzM2ODMzNH0.KWYF7TvoA0I3iyoIbyYIyTSlJcIyPH6yCfHueEEMIlA',
              'Authorization': `Bearer ${session?.access_token}`,
              'Content-Type': 'application/json',
            },
          });

          if (buyerCheck.ok) {
            const buyerData = await buyerCheck.json();
            if (buyerData.length > 0) {
              accountType = 'buyer';
              console.log("Detected account type from database: buyer");
            }
          }
        }

        // Default to buyer if still not found
        if (!accountType) {
          accountType = 'buyer';
          console.log("No profile found in either table, defaulting to buyer");
        }
      }

      console.log("Final account type:", accountType);

      if (accountType === 'buyer') {
        try {
          // First try to get by ID (primary key)
          const response = await fetch(`https://dlrnrgcoguxlkkcitlpd.supabase.co/rest/v1/user_buyers?select=*&id=eq.${user.id}&limit=1`, {
            headers: {
              'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRscm5yZ2NvZ3V4bGtrY2l0bHBkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE3OTIzMzQsImV4cCI6MjA2NzM2ODMzNH0.KWYF7TvoA0I3iyoIbyYIyTSlJcIyPH6yCfHueEEMIlA',
              'Authorization': `Bearer ${session?.access_token}`,
              'Content-Type': 'application/json',
            },
          });

          if (response.ok) {
            const data = await response.json();
            if (data.length > 0) {
              const unifiedProfile: UnifiedProfile = {
                ...data[0],
                account_type: 'buyer',
                pen_name: null, // buyers don't have pen names
              };
              console.log("✅ Buyer profile loaded successfully by ID:", unifiedProfile);
              setProfile(unifiedProfile);
              setFormData(unifiedProfile);
              setDbConnectivityStatus({ isConnected: true });
            } else {
              // No profile found by ID, try to create one
              console.log("No buyer profile found by ID, attempting to create one");
              await createBuyerProfile();
            }
          } else {
            throw new Error(`Failed to fetch buyer profile: ${response.status}`);
          }
        } catch (error) {
          console.error("Error loading buyer profile:", error);
          throw error; // Re-throw to be caught by outer catch
        }
      } else {
        // creator profile
        try {
          // First try to get by ID (primary key)
          const response = await fetch(`https://dlrnrgcoguxlkkcitlpd.supabase.co/rest/v1/user_creators?select=*&id=eq.${user.id}&limit=1`, {
            headers: {
              'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRscm5yZ2NvZ3V4bGtrY2l0bHBkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE3OTIzMzQsImV4cCI6MjA2NzM2ODMzNH0.KWYF7TvoA0I3iyoIbyYIyTSlJcIyPH6yCfHueEEMIlA',
              'Authorization': `Bearer ${session?.access_token}`,
              'Content-Type': 'application/json',
            },
          });

          if (response.ok) {
            const data = await response.json();
            if (data.length > 0) {
              const unifiedProfile: UnifiedProfile = {
                ...data[0],
                account_type: 'creator',
                pen_name: data[0].pen_name,
                buyer_company: null,
                buyer_role: null,
                linkedin_url: null,
              };
              console.log("✅ Creator profile loaded successfully by ID:", unifiedProfile);
              setProfile(unifiedProfile);
              setFormData(unifiedProfile);
              setDbConnectivityStatus({ isConnected: true });
            } else {
              // No profile found by ID, try to create one
              console.log("No creator profile found by ID, attempting to create one");
              await createIPOwnerProfile();
            }
          } else {
            throw new Error(`Failed to fetch creator profile: ${response.status}`);
          }
        } catch (error) {
          console.error("Error loading creator profile:", error);
          throw error; // Re-throw to be caught by outer catch
        }
      }
    } catch (error) {
      console.error("❌ Database connectivity error loading profile:", error);

      // Update connectivity status
      const errorMessage = error instanceof Error ? error.message : 'Unknown database error';
      setDbConnectivityStatus({ isConnected: false, error: errorMessage });
      setDbError(errorMessage);

      // NEW POLICY: Show database error to user instead of fallback
      toast({
        title: "Database Connection Error",
        description: "Unable to load profile. Please check your connection and try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, [user, toast]);

  const fetchSubscriptionData = async () => {
    if (!user) return;

    try {
      // Fetch subscription data from stripe_customers table
      const { data, error } = await supabase
        .from('stripe_customers')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (data) {
        setSubscriptionData(data);
      }
    } catch (error) {
      console.error('Error fetching subscription data:', error);
    }
  };

  useEffect(() => {
    fetchProfile();
    fetchSubscriptionData();
  }, [fetchProfile]);

  const createBuyerProfile = async () => {
    if (!user || !session?.access_token) {
      console.error("Missing user or session token for profile creation");
      return;
    }

    console.log("Creating new buyer profile for user:", user.id);

    try {
      const newProfile = {
        id: user.id, // Required for RLS policy
        email: user.email || '',
        full_name: user.user_metadata?.full_name || '',
        buyer_company: user.user_metadata?.buyer_company || null,
        buyer_role: user.user_metadata?.buyer_role || null,
        linkedin_url: user.user_metadata?.linkedin_url || null,
      };

      console.log("Creating buyer profile with data:", newProfile);

      // Use directApiService to bypass potential RLS issues
      const response = await fetch(`https://dlrnrgcoguxlkkcitlpd.supabase.co/rest/v1/user_buyers`, {
        method: 'POST',
        headers: {
          'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRscm5yZ2NvZ3V4bGtrY2l0bHBkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE3OTIzMzQsImV4cCI6MjA2NzM2ODMzNH0.KWYF7TvoA0I3iyoIbyYIyTSlJcIyPH6yCfHueEEMIlA',
          'Authorization': `Bearer ${session?.access_token}`, // Use session's auth token
          'Content-Type': 'application/json',
          'Prefer': 'return=representation',
        },
        body: JSON.stringify(newProfile),
      });

      if (!response.ok) {
        const errorText = await response.text();

        // If we get a conflict (409), the profile already exists - try to fetch it instead
        if (response.status === 409) {
          console.log("Profile already exists, fetching existing profile...");
          const fetchResponse = await fetch(`https://dlrnrgcoguxlkkcitlpd.supabase.co/rest/v1/user_buyers?select=*&id=eq.${user.id}&limit=1`, {
            headers: {
              'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRscm5yZ2NvZ3V4bGtrY2l0bHBkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE3OTIzMzQsImV4cCI6MjA2NzM2ODMzNH0.KWYF7TvoA0I3iyoIbyYIyTSlJcIyPH6yCfHueEEMIlA',
              'Authorization': `Bearer ${session?.access_token}`,
              'Content-Type': 'application/json',
            },
          });

          if (fetchResponse.ok) {
            const existingData = await fetchResponse.json();
            if (existingData.length > 0) {
              const unifiedProfile: UnifiedProfile = {
                ...existingData[0],
                account_type: 'buyer',
                pen_name: null,
              };
              console.log("✅ Found existing buyer profile:", unifiedProfile);
              setProfile(unifiedProfile);
              setFormData(unifiedProfile);
              toast({
                title: "Profile Loaded",
                description: "Your existing profile has been loaded successfully.",
              });
              return;
            }
          }
        }

        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      const createdProfile = Array.isArray(data) ? data[0] : data;

      const unifiedProfile: UnifiedProfile = {
        ...createdProfile,
        account_type: 'buyer',
        pen_name: null,
      };
      console.log("Buyer profile created successfully:", unifiedProfile);
      setProfile(unifiedProfile);
      setFormData(unifiedProfile);
      toast({
        title: "Success",
        description: "Profile created successfully!",
      });
    } catch (error) {
      console.error("Exception creating buyer profile:", error);
      toast({
        title: "Error",
        description: "Failed to create profile",
        variant: "destructive",
      });
    }
  };

  const createIPOwnerProfile = async () => {
    if (!user || !session?.access_token) {
      console.error("Missing user or session token for creator profile creation");
      return;
    }

    console.log("Creating new IP owner profile for user:", user.id);

    try {
      const newProfile = {
        id: user.id, // Required for RLS policy
        email: user.email || '',
        full_name: user.user_metadata?.full_name || '',
        pen_name: user.user_metadata?.pen_name || null,
        ip_owner_role: user.user_metadata?.ip_owner_role || null,
        ip_owner_company: user.user_metadata?.ip_owner_company || null,
        website_url: user.user_metadata?.website_url || null,
      };

      console.log("Creating IP owner profile with data:", newProfile);

      // Use direct API call to bypass potential RLS issues
      const response = await fetch(`https://dlrnrgcoguxlkkcitlpd.supabase.co/rest/v1/user_creators`, {
        method: 'POST',
        headers: {
          'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRscm5yZ2NvZ3V4bGtrY2l0bHBkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE3OTIzMzQsImV4cCI6MjA2NzM2ODMzNH0.KWYF7TvoA0I3iyoIbyYIyTSlJcIyPH6yCfHueEEMIlA',
          'Authorization': `Bearer ${session?.access_token}`, // Use session's auth token
          'Content-Type': 'application/json',
          'Prefer': 'return=representation',
        },
        body: JSON.stringify(newProfile),
      });

      if (!response.ok) {
        const errorText = await response.text();

        // If we get a conflict (409), the profile already exists - try to fetch it instead
        if (response.status === 409) {
          console.log("Creator profile already exists, fetching existing profile...");
          const fetchResponse = await fetch(`https://dlrnrgcoguxlkkcitlpd.supabase.co/rest/v1/user_creators?select=*&id=eq.${user.id}&limit=1`, {
            headers: {
              'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRscm5yZ2NvZ3V4bGtrY2l0bHBkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE3OTIzMzQsImV4cCI6MjA2NzM2ODMzNH0.KWYF7TvoA0I3iyoIbyYIyTSlJcIyPH6yCfHueEEMIlA',
              'Authorization': `Bearer ${session?.access_token}`,
              'Content-Type': 'application/json',
            },
          });

          if (fetchResponse.ok) {
            const existingData = await fetchResponse.json();
            if (existingData.length > 0) {
              const unifiedProfile: UnifiedProfile = {
                ...existingData[0],
                account_type: 'creator',
                pen_name: existingData[0].pen_name,
                buyer_company: null,
                buyer_role: null,
                linkedin_url: null,
              };
              console.log("✅ Found existing creator profile:", unifiedProfile);
              setProfile(unifiedProfile);
              setFormData(unifiedProfile);
              toast({
                title: "Profile Loaded",
                description: "Your existing profile has been loaded successfully.",
              });
              return;
            }
          }
        }

        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      const createdProfile = Array.isArray(data) ? data[0] : data;

      const unifiedProfile: UnifiedProfile = {
        ...createdProfile,
        account_type: 'creator',
        pen_name: createdProfile.pen_name,
        buyer_company: null,
        buyer_role: null,
        linkedin_url: null,
      };
      console.log("IP owner profile created successfully:", unifiedProfile);
      setProfile(unifiedProfile);
      setFormData(unifiedProfile);
      toast({
        title: "Success",
        description: "Profile created successfully!",
      });
    } catch (error) {
      console.error("Exception creating IP owner profile:", error);
      toast({
        title: "Error",
        description: "Failed to create profile",
        variant: "destructive",
      });
    }
  };

  const handleUpdateProfile = async () => {
    // Handle localhost development with mock data

    if (!user || !profile) return;

    try {
      setUpdating(true);

      if (profile.account_type === 'buyer') {
        const updateData = {
          buyer_company: formData.buyer_company,
          buyer_role: formData.buyer_role,
          linkedin_url: formData.linkedin_url,
        };
        const cleanedUpdate = Object.fromEntries(
          Object.entries(updateData).filter(([, value]) => value !== undefined)
        );

        const data = await directApiService.updateBuyerProfile(user.id, cleanedUpdate);
        const unifiedProfile: UnifiedProfile = {
          ...data,
          account_type: 'buyer',
          pen_name: null,
        };
        setProfile(unifiedProfile);
        setFormData(unifiedProfile);
      } else {
        const updateData = {
          pen_name: formData.pen_name,
          ip_owner_role: formData.ip_owner_role,
          ip_owner_company: formData.ip_owner_company,
          website_url: formData.website_url,
        };
        const cleanedUpdate = Object.fromEntries(
          Object.entries(updateData).filter(([, value]) => value !== undefined)
        );

        const data = await directApiService.updateCreatorProfile(user.id, cleanedUpdate);
        const unifiedProfile: UnifiedProfile = {
          ...data,
          account_type: 'creator',
          pen_name: data.pen_name,
          buyer_company: null,
          buyer_role: null,
          linkedin_url: null,
        };
        setProfile(unifiedProfile);
        setFormData(unifiedProfile);
      }

      setIsEditing(false);
      
      toast({
        title: "Success",
        description: "Profile updated successfully",
      });
    } catch (error) {
      console.error("Error updating profile:", error);
      toast({
        title: "Error",
        description: "Failed to update profile",
        variant: "destructive",
      });
    } finally {
      setUpdating(false);
    }
  };

  const handleInputChange = (field: keyof UnifiedProfile, value: string | null) => {
    setFormData(prev => ({
      ...prev,
      [field]: value || null,
    }));
  };

  const handleCancel = () => {
    setFormData(profile || {});
    setIsEditing(false);
  };

  const formatAccountType = (accountType: string) => {
    switch (accountType) {
      case "buyer":
        return "Content Buyer";
      case "creator":
        return "IP Owner/Creator";
      default:
        return accountType;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const handleSignOut = async () => {
    console.group('🧾 PROFILE SIGN OUT');
    console.log('Sign out requested from profile page', {
      userId: user?.id,
      userEmail: user?.email,
      accountType: profile?.account_type,
      currentPath: window.location.pathname,
    });

    try {
      toast({
        title: "Signing out...",
        description: "We're closing your session.",
      });

      // The signOut function handles redirection automatically
      await signOut();
      console.log('✅ Sign out completed successfully from profile page');
    } catch (error) {
      console.error('❌ PROFILE SIGN OUT: failed', error);
      toast({
        title: "Sign out failed",
        description: "We couldn't sign you out. Please try again.",
        variant: "destructive",
      });
    } finally {
      console.groupEnd();
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto py-4 sm:py-6 lg:py-8 px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-slate-600 text-sm sm:text-base">Loading profile from database...</div>
        </div>
      </div>
    );
  }

  // NEW POLICY: Show database connectivity error if connection failed
  if (dbError && !getDbConnectivityStatus().isConnected) {
    return (
      <div className="container mx-auto py-4 sm:py-6 lg:py-8 px-3 sm:px-6 lg:px-8">
        <Card className="border-red-200 shadow-lg">
          <CardContent className="p-8 text-center">
            <div className="h-12 w-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-red-600 text-xl font-bold">!</span>
            </div>
            <h3 className="text-lg font-medium text-red-600 mb-2">
              Database Connection Error
            </h3>
            <p className="text-red-500 mb-4">
              Unable to load profile data. Please check your internet connection.
            </p>
            <p className="text-xs text-gray-500 mb-4">
              Error: {dbError}
            </p>
            <Button
              onClick={() => window.location.reload()}
              className="bg-red-600 hover:bg-red-700"
            >
              Retry Connection
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="container mx-auto py-4 sm:py-6 lg:py-8 px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-slate-600 text-sm sm:text-base">Profile not found</div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="max-w-7xl mx-auto py-4 sm:py-6 lg:py-8 px-3 sm:px-6 lg:px-8">
        {/* Profile Information Card */}
        <Card className="bg-transparent border-gray-300 shadow-none rounded-2xl mb-6 sm:mb-8 lg:mb-12">
          <CardContent className="p-4 sm:p-6">
            {/* Edit/Save buttons positioned at top right */}
            <div className="flex justify-end mb-4">
              {!isEditing ? (
                <Button
                  onClick={() => setIsEditing(true)}
                  variant="outline"
                  className="border-gray-300 hover:bg-gray-100"
                >
                  Edit Profile
                </Button>
              ) : (
                <div className="flex gap-2">
                  <Button
                    onClick={handleUpdateProfile}
                    disabled={updating}
                    variant="outline"
                    className="border-gray-300 hover:bg-gray-100"
                  >
                    {updating ? "Saving..." : "Save Changes"}
                  </Button>
                  <Button
                    onClick={handleCancel}
                    variant="outline"
                    disabled={updating}
                    className="border-gray-300 hover:bg-gray-100"
                  >
                    Cancel
                  </Button>
                </div>
              )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
              {/* Left Column - Basic Information */}
              <div className="space-y-4 sm:space-y-6">
                {/* Full Name */}
                <div>
                  <h5 className="font-semibold text-black mb-1 text-sm sm:text-base">Full Name</h5>
                  <p className="text-gray-600 text-xs sm:text-sm">{profile.full_name || "Not specified"}</p>
                </div>

                {/* Email */}
                <div>
                  <h5 className="font-semibold text-black mb-1 text-sm sm:text-base">Email Address</h5>
                  <p className="text-gray-600 text-xs sm:text-sm break-all">{profile.email}</p>
                </div>

                {/* Account Type */}
                <div>
                  <h5 className="font-semibold text-black mb-1 text-sm sm:text-base">Account Type</h5>
                  <p className="text-gray-600 text-xs sm:text-sm">{formatAccountType(profile.account_type)}</p>
                </div>

                {/* Pen Name for IP Owners */}
                {profile.account_type === 'creator' && (
                  <div>
                    <h5 className="font-semibold text-black mb-1 text-sm sm:text-base">Pen Name / Studio Name</h5>
                    {isEditing ? (
                      <Input
                        id="pen_name"
                        value={formData.pen_name || ""}
                        onChange={(e) => handleInputChange("pen_name", e.target.value)}
                        placeholder="Enter your pen name or studio name"
                      />
                    ) : (
                      <p className="text-gray-600 text-xs sm:text-sm">{profile.pen_name || "Not specified"}</p>
                    )}
                  </div>
                )}
              </div>

              {/* Right Column - Professional Information */}
              <div className="space-y-4 sm:space-y-6">
                {profile.account_type === "buyer" ? (
                  <>
                    {/* Company */}
                    <div>
                      <h5 className="font-semibold text-black mb-1 text-sm sm:text-base">Company</h5>
                      {isEditing ? (
                        <Input
                          id="buyer_company"
                          value={formData.buyer_company || ""}
                          onChange={(e) => handleInputChange("buyer_company", e.target.value)}
                          placeholder="Enter your company name"
                        />
                      ) : (
                        <p className="text-gray-600 text-xs sm:text-sm">{profile.buyer_company || "Not specified"}</p>
                      )}
                    </div>

                    {/* Role */}
                    <div>
                      <h5 className="font-semibold text-black mb-1 text-sm sm:text-base">Role</h5>
                      {isEditing ? (
                        <Select
                          value={formData.buyer_role || ""}
                          onValueChange={(value) => handleInputChange("buyer_role", value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select your role" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="producer">Producer</SelectItem>
                            <SelectItem value="executive">Executive</SelectItem>
                            <SelectItem value="agent">Agent</SelectItem>
                            <SelectItem value="content_scout">Content Scout</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      ) : (
                        <p className="text-gray-600 text-xs sm:text-sm">
                          {profile.buyer_role ? 
                            profile.buyer_role.split("_").map(word => 
                              word.charAt(0).toUpperCase() + word.slice(1)
                            ).join(" ") 
                            : "Not specified"
                          }
                        </p>
                      )}
                    </div>

                    {/* LinkedIn URL */}
                    <div>
                      <h5 className="font-semibold text-black mb-1 text-sm sm:text-base">LinkedIn URL</h5>
                      {isEditing ? (
                        <Input
                          id="linkedin_url"
                          value={formData.linkedin_url || ""}
                          onChange={(e) => handleInputChange("linkedin_url", e.target.value)}
                          placeholder="https://linkedin.com/in/your-profile"
                          type="url"
                        />
                      ) : (
                        <p className="text-gray-600 text-xs sm:text-sm">
                          {profile.linkedin_url ? (
                            <a
                              href={profile.linkedin_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-black hover:text-gray-700 transition-colors break-all"
                            >
                              LinkedIn Profile
                            </a>
                          ) : (
                            "Not specified"
                          )}
                        </p>
                      )}
                    </div>
                  </>
                ) : (
                  <>
                    {/* Company */}
                    <div>
                      <h5 className="font-semibold text-black mb-1 text-sm sm:text-base">Company</h5>
                      {isEditing ? (
                        <Input
                          id="ip_owner_company"
                          value={formData.ip_owner_company || ""}
                          onChange={(e) => handleInputChange("ip_owner_company", e.target.value)}
                          placeholder="Enter your company name"
                        />
                      ) : (
                        <p className="text-gray-600 text-xs sm:text-sm">{profile.ip_owner_company || "Not specified"}</p>
                      )}
                    </div>

                    {/* Role */}
                    <div>
                      <h5 className="font-semibold text-black mb-1 text-sm sm:text-base">Role</h5>
                      {isEditing ? (
                        <Select
                          value={formData.ip_owner_role || ""}
                          onValueChange={(value) => handleInputChange("ip_owner_role", value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select your role" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="author">Author</SelectItem>
                            <SelectItem value="agent">Agent</SelectItem>
                          </SelectContent>
                        </Select>
                      ) : (
                        <p className="text-gray-600 text-xs sm:text-sm">
                          {profile.ip_owner_role ? 
                            profile.ip_owner_role.charAt(0).toUpperCase() + profile.ip_owner_role.slice(1)
                            : "Not specified"
                          }
                        </p>
                      )}
                    </div>

                    {/* Website URL */}
                    <div>
                      <h5 className="font-semibold text-black mb-1 text-sm sm:text-base">Website URL</h5>
                      {isEditing ? (
                        <Input
                          id="website_url"
                          value={formData.website_url || ""}
                          onChange={(e) => handleInputChange("website_url", e.target.value)}
                          placeholder="https://your-website.com"
                          type="url"
                        />
                      ) : (
                        <p className="text-gray-600 text-xs sm:text-sm">
                          {profile.website_url ? (
                            <a
                              href={profile.website_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-black hover:text-gray-700 transition-colors break-all"
                            >
                              {profile.website_url}
                            </a>
                          ) : (
                            "Not specified"
                          )}
                        </p>
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Subscription Plan Section */}
        {profile?.account_type === 'buyer' && (
          <Card className="bg-transparent border-gray-300 shadow-none rounded-2xl mb-6 sm:mb-8 lg:mb-12">
            <CardContent className="p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gray-100">
                    <Users className="h-6 w-6 text-gray-600" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {profile?.tier === 'pro' || subscriptionData?.subscription_status === 'active'
                        ? 'Pro plan'
                        : profile?.tier === 'suite'
                        ? 'Suite plan'
                        : 'Basic plan'}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {subscriptionData?.subscription_status === 'active' ? (
                        <>
                          Pro tier access with premium features
                          <br />
                          Your subscription will auto renew on{' '}
                          {subscriptionData?.current_period_end
                            ? new Date(subscriptionData.current_period_end).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric'
                              })
                            : 'N/A'}
                          .
                        </>
                      ) : profile?.tier === 'pro' ? (
                        <>
                          Pro tier access with premium features
                          <br />
                          Full access to pitch decks and creator contacts
                        </>
                      ) : profile?.tier === 'suite' ? (
                        <>
                          Suite tier with all features unlocked
                          <br />
                          Maximum access and priority support
                        </>
                      ) : (
                        <>
                          Basic tier with standard features
                          <br />
                          Upgrade to Pro for pitch deck access and more
                        </>
                      )}
                    </p>
                  </div>
                </div>
                {(profile.email === 'sungho@dadble.com' || profile.email === 'kevin@sandstoneartists.com') ? (
                  <Link to="/buyers/plan">
                    <Button
                      variant="outline"
                      className="w-full sm:w-auto border-gray-300 hover:bg-gray-100"
                    >
                      Adjust plan
                    </Button>
                  </Link>
                ) : (
                  <Button
                    variant="outline"
                    className="w-full sm:w-auto border-gray-300 bg-gray-100 text-gray-400 cursor-not-allowed"
                    disabled
                  >
                    Adjust plan
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* AI Chatbot Section - Only for specific users */}
        {(profile.email === 'sungho@dadble.com' || profile.email === 'kevin@sandstoneartists.com') && (
          <Card className="bg-transparent border-gray-300 shadow-none rounded-2xl mb-6 sm:mb-8 lg:mb-12">
            <CardContent className="p-4 sm:p-6 lg:p-8">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 sm:gap-0">
                <div>
                  <h3 className="text-lg sm:text-xl font-bold text-midnight-ink mb-2">AI IP Discovery</h3>
                  <p className="text-gray-600 text-sm sm:text-base">
                    Access AI-powered Korean IP discovery tools and view your conversation history and analytics.
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row gap-3">
                  <Link to="/ai-chatbot">
                    <Button className="w-full sm:w-auto bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white shadow-lg rounded-2xl px-4 sm:px-6 py-2 sm:py-3 text-sm sm:text-base transition-all duration-300 group relative overflow-hidden">
                      {/* Shine effect */}
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 translate-x-[-100%] group-hover:translate-x-[200%] transition-transform duration-700 pointer-events-none"></div>
                      
                      {/* Text */}
                      <span className="relative z-10">🤖 AI CHATBOT</span>
                      
                      {/* Glow effect */}
                      <div className="absolute inset-0 rounded-2xl bg-purple-500/50 blur-md group-hover:bg-purple-500/60 transition-colors duration-300 pointer-events-none"></div>
                    </Button>
                  </Link>
                  
                  <Link to="/buyers/chat">
                    <Button className="w-full sm:w-auto bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-lg rounded-2xl px-4 sm:px-6 py-2 sm:py-3 text-sm sm:text-base transition-all duration-300 group relative overflow-hidden">
                      {/* Shine effect */}
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 translate-x-[-100%] group-hover:translate-x-[200%] transition-transform duration-700 pointer-events-none"></div>
                      
                      {/* Text */}
                      <span className="relative z-10">🧠 OPENAI CHAT</span>
                      
                      {/* Glow effect */}
                      <div className="absolute inset-0 rounded-2xl bg-emerald-500/50 blur-md group-hover:bg-emerald-500/60 transition-colors duration-300 pointer-events-none"></div>
                    </Button>
                  </Link>
                  
                  <Link to="/chat-history">
                    <Button className="w-full sm:w-auto bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-lg rounded-2xl px-4 sm:px-6 py-2 sm:py-3 text-sm sm:text-base transition-all duration-300 group relative overflow-hidden">
                      {/* Shine effect */}
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 translate-x-[-100%] group-hover:translate-x-[200%] transition-transform duration-700 pointer-events-none"></div>
                      
                      {/* Text */}
                      <span className="relative z-10">📊 CHAT HISTORY</span>
                      
                      {/* Glow effect */}
                      <div className="absolute inset-0 rounded-2xl bg-indigo-500/50 blur-md group-hover:bg-indigo-500/60 transition-colors duration-300 pointer-events-none"></div>
                    </Button>
                  </Link>

                  <Link to="/vector-search-manager">
                    <Button className="w-full sm:w-auto bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-lg rounded-2xl px-4 sm:px-6 py-2 sm:py-3 text-sm sm:text-base transition-all duration-300 group relative overflow-hidden">
                      {/* Shine effect */}
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 translate-x-[-100%] group-hover:translate-x-[200%] transition-transform duration-700 pointer-events-none"></div>
                      
                      {/* Text */}
                      <span className="relative z-10">🔍 VECTOR SEARCH</span>
                      
                      {/* Glow effect */}
                      <div className="absolute inset-0 rounded-2xl bg-purple-500/50 blur-md group-hover:bg-purple-500/60 transition-colors duration-300 pointer-events-none"></div>
                    </Button>
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Account Actions Section */}
        <Card className="bg-transparent border-gray-300 shadow-none rounded-2xl">
          <CardContent className="p-4 sm:p-6 lg:p-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 sm:gap-0">
              <div>
                <h3 className="text-lg sm:text-xl font-bold text-midnight-ink">Account Actions</h3>
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                {/* Change Password Button */}
                <Button
                  onClick={() => setIsPasswordResetModalOpen(true)}
                  variant="outline"
                  className="w-full sm:w-auto border-gray-300 hover:bg-gray-100"
                >
                  Change Password
                </Button>

                {/* Sign Out Button */}
                <Button
                  type="button"
                  onClick={handleSignOut}
                  variant="outline"
                  className="w-full sm:w-auto border-gray-300 hover:bg-gray-100 text-red-600"
                >
                  Sign Out
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Password Reset Modal */}
      <PasswordResetModal 
        isOpen={isPasswordResetModalOpen} 
        onClose={() => setIsPasswordResetModalOpen(false)} 
      />
    </div>
  );
}
