# Deployment Checklist: title_view_from_chat Tracking

**Issue**: GTM tag configured correctly but event not firing
**Root Cause**: Code changes not deployed/loaded in current environment
**Last Updated**: 2025-10-04

---

## 🚨 Current Situation

**Problem Symptoms**:
- ✅ GTM tag "Title View From Chat" exists and configured
- ✅ GTM trigger `title_view_from_chat` exists
- ✅ All 4 Data Layer Variables configured
- ❌ Event never appears in GTM Preview
- ❌ "20 tags did not fire" when clicking title in chat
- ❌ Only `gtm.linkClick` auto-event fires

**Why**: The tracking code exists in files but is **not loaded** in your browser/environment.

---

## ✅ Step 1: Verify Code Exists (Completed)

Run these commands to confirm code is present:

```bash
cd /Users/sungholee/code/kstorybridge-v2/apps/dashboard

# Check function exists
grep -n "trackTitleViewFromChat" src/utils/analytics.ts
# Should show: Line 81

# Check import exists
grep -n "trackTitleViewFromChat" src/pages/Chat.tsx
# Should show: Line 20 (import) and Line 1216 (function call)
```

✅ **Verified**: Code exists in both files.

---

## ✅ Step 2: Local Testing (DO THIS FIRST)

### 2.1 Restart Development Server

**CRITICAL**: Your dev server may have cached old JavaScript.

```bash
# Stop current dev server
# Press: Ctrl + C (Windows/Linux) or Cmd + C (Mac)

# Start fresh
npm run dev

# Wait for:
# ✓ ready in XXXms
# ➜ Local: http://localhost:8081/
```

### 2.2 Hard Refresh Browser

**Clear JavaScript cache**:
- **Windows/Linux**: `Ctrl + Shift + R`
- **Mac**: `Cmd + Shift + R`

Or use DevTools:
1. Open DevTools (`F12`)
2. Right-click refresh button
3. Select "Empty Cache and Hard Reload"

### 2.3 Verify Code is Loaded

Open browser console (`F12` → Console tab):

```javascript
// Test 1: Check if function exists in global scope
// (It won't be, but we can test the tracking manually)

// Test 2: Check analytics module loaded
console.log('Testing title view tracking...');

// Test 3: Manually trigger event to test GTM
window.dataLayer.push({
  'event': 'title_view_from_chat',
  'title_id': 'test-123',
  'title_name': 'Test Title',
  'chat_mode': 'standard',
  'user_tier': 'basic',
  'session_id': 'test-session',
  'message_id': 'test-message',
  'user_prompt': 'test prompt',
  'recommendation_score': 0.95
});

// Check GTM Preview - should see event appear!
```

**Expected Result**: If GTM Preview shows `title_view_from_chat` event after manual push:
- ✅ GTM configuration is correct
- ❌ Problem is code not calling the function

### 2.4 Test Real Click

1. **Go to chat**: `http://localhost:8081/buyers/chat`
2. **Send message**: "Show me romantic titles"
3. **Click title card** in AI response
4. **Check console** for: `👁️ TITLE VIEW FROM CHAT: [Title] (Mode: standard)`
5. **Check GTM Preview**: Event timeline should show `title_view_from_chat`

---

## ⚠️ Troubleshooting Local Testing

### Issue: Console log doesn't appear

**Symptoms**: No `👁️ TITLE VIEW FROM CHAT` log when clicking title

**Solutions**:

#### A. Dev Server Not Updated
```bash
# Kill ALL node processes
pkill -f node

# Restart dev server
npm run dev
```

#### B. Browser Cache Issue
1. Close ALL browser tabs with localhost:8081
2. Clear browser cache completely
3. Restart browser
4. Open fresh tab to localhost:8081

#### C. Check Click Handler

Open Chat.tsx in editor and find line 1216:

```typescript
// Should look like this:
trackTitleViewFromChat(
  title.title_id,
  titleName,
  'standard',
  currentSession?.id,
  messageId,
  userPrompt,
  title.score
);
```

If missing or different, the code wasn't saved correctly.

### Issue: Manual dataLayer push works, but real click doesn't

**Symptoms**:
- Manual `window.dataLayer.push(...)` shows event in GTM
- But clicking title card doesn't

**Cause**: Click handler not calling `trackTitleViewFromChat()`

**Solution**: Check the click handler code in Chat.tsx:

```bash
# View the exact code around line 1196-1225
sed -n '1196,1225p' src/pages/Chat.tsx
```

Should include:
```typescript
const handleTitleCardClick = async () => {
  // ... other code ...

  trackTitleViewFromChat(
    title.title_id,
    titleName,
    'standard',
    currentSession?.id,
    messageId,
    userPrompt,
    title.score
  );

  // ... other code ...
};
```

### Issue: Function is called but event doesn't fire

**Symptoms**:
- Console log appears: `👁️ TITLE VIEW FROM CHAT`
- But GTM Preview doesn't show event

**Cause**: dataLayer not accessible or timing issue

**Solution**: Add debug logging to analytics.ts:

```bash
# Check current trackTitleViewFromChat function
sed -n '81,109p' src/utils/analytics.ts
```

Should include:
```typescript
if (typeof window !== 'undefined' && window.dataLayer) {
  window.dataLayer.push({
    'event': 'title_view_from_chat',
    // ... parameters ...
  });

  console.log(`👁️ TITLE VIEW FROM CHAT: ${titleName} (Mode: ${chatMode})`);
}
```

**Temporary debug** - add this after the `push()`:
```typescript
console.log('DataLayer after push:', window.dataLayer);
```

---

## ✅ Step 3: Deploy to Production

Once local testing works, deploy to production.

### 3.1 Build & Test Build

```bash
# Build production version
npm run build

# Preview production build locally
npm run preview

# Should open: http://localhost:4173
# Test the same way as Step 2.4
```

**Note**: There's a known build issue with `mermaid` import in `UserJourneyTab.tsx`. This is unrelated to our changes but may block builds.

**Workaround if build fails**:
```bash
# Temporarily comment out the problematic import
# Or deploy via Vercel which handles this differently
```

### 3.2 Deploy to Vercel (Recommended)

```bash
# Install Vercel CLI if not installed
npm i -g vercel

# Deploy to production
vercel --prod

# Wait for deployment...
# Will output: https://dashboard.kstorybridge.com
```

### 3.3 Alternative: Git Deploy (If using Git-based deployment)

```bash
# Add changes
git add src/utils/analytics.ts src/pages/Chat.tsx

# Commit with descriptive message
git commit -m "Add title_view_from_chat event tracking

- Created trackTitleViewFromChat() function in analytics.ts
- Updated Chat.tsx to call new tracking function
- Sends complete event data to GTM/GA4 for chat title engagement tracking"

# Push to deploy branch (usually main or master)
git push origin main

# Wait for CI/CD to deploy...
```

---

## ✅ Step 4: Verify Production Deployment

### 4.1 Wait for Deployment

- **Vercel**: Usually 2-5 minutes
- **Other CI/CD**: Check your deployment pipeline

### 4.2 Test in Production

1. **Go to production URL**: `https://dashboard.kstorybridge.com`
2. **Open GTM Preview**: Connect to production URL
3. **Navigate to chat**: `/buyers/chat`
4. **Send message**: "Show me romantic titles"
5. **Click title card**
6. **Verify in GTM Preview**: `title_view_from_chat` event appears

### 4.3 Verify in GA4

1. **GA4 Real-time report**:
   - Go to GA4 → Reports → Real-time
   - Perform test clicks (Step 4.2)
   - Event should appear within 30-60 seconds

2. **Check event parameters**:
   - Click on `title_view_from_chat` event
   - Verify all parameters present:
     - ✅ `title_id`
     - ✅ `title_name`
     - ✅ `chat_mode`
     - ✅ `user_tier`
     - ✅ `session_id`
     - ✅ `message_id`

---

## ✅ Step 5: Final Verification

### Production Smoke Test

Run this checklist within 24 hours of deployment:

- [ ] Event fires in production GTM Preview
- [ ] Console log appears: `👁️ TITLE VIEW FROM CHAT`
- [ ] Event appears in GA4 Real-time (within 10 min)
- [ ] All 4+ parameters populated in GA4
- [ ] Event count increases with each click
- [ ] Old events (`upgrade_button_click`) still work

### Long-term Monitoring (1 week after)

- [ ] GA4 Reports → Engagement → Events
- [ ] Find `title_view_from_chat` event
- [ ] Verify reasonable event count (proportional to chat usage)
- [ ] Check parameter distribution makes sense

---

## 🐛 Common Deployment Issues

### Issue: Works locally, fails in production

**Symptoms**: Local testing perfect, production doesn't fire

**Causes**:
1. **Build optimization stripped code**
2. **Environment variable differences**
3. **CDN caching old JavaScript**

**Solutions**:

#### A. Check Build Output
```bash
# After npm run build, check if function exists in bundle
grep -r "trackTitleViewFromChat" dist/

# Should find it in a minified .js file
```

#### B. Clear CDN Cache (if using CDN)
- Vercel: Usually auto-purges, wait 5 minutes
- Cloudflare: Purge cache manually
- Other: Check CDN docs

#### C. Hard Refresh Production
- Clear browser cache completely
- Shift + Reload
- Try incognito/private window

### Issue: Event fires but no data in GA4

**Symptoms**:
- GTM Preview shows event firing
- Tag shows "Fired"
- But GA4 has no data

**Causes**:
1. **Wrong Measurement ID**
2. **GA4 property misconfigured**
3. **Event name mismatch**

**Solutions**:

#### A. Verify Measurement ID
- GTM Tag: Should be `G-DWL6MV0MC2`
- GA4 Property: Verify this is correct ID
- Check: Admin → Data Streams → Measurement ID

#### B. Check GA4 Data Retention
- Admin → Data Settings → Data Retention
- Should be collecting event data

#### C. Wait Longer
- GA4 can take up to 24 hours for reports
- Real-time should show within minutes
- DebugView shows immediately

---

## 📊 Success Metrics

After successful deployment, expect:

| Metric | Expected Value | Where to Check |
|--------|---------------|----------------|
| Event fires | Yes, every title click from chat | GTM Preview |
| Console log | `👁️ TITLE VIEW...` | Browser console |
| GA4 Real-time | Event visible < 10 min | GA4 → Real-time |
| Parameters | 4+ populated | GA4 event detail |
| Daily events | ~10-50 (depends on chat usage) | GA4 → Events report |

---

## 🔗 Related Files

- **Tracking Code**: `/src/utils/analytics.ts` (line 81-109)
- **Implementation**: `/src/pages/Chat.tsx` (line 20, 1216-1224)
- **GTM Config Guide**: `/public/docs/GTM_UPGRADE_BUTTON_COMPLETE_SETUP.md`
- **Event Fix Guide**: `/public/docs/GA_EVENTS_FIX_GUIDE.md`
- **Status Summary**: `/public/docs/GA_EVENTS_STATUS.md`

---

## 🆘 Still Not Working?

If you've followed all steps and it still doesn't work:

### Debug Checklist

1. **Verify code in production**:
   ```javascript
   // In production console:
   fetch('/_next/static/chunks/pages/buyers/chat-[hash].js')
     .then(r => r.text())
     .then(t => console.log(t.includes('title_view_from_chat')))
   // Should return: true
   ```

2. **Check GTM container version**:
   - GTM → Versions → Check latest published
   - Should include your tag changes

3. **Verify no JavaScript errors**:
   - Console → Check for red error messages
   - Common: Import errors, undefined functions

4. **Test with different browser**:
   - Chrome, Firefox, Safari
   - Incognito/private mode
   - Different computer

### Get Help

If still stuck, gather this info:

- [ ] Screenshot of GTM Preview showing Link Click (but not title_view_from_chat)
- [ ] Browser console log (full output)
- [ ] Network tab showing loaded JavaScript files
- [ ] Exact steps you followed
- [ ] Environment (localhost, production, staging)
- [ ] Deployment method (Vercel, custom, etc.)

---

## ✅ Final Checklist

Before marking this as "Done":

- [ ] Local testing: Event fires in GTM Preview (localhost)
- [ ] Local testing: Console log appears
- [ ] Production deployment: Completed successfully
- [ ] Production testing: Event fires in GTM Preview
- [ ] GA4 verification: Event appears in Real-time
- [ ] GA4 verification: Parameters populated
- [ ] Monitoring setup: Know where to check event count
- [ ] Documentation: This checklist followed completely

---

*Last updated: 2025-10-04*
*Status: Ready for deployment*
*Estimated time: 15-30 minutes (including deployment)*
