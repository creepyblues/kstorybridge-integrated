# GTM Implementation Testing Guide

## Summary of Changes Made

### Updated Apps:
1. **Website App** (`apps/website/`)
2. **Dashboard App** (`apps/dashboard/`)

### Changes Applied:

#### HTML Files Updated:
- `apps/website/index.html` - Replaced GA4 with GTM
- `apps/dashboard/index.html` - Replaced GA4 with GTM

#### Analytics Code Updated:
- `apps/dashboard/src/utils/analytics.ts` - Updated to use GTM dataLayer
- `apps/dashboard/src/utils/debugGA.ts` - Updated debug utilities for GTM

### GTM Container ID: `GTM-PZBC4XQT`
- Previous: Google Analytics 4 with `G-LTR32L1HTF`
- Current: Google Tag Manager with `GTM-PZBC4XQT`

## Testing Methods

### Method 1: Browser Developer Tools

1. **Start Development Servers:**
   ```bash
   # Terminal 1 - Website
   cd /Users/sungholee/code/kstorybridge-monorepo
   npm run dev:website
   
   # Terminal 2 - Dashboard  
   npm run dev:dashboard
   ```

2. **Test Website App:**
   - Open http://localhost:5173
   - Open DevTools (F12) → Network tab
   - Look for requests to `googletagmanager.com/gtm.js?id=GTM-PZBC4XQT`
   - In Console, check: `window.dataLayer`

3. **Test Dashboard App:**
   - Open http://localhost:8081
   - Open DevTools (F12) → Network tab
   - Look for requests to `googletagmanager.com/gtm.js?id=GTM-PZBC4XQT`
   - In Console, run: `window.debugGTM.checkGTMStatus()`
   - In Console, run: `window.debugGTM.viewDataLayer()`

### Method 2: GTM Debug Console

1. Install [Google Tag Assistant](https://chrome.google.com/webstore/detail/tag-assistant-legacy-by/kejbdjndbnbjgmefkgdddjlbokphdefk) Chrome extension
2. Navigate to your app
3. Click Tag Assistant → Enable
4. Reload page
5. Verify GTM-PZBC4XQT container is loaded

### Method 3: GTM Preview Mode

1. Login to [Google Tag Manager](https://tagmanager.google.com/)
2. Select container GTM-PZBC4XQT
3. Click "Preview" button
4. Enter your local development URL
5. Browse your app to see events firing in GTM debug panel

### Method 4: Automated Testing Commands

```bash
# Test website build
npm run build:website

# Test dashboard build  
npm run build:dashboard

# Check GTM script in built files
grep -r "GTM-PZBC4XQT" apps/website/dist/
grep -r "GTM-PZBC4XQT" apps/dashboard/dist/

# Verify no old GA4 references remain
grep -r "G-LTR32L1HTF" apps/website/ apps/dashboard/ || echo "✅ No old GA4 references found"
```

## Expected Results

### ✅ Success Indicators:

1. **Network Requests:**
   - `https://www.googletagmanager.com/gtm.js?id=GTM-PZBC4XQT` loads successfully
   - No requests to old GA4 endpoints

2. **Console Output:**
   - `window.dataLayer` exists and contains GTM events
   - No JavaScript errors related to gtag or analytics
   - Debug functions work: `window.debugGTM.checkGTMStatus()` returns "✅ Google Tag Manager is ready"

3. **HTML Source:**
   - Contains GTM script in `<head>` section
   - Contains GTM noscript fallback in `<body>` section
   - No references to old `G-LTR32L1HTF` ID

4. **Events Tracking:**
   - Page views push to dataLayer with proper structure
   - Custom events (premium features, navigation) push to dataLayer
   - Events contain `app_section: 'dashboard'` or `app_section: 'website'`

### ❌ Failure Indicators:

1. **Network Issues:**
   - 404 errors for GTM script
   - Requests still going to old GA4 endpoints

2. **Console Errors:**
   - `window.dataLayer is undefined`
   - JavaScript errors mentioning gtag or analytics
   - Debug functions return error messages

3. **Missing Implementation:**
   - GTM script not found in HTML source
   - Old GA4 references still present in code

## Manual Test Scenarios

### Dashboard App:
1. Navigate to different pages → Check page_view events in dataLayer
2. Search for titles → Check search events  
3. Click "Request Premium Feature" → Check premium_feature_request events
4. View title details → Check view_item events

### Website App:
1. Navigate homepage → Check page_view events
2. Click signup buttons → Check navigation events
3. Switch language → Check interaction events

## Verification Commands

```bash
# Verify GTM implementation in source files
echo "=== Checking Website GTM Implementation ==="
grep -n "GTM-PZBC4XQT" apps/website/index.html

echo "=== Checking Dashboard GTM Implementation ==="
grep -n "GTM-PZBC4XQT" apps/dashboard/index.html

echo "=== Checking Analytics Code Update ==="
grep -n "dataLayer" apps/dashboard/src/utils/analytics.ts

echo "=== Verifying No Old GA4 References ==="
! grep -r "G-LTR32L1HTF" apps/website/src/ apps/dashboard/src/ && echo "✅ Clean migration completed"
```