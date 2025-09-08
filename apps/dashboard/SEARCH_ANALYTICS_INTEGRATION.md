# Search Analytics Integration Guide

The Search Analytics system is now active! Here's how to integrate tracking into your search components.

## ✅ **Current Status:**
- 🗄️ **Database Tables**: Created and ready
- 📊 **Analytics Services**: Re-enabled and functional  
- 🎯 **Dashboard**: Live at `/search-analytics`

## 🔌 **How to Add Search Tracking**

### 1. Import the Service
```typescript
import { searchAnalyticsService } from '@/services/searchAnalyticsService';
import { useAuth } from '@/hooks/useAuth';
```

### 2. Add to Your Search Function
```typescript
const handleSearch = async (query: string) => {
  const startTime = Date.now();
  const { user } = useAuth();
  
  // Perform your existing search
  const searchResults = await yourExistingSearchMethod(query);
  
  // Track the search analytics
  await searchAnalyticsService.trackSearch({
    query,
    searchType: 'traditional', // or 'vector' or 'hybrid'
    resultCount: searchResults.length,
    searchTime: Date.now() - startTime,
    userId: user?.id,
    queryIntent: detectIntent(query), // 'browse', 'specific', 'research', 'comparison'
    queryComplexity: query.split(' ').length > 3 ? 'complex' : 'simple',
    refinements: []
  });
};
```

### 3. Track User Clicks (Optional)
```typescript
const handleResultClick = async (titleId: string, position: number) => {
  // Your existing click handling
  navigateToTitle(titleId);
  
  // Update analytics with click data
  await searchAnalyticsService.trackSearch({
    query: lastSearchQuery,
    searchType: 'traditional',
    resultCount: lastResultCount,
    clickedTitleId: titleId,
    clickPosition: position,
    searchTime: 0, // Already tracked
    userId: user?.id,
    queryIntent: 'specific',
    queryComplexity: 'simple',
    refinements: []
  });
};
```

### 4. Example: Complete Search Component
```typescript
import { useState } from 'react';
import { searchAnalyticsService } from '@/services/searchAnalyticsService';
import { useAuth } from '@/hooks/useAuth';

export const SearchComponent = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const { user } = useAuth();

  const performSearch = async (searchQuery: string) => {
    if (!searchQuery.trim()) return;
    
    const startTime = Date.now();
    
    try {
      // Your existing search logic
      const searchResults = await yourSearchService.search(searchQuery);
      setResults(searchResults);
      
      // Track analytics
      await searchAnalyticsService.trackSearch({
        query: searchQuery,
        searchType: 'traditional',
        resultCount: searchResults.length,
        searchTime: Date.now() - startTime,
        userId: user?.id,
        queryIntent: inferIntent(searchQuery),
        queryComplexity: searchQuery.split(' ').length > 3 ? 'complex' : 'simple',
        refinements: []
      });
      
      console.log('✅ Search tracked:', searchQuery);
    } catch (error) {
      console.error('Search failed:', error);
    }
  };

  const inferIntent = (query: string): 'browse' | 'specific' | 'research' | 'comparison' => {
    if (query.includes('vs') || query.includes('compare')) return 'comparison';
    if (query.includes('best') || query.includes('top')) return 'browse';
    if (query.length > 20) return 'research';
    return 'specific';
  };

  return (
    <div>
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyPress={(e) => e.key === 'Enter' && performSearch(query)}
        placeholder="Search titles..."
      />
      <button onClick={() => performSearch(query)}>Search</button>
      
      {results.map((result, index) => (
        <div 
          key={result.id} 
          onClick={() => handleResultClick(result.id, index)}
        >
          {result.title}
        </div>
      ))}
    </div>
  );
};
```

## 📊 **What Gets Tracked:**
- Search queries and results
- Search performance (response time)
- User clicks and positions
- Query complexity and intent
- User satisfaction (when provided)

## 🎯 **View Analytics:**
Visit **http://localhost:8083/search-analytics** to see:
- Search performance metrics
- Popular queries
- Click-through rates
- Search issues and suggestions

## 🚀 **Next Steps:**
1. Add tracking to your main search components
2. Test with a few searches
3. Visit the analytics dashboard to see live data
4. Iterate and improve based on insights

The system will start showing real data as soon as you add tracking to your search components!