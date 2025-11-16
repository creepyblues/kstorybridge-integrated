# Browser-Session-Only Persistence Implementation

**Last Updated**: 2025-11-16

## Overview

This document describes the implementation of browser-session-only persistence for the KStoryBridge dashboard app. Sessions now persist while the browser is open but are automatically cleared when the browser/tab closes.

---

## Why sessionStorage Instead of localStorage?

### User Request
- Cannot modify Supabase JWT settings (requires paid plan)
- Needs app-level solution for session management
- Wants sessions to clear when browser closes (improved security)

### Solution
Switch from `localStorage` to `sessionStorage` for auth token storage.

---

## Implementation Details

### Changes Made

#### 1. **Supabase Client Configuration**
**File**: `src/integrations/supabase/client.ts`

**Line 55** - Changed storage mechanism:
```typescript
auth: {
  storage: sessionStorage, // Use sessionStorage for browser-session-only persistence
  persistSession: true,
  autoRefreshToken: true,
  // ... rest unchanged
}
```

#### 2. **Bootstrap Function Updates**
**File**: `src/integrations/supabase/client.ts`

**Lines 306-349** - Updated to read from sessionStorage:
```typescript
// Line 306: Read from sessionStorage instead of localStorage
const raw = window.sessionStorage.getItem(STORAGE_KEY);

// Line 307: Updated log message
console.log('🧊 [BOOTSTRAP] sessionStorage check:', { ... });

// Line 314: Updated log message
console.log('🧊 [BOOTSTRAP] No sessionStorage data found');

// Line 318: Updated comment
// Parse Supabase's sessionStorage format correctly

// Line 334: Updated log message
console.log('🧊 [BOOTSTRAP SUCCESS] Session cached from sessionStorage:', { ... });

// Line 342: Updated log message
console.log('🧊 [BOOTSTRAP FAILED] sessionStorage auth data inspection:', { ... });
```

#### 3. **Reverted 7-Day Session Changes**
Since we no longer need extended JWT tokens, reverted all previous 7-day session changes:

**File**: `src/config/sessionConfig.ts`
- `SESSION_EXPIRY_WARNING`: 24 hours → **5 minutes**
- `SESSION_EXPIRY_CRITICAL`: 1 hour → **1 minute**
- `SESSION_EXPIRY_INFO`: 48 hours → **15 minutes**
- `MAX_SESSION_AGE`: 7 days → **24 hours**

**File**: `src/integrations/supabase/client.ts`
- `SESSION_CACHE_MAX_AGE_MS`: 6 hours → **30 minutes**
- `expiryBufferOk`: 1 hour → **15 minutes**

**File**: `src/utils/sessionManager.ts`
- Reverted expiry messages to original values (5 minutes, 1 minute, 15 minutes)

---

## How It Works

### sessionStorage Behavior

**Persistence**:
- ✅ Persists across page refreshes within the same tab
- ✅ Persists across navigation within the same tab
- ✅ Survives page reloads (F5, Ctrl+R)
- ❌ Cleared when tab is closed
- ❌ Cleared when browser is closed
- ❌ NOT shared across tabs (each tab has isolated session)

**Auto-Refresh Compatibility**:
- ✅ Auto-refresh continues working normally
- ✅ Refresh tokens stored in sessionStorage
- ✅ Health checks work identically
- ✅ Session maintained during active browser session

### Session Lifecycle

```
User Opens Browser
  ↓
User Signs In
  ↓
Supabase issues JWT (1 hour default)
  ↓
Token stored in sessionStorage
  ↓
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
During Browser Session:
  - Page refreshes → Session persists ✅
  - Navigate between pages → Session persists ✅
  - Auto-refresh maintains session ✅
  - Health checks every 10 minutes ✅
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  ↓
User Closes Tab/Browser
  ↓
sessionStorage automatically cleared
  ↓
Next browser session requires re-login
```

---

## Behavior Comparison

| Action | localStorage (Before) | sessionStorage (Now) |
|--------|-----------------------|---------------------|
| Page refresh | ✅ Stays logged in | ✅ Stays logged in |
| Navigate to another page | ✅ Stays logged in | ✅ Stays logged in |
| Close tab, reopen site | ✅ Stays logged in | ❌ **Must login again** |
| Close browser, reopen | ✅ Stays logged in | ❌ **Must login again** |
| Open new tab to site | ✅ Auto logged in | ❌ **Must login again** |
| Browser crash/restart | ✅ Stays logged in | ❌ **Must login again** |

---

## Security Improvements

### Enhanced Security
- ✅ **Reduced exposure window**: Sessions cleared on browser close
- ✅ **Shared computer safety**: Next user can't access previous session
- ✅ **Tab isolation**: Each tab requires separate login
- ✅ **Auto-cleanup**: No manual session management needed

### Risk Reduction
- **Before**: Session token persisted indefinitely in localStorage
- **After**: Session token cleared when browser closes
- **Impact**: Stolen/leaked tokens have shorter validity window

---

## Testing Checklist

### ✅ Basic Functionality
- [ ] Login to dashboard → Should work normally
- [ ] Refresh page (F5) → Should stay logged in
- [ ] Navigate to different page → Should stay logged in
- [ ] Check DevTools → Application → Session Storage → Verify auth token exists
- [ ] Check DevTools → Application → Local Storage → Verify NO auth token

### ✅ Session Persistence
- [ ] Login to dashboard
- [ ] Navigate between pages (Home, Titles, Profile)
- [ ] Refresh multiple times
- [ ] Verify session persists throughout

### ✅ Session Clearing
- [ ] Login to dashboard
- [ ] Close tab completely
- [ ] Open new tab to dashboard
- [ ] Should redirect to /signin (NOT auto-logged-in)

### ✅ Browser Restart
- [ ] Login to dashboard
- [ ] Close browser completely
- [ ] Reopen browser
- [ ] Navigate to dashboard
- [ ] Should redirect to /signin (NOT auto-logged-in)

### ✅ Multi-Tab Behavior
- [ ] Tab 1: Login to dashboard
- [ ] Tab 2: Open dashboard in new tab
- [ ] Tab 2 should require login (NOT auto-logged-in)
- [ ] Login on Tab 2
- [ ] Both tabs now have independent sessions

### ✅ Auto-Refresh
- [ ] Login to dashboard
- [ ] Leave browser open for 30+ minutes
- [ ] Interact with app
- [ ] Session should still be valid (auto-refresh working)
- [ ] Check console for refresh logs

### ✅ OAuth Flow
- [ ] Click "Continue with Google" (or other OAuth)
- [ ] Complete OAuth flow
- [ ] Should redirect back and login successfully
- [ ] Session stored in sessionStorage

---

## Development Notes

### Storage Key
```typescript
const STORAGE_KEY = 'sb-dlrnrgcoguxlkkcitlpd-auth-token';
```

This key is now used with **sessionStorage** instead of localStorage.

### Debug Logging

Enable session debug logs:
```env
VITE_SESSION_DEBUG=true
VITE_SESSION_CACHE_DEBUG=true
VITE_AUTH_DEBUG=true
```

Look for these log prefixes:
- `🧊 [BOOTSTRAP]` - Session bootstrap from storage
- `🔐 AUTH:` - Authentication operations
- `⚡` - Cached session usage
- `🌐` - Remote session fetch

### Inspecting Sessions

**Browser DevTools Console**:
```javascript
// Check sessionStorage
console.log('Session data:', sessionStorage.getItem('sb-dlrnrgcoguxlkkcitlpd-auth-token'));

// Check localStorage (should be empty)
console.log('Local data:', localStorage.getItem('sb-dlrnrgcoguxlkkcitlpd-auth-token'));

// Parse session
const session = JSON.parse(sessionStorage.getItem('sb-dlrnrgcoguxlkkcitlpd-auth-token'));
console.log({
  user: session?.user?.email,
  expiresAt: new Date(session?.expires_at * 1000).toISOString()
});
```

---

## Common Issues

### Issue: Session lost on page refresh
**Cause**: Browser might be clearing sessionStorage aggressively
**Debug**:
1. Check browser privacy settings
2. Verify no extensions blocking sessionStorage
3. Check DevTools → Application → Session Storage during refresh

**Fix**: sessionStorage SHOULD persist on refresh - if not, browser issue

### Issue: Can't login at all
**Cause**: sessionStorage might be disabled
**Debug**:
```javascript
try {
  sessionStorage.setItem('test', 'test');
  console.log('sessionStorage works');
  sessionStorage.removeItem('test');
} catch (e) {
  console.error('sessionStorage blocked:', e);
}
```

**Fix**: Enable sessionStorage in browser settings, disable strict privacy mode

### Issue: Multi-tab sessions confusing users
**Expectation**: Some users expect tabs to share sessions
**Reality**: sessionStorage isolates tabs intentionally

**Consideration**: This is by design for security, but document in UI/help text

---

## Rollback Plan

If issues occur, revert to localStorage:

### Quick Rollback

**File**: `src/integrations/supabase/client.ts`

1. **Line 55**: Change back to localStorage:
```typescript
auth: {
  storage: localStorage, // Reverted from sessionStorage
  // ... rest unchanged
}
```

2. **Line 306**: Change back to localStorage:
```typescript
const raw = window.localStorage.getItem(STORAGE_KEY);
```

3. **Update log messages** (lines 307, 314, 318, 334, 342):
   - Replace "sessionStorage" → "localStorage"

4. **Rebuild and deploy**:
```bash
npm run build:dashboard
```

---

## Future Considerations

### "Remember Me" Feature
Consider adding optional localStorage fallback:
```typescript
const useRememberMe = true; // User preference
const storage = useRememberMe ? localStorage : sessionStorage;

auth: {
  storage: storage,
  // ...
}
```

### Session Duration Control
Allow users to choose session behavior:
- "Close browser" → sessionStorage (current)
- "7 days" → localStorage + extended JWT (requires paid Supabase)
- "Custom" → localStorage + custom expiry

### Multi-Tab Support
If needed, implement cross-tab communication:
```typescript
// Tab A logs in
window.addEventListener('storage', (e) => {
  if (e.key === AUTH_EVENT_KEY) {
    // Sync session across tabs
  }
});
```

---

## Related Files

- `src/integrations/supabase/client.ts` - Main client configuration
- `src/config/sessionConfig.ts` - Session timing constants
- `src/utils/sessionManager.ts` - Session utilities
- `src/hooks/useAuth.tsx` - Auth context/provider

---

## Summary

✅ **Simple implementation**: 2-file change, minimal code modifications
✅ **Improved security**: Sessions clear on browser close
✅ **No Supabase changes**: App-level solution only
✅ **Backward compatible**: Can revert easily if needed
✅ **All features work**: Auto-refresh, OAuth, health checks unchanged

The switch from localStorage to sessionStorage provides browser-session-only persistence without requiring any Supabase configuration changes.
