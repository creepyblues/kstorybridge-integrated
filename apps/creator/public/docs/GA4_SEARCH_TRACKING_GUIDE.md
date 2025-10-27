# GA4 Search Query Tracking Setup Guide

## Overview
This guide walks you through the complete implementation of search query tracking using Google Analytics 4 (GA4) in the KStoryBridge Dashboard.

## ✅ Implementation Status
- **Frontend Tracking**: ✅ Implemented
- **Analytics Functions**: ✅ Ready
- **GA4 Configuration**: ⏳ Needs Setup
- **Testing**: ⏳ Ready for Testing

## 🔧 What's Been Implemented

### 1. Enhanced Analytics Utility (`src/utils/analytics.ts`)
- **`trackSearch(searchTerm, resultCount)`**: Tracks search queries with result counts
- **GTM Integration**: Uses Google Tag Manager for proper data layer handling
- **Custom Event Structure**: Sends structured data to GA4

### 2. Search Tracking in Titles Page
- **Debounced Tracking**: Waits 1 second after user stops typing to avoid spam
- **Enter Key Tracking**: Immediate tracking when user presses Enter
- **Result Count**: Automatically calculates and sends number of results
- **User Context**: Distinguishes between buyer and creator searches

### 3. Search Tracking in Favorites Page  
- **Context Prefix**: Adds "favorites:" prefix to distinguish from general search
- **Favorites-specific Logic**: Searches only within user's favorites
- **Same Debouncing**: 1-second delay to optimize tracking calls

### 4. Console Debugging
- **Detailed Logs**: Shows search term, result count, user type, and context
- **Easy Monitoring**: Use browser console to verify tracking is working

## 🎯 GA4 Configuration Steps

### Step 1: Configure Custom Events in GA4

1. **Go to your GA4 Property**
   - Navigate to [Google Analytics](https://analytics.google.com/)
   - Select your KStoryBridge Dashboard property

2. **Create Custom Event: `search`**
   - Go to **Configure** → **Events** → **Create Event**
   - Event name: `search`
   - Parameters to track:
     - `search_term` (string)
     - `search_results` (number)
     - `app_section` (string) - always "dashboard"

### Step 2: Set Up Custom Dimensions

1. **Go to Configure → Custom definitions**

2. **Create Custom Dimensions:**
   - **Search Term**:
     - Name: "Search Term"
     - Parameter: `search_term`
     - Scope: Event
     
   - **Search Results Count**:
     - Name: "Search Results"
     - Parameter: `search_results`
     - Scope: Event
     
   - **App Section**:
     - Name: "App Section"  
     - Parameter: `app_section`
     - Scope: Event

### Step 3: Create Exploration Reports

1. **Go to Explore → Create new exploration**

2. **Search Performance Report**:
   - **Dimensions**: Search Term, Date
   - **Metrics**: Event count, Users, Sessions
   - **Filters**: Event name = "search"

3. **Search Results Analysis**:
   - **Dimensions**: Search Term, Search Results
   - **Metrics**: Event count
   - **Sort by**: Event count (descending)

## 📊 Data Structure Being Sent

### Search Event Structure
```javascript
{
  'event': 'search',
  'search_term': 'romance webtoon',
  'search_results': 15,
  'app_section': 'dashboard'
}
```

### Search Context Examples
- **General Titles Search**: `"romance webtoon"`
- **Favorites Search**: `"favorites:drama"`

## 🧪 Testing Instructions

### 1. Console Testing
1. Open browser DevTools → Console
2. Search for titles in the dashboard
3. Look for logs starting with `🔍 SEARCH TRACKED:`
4. Verify search term and result count are correct

### 2. Network Testing  
1. Open DevTools → Network tab
2. Filter by "collect" or "google-analytics"
3. Perform searches
4. Verify GA4 requests are being sent with correct data

### 3. GA4 Real-time Testing
1. Go to GA4 → Reports → Realtime
2. Perform searches in the dashboard
3. Check "Events by Event name" for `search` events
4. Verify event parameters are populated

## 📈 Key Metrics You Can Track

### Search Volume Metrics
- **Total Searches**: How many searches are performed
- **Unique Searchers**: How many users perform searches  
- **Searches per Session**: Average search activity per session

### Search Quality Metrics
- **Zero-Result Searches**: Searches returning 0 results (improve content)
- **Low-Result Searches**: Searches with <3 results (optimize search)
- **Popular Search Terms**: Most common search queries

### User Behavior Metrics
- **Search-to-Click Rate**: Users who search then view titles
- **Repeat Searches**: Users who refine their search terms
- **Search Context**: General vs. Favorites search patterns

### Business Intelligence
- **Content Gaps**: Search terms with low/no results indicate missing content
- **User Intent**: What users are looking for (genres, tones, etc.)
- **Feature Usage**: How often favorites search vs. general search is used

## 🔧 Advanced Configuration Options

### Add More Search Context
You can enhance tracking by adding more context:

```javascript
trackSearch(`${userType}:${searchLocation}:${searchTerm}`, resultCount);
// Example: "buyer:titles:romance webtoon"
```

### Track Search Refinement
Add a parameter to track if users refine searches:

```javascript
if (previousSearchTerm && previousSearchTerm !== newSearchTerm) {
  // Track as refined search
  trackEvent('search_refinement', 'search_behavior', newSearchTerm);
}
```

### Search Success Tracking
Track when users click on search results:

```javascript
// When user clicks a title from search results
trackEvent('search_result_click', 'search_success', titleName);
```

## 📝 Report Templates

### Weekly Search Report
- Top 10 search terms
- Zero-result searches needing attention
- Search volume trends
- User engagement after search

### Monthly Search Analysis  
- Search term categorization (genre, format, etc.)
- Seasonal search trends
- Search success rates
- Content recommendation insights

## 🚨 Troubleshooting

### Common Issues

1. **No Search Events in GA4**
   - Check console for tracking logs
   - Verify GTM container ID is correct
   - Ensure GA4 measurement ID is set

2. **Missing Event Parameters**
   - Check custom dimensions are created
   - Verify parameter names match exactly
   - Allow up to 24 hours for new parameters to appear

3. **Inconsistent Tracking**
   - Check network requests are being sent
   - Verify no ad blockers are interfering
   - Test in incognito mode

### Debug Commands
```javascript
// Test search tracking in browser console
window.dataLayer.push({
  'event': 'search',
  'search_term': 'test query',
  'search_results': 5,
  'app_section': 'dashboard'
});
```

## 🎯 Success Metrics
After implementation, you should see:
- ✅ Search events appearing in GA4 real-time reports
- ✅ Custom dimensions populated with search data
- ✅ Ability to create search performance reports
- ✅ Insights into user search behavior and content gaps

## 🔄 Next Steps
1. **Configure GA4 events and dimensions** (Steps 1-2 above)
2. **Test tracking** using the testing instructions
3. **Create initial reports** to establish baseline metrics
4. **Set up automated reports** for weekly/monthly analysis
5. **Use insights** to improve content and search functionality