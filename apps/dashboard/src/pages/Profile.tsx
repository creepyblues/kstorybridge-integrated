import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { User, Mail, Building, Globe, Linkedin, Save, Edit3, X } from "lucide-react";

// Define types for the actual table structures
type BuyerProfile = {
  id: string;
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
      if (!user) {
        console.log("No user found, skipping profile fetch");
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
            .eq("id", user.id)
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
            .eq("id", user.id)
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
        id: user.id,
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
        id: user.id,
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
          .eq("id", user.id)
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
          .eq("id", user.id)
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
    <div className="container mx-auto py-8 space-y-8">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <User className="w-8 h-8 text-hanok-teal" />
          <h1 className="text-3xl font-bold text-slate-800">My Profile</h1>
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

      <div className="grid gap-6 md:grid-cols-2">
        {/* Basic Information */}
        <Card className="shadow-lg">
          <CardHeader className="bg-gradient-to-r from-hanok-teal to-porcelain-blue-600 text-white">
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              Basic Information
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="full_name">Full Name</Label>
              {isEditing ? (
                <Input
                  id="full_name"
                  value={formData.full_name || ""}
                  onChange={(e) => handleInputChange("full_name", e.target.value)}
                  placeholder="Enter your full name"
                />
              ) : (
                <div className="flex items-center gap-3">
                  <User className="w-4 h-4 text-slate-500" />
                  <p className="font-medium text-slate-800">{profile.full_name || "Not provided"}</p>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <div className="flex items-center gap-3">
                <Mail className="w-4 h-4 text-slate-500" />
                <p className="font-medium text-slate-800">{profile.email}</p>
                <span className="text-xs text-slate-500 ml-auto">(Cannot be changed)</span>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Account Type</Label>
              <div className="flex items-center gap-3">
                <User className="w-4 h-4 text-slate-500" />
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-hanok-teal/10 text-hanok-teal border border-hanok-teal/20">
                  {formatAccountType(profile.account_type)}
                </span>
                <span className="text-xs text-slate-500 ml-auto">(Cannot be changed)</span>
              </div>
            </div>

            {profile.account_type === 'ip_owner' && (
              <div className="space-y-2">
                <Label htmlFor="pen_name">Pen Name / Studio Name</Label>
                {isEditing ? (
                  <Input
                    id="pen_name"
                    value={formData.pen_name || ""}
                    onChange={(e) => handleInputChange("pen_name", e.target.value)}
                    placeholder="Enter your pen name or studio name"
                  />
                ) : (
                  <div className="flex items-center gap-3">
                    <User className="w-4 h-4 text-slate-500" />
                    <p className="font-medium text-slate-800">{profile.pen_name || "Not provided"}</p>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Professional Information */}
        <Card className="shadow-lg">
          <CardHeader className="bg-gradient-to-r from-porcelain-blue-600 to-hanok-teal text-white">
            <CardTitle className="flex items-center gap-2">
              <Building className="w-5 h-5" />
              Professional Information
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
            {profile.account_type === "buyer" ? (
              <>
                <div className="space-y-2">
                  <Label htmlFor="buyer_company">Company</Label>
                  {isEditing ? (
                    <Input
                      id="buyer_company"
                      value={formData.buyer_company || ""}
                      onChange={(e) => handleInputChange("buyer_company", e.target.value)}
                      placeholder="Enter your company name"
                    />
                  ) : (
                    <div className="flex items-center gap-3">
                      <Building className="w-4 h-4 text-slate-500" />
                      <p className="font-medium text-slate-800">{profile.buyer_company || "Not provided"}</p>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="buyer_role">Role</Label>
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
                    <div className="flex items-center gap-3">
                      <User className="w-4 h-4 text-slate-500" />
                      <p className="font-medium text-slate-800">
                        {profile.buyer_role ? 
                          profile.buyer_role.split("_").map(word => 
                            word.charAt(0).toUpperCase() + word.slice(1)
                          ).join(" ") 
                          : "Not provided"
                        }
                      </p>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                <div className="space-y-2">
                  <Label htmlFor="ip_owner_company">Company</Label>
                  {isEditing ? (
                    <Input
                      id="ip_owner_company"
                      value={formData.ip_owner_company || ""}
                      onChange={(e) => handleInputChange("ip_owner_company", e.target.value)}
                      placeholder="Enter your company name"
                    />
                  ) : (
                    <div className="flex items-center gap-3">
                      <Building className="w-4 h-4 text-slate-500" />
                      <p className="font-medium text-slate-800">{profile.ip_owner_company || "Not provided"}</p>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="ip_owner_role">Role</Label>
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
                    <div className="flex items-center gap-3">
                      <User className="w-4 h-4 text-slate-500" />
                      <p className="font-medium text-slate-800">
                        {profile.ip_owner_role ? 
                          profile.ip_owner_role.charAt(0).toUpperCase() + profile.ip_owner_role.slice(1)
                          : "Not provided"
                        }
                      </p>
                    </div>
                  )}
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Contact & Links */}
        <Card className="shadow-lg">
          <CardHeader className="bg-gradient-to-r from-sunrise-coral to-hanok-teal text-white">
            <CardTitle className="flex items-center gap-2">
              <Globe className="w-5 h-5" />
              Contact & Links
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
            {profile.account_type === 'ip_owner' && (
              <div className="space-y-2">
                <Label htmlFor="website_url">Website URL</Label>
                {isEditing ? (
                  <Input
                    id="website_url"
                    value={formData.website_url || ""}
                    onChange={(e) => handleInputChange("website_url", e.target.value)}
                    placeholder="https://your-website.com"
                    type="url"
                  />
                ) : (
                  <div className="flex items-center gap-3">
                    <Globe className="w-4 h-4 text-slate-500" />
                    {profile.website_url ? (
                      <a
                        href={profile.website_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-medium text-hanok-teal hover:text-hanok-teal-600 transition-colors"
                      >
                        {profile.website_url}
                      </a>
                    ) : (
                      <p className="font-medium text-slate-800">Not provided</p>
                    )}
                  </div>
                )}
              </div>
            )}

            {profile.account_type === 'buyer' && (
              <div className="space-y-2">
                <Label htmlFor="linkedin_url">LinkedIn URL</Label>
                {isEditing ? (
                  <Input
                    id="linkedin_url"
                    value={formData.linkedin_url || ""}
                    onChange={(e) => handleInputChange("linkedin_url", e.target.value)}
                    placeholder="https://linkedin.com/in/your-profile"
                    type="url"
                  />
                ) : (
                  <div className="flex items-center gap-3">
                    <Linkedin className="w-4 h-4 text-slate-500" />
                    {profile.linkedin_url ? (
                      <a
                        href={profile.linkedin_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-medium text-hanok-teal hover:text-hanok-teal-600 transition-colors"
                      >
                        LinkedIn Profile
                      </a>
                    ) : (
                      <p className="font-medium text-slate-800">Not provided</p>
                    )}
                  </div>
                )}
              </div>
            )}

            {!profile.website_url && !profile.linkedin_url && (
              <div className="text-center py-8 text-slate-500">
                <Globe className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>No contact links available</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Account Details */}
        <Card className="shadow-lg">
          <CardHeader className="bg-gradient-to-r from-slate-600 to-slate-700 text-white">
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              Account Details
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
            <div className="space-y-2">
              <Label>Member Since</Label>
              <p className="font-medium text-slate-800">{formatDate(profile.created_at)}</p>
            </div>

            <div className="space-y-2">
              <Label>Last Updated</Label>
              <p className="font-medium text-slate-800">{formatDate(profile.updated_at)}</p>
            </div>

            {profile.tier && (
              <div className="space-y-2">
                <Label>Membership Tier</Label>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  profile.tier === "basic" || profile.tier === "pro" || profile.tier === "suite"
                    ? profile.tier === "suite" 
                      ? "bg-purple-100 text-purple-800 border border-purple-200"
                      : profile.tier === "pro"
                      ? "bg-blue-100 text-blue-800 border border-blue-200"
                      : "bg-green-100 text-green-800 border border-green-200"
                    : "bg-slate-100 text-slate-800 border border-slate-200"
                }`}>
                  {profile.tier === "suite" ? "Suite" : profile.tier.charAt(0).toUpperCase() + profile.tier.slice(1)}
                </span>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}