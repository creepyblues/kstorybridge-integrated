import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@kstorybridge/ui";
import { Button } from '@kstorybridge/ui';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@kstorybridge/ui";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@kstorybridge/ui";
import { RefreshCw, Save, Check, Mail, CheckCircle } from "lucide-react";
import AdminLayout from "@/components/layout/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { Database } from "@/integrations/supabase/types";

type UserTier = Database["public"]["Enums"]["user_tier"];

interface UserBuyer {
  id: string;
  email: string;
  tier: UserTier | null;
  created_at: string;
  requested: boolean | null;
  user_id: string;
}

export default function AdminUserApproval() {
  const [users, setUsers] = useState<UserBuyer[]>([]);
  const [loading, setLoading] = useState(false);
  const [savingUsers, setSavingUsers] = useState<Set<string>>(new Set());
  const [pendingChanges, setPendingChanges] = useState<Map<string, UserTier>>(new Map());
  const [approvingUsers, setApprovingUsers] = useState<Set<string>>(new Set());

  const tierOptions: UserTier[] = ["invited", "basic", "pro", "suite"];

  const tierColors = {
    invited: "bg-gray-100 text-gray-700",
    basic: "bg-blue-100 text-blue-700",
    pro: "bg-purple-100 text-purple-700",
    suite: "bg-amber-100 text-amber-700",
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      
      // Try to use the view first if it exists
      const { data: viewData, error: viewError } = await supabase
        .from('user_buyers_with_email')
        .select('*')
        .order('created_at', { ascending: false });

      if (!viewError && viewData) {
        // View exists and we got data
        setUsers(viewData);
        return;
      }

      // Fallback: Try the original user_buyers table structure (with email field)
      const { data: buyersWithEmail, error: buyersWithEmailError } = await supabase
        .from('user_buyers')
        .select('id, email, full_name, tier, requested, created_at, user_id')
        .order('created_at', { ascending: false });

      if (!buyersWithEmailError && buyersWithEmail && buyersWithEmail.length > 0) {
        // Check if the first record has an email field
        if (buyersWithEmail[0].email) {
          // Original structure with email field
          const usersData = buyersWithEmail.map(buyer => ({
            id: buyer.id,
            user_id: buyer.user_id || buyer.id, // Use id as user_id if user_id doesn't exist
            email: buyer.email,
            full_name: buyer.full_name || 'Unknown',
            tier: buyer.tier,
            requested: buyer.requested,
            created_at: buyer.created_at
          }));
          setUsers(usersData);
          return;
        }
      }

      // Last fallback: Get basic user_buyers data without emails
      const { data: buyersData, error: buyersError } = await supabase
        .from('user_buyers')
        .select('*')
        .order('created_at', { ascending: false });

      if (buyersError) throw buyersError;

      if (!buyersData || buyersData.length === 0) {
        setUsers([]);
        return;
      }

      // For each buyer, create a temporary email placeholder
      const usersWithEmails = buyersData.map(buyer => {
        // Safely handle both id and user_id fields
        const userId = buyer.user_id || buyer.id;
        const userIdStr = userId ? String(userId) : 'unknown';
        const shortId = userIdStr.length > 8 ? userIdStr.substring(0, 8) : userIdStr;
        
        return {
          ...buyer,
          user_id: userId,
          email: buyer.email || `user_${shortId}@kstorybridge.com`,
          full_name: buyer.full_name || `User ${shortId}`
        };
      });

      setUsers(usersWithEmails);
      
      // Note to admin that emails couldn't be loaded
      if (viewError) {
        console.log('View not available. Please run the migration to create user_buyers_with_email view.');
        toast.info('To see actual email addresses, please run the database migration.');
      }
      
    } catch (error) {
      console.error('Error loading users:', error);
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const handleTierChange = (userId: string, newTier: UserTier) => {
    setPendingChanges(prev => {
      const newMap = new Map(prev);
      newMap.set(userId, newTier);
      return newMap;
    });
  };

  const saveUserTier = async (userId: string) => {
    const newTier = pendingChanges.get(userId);
    if (!newTier) return;

    try {
      setSavingUsers(prev => new Set(prev).add(userId));

      const { error } = await supabase
        .from('user_buyers')
        .update({ tier: newTier })
        .eq('id', userId);

      if (error) throw error;

      // Update local state
      setUsers(prev => prev.map(user => 
        user.id === userId ? { ...user, tier: newTier } : user
      ));

      // Clear pending change
      setPendingChanges(prev => {
        const newMap = new Map(prev);
        newMap.delete(userId);
        return newMap;
      });

      toast.success('User tier updated successfully');
    } catch (error) {
      console.error('Error updating user tier:', error);
      toast.error('Failed to update user tier');
    } finally {
      setSavingUsers(prev => {
        const newSet = new Set(prev);
        newSet.delete(userId);
        return newSet;
      });
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const approveUser = async (userId: string, userEmail: string) => {
    try {
      setApprovingUsers(prev => new Set(prev).add(userId));

      // First, update the user's tier to 'basic'
      const { error: updateError } = await supabase
        .from('user_buyers')
        .update({ tier: 'basic' })
        .eq('id', userId);

      if (updateError) throw updateError;

      // Send approval email via Edge Function
      const { error: emailError } = await supabase.functions.invoke('send-approval-email', {
        body: {
          email: userEmail
        }
      });

      if (emailError) {
        console.error('Failed to send approval email:', emailError);
        toast.warning('User approved but email notification failed');
      } else {
        toast.success('User approved and email sent successfully!');
      }

      // Update local state
      setUsers(prev => prev.map(user => 
        user.id === userId ? { ...user, tier: 'basic' } : user
      ));

      // Clear any pending changes for this user
      setPendingChanges(prev => {
        const newMap = new Map(prev);
        newMap.delete(userId);
        return newMap;
      });

    } catch (error) {
      console.error('Error approving user:', error);
      toast.error('Failed to approve user');
    } finally {
      setApprovingUsers(prev => {
        const newSet = new Set(prev);
        newSet.delete(userId);
        return newSet;
      });
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-midnight-ink">User Approval</h1>
          <Button
            onClick={loadUsers}
            variant="outline"
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Buyer Users</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-hanok-teal"></div>
              </div>
            ) : users.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No buyer users found
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Email</TableHead>
                      <TableHead>Current Tier</TableHead>
                      <TableHead>Change Tier</TableHead>
                      <TableHead>Requested Access</TableHead>
                      <TableHead>Joined</TableHead>
                      <TableHead>Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((user) => {
                      const hasPendingChange = pendingChanges.has(user.id);
                      const pendingTier = pendingChanges.get(user.id);
                      const isSaving = savingUsers.has(user.id);
                      const isApproving = approvingUsers.has(user.id);

                      return (
                        <TableRow key={user.id}>
                          <TableCell className="font-medium">
                            <div className="flex items-center gap-2">
                              {user.email}
                              {user.tier === 'invited' && (
                                <Button
                                  size="sm"
                                  variant="default"
                                  onClick={() => approveUser(user.id, user.email)}
                                  disabled={isApproving}
                                  className="bg-green-600 hover:bg-green-700"
                                >
                                  {isApproving ? (
                                    <RefreshCw className="h-3 w-3 animate-spin" />
                                  ) : (
                                    <>
                                      <CheckCircle className="h-3 w-3 mr-1" />
                                      Approve
                                    </>
                                  )}
                                </Button>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            {user.tier ? (
                              <span className={`px-2 py-1 rounded-full text-xs font-semibold ${tierColors[user.tier]}`}>
                                {user.tier.toUpperCase()}
                              </span>
                            ) : (
                              <span className="text-gray-400">Not set</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <Select
                              value={pendingTier || user.tier || ""}
                              onValueChange={(value) => handleTierChange(user.id, value as UserTier)}
                              disabled={isSaving}
                            >
                              <SelectTrigger className="w-32">
                                <SelectValue placeholder="Select tier" />
                              </SelectTrigger>
                              <SelectContent>
                                {tierOptions.map((tier) => (
                                  <SelectItem key={tier} value={tier}>
                                    {tier.charAt(0).toUpperCase() + tier.slice(1)}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell>
                            {user.requested ? (
                              <span className="text-green-600 flex items-center">
                                <Check className="h-4 w-4 mr-1" />
                                Yes
                              </span>
                            ) : (
                              <span className="text-gray-400">No</span>
                            )}
                          </TableCell>
                          <TableCell>{formatDate(user.created_at)}</TableCell>
                          <TableCell>
                            <Button
                              size="sm"
                              onClick={() => saveUserTier(user.id)}
                              disabled={!hasPendingChange || isSaving}
                              variant={hasPendingChange ? "default" : "outline"}
                            >
                              {isSaving ? (
                                <RefreshCw className="h-4 w-4 animate-spin" />
                              ) : (
                                <>
                                  <Save className="h-4 w-4 mr-1" />
                                  Save
                                </>
                              )}
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}