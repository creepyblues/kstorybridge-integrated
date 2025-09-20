import React, { useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, Badge, Button } from '@kstorybridge/ui';
import { searchAnalyticsService, type SearchPerformanceMetrics } from '@/services/searchAnalyticsService';
import { Clock, Search, TrendingUp, Users, Eye, Target } from 'lucide-react';

interface SearchAnalyticsDashboardProps {
  timeRange?: '24h' | '7d' | '30d';
}

export const SearchAnalyticsDashboard: React.FC<SearchAnalyticsDashboardProps> = ({
  timeRange = '7d'
}) => {
  const [metrics, setMetrics] = useState<SearchPerformanceMetrics | null>(null);
  const [searchIssues, setSearchIssues] = useState<Array<{ query: string; issues: string[]; solutions: string[] }>>([]);
  const [loading, setLoading] = useState(true);

  const loadAnalytics = useCallback(async () => {
    setLoading(true);
    try {
      const [performanceData, issuesData] = await Promise.all([
        searchAnalyticsService.getSearchPerformanceMetrics(timeRange),
        searchAnalyticsService.identifySearchIssues()
      ]);
      
      setMetrics(performanceData);
      setSearchIssues(issuesData);
    } catch (error) {
      console.error('Failed to load search analytics:', error);
      // Set default metrics if tables don't exist yet
      setMetrics({
        averageResultCount: 0,
        averageClickPosition: 0,
        clickThroughRate: 0,
        querySuccessRate: 0,
        averageSearchTime: 0,
        userSatisfactionScore: 0,
        popularQueries: [],
        lowPerformingQueries: []
      });
      setSearchIssues([]);
    } finally {
      setLoading(false);
    }
  }, [timeRange]);

  useEffect(() => {
    loadAnalytics();
  }, [loadAnalytics]);

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="animate-pulse bg-gray-200 h-20"></CardHeader>
          </Card>
        ))}
      </div>
    );
  }

  if (!metrics) return null;

  // Check if this is showing default/empty data (tables might not exist)
  const isEmpty = metrics.averageResultCount === 0 && 
                  metrics.clickThroughRate === 0 && 
                  metrics.popularQueries.length === 0;

  const formatNumber = (num: number) => {
    return num < 1000 ? num.toFixed(1) : (num / 1000).toFixed(1) + 'k';
  };

  return (
    <div className="space-y-6">
      {isEmpty && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-yellow-800">
              <Search className="h-5 w-5" />
              Analytics Tables Not Found
            </CardTitle>
            <CardDescription className="text-yellow-700">
              The search analytics tables haven't been created yet. To enable analytics:
              <ol className="mt-2 ml-4 list-decimal space-y-1 text-sm">
                <li>Apply the database migration: <code className="bg-yellow-100 px-2 py-1 rounded">20250908000001_search_analytics_tables.sql</code></li>
                <li>Integrate search tracking into your search components</li>
                <li>Start collecting search data from user interactions</li>
              </ol>
            </CardDescription>
          </CardHeader>
        </Card>
      )}
      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Results</CardTitle>
            <Search className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.averageResultCount.toFixed(1)}</div>
            <p className="text-xs text-muted-foreground">
              Per search query
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Click-Through Rate</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.clickThroughRate.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">
              Users clicking results
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.querySuccessRate.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">
              Queries with results
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Search Time</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.averageSearchTime.toFixed(0)}ms</div>
            <p className="text-xs text-muted-foreground">
              Response time
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Popular Queries */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Popular Queries</CardTitle>
            <CardDescription>Most searched terms ({timeRange})</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {metrics.popularQueries.slice(0, 8).map((query, index) => (
                <div key={query.query} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="w-6 h-6 rounded-full p-0 flex items-center justify-center text-xs">
                      {index + 1}
                    </Badge>
                    <span className="text-sm font-medium truncate max-w-[200px]">{query.query}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span>{query.count} searches</span>
                    <Badge variant={query.avgSatisfaction >= 4 ? "default" : query.avgSatisfaction >= 3 ? "secondary" : "destructive"}>
                      {query.avgSatisfaction.toFixed(1)}★
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Search Issues */}
        <Card>
          <CardHeader>
            <CardTitle>Search Issues</CardTitle>
            <CardDescription>Queries needing improvement</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {searchIssues.slice(0, 5).map((issue, index) => (
                <div key={issue.query} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium truncate max-w-[200px]">{issue.query}</span>
                    <Badge variant="destructive" className="text-xs">
                      {issue.issues.length} issues
                    </Badge>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Issues: {issue.issues.join(', ')}
                  </div>
                  {issue.solutions.length > 0 && (
                    <div className="text-xs text-blue-600">
                      Solutions: {issue.solutions.slice(0, 2).join(', ')}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* User Satisfaction */}
      {metrics.userSatisfactionScore > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>User Satisfaction</CardTitle>
            <CardDescription>Overall search experience rating</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <div className="text-4xl font-bold">{metrics.userSatisfactionScore.toFixed(1)}/5</div>
              <div className="flex-1">
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-red-500 via-yellow-500 to-green-500 transition-all duration-300" 
                    style={{ width: `${(metrics.userSatisfactionScore / 5) * 100}%` }}
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Based on user feedback and click behavior
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};