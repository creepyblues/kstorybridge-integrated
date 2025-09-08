import { supabase } from '@/integrations/supabase/client';
import { vectorSearchService } from './vectorSearchService';

export interface SearchAnalytics {
  query: string;
  searchType: 'vector' | 'traditional' | 'hybrid';
  resultCount: number;
  clickedTitleId?: string;
  clickPosition?: number;
  searchTime: number;
  userId?: string;
  sessionId: string;
  timestamp: Date;
  queryIntent: 'browse' | 'specific' | 'research' | 'comparison';
  queryComplexity: 'simple' | 'medium' | 'complex';
  userSatisfaction?: number; // 1-5 rating
  refinements: string[]; // Follow-up queries
}

export interface QuerySuggestion {
  suggestion: string;
  confidence: number;
  reasoning: string;
  searchType: 'similar' | 'related' | 'refined' | 'broader' | 'narrower';
}

export interface SearchPerformanceMetrics {
  averageResultCount: number;
  averageClickPosition: number;
  clickThroughRate: number;
  querySuccessRate: number;
  averageSearchTime: number;
  userSatisfactionScore: number;
  popularQueries: Array<{ query: string; count: number; avgSatisfaction: number }>;
  lowPerformingQueries: Array<{ query: string; issues: string[] }>;
}

class SearchAnalyticsService {
  private sessionId = this.generateSessionId();

  /**
   * Track search query and results
   */
  async trackSearch(analytics: Omit<SearchAnalytics, 'timestamp' | 'sessionId'>): Promise<void> {
    try {
      const { error } = await supabase
        .from('vector_search_analytics')
        .insert({
          query: analytics.query,
          search_type: analytics.searchType,
          result_count: analytics.resultCount,
          clicked_title_id: analytics.clickedTitleId,
          click_position: analytics.clickPosition,
          search_duration_ms: analytics.searchTime,
          user_id: analytics.userId,
          session_id: analytics.sessionId || this.sessionId,
          query_intent: analytics.queryIntent,
          query_complexity: analytics.queryComplexity,
          user_satisfaction_score: analytics.userSatisfaction,
          refinements: analytics.refinements,
          created_at: new Date().toISOString()
        });

      if (error) throw error;

      console.log('✅ Search analytics tracked:', analytics.query);
    } catch (error) {
      console.error('Failed to track search analytics:', error);
    }
  }

  /**
   * Generate intelligent query suggestions based on search history and performance
   */
  async generateQuerySuggestions(query: string, userId?: string): Promise<QuerySuggestion[]> {
    const suggestions: QuerySuggestion[] = [];

    try {
      // 1. Similar successful queries
      const similarQueries = await this.findSimilarSuccessfulQueries(query);
      suggestions.push(...similarQueries);

      // 2. Intent-based refinements
      const intentRefinements = await this.generateIntentBasedRefinements(query);
      suggestions.push(...intentRefinements);

      // 3. User-specific suggestions
      if (userId) {
        const personalizedSuggestions = await this.generatePersonalizedSuggestions(query, userId);
        suggestions.push(...personalizedSuggestions);
      }

      // 4. Trending and popular variations
      const trendingSuggestions = await this.generateTrendingSuggestions(query);
      suggestions.push(...trendingSuggestions);

      // Sort by confidence and return top suggestions
      return suggestions
        .sort((a, b) => b.confidence - a.confidence)
        .slice(0, 8);
    } catch (error) {
      console.error('Failed to generate query suggestions:', error);
      return [];
    }
  }

  /**
   * Analyze search performance and identify improvement opportunities
   */
  async getSearchPerformanceMetrics(timeRange: '24h' | '7d' | '30d' = '7d'): Promise<SearchPerformanceMetrics> {
    const dateThreshold = new Date();
    switch (timeRange) {
      case '24h': dateThreshold.setHours(dateThreshold.getHours() - 24); break;
      case '7d': dateThreshold.setDate(dateThreshold.getDate() - 7); break;
      case '30d': dateThreshold.setDate(dateThreshold.getDate() - 30); break;
    }

    try {
      const { data: searchData, error } = await supabase
        .from('vector_search_analytics')
        .select('*')
        .gte('created_at', dateThreshold.toISOString())
        .order('created_at', { ascending: false });

      if (error) throw error;

      const metrics = this.calculatePerformanceMetrics(searchData || []);
      return metrics;
    } catch (error) {
      console.error('Failed to get search performance metrics:', error);
      return this.getDefaultMetrics();
    }
  }

  /**
   * Identify and fix low-performing search queries
   */
  async identifySearchIssues(): Promise<Array<{ query: string; issues: string[]; solutions: string[] }>> {
    try {
      const { data: searchData, error } = await supabase
        .from('vector_search_analytics')
        .select('query, result_count, user_satisfaction_score, search_duration_ms')
        .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()); // Last 7 days

      if (error) throw error;

      const queryAnalysis = this.analyzeQueryPerformance(searchData || []);
      return queryAnalysis.map(analysis => ({
        query: analysis.query,
        issues: this.identifyIssues(analysis),
        solutions: this.generateSolutions(analysis)
      }));
    } catch (error) {
      console.error('Failed to identify search issues:', error);
      return [];
    }
  }

  /**
   * Real-time query auto-completion based on user behavior
   */
  async getAutocompleteSuggestions(partialQuery: string, userId?: string): Promise<string[]> {
    if (partialQuery.length < 2) return [];

    // Return empty array for now until tables are created
    console.log('Analytics tables not yet created - returning empty autocomplete');
    return [];
  }

  // Private helper methods
  private generateSessionId(): string {
    return `search-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private async updatePerformanceMetrics(query: string, analytics: Omit<SearchAnalytics, 'timestamp' | 'sessionId'>): Promise<void> {
    // Update query performance cache/aggregations
    // This could be implemented with a separate aggregation table or cache
  }

  private async findSimilarSuccessfulQueries(query: string): Promise<QuerySuggestion[]> {
    // Disabled until analytics tables are created
    return [];
  }

  private async generateIntentBasedRefinements(query: string): Promise<QuerySuggestion[]> {
    const refinements: QuerySuggestion[] = [];
    const lowerQuery = query.toLowerCase();

    // Genre-specific refinements
    if (lowerQuery.includes('romance')) {
      refinements.push({
        suggestion: `${query} contemporary`,
        confidence: 0.7,
        reasoning: 'Contemporary romance is highly popular',
        searchType: 'refined'
      });
    }

    // Broadening suggestions
    if (lowerQuery.split(' ').length > 2) {
      const mainTerms = lowerQuery.split(' ').slice(0, 2).join(' ');
      refinements.push({
        suggestion: mainTerms,
        confidence: 0.6,
        reasoning: 'Broader search might find more results',
        searchType: 'broader'
      });
    }

    return refinements;
  }

  private async generatePersonalizedSuggestions(query: string, userId: string): Promise<QuerySuggestion[]> {
    // Disabled until analytics tables are created
    return [];
  }

  private async generateTrendingSuggestions(query: string): Promise<QuerySuggestion[]> {
    // Disabled until analytics tables are created
    return [];
  }

  private calculatePerformanceMetrics(searchData: any[]): SearchPerformanceMetrics {
    if (searchData.length === 0) return this.getDefaultMetrics();

    const totalSearches = searchData.length;
    const clickedSearches = searchData.filter(s => s.clicked_title_id).length;
    const averageResultCount = searchData.reduce((sum, s) => sum + (s.result_count || 0), 0) / totalSearches;
    const averageClickPosition = searchData
      .filter(s => s.click_position)
      .reduce((sum, s) => sum + s.click_position, 0) / clickedSearches || 0;
    const clickThroughRate = (clickedSearches / totalSearches) * 100;
    const querySuccessRate = searchData.filter(s => s.result_count > 0).length / totalSearches * 100;
    const averageSearchTime = searchData.reduce((sum, s) => sum + (s.search_duration_ms || 0), 0) / totalSearches;
    const userSatisfactionScore = searchData
      .filter(s => s.user_satisfaction_score)
      .reduce((sum, s) => sum + s.user_satisfaction_score, 0) / searchData.filter(s => s.user_satisfaction_score).length || 0;

    // Calculate popular queries
    const queryMap = new Map<string, { count: number; satisfaction: number[] }>();
    searchData.forEach(s => {
      const existing = queryMap.get(s.query) || { count: 0, satisfaction: [] };
      existing.count++;
      if (s.user_satisfaction_score) existing.satisfaction.push(s.user_satisfaction_score);
      queryMap.set(s.query, existing);
    });

    const popularQueries = Array.from(queryMap.entries())
      .map(([query, data]) => ({
        query,
        count: data.count,
        avgSatisfaction: data.satisfaction.reduce((a, b) => a + b, 0) / data.satisfaction.length || 0
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    const lowPerformingQueries = popularQueries
      .filter(q => q.avgSatisfaction < 3 || q.count < 2)
      .map(q => ({ query: q.query, issues: ['Low satisfaction', 'Few results'] }))
      .slice(0, 5);

    return {
      averageResultCount,
      averageClickPosition,
      clickThroughRate,
      querySuccessRate,
      averageSearchTime,
      userSatisfactionScore,
      popularQueries,
      lowPerformingQueries
    };
  }

  private getDefaultMetrics(): SearchPerformanceMetrics {
    return {
      averageResultCount: 0,
      averageClickPosition: 0,
      clickThroughRate: 0,
      querySuccessRate: 0,
      averageSearchTime: 0,
      userSatisfactionScore: 0,
      popularQueries: [],
      lowPerformingQueries: []
    };
  }

  private analyzeQueryPerformance(searchData: any[]): any[] {
    // Group by query and analyze performance metrics
    const queryMap = new Map();
    searchData.forEach(item => {
      const existing = queryMap.get(item.query) || { 
        query: item.query, 
        searches: [], 
        totalResults: 0, 
        totalSatisfaction: 0,
        avgSearchTime: 0
      };
      existing.searches.push(item);
      existing.totalResults += item.result_count || 0;
      existing.totalSatisfaction += item.user_satisfaction_score || 0;
      existing.avgSearchTime += item.search_duration_ms || 0;
      queryMap.set(item.query, existing);
    });

    return Array.from(queryMap.values());
  }

  private identifyIssues(analysis: any): string[] {
    const issues = [];
    
    if (analysis.totalResults / analysis.searches.length < 2) issues.push('Low result count');
    if (analysis.totalSatisfaction / analysis.searches.length < 3) issues.push('Low user satisfaction');
    if (analysis.avgSearchTime / analysis.searches.length > 2000) issues.push('Slow search performance');
    
    return issues;
  }

  private generateSolutions(analysis: any): string[] {
    const solutions = [];
    
    if (analysis.totalResults / analysis.searches.length < 2) {
      solutions.push('Expand search criteria', 'Add synonyms and related terms', 'Improve fuzzy matching');
    }
    if (analysis.totalSatisfaction / analysis.searches.length < 3) {
      solutions.push('Improve result relevance ranking', 'Add more metadata tags', 'Enhance content analysis');
    }
    
    return solutions;
  }

  private extractPreferredTerms(userHistory: any[]): string[] {
    // Extract common terms from user's high-satisfaction searches
    const termFrequency = new Map<string, number>();
    
    userHistory.forEach(item => {
      const terms = item.query.toLowerCase().split(/\s+/);
      terms.forEach(term => {
        if (term.length > 2) { // Skip short terms
          termFrequency.set(term, (termFrequency.get(term) || 0) + 1);
        }
      });
    });
    
    return Array.from(termFrequency.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(entry => entry[0]);
  }
}

export const searchAnalyticsService = new SearchAnalyticsService();