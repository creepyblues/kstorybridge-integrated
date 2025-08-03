import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { User, Mail, Building, Globe, Linkedin, Calendar, UserCheck } from "lucide-react";
import { Database } from "@/integrations/supabase/types";

type Profile = Database["public"]["Tables"]["profiles"]["Row"];

export default function Profile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return;

      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single();

        if (error) {
          console.error("Error fetching profile:", error);
        } else {
          setProfile(data);
        }
      } catch (error) {
        console.error("Error fetching profile:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [user]);

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

  const formatRole = (role: string | null, accountType: string) => {
    if (!role) return null;
    
    // Convert underscore to space and capitalize
    return role
      .split("_")
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
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
      <div className="flex items-center gap-3 mb-8">
        <User className="w-8 h-8 text-hanok-teal" />
        <h1 className="text-3xl font-bold text-slate-800">My Profile</h1>
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
            <div className="flex items-center gap-3">
              <User className="w-4 h-4 text-slate-500" />
              <div>
                <p className="font-medium text-slate-800">{profile.full_name}</p>
                <p className="text-sm text-slate-600">Full Name</p>
              </div>
            </div>

            <Separator />

            <div className="flex items-center gap-3">
              <Mail className="w-4 h-4 text-slate-500" />
              <div>
                <p className="font-medium text-slate-800">{profile.email}</p>
                <p className="text-sm text-slate-600">Email Address</p>
              </div>
            </div>

            <Separator />

            <div className="flex items-center gap-3">
              <UserCheck className="w-4 h-4 text-slate-500" />
              <div>
                <Badge variant="secondary" className="bg-hanok-teal/10 text-hanok-teal border-hanok-teal/20">
                  {formatAccountType(profile.account_type)}
                </Badge>
                <p className="text-sm text-slate-600 mt-1">Account Type</p>
              </div>
            </div>

            {profile.pen_name_or_studio && (
              <>
                <Separator />
                <div className="flex items-center gap-3">
                  <User className="w-4 h-4 text-slate-500" />
                  <div>
                    <p className="font-medium text-slate-800">{profile.pen_name_or_studio}</p>
                    <p className="text-sm text-slate-600">Pen Name / Studio</p>
                  </div>
                </div>
              </>
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
                {profile.buyer_company && (
                  <div className="flex items-center gap-3">
                    <Building className="w-4 h-4 text-slate-500" />
                    <div>
                      <p className="font-medium text-slate-800">{profile.buyer_company}</p>
                      <p className="text-sm text-slate-600">Company</p>
                    </div>
                  </div>
                )}
                
                {profile.buyer_role && (
                  <>
                    {profile.buyer_company && <Separator />}
                    <div className="flex items-center gap-3">
                      <UserCheck className="w-4 h-4 text-slate-500" />
                      <div>
                        <Badge variant="outline" className="border-porcelain-blue-300 text-porcelain-blue-700">
                          {formatRole(profile.buyer_role, profile.account_type)}
                        </Badge>
                        <p className="text-sm text-slate-600 mt-1">Role</p>
                      </div>
                    </div>
                  </>
                )}
              </>
            ) : (
              <>
                {profile.ip_owner_company && (
                  <div className="flex items-center gap-3">
                    <Building className="w-4 h-4 text-slate-500" />
                    <div>
                      <p className="font-medium text-slate-800">{profile.ip_owner_company}</p>
                      <p className="text-sm text-slate-600">Company</p>
                    </div>
                  </div>
                )}
                
                {profile.ip_owner_role && (
                  <>
                    {profile.ip_owner_company && <Separator />}
                    <div className="flex items-center gap-3">
                      <UserCheck className="w-4 h-4 text-slate-500" />
                      <div>
                        <Badge variant="outline" className="border-porcelain-blue-300 text-porcelain-blue-700">
                          {formatRole(profile.ip_owner_role, profile.account_type)}
                        </Badge>
                        <p className="text-sm text-slate-600 mt-1">Role</p>
                      </div>
                    </div>
                  </>
                )}
              </>
            )}

            {!profile.buyer_company && !profile.ip_owner_company && !profile.buyer_role && !profile.ip_owner_role && (
              <div className="text-center py-8 text-slate-500">
                <Building className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>No professional information available</p>
              </div>
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
            {profile.website_url && (
              <div className="flex items-center gap-3">
                <Globe className="w-4 h-4 text-slate-500" />
                <div>
                  <a
                    href={profile.website_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium text-hanok-teal hover:text-hanok-teal-600 transition-colors"
                  >
                    {profile.website_url}
                  </a>
                  <p className="text-sm text-slate-600">Website</p>
                </div>
              </div>
            )}

            {profile.linkedin_url && (
              <>
                {profile.website_url && <Separator />}
                <div className="flex items-center gap-3">
                  <Linkedin className="w-4 h-4 text-slate-500" />
                  <div>
                    <a
                      href={profile.linkedin_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-medium text-hanok-teal hover:text-hanok-teal-600 transition-colors"
                    >
                      LinkedIn Profile
                    </a>
                    <p className="text-sm text-slate-600">Professional Network</p>
                  </div>
                </div>
              </>
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
              <Calendar className="w-5 h-5" />
              Account Details
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
            <div className="flex items-center gap-3">
              <Calendar className="w-4 h-4 text-slate-500" />
              <div>
                <p className="font-medium text-slate-800">{formatDate(profile.created_at)}</p>
                <p className="text-sm text-slate-600">Member Since</p>
              </div>
            </div>

            <Separator />

            <div className="flex items-center gap-3">
              <Calendar className="w-4 h-4 text-slate-500" />
              <div>
                <p className="font-medium text-slate-800">{formatDate(profile.updated_at)}</p>
                <p className="text-sm text-slate-600">Last Updated</p>
              </div>
            </div>

            {profile.invitation_status && (
              <>
                <Separator />
                <div className="flex items-center gap-3">
                  <UserCheck className="w-4 h-4 text-slate-500" />
                  <div>
                    <Badge 
                      variant={profile.invitation_status === "accepted" ? "default" : "secondary"}
                      className={profile.invitation_status === "accepted" 
                        ? "bg-green-100 text-green-800 border-green-200" 
                        : ""
                      }
                    >
                      {profile.invitation_status.charAt(0).toUpperCase() + profile.invitation_status.slice(1)}
                    </Badge>
                    <p className="text-sm text-slate-600 mt-1">Invitation Status</p>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}