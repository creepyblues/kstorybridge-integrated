# Google Analytics Setup for Dashboard

This document explains how Google Analytics has been integrated into the KStoryBridge Dashboard.

## Setup Instructions

### 1. Environment Configuration
Create a `.env.local` file in the dashboard root directory:
```bash
cp .env.example .env.local
```

Edit `.env.local` and replace `GA_MEASUREMENT_ID` with your actual Google Analytics 4 measurement ID:
```
VITE_GA_MEASUREMENT_ID=G-XXXXXXXXXX
```

### 2. Google Analytics 4 Property Setup
1. Go to [Google Analytics](https://analytics.google.com/)
2. Create a new GA4 property for your dashboard
3. Copy the Measurement ID (format: G-XXXXXXXXXX)
4. Add it to your `.env.local` file

## What's Being Tracked

### Automatic Tracking
- **Page Views**: All route changes are automatically tracked
- **Session Data**: User sessions and engagement metrics
- **Geographic Data**: User location (anonymized)

### Custom Events
- **Premium Feature Requests**: When users request premium features
- **Premium Popup Views**: When premium feature popups are displayed
- **Title Views**: When users view specific content titles
- **Favorites Actions**: Adding/removing titles from favorites
- **Search Actions**: Search queries and results
- **Authentication Events**: Login, logout, signup
- **Error Tracking**: Technical issues and errors

### Dashboard-Specific Tracking
All events include a custom dimension to identify dashboard traffic separately from website traffic.

## Implementation Details

### Files Added/Modified
- `index.html` - Google Analytics script injection
- `src/utils/analytics.ts` - Analytics utility functions
- `src/hooks/useAnalytics.ts` - React hook for analytics
- `src/components/AnalyticsProvider.tsx` - Analytics context provider
- `src/components/PremiumFeaturePopup.tsx` - Added premium feature tracking
- `src/App.tsx` - Integrated analytics provider

### Key Features
- **Environment-based loading**: GA only loads if measurement ID is properly configured
- **TypeScript support**: Full type definitions for gtag functions
- **Error handling**: Graceful degradation when GA is unavailable
- **Privacy-friendly**: IP anonymization enabled
- **Custom dimensions**: Dashboard traffic identification

## Usage Examples

### Track Custom Events
```typescript
import { useAnalytics } from '@/hooks/useAnalytics';

const MyComponent = () => {
  const { trackEvent } = useAnalytics();
  
  const handleClick = () => {
    trackEvent('button_click', 'user_interaction', 'my_button');
  };
  
  return <button onClick={handleClick}>Click Me</button>;
};
```

### Track Specific Dashboard Events
```typescript
import { trackDashboardEvent } from '@/utils/analytics';

// Track dashboard-specific interactions
trackDashboardEvent('filter_applied', { 
  filterType: 'genre', 
  filterValue: 'romance' 
});
```

## Data Privacy
- IP addresses are anonymized
- Ad personalization signals are disabled
- Google Signals are enabled for enhanced insights
- No personally identifiable information is tracked

## Testing
To verify GA is working:
1. Set up your measurement ID in `.env.local`
2. Run the dashboard in development mode
3. Check the browser's Network tab for requests to `google-analytics.com`
4. View real-time data in your GA4 dashboard

## Production Deployment
Ensure the `VITE_GA_MEASUREMENT_ID` environment variable is set in your production environment with your actual GA4 measurement ID.