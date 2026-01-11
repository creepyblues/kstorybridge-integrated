/**
 * TrialConversions
 *
 * Admin page to view trial-to-signup conversions.
 * Shows which users went through the trial flow and converted to signup.
 */

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import AdminLayout from '@/components/layout/AdminLayout';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';
import { Icon } from '@iconify/react';

interface TrialSession {
  id: string;
  session_id: string;
  converted: boolean;
  converted_at: string | null;
  user_id: string | null;
  user_email: string | null;
  tools_used: string[];
  total_searches: number;
  comps_searches: number;
  mandate_searches: number;
  chat_messages: number;
  titles_viewed: number;
  last_comps_query: string[] | null;
  last_mandate_query: string | null;
  last_chat_query: string | null;
  first_visit_at: string;
  last_activity_at: string;
  created_at: string;
  // Joined data
  user_buyers?: {
    full_name: string | null;
    buyer_company: string | null;
    buyer_role: string | null;
  } | null;
}

interface Stats {
  totalTrials: number;
  converted: number;
  conversionRate: number;
  avgSearches: number;
}

type FilterStatus = 'all' | 'converted' | 'unconverted';

export default function TrialConversions() {
  const { toast } = useToast();
  const [sessions, setSessions] = useState<TrialSession[]>([]);
  const [stats, setStats] = useState<Stats>({
    totalTrials: 0,
    converted: 0,
    conversionRate: 0,
    avgSearches: 0,
  });
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');
  const [dateRange, setDateRange] = useState<'7d' | '30d' | '90d' | 'all'>('30d');

  useEffect(() => {
    loadData();
  }, [dateRange]);

  async function loadData() {
    setLoading(true);
    try {
      // Calculate date filter
      let dateFilter: string | null = null;
      const now = new Date();
      if (dateRange === '7d') {
        dateFilter = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
      } else if (dateRange === '30d') {
        dateFilter = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
      } else if (dateRange === '90d') {
        dateFilter = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000).toISOString();
      }

      // Fetch trial sessions
      let query = supabase
        .from('trial_sessions')
        .select(`
          *,
          user_buyers (
            full_name,
            buyer_company,
            buyer_role
          )
        `)
        .order('created_at', { ascending: false });

      if (dateFilter) {
        query = query.gte('created_at', dateFilter);
      }

      const { data, error } = await query;

      if (error) throw error;

      const sessionsData = (data || []) as TrialSession[];
      setSessions(sessionsData);

      // Calculate stats
      const totalTrials = sessionsData.length;
      const converted = sessionsData.filter(s => s.converted).length;
      const totalSearches = sessionsData.reduce((sum, s) => sum + (s.total_searches || 0), 0);

      setStats({
        totalTrials,
        converted,
        conversionRate: totalTrials > 0 ? (converted / totalTrials) * 100 : 0,
        avgSearches: totalTrials > 0 ? totalSearches / totalTrials : 0,
      });
    } catch (error: any) {
      console.error('Error loading trial data:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to load trial data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }

  // Filter sessions based on search and status
  const filteredSessions = sessions.filter(session => {
    // Status filter
    if (filterStatus === 'converted' && !session.converted) return false;
    if (filterStatus === 'unconverted' && session.converted) return false;

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const email = session.user_email?.toLowerCase() || '';
      const company = session.user_buyers?.buyer_company?.toLowerCase() || '';
      const name = session.user_buyers?.full_name?.toLowerCase() || '';
      return email.includes(query) || company.includes(query) || name.includes(query);
    }

    return true;
  });

  function formatDate(dateString: string | null) {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-black">Trial Conversions</h1>
            <p className="text-sm text-gray-600 mt-1">
              Track trial users and their conversion to signup
            </p>
          </div>
          <Button
            variant="outline"
            onClick={loadData}
            disabled={loading}
            className="border-gray-300"
          >
            <Icon icon="solar:refresh-bold-duotone" className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Icon icon="solar:users-group-two-rounded-bold-duotone" className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <div className="text-sm text-gray-600">Total Trials</div>
                  <div className="text-2xl font-bold text-black">{stats.totalTrials}</div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Icon icon="solar:check-circle-bold-duotone" className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <div className="text-sm text-gray-600">Converted</div>
                  <div className="text-2xl font-bold text-black">{stats.converted}</div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Icon icon="solar:chart-bold-duotone" className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <div className="text-sm text-gray-600">Conversion Rate</div>
                  <div className="text-2xl font-bold text-black">{stats.conversionRate.toFixed(1)}%</div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <Icon icon="solar:magnifer-bold-duotone" className="h-5 w-5 text-orange-600" />
                </div>
                <div>
                  <div className="text-sm text-gray-600">Avg Searches</div>
                  <div className="text-2xl font-bold text-black">{stats.avgSearches.toFixed(1)}</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4">
              {/* Search */}
              <div className="flex-1 relative">
                <Icon icon="solar:magnifer-bold-duotone" className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Search by email, name, or company..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>

              {/* Status Filter */}
              <Select value={filterStatus} onValueChange={(v) => setFilterStatus(v as FilterStatus)}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Sessions</SelectItem>
                  <SelectItem value="converted">Converted Only</SelectItem>
                  <SelectItem value="unconverted">Unconverted Only</SelectItem>
                </SelectContent>
              </Select>

              {/* Date Range */}
              <Select value={dateRange} onValueChange={(v) => setDateRange(v as typeof dateRange)}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Date range" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7d">Last 7 days</SelectItem>
                  <SelectItem value="30d">Last 30 days</SelectItem>
                  <SelectItem value="90d">Last 90 days</SelectItem>
                  <SelectItem value="all">All time</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Sessions Table */}
        <Card>
          <CardContent className="p-0">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Icon icon="solar:refresh-circle-bold-duotone" className="h-8 w-8 animate-spin text-gray-400" />
              </div>
            ) : filteredSessions.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                {searchQuery || filterStatus !== 'all'
                  ? 'No sessions match your filters'
                  : 'No trial sessions recorded yet'}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                        User
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                        Company
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                        Tools Used
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                        Searches
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                        First Visit
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                        Converted At
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredSessions.map((session) => (
                      <tr key={session.id} className="hover:bg-gray-50">
                        {/* Status */}
                        <td className="px-4 py-4 whitespace-nowrap">
                          {session.converted ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-full bg-green-100 text-green-700">
                              <Icon icon="solar:check-circle-bold" className="h-3.5 w-3.5" />
                              Converted
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-600">
                              <Icon icon="solar:clock-circle-bold" className="h-3.5 w-3.5" />
                              Pending
                            </span>
                          )}
                        </td>

                        {/* User */}
                        <td className="px-4 py-4">
                          {session.converted && session.user_email ? (
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {session.user_buyers?.full_name || 'Unknown'}
                              </div>
                              <div className="text-xs text-gray-500">{session.user_email}</div>
                            </div>
                          ) : (
                            <div className="text-sm text-gray-400 italic">Anonymous</div>
                          )}
                        </td>

                        {/* Company */}
                        <td className="px-4 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-600">
                            {session.user_buyers?.buyer_company || '-'}
                          </div>
                        </td>

                        {/* Tools Used */}
                        <td className="px-4 py-4 whitespace-nowrap">
                          <div className="flex gap-1">
                            {session.tools_used?.includes('comps') && (
                              <span className="px-2 py-0.5 text-xs rounded-full bg-blue-100 text-blue-700">
                                Comps
                              </span>
                            )}
                            {session.tools_used?.includes('mandates') && (
                              <span className="px-2 py-0.5 text-xs rounded-full bg-purple-100 text-purple-700">
                                Mandates
                              </span>
                            )}
                            {session.tools_used?.includes('chat') && (
                              <span className="px-2 py-0.5 text-xs rounded-full bg-green-100 text-green-700">
                                Chat
                              </span>
                            )}
                            {(!session.tools_used || session.tools_used.length === 0) && (
                              <span className="text-sm text-gray-400">-</span>
                            )}
                          </div>
                        </td>

                        {/* Searches */}
                        <td className="px-4 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900 font-medium">
                            {session.total_searches || 0}
                          </div>
                          {session.total_searches > 0 && (
                            <div className="text-xs text-gray-500">
                              {session.comps_searches > 0 && `${session.comps_searches} comps`}
                              {session.mandate_searches > 0 && (session.comps_searches > 0 ? ', ' : '') + `${session.mandate_searches} mandates`}
                              {session.chat_messages > 0 && ((session.comps_searches > 0 || session.mandate_searches > 0) ? ', ' : '') + `${session.chat_messages} chat`}
                            </div>
                          )}
                        </td>

                        {/* First Visit */}
                        <td className="px-4 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-600">
                            {formatDate(session.first_visit_at)}
                          </div>
                        </td>

                        {/* Converted At */}
                        <td className="px-4 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-600">
                            {session.converted ? formatDate(session.converted_at) : '-'}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Summary */}
        {filteredSessions.length > 0 && (
          <p className="text-sm text-gray-500 text-center">
            Showing {filteredSessions.length} of {sessions.length} trial sessions
          </p>
        )}
      </div>
    </AdminLayout>
  );
}
