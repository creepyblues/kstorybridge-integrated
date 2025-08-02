# Website Analytics Debugging Guide

## Issue Identified and Fixed ✅

**Problem**: Website wasn't showing activity in Google Analytics while dashboard was working.

**Root Cause**: The website had GTM script in HTML but lacked the JavaScript analytics utilities to push events to dataLayer. The dashboard worked because it had analytics tracking functions, but the website was missing this implementation.

## Solution Implemented

### 1. Created Analytics Infrastructure

**Files Added:**
- `apps/website/src/utils/analytics.ts` - GTM tracking utilities
- `apps/website/src/hooks/useAnalytics.ts` - React hook for page view tracking
- `apps/website/src/components/AnalyticsProvider.tsx` - Analytics initialization component

### 2. Integrated Analytics Tracking

**Modified Files:**
- `apps/website/src/App.tsx` - Added AnalyticsProvider
- `apps/website/src/components/header/AuthSection.tsx` - Added button click tracking
- `apps/website/src/components/header/LanguageSelector.tsx` - Added language change tracking
- `apps/website/src/components/SignupForm.tsx` - Added signup and form submission tracking

### 3. Event Types Now Tracked

- ✅ **Page Views** - Automatic on route changes
- ✅ **Button Clicks** - Sign In, Get Started, Sign Out buttons
- ✅ **Language Changes** - EN ↔ KR switching
- ✅ **Form Submissions** - Signup forms (success/failure)
- ✅ **User Signup** - Both email and Google signup methods
- ✅ **Navigation Events** - User flow tracking

## Testing the Fix

### Method 1: Browser Console Debug

1. **Open website** (http://localhost:5173 or production URL)
2. **Open DevTools Console**
3. **Run debug script:**
   ```javascript
   // Paste and run the contents of debug-website-gtm.js
   // Or if available:
   debugWebsiteGTM()
   ```

4. **Expected Output:**
   ```
   ✅ dataLayer available: X events
   📊 Current dataLayer events: [...]
   📝 GTM script loaded: true
   🔗 GTM script URL: https://www.googletagmanager.com/gtm.js?id=GTM-PZBC4XQT
   ```

### Method 2: Manual Event Testing

In browser console:
```javascript
// Test page view
testPageViewTracking()

// Test button click
testButtonClickTracking()

// Test signup
testSignupTracking()

// Check dataLayer
console.log(window.dataLayer)
```

### Method 3: GTM Preview Mode

1. **Login to GTM** (https://tagmanager.google.com/)
2. **Select container** GTM-PZBC4XQT
3. **Click "Preview"**
4. **Enter website URL**
5. **Navigate website** and observe events firing

### Method 4: Network Monitoring

1. **Open DevTools → Network tab**
2. **Filter by "gtm"**
3. **Navigate website**
4. **Look for requests to:**
   - `googletagmanager.com/gtm.js?id=GTM-PZBC4XQT`
   - `google-analytics.com/collect` (if GA4 tags configured in GTM)

## Event Tracking Implementation

### Page Views (Automatic)
```javascript
// Triggered on route changes via useAnalytics hook
{
  'event': 'page_view',
  'page_title': 'Page Title',
  'page_location': 'https://example.com/page',
  'page_path': '/page',
  'app_section': 'website'
}
```

### Button Clicks
```javascript
// Triggered on header button clicks
{
  'event': 'custom_event',
  'event_action': 'button_click',
  'event_category': 'engagement',
  'event_label': 'Sign In (header)',
  'app_section': 'website'
}
```

### User Signups
```javascript
// Triggered on successful signup
{
  'event': 'sign_up',
  'method': 'email', // or 'google'
  'user_type': 'buyer', // or 'creator'
  'app_section': 'website'
}
```

### Language Changes
```javascript
// Triggered on language switching
{
  'event': 'custom_event',
  'event_action': 'language_change',
  'event_category': 'user_preference',
  'event_label': 'EN -> KR',
  'app_section': 'website'
}
```

## Verification Checklist

### ✅ HTML Implementation
- [x] GTM script in `<head>` section
- [x] GTM noscript in `<body>` section
- [x] Correct container ID: `GTM-PZBC4XQT`

### ✅ JavaScript Implementation
- [x] Analytics utilities created (`utils/analytics.ts`)
- [x] React hooks implemented (`hooks/useAnalytics.ts`)
- [x] Analytics provider integrated (`components/AnalyticsProvider.tsx`)
- [x] Event tracking added to key components

### ✅ Event Tracking
- [x] Page views tracked automatically
- [x] Button clicks tracked on key CTAs
- [x] Form submissions tracked (success/failure)
- [x] User signups tracked with method and type
- [x] Language changes tracked

### ✅ Build & Deploy
- [x] Website builds successfully with analytics
- [x] No TypeScript errors
- [x] GTM scripts included in built HTML

## Expected Analytics Data

After implementing this fix, you should see in Google Analytics:

1. **Website Page Views** - All page navigation
2. **User Engagement** - Button clicks, language changes
3. **Conversions** - Signup completions
4. **User Flow** - Navigation patterns
5. **Event Attribution** - Events tagged with `app_section: 'website'`

## Debugging Commands

```bash
# Build website with analytics
npm run build:website

# Start website development
npm run dev:website

# Check for analytics files
ls apps/website/src/utils/analytics.ts
ls apps/website/src/hooks/useAnalytics.ts
ls apps/website/src/components/AnalyticsProvider.tsx

# Verify GTM in built files
grep -r "GTM-PZBC4XQT" apps/website/dist/
```

## Common Issues & Solutions

### No dataLayer events
- **Check**: Analytics provider is included in App.tsx
- **Fix**: Ensure `<AnalyticsProvider />` is added to BrowserRouter

### Events not appearing in GA
- **Check**: GTM container has GA4 tags configured
- **Fix**: Set up GA4 configuration tag in GTM console

### TypeScript errors
- **Check**: Analytics imports are correct
- **Fix**: Verify `@/utils/analytics` import paths

### Console errors
- **Check**: Analytics functions are called correctly
- **Fix**: Wrap analytics calls in try-catch blocks

The website should now track analytics data similar to the dashboard, providing comprehensive user behavior insights.