# GA4 Search Query Tracking Setup Guide

This guide provides step-by-step instructions for setting up Google Analytics 4 (GA4) to track search queries in the KStoryBridge dashboard with the new submit-based search implementation.

## Overview

The dashboard now implements submit-based search tracking that fires GA4 events when users deliberately submit search queries, providing cleaner and more accurate analytics data.

## 1. GA4 Custom Events Setup

### Search Event Structure
The dashboard sends the following event to GA4 when users submit searches:

```javascript
{
  'event': 'search',                    // GA4 event name
  'search_term': 'user search query',   // Cleaned search term
  'search_results': 25,                 // Number of results found
  'search_context': 'main',             // 'main' or 'favorites'
  'user_type': 'buyer',                 // 'buyer', 'creator', or 'unknown'
  'page_context': '/buyers/titles',     // Current page path
  'app_section': 'dashboard',           // Application section
  'search_id': 'search_1704067200000',  // Unique search identifier
  'search_timestamp': '2024-01-01T00:00:00.000Z' // ISO timestamp
}
```

## 2. GA4 Property Configuration

### Step 1: Create Custom Dimensions
In your GA4 property, navigate to **Admin > Custom Definitions > Custom Dimensions** and create:

| Dimension Name | Parameter Name | Scope | Description |
|----------------|----------------|--------|-------------|
| Search Context | search_context | Event | Whether search was performed in main titles or favorites |
| User Type | user_type | Event | Type of user (buyer/creator) performing the search |
| Search Results Count | search_results | Event | Number of results returned for the search |
| Page Context | page_context | Event | Page where the search was performed |
| Search ID | search_id | Event | Unique identifier for each search session |

### Step 2: Configure Search Event as Conversion (Optional)
1. Go to **Admin > Events**
2. Find the `search` event
3. Toggle **Mark as conversion** if you want to track searches as conversion events

### Step 3: Create Custom Metrics
Navigate to **Admin > Custom Definitions > Custom Metrics** and create:

| Metric Name | Parameter Name | Unit of Measurement | Scope |
|-------------|----------------|---------------------|--------|
| Search Results | search_results | Standard | Event |

## 3. GA4 Reports and Analysis

### Search Overview Report
Create a custom report to analyze search behavior:

1. **Exploration > Free Form**
2. **Rows**: Search Term (search_term)
3. **Columns**: Search Context (search_context)
4. **Values**: Event Count, Search Results (average)
5. **Filters**: Event Name = search

### Search Performance Analysis
Key metrics to track:

- **Popular Search Terms**: Most frequently searched terms
- **Search Success Rate**: Average results per search
- **User Type Analysis**: Search behavior by buyer vs creator
- **Context Analysis**: Main search vs favorites search patterns
- **Zero Results Searches**: Searches returning no results

### Sample GA4 Queries

#### Top Search Terms by User Type
```
Event Name = search
Group by: Search Term, User Type
Metric: Event Count
```

#### Average Search Results by Context
```
Event Name = search
Group by: Search Context
Metric: Search Results (average)
```

#### Search Funnel Analysis
```
Event Name = search
Secondary dimension: Search Results Count
Filter: Search Results > 0 (successful searches)
```

## 4. Data Studio / Looker Studio Integration

### Connect GA4 to Data Studio
1. Create new Data Studio report
2. Add GA4 connector with your property ID
3. Use custom dimensions and metrics created above

### Key Visualizations
1. **Search Volume Over Time**: Line chart showing daily search events
2. **Top Search Terms**: Table with search terms and result counts
3. **User Type Distribution**: Pie chart of searches by user type
4. **Search Context Breakdown**: Bar chart comparing main vs favorites searches
5. **Search Success Rate**: Gauge showing percentage of searches with results

## 5. Real-Time Monitoring

### GA4 Real-Time Reports
Monitor search activity in real-time:
1. Go to **Reports > Realtime**
2. Add **Event Name** card, filter for `search`
3. View live search activity and parameters

### Debug Mode
For development/testing, enable debug mode:
```javascript
// Add to your GTM or tracking code
gtag('config', 'GA_MEASUREMENT_ID', {
  debug_mode: true
});
```

## 6. Enhanced Ecommerce Integration (Future)

The search tracking includes `search_id` and structured data that can be extended for enhanced ecommerce:

```javascript
// Future enhancement for product discovery
trackSearch('korean webtoon', 15, {
  userType: 'buyer',
  searchContext: 'main',
  page: '/buyers/titles',
  // Enhanced ecommerce data
  items: [
    {
      item_id: 'title_123',
      item_name: 'Sample Title',
      item_category: 'webtoon',
      price: 0,
      quantity: 1
    }
  ]
});
```

## 7. Data Quality and Testing

### Testing Search Events
1. Open Chrome DevTools → Network tab
2. Search for "collect" requests to GA4
3. Verify search event parameters are being sent
4. Check GA4 real-time reports for incoming data

### Data Validation Checklist
- [ ] Search events appear in GA4 real-time
- [ ] Custom dimensions are populated correctly  
- [ ] Search terms are clean (no "favorites:" prefixes)
- [ ] Result counts are accurate
- [ ] User types are properly identified
- [ ] Page contexts match actual URLs

## 8. Privacy and Compliance

### Search Term Privacy
- Search terms may contain personal information
- Consider implementing search term anonymization for sensitive queries
- Ensure compliance with GDPR/CCPA for search data retention

### Data Retention Settings
Configure appropriate data retention in GA4:
- **Admin > Data Settings > Data Retention**
- Recommended: 14 months for search analytics

## 9. Troubleshooting

### Common Issues
1. **No search events appearing**: Check GTM container is properly loaded
2. **Missing custom dimensions**: Verify dimensions are created with correct parameter names
3. **Incorrect user types**: Check authentication state detection logic
4. **Duplicate events**: Ensure search is only tracked on form submission, not on input changes

### Debug Console Messages
The dashboard logs search events to console:
```
🔍 GA4 SEARCH EVENT: {
  searchTerm: "korean drama",
  resultCount: 12,
  context: "main",
  userType: "buyer",
  timestamp: "2024-01-01T00:00:00.000Z"
}
```

## 10. Performance Considerations

### Event Limits
- GA4 allows 500 distinctly named events per app instance
- Search events count toward this limit
- Consider sampling for high-volume applications

### Parameter Limits  
- Maximum 25 custom parameters per event
- Parameter names: 40 characters max
- Parameter values: 100 characters max (search terms may need truncation)

---

## Implementation Status

✅ **Completed Features:**
- Submit-based search tracking (no more debouncing)
- Enhanced event parameters with context
- Buyer/Creator user type detection
- Main vs Favorites search context
- Clean search term processing
- Unique search ID generation

🚀 **Ready for GA4 Configuration:**
The tracking implementation is complete. Follow steps 1-3 above to configure your GA4 property for optimal search analytics.