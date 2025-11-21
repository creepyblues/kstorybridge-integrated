/**
 * Comps Navigator Analytics Dashboard
 *
 * Admin page for monitoring Comps Navigator usage, performance, and costs.
 */

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@kstorybridge/ui';
import { supabase } from '@/integrations/supabase/client';
import { BarChart3, TrendingUp, DollarSign, Search, Clock, Star } from 'lucide-react';

interface AnalyticsData {
  totalSearches: number;
  totalUsers: number;
  avgMatchScore: number;
  avgSearchesPerUser: number;
  totalBookmarked: number;
  avgResultCount: number;
  topComps: Array<{ comp: string; count: number }>;
  searchTrends: Array<{ date: string; count: number }>;
  costEstimate: number;
}

export default function CompsAnalytics() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | 'all'>('30d');

  useEffect(() => {
    loadAnalytics();
  }, [timeRange]);

  const loadAnalytics = async () => {
    setLoading(true);
    try {
      // Calculate date range
      const now = new Date();
      const startDate = timeRange === '7d'
        ? new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        : timeRange === '30d'
        ? new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
        : new Date(0);

      // Fetch all searches in time range
      const { data: searches, error } = await supabase
        .from('comp_searches')
        .select('*')
        .gte('created_at', startDate.toISOString())
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (!searches || searches.length === 0) {
        setData({
          totalSearches: 0,
          totalUsers: 0,
          avgMatchScore: 0,
          avgSearchesPerUser: 0,
          totalBookmarked: 0,
          avgResultCount: 0,
          topComps: [],
          searchTrends: [],
          costEstimate: 0
        });
        setLoading(false);
        return;
      }

      // Calculate metrics
      const uniqueUsers = new Set(searches.map(s => s.user_email)).size;
      const totalSearches = searches.length;
      const avgMatchScore = searches.reduce((sum, s) => sum + (s.avg_match_score || 0), 0) / totalSearches;
      const totalBookmarked = searches.filter(s => s.is_bookmarked).length;
      const avgResultCount = searches.reduce((sum, s) => sum + (s.result_count || 0), 0) / totalSearches;

      // Top comps
      const compCounts: Record<string, number> = {};
      searches.forEach(search => {
        search.comp_titles?.forEach((comp: string) => {
          compCounts[comp] = (compCounts[comp] || 0) + 1;
        });
      });
      const topComps = Object.entries(compCounts)
        .map(([comp, count]) => ({ comp, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

      // Search trends (daily)
      const trendMap: Record<string, number> = {};
      searches.forEach(search => {
        const date = new Date(search.created_at).toISOString().split('T')[0];
        trendMap[date] = (trendMap[date] || 0) + 1;
      });
      const searchTrends = Object.entries(trendMap)
        .map(([date, count]) => ({ date, count }))
        .sort((a, b) => a.date.localeCompare(b.date));

      // Cost estimate ($0.015 per search)
      const costEstimate = totalSearches * 0.015;

      setData({
        totalSearches,
        totalUsers: uniqueUsers,
        avgMatchScore,
        avgSearchesPerUser: totalSearches / uniqueUsers,
        totalBookmarked,
        avgResultCount,
        topComps,
        searchTrends,
        costEstimate
      });
    } catch (error) {
      console.error('Failed to load analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-4">Comps Navigator Analytics</h1>
        <p className="text-gray-600">Failed to load analytics data.</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Comps Navigator Analytics</h1>
        <div className="flex gap-2">
          <button
            onClick={() => setTimeRange('7d')}
            className={`px-4 py-2 rounded ${timeRange === '7d' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
          >
            7 Days
          </button>
          <button
            onClick={() => setTimeRange('30d')}
            className={`px-4 py-2 rounded ${timeRange === '30d' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
          >
            30 Days
          </button>
          <button
            onClick={() => setTimeRange('all')}
            className={`px-4 py-2 rounded ${timeRange === 'all' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
          >
            All Time
          </button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <MetricCard
          icon={<Search className="h-6 w-6 text-blue-500" />}
          title="Total Searches"
          value={data.totalSearches.toLocaleString()}
          subtitle={`${data.totalUsers} unique users`}
        />
        <MetricCard
          icon={<TrendingUp className="h-6 w-6 text-green-500" />}
          title="Avg Match Score"
          value={`${data.avgMatchScore.toFixed(1)}%`}
          subtitle="Quality metric"
        />
        <MetricCard
          icon={<DollarSign className="h-6 w-6 text-yellow-500" />}
          title="Estimated Cost"
          value={`$${data.costEstimate.toFixed(2)}`}
          subtitle={`$${(data.costEstimate / data.totalSearches || 0).toFixed(3)} per search`}
        />
        <MetricCard
          icon={<BarChart3 className="h-6 w-6 text-purple-500" />}
          title="Avg Results"
          value={data.avgResultCount.toFixed(1)}
          subtitle="Matches per search"
        />
        <MetricCard
          icon={<Star className="h-6 w-6 text-orange-500" />}
          title="Bookmarked"
          value={data.totalBookmarked.toLocaleString()}
          subtitle={`${((data.totalBookmarked / data.totalSearches) * 100).toFixed(1)}% bookmark rate`}
        />
        <MetricCard
          icon={<Clock className="h-6 w-6 text-gray-500" />}
          title="Searches/User"
          value={data.avgSearchesPerUser.toFixed(1)}
          subtitle="Avg usage per user"
        />
      </div>

      {/* Top Comps */}
      <Card>
        <CardHeader>
          <CardTitle>Top Comparable Titles</CardTitle>
        </CardHeader>
        <CardContent>
          {data.topComps.length === 0 ? (
            <p className="text-gray-500">No data available</p>
          ) : (
            <div className="space-y-3">
              {data.topComps.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl font-bold text-gray-300">#{idx + 1}</span>
                    <span className="font-medium">{item.comp}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-32 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-500 h-2 rounded-full"
                        style={{ width: `${(item.count / data.topComps[0].count) * 100}%` }}
                      ></div>
                    </div>
                    <span className="text-sm text-gray-600 w-16 text-right">
                      {item.count} searches
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Search Trends */}
      <Card>
        <CardHeader>
          <CardTitle>Search Trends</CardTitle>
        </CardHeader>
        <CardContent>
          {data.searchTrends.length === 0 ? (
            <p className="text-gray-500">No data available</p>
          ) : (
            <div className="space-y-2">
              {data.searchTrends.slice(-14).map((item, idx) => (
                <div key={idx} className="flex items-center gap-4">
                  <span className="text-sm text-gray-600 w-24">
                    {new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </span>
                  <div className="flex-1 bg-gray-200 rounded-full h-6">
                    <div
                      className="bg-green-500 h-6 rounded-full flex items-center justify-end pr-2"
                      style={{ width: `${(item.count / Math.max(...data.searchTrends.map(t => t.count))) * 100}%` }}
                    >
                      <span className="text-xs text-white font-medium">{item.count}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Insights */}
      <Card>
        <CardHeader>
          <CardTitle>Insights & Recommendations</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Insight
            type="success"
            title="Feature Adoption"
            message={
              data.totalUsers > 10
                ? `Strong adoption with ${data.totalUsers} users. Consider promoting to more buyers.`
                : `Early stage with ${data.totalUsers} users. Increase promotion and onboarding.`
            }
          />
          <Insight
            type={data.avgMatchScore > 80 ? 'success' : 'warning'}
            title="Match Quality"
            message={
              data.avgMatchScore > 80
                ? `Excellent match quality (${data.avgMatchScore.toFixed(1)}%). Users are finding relevant titles.`
                : `Match quality is ${data.avgMatchScore.toFixed(1)}%. Consider tuning the AI ranking algorithm.`
            }
          />
          <Insight
            type="info"
            title="Cost Efficiency"
            message={`Spending $${data.costEstimate.toFixed(2)} for ${data.totalSearches} searches. Cost per search: $${(data.costEstimate / data.totalSearches || 0).toFixed(3)}`}
          />
          <Insight
            type={data.totalBookmarked / data.totalSearches > 0.2 ? 'success' : 'warning'}
            title="Bookmark Rate"
            message={
              data.totalBookmarked / data.totalSearches > 0.2
                ? `High bookmark rate (${((data.totalBookmarked / data.totalSearches) * 100).toFixed(1)}%). Users find searches valuable.`
                : `Low bookmark rate (${((data.totalBookmarked / data.totalSearches) * 100).toFixed(1)}%). Encourage users to save useful searches.`
            }
          />
        </CardContent>
      </Card>
    </div>
  );
}

// Helper Components

interface MetricCardProps {
  icon: React.ReactNode;
  title: string;
  value: string;
  subtitle: string;
}

function MetricCard({ icon, title, value, subtitle }: MetricCardProps) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-gray-100 rounded-lg">{icon}</div>
          <div className="flex-1">
            <p className="text-sm text-gray-600 mb-1">{title}</p>
            <p className="text-3xl font-bold mb-1">{value}</p>
            <p className="text-xs text-gray-500">{subtitle}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

interface InsightProps {
  type: 'success' | 'warning' | 'info';
  title: string;
  message: string;
}

function Insight({ type, title, message }: InsightProps) {
  const colors = {
    success: 'bg-green-50 border-green-200 text-green-800',
    warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
    info: 'bg-blue-50 border-blue-200 text-blue-800'
  };

  return (
    <div className={`p-4 rounded-lg border ${colors[type]}`}>
      <p className="font-semibold mb-1">{title}</p>
      <p className="text-sm">{message}</p>
    </div>
  );
}
