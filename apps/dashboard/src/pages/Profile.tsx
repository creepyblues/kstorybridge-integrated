import { useEffect, useState } from "react";
import { Button, Card, CardContent, CardHeader, CardTitle, Input, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, useToast } from "@kstorybridge/ui";

import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Save, Edit3, X } from "lucide-react";

// Define types for the actual table structures
type BuyerProfile = {
  id: string;
  user_id: string;
  email: string;
  full_name: string;
  buyer_company?: string | null;
  buyer_role?: string | null;
  linkedin_url?: string | null;
  plan: string;
  tier?: string | null;
  created_at: string;
  updated_at: string;
};

type IPOwnerProfile = {
  id: string;
  user_id: string;
  email: string;
  full_name: string;
  pen_name_or_studio?: string | null;
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
  account_type: 'buyer' | 'ip_owner';
  
  // Buyer fields
  buyer_company?: string | null;
  buyer_role?: string | null;
  linkedin_url?: string | null;
  plan?: string | null; // only for buyers
  
  // IP Owner fields
  pen_name?: string | null; // mapped from pen_name_or_studio
  ip_owner_role?: string | null;
  ip_owner_company?: string | null;
  website_url?: string | null;
  
  tier?: string | null;
  created_at: string;
  updated_at: string;
};

// Check if we should use mock data for localhost development
const shouldUseMockData = () => {
  const isLocalhost = window.location.hostname === 'localhost';
  const bypassEnabled = import.meta.env.VITE_DISABLE_AUTH_LOCALHOST === 'true';
  const isDev = import.meta.env.DEV;
  
  return isLocalhost && bypassEnabled && isDev;
};

// Mock profile data for localhost development
const mockProfile: UnifiedProfile = {
  id: "550e8400-e29b-41d4-a716-446655440000",
  user_id: "550e8400-e29b-41d4-a716-446655440000",
  email: "sungho@dadble.com",
  full_name: "Sungho Lee",
  account_type: "buyer",
  buyer_company: "Dadble Inc.",
  buyer_role: "Senior Product Manager",
  linkedin_url: "https://linkedin.com/in/sungholee",
  plan: "pro",
  tier: "pro",
  website_url: "https://dadble.com",
  created_at: "2024-12-01T10:00:00.000Z",
  updated_at: "2025-08-12T06:00:00.000Z",
};

export default function Profile() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [profile, setProfile] = useState<UnifiedProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<Partial<UnifiedProfile>>({});

  useEffect(() => {
    const fetchProfile = async () => {
      // Handle localhost development with mock data
      if (shouldUseMockData()) {
        console.log("👤 PROFILE: Using mock profile data for localhost development");
        setProfile(mockProfile);
        setFormData(mockProfile);
        setLoading(false);
        return;
      }

      if (!user) {
        console.log("No user found, skipping profile fetch");
        setLoading(false);
        return;
      }

      console.log("Fetching profile for user:", user.id, user.email);
      console.log("User metadata:", user.user_metadata);

      try {
        const accountType = user.user_metadata?.account_type || 'buyer';
        console.log("Account type:", accountType);

        if (accountType === 'buyer') {
          const { data, error } = await supabase
            .from("user_buyers")
            .select("*")
            .eq("email", user.email)
            .single();

          console.log("Buyer profile query result:", { data, error });

          if (error) {
            if (error.code === 'PGRST116') {
              console.log("No buyer profile found, attempting to create one");
              await createBuyerProfile();
            } else {
              console.error("Error fetching buyer profile:", error);
              toast({
                title: "Error",
                description: `Failed to load profile data: ${error.message}`,
                variant: "destructive",
              });
            }
          } else {
            const unifiedProfile: UnifiedProfile = {
              ...data,
              account_type: 'buyer',
              pen_name: null, // buyers don't have pen names
            };
            console.log("Buyer profile loaded successfully:", unifiedProfile);
            setProfile(unifiedProfile);
            setFormData(unifiedProfile);
          }
        } else {
          // ip_owner
          const { data, error } = await supabase
            .from("user_ipowners")
            .select("*")
            .eq("email", user.email)
            .single();

          console.log("IP Owner profile query result:", { data, error });

          if (error) {
            if (error.code === 'PGRST116') {
              console.log("No IP owner profile found, attempting to create one");
              await createIPOwnerProfile();
            } else {
              console.error("Error fetching IP owner profile:", error);
              toast({
                title: "Error",
                description: `Failed to load profile data: ${error.message}`,
                variant: "destructive",
              });
            }
          } else {
            const unifiedProfile: UnifiedProfile = {
              ...data,
              account_type: 'ip_owner',
              pen_name: data.pen_name_or_studio, // map to pen_name
              buyer_company: null,
              buyer_role: null,
              linkedin_url: null,
              plan: null, // IP owners don't have plans
            };
            console.log("IP Owner profile loaded successfully:", unifiedProfile);
            setProfile(unifiedProfile);
            setFormData(unifiedProfile);
          }
        }
      } catch (error) {
        console.error("Error fetching profile:", error);
        toast({
          title: "Error",
          description: "Failed to load profile data",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [user, toast]);

  const createBuyerProfile = async () => {
    if (!user) return;
    
    console.log("Creating new buyer profile for user:", user.id);
    
    try {
      const newProfile: Partial<BuyerProfile> = {
        email: user.email || '',
        full_name: user.user_metadata?.full_name || '',
        buyer_company: user.user_metadata?.buyer_company,
        buyer_role: user.user_metadata?.buyer_role,
        linkedin_url: user.user_metadata?.linkedin_url,
      };
      
      console.log("Creating buyer profile with data:", newProfile);
      
      const { data, error } = await supabase
        .from("user_buyers")
        .insert(newProfile)
        .select()
        .single();
        
      if (error) {
        console.error("Failed to create buyer profile:", error);
        toast({
          title: "Error",
          description: `Failed to create profile: ${error.message}`,
          variant: "destructive",
        });
      } else {
        const unifiedProfile: UnifiedProfile = {
          ...data,
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
      }
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
    if (!user) return;
    
    console.log("Creating new IP owner profile for user:", user.id);
    
    try {
      const newProfile: Partial<IPOwnerProfile> = {
        email: user.email || '',
        full_name: user.user_metadata?.full_name || '',
        pen_name_or_studio: user.user_metadata?.pen_name_or_studio,
        ip_owner_role: user.user_metadata?.ip_owner_role,
        ip_owner_company: user.user_metadata?.ip_owner_company,
        website_url: user.user_metadata?.website_url,
      };
      
      console.log("Creating IP owner profile with data:", newProfile);
      
      const { data, error } = await supabase
        .from("user_ipowners")
        .insert(newProfile)
        .select()
        .single();
        
      if (error) {
        console.error("Failed to create IP owner profile:", error);
        toast({
          title: "Error",
          description: `Failed to create profile: ${error.message}`,
          variant: "destructive",
        });
      } else {
        const unifiedProfile: UnifiedProfile = {
          ...data,
          account_type: 'ip_owner',
          pen_name: data.pen_name_or_studio,
          buyer_company: null,
          buyer_role: null,
          linkedin_url: null,
          plan: null, // IP owners don't have plans
        };
        console.log("IP owner profile created successfully:", unifiedProfile);
        setProfile(unifiedProfile);
        setFormData(unifiedProfile);
        toast({
          title: "Success",
          description: "Profile created successfully!",
        });
      }
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
    if (shouldUseMockData()) {
      console.log("👤 PROFILE: Mock profile update for localhost development");
      setUpdating(true);
      
      // Simulate async operation
      setTimeout(() => {
        const updatedProfile = { ...mockProfile, ...formData };
        setProfile(updatedProfile);
        setIsEditing(false);
        setUpdating(false);
        
        toast({
          title: "Success",
          description: "Profile updated successfully (localhost mock)",
        });
      }, 500);
      return;
    }

    if (!user || !profile) return;

    try {
      setUpdating(true);

      if (profile.account_type === 'buyer') {
        const updateData = {
          full_name: formData.full_name,
          buyer_company: formData.buyer_company,
          buyer_role: formData.buyer_role,
          linkedin_url: formData.linkedin_url,
        };

        const { data, error } = await supabase
          .from("user_buyers")
          .update(updateData)
          .eq("email", user.email)
          .select()
          .single();

        if (error) {
          throw error;
        }

        const unifiedProfile: UnifiedProfile = {
          ...data,
          account_type: 'buyer',
          pen_name: null,
        };
        setProfile(unifiedProfile);
        setFormData(unifiedProfile);
      } else {
        const updateData = {
          full_name: formData.full_name,
          pen_name_or_studio: formData.pen_name,
          ip_owner_role: formData.ip_owner_role,
          ip_owner_company: formData.ip_owner_company,
          website_url: formData.website_url,
        };

        const { data, error } = await supabase
          .from("user_ipowners")
          .update(updateData)
          .eq("email", user.email)
          .select()
          .single();

        if (error) {
          throw error;
        }

        const unifiedProfile: UnifiedProfile = {
          ...data,
          account_type: 'ip_owner',
          pen_name: data.pen_name_or_studio,
          buyer_company: null,
          buyer_role: null,
          linkedin_url: null,
          plan: null, // IP owners don't have plans
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
      case "ip_owner":
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

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-slate-600">Loading profile...</div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-slate-600">Profile not found</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-porcelain-blue-50">
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-5xl lg:text-6xl font-bold text-midnight-ink leading-tight mb-4">MY PROFILE</h1>
            <p className="text-xl text-midnight-ink-600 leading-relaxed">
              Manage your account information and preferences.
            </p>
          </div>
        
        <div className="flex gap-2">
          {!isEditing ? (
            <Button
              onClick={() => setIsEditing(true)}
              className="bg-hanok-teal hover:bg-hanok-teal-600 text-white"
            >
              <Edit3 className="w-4 h-4 mr-2" />
              Edit Profile
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button
                onClick={handleUpdateProfile}
                disabled={updating}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                <Save className="w-4 h-4 mr-2" />
                {updating ? "Saving..." : "Save Changes"}
              </Button>
              <Button
                onClick={handleCancel}
                variant="outline"
                disabled={updating}
              >
                <X className="w-4 h-4 mr-2" />
                Cancel
              </Button>
            </div>
          )}
        </div>
      </div>

        {/* Profile Information Card */}
        <Card className="bg-white border-gray-200 shadow-lg rounded-2xl mb-12">
          <CardHeader>
            <CardTitle className="text-midnight-ink text-xl">Profile Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Left Column - Basic Information */}
              <div className="space-y-4">
                {/* Full Name */}
                <div>
                  <h5 className="font-semibold text-hanok-teal mb-1">Full Name</h5>
                  {isEditing ? (
                    <Input
                      id="full_name"
                      value={formData.full_name || ""}
                      onChange={(e) => handleInputChange("full_name", e.target.value)}
                      placeholder="Enter your full name"
                    />
                  ) : (
                    <p className="text-gray-600 text-sm">{profile.full_name || "Not specified"}</p>
                  )}
                </div>

                {/* Email */}
                <div>
                  <h5 className="font-semibold text-hanok-teal mb-1">Email Address</h5>
                  <p className="text-gray-600 text-sm">{profile.email}</p>
                </div>

                {/* Account Type */}
                <div>
                  <h5 className="font-semibold text-hanok-teal mb-1">Account Type</h5>
                  <p className="text-gray-600 text-sm">{formatAccountType(profile.account_type)}</p>
                </div>

                {/* Pen Name for IP Owners */}
                {profile.account_type === 'ip_owner' && (
                  <div>
                    <h5 className="font-semibold text-hanok-teal mb-1">Pen Name / Studio Name</h5>
                    {isEditing ? (
                      <Input
                        id="pen_name"
                        value={formData.pen_name || ""}
                        onChange={(e) => handleInputChange("pen_name", e.target.value)}
                        placeholder="Enter your pen name or studio name"
                      />
                    ) : (
                      <p className="text-gray-600 text-sm">{profile.pen_name || "Not specified"}</p>
                    )}
                  </div>
                )}

                {/* Member Since */}
                <div>
                  <h5 className="font-semibold text-hanok-teal mb-1">Member Since</h5>
                  <p className="text-gray-600 text-sm">{formatDate(profile.created_at)}</p>
                </div>
              </div>

              {/* Right Column - Professional Information */}
              <div className="space-y-4">
                {profile.account_type === "buyer" ? (
                  <>
                    {/* Company */}
                    <div>
                      <h5 className="font-semibold text-hanok-teal mb-1">Company</h5>
                      {isEditing ? (
                        <Input
                          id="buyer_company"
                          value={formData.buyer_company || ""}
                          onChange={(e) => handleInputChange("buyer_company", e.target.value)}
                          placeholder="Enter your company name"
                        />
                      ) : (
                        <p className="text-gray-600 text-sm">{profile.buyer_company || "Not specified"}</p>
                      )}
                    </div>

                    {/* Role */}
                    <div>
                      <h5 className="font-semibold text-hanok-teal mb-1">Role</h5>
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
                        <p className="text-gray-600 text-sm">
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
                      <h5 className="font-semibold text-hanok-teal mb-1">LinkedIn URL</h5>
                      {isEditing ? (
                        <Input
                          id="linkedin_url"
                          value={formData.linkedin_url || ""}
                          onChange={(e) => handleInputChange("linkedin_url", e.target.value)}
                          placeholder="https://linkedin.com/in/your-profile"
                          type="url"
                        />
                      ) : (
                        <p className="text-gray-600 text-sm">
                          {profile.linkedin_url ? (
                            <a
                              href={profile.linkedin_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-hanok-teal hover:text-hanok-teal-600 transition-colors"
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
                      <h5 className="font-semibold text-hanok-teal mb-1">Company</h5>
                      {isEditing ? (
                        <Input
                          id="ip_owner_company"
                          value={formData.ip_owner_company || ""}
                          onChange={(e) => handleInputChange("ip_owner_company", e.target.value)}
                          placeholder="Enter your company name"
                        />
                      ) : (
                        <p className="text-gray-600 text-sm">{profile.ip_owner_company || "Not specified"}</p>
                      )}
                    </div>

                    {/* Role */}
                    <div>
                      <h5 className="font-semibold text-hanok-teal mb-1">Role</h5>
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
                        <p className="text-gray-600 text-sm">
                          {profile.ip_owner_role ? 
                            profile.ip_owner_role.charAt(0).toUpperCase() + profile.ip_owner_role.slice(1)
                            : "Not specified"
                          }
                        </p>
                      )}
                    </div>

                    {/* Website URL */}
                    <div>
                      <h5 className="font-semibold text-hanok-teal mb-1">Website URL</h5>
                      {isEditing ? (
                        <Input
                          id="website_url"
                          value={formData.website_url || ""}
                          onChange={(e) => handleInputChange("website_url", e.target.value)}
                          placeholder="https://your-website.com"
                          type="url"
                        />
                      ) : (
                        <p className="text-gray-600 text-sm">
                          {profile.website_url ? (
                            <a
                              href={profile.website_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-hanok-teal hover:text-hanok-teal-600 transition-colors"
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

                {/* Membership Tier */}
                {profile.tier && (
                  <div>
                    <h5 className="font-semibold text-hanok-teal mb-1">Membership Tier</h5>
                    <p className="text-gray-600 text-sm">
                      {profile.tier === "suite" ? "Suite" : profile.tier.charAt(0).toUpperCase() + profile.tier.slice(1)}
                    </p>
                  </div>
                )}

                {/* Last Updated */}
                <div>
                  <h5 className="font-semibold text-hanok-teal mb-1">Last Updated</h5>
                  <p className="text-gray-600 text-sm">{formatDate(profile.updated_at)}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}