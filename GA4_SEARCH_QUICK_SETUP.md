# GA4 Search Tracking - Quick Setup

## What Changed
✅ **Search is now submit-based** - Users must press Enter or click Search button  
✅ **Enhanced GA4 tracking** - More detailed search event parameters  
✅ **Clean analytics data** - No more noise from real-time typing  

## GA4 Configuration Needed

### 1. Create Custom Dimensions in GA4
Go to **Admin > Custom Definitions > Custom Dimensions**:

| Dimension Name | Parameter Name | Scope |
|----------------|----------------|--------|
| Search Context | search_context | Event |
| User Type | user_type | Event |
| Search Results Count | search_results | Event |
| Page Context | page_context | Event |

### 2. Monitor Search Events
- **Event Name**: `search`
- **Real-time**: Go to Reports > Realtime, filter for "search" events
- **Parameters**: Check for `search_term`, `search_context`, `user_type`, etc.

### 3. Test the Implementation
In browser console (development mode):
```javascript
// Test search tracking
testSearchTracking()

// Check GA4 status
checkGA4Status()
```

## Event Structure
```javascript
{
  event: 'search',
  search_term: 'korean webtoon',      // Clean search term
  search_results: 15,                 // Number of results
  search_context: 'main',            // 'main' or 'favorites'  
  user_type: 'buyer',                // 'buyer' or 'creator'
  page_context: '/buyers/titles',    // Current page
  search_id: 'search_1704067200000', // Unique ID
  search_timestamp: '2024-01-01T00:00:00.000Z'
}
```

## Key Benefits
- 🎯 **Intentional searches only** - No accidental tracking from typing
- 📊 **Better data quality** - Clean, actionable search analytics  
- 🔍 **Enhanced context** - User type, search location, result counts
- 🚀 **Immediate tracking** - Events fire instantly on search submission

## Files Modified
- `/apps/dashboard/src/utils/analytics.ts` - Enhanced search tracking
- `/apps/dashboard/src/pages/Titles.tsx` - Submit-based search form  
- `/apps/dashboard/src/pages/Favorites.tsx` - Submit-based search form
- `/apps/dashboard/src/components/dashboard/SearchAndFilter.tsx` - Updated for consistency

## Next Steps
1. Configure the custom dimensions in your GA4 property
2. Monitor real-time events to verify tracking works
3. Create custom reports for search analysis  
4. Set up alerts for popular search terms or zero-result searches

📖 **Full documentation**: See `GA4_SEARCH_SETUP_GUIDE.md` for detailed setup instructions