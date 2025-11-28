# AUTH ISOLATION GUIDE

**Last Updated**: 2025-11-03
**Pattern**: Minimal Auth Provider Pattern
**Status**: ✅ Implemented

---

## 🎯 Purpose

This guide documents the **Minimal Auth Provider Pattern** implemented to completely isolate authentication from other features, preventing non-auth changes from breaking the auth system.

### Problem We Solved

Before this pattern:
- Auth failures after making changes to unrelated features (tier, billing, chat)
- OAuth callback timeouts due to provider coupling
- Infinite loading states when tier fetching failed
- TierProvider blocking entire app initialization

After this pattern:
- ✅ Auth works independently of all other features
- ✅ Tier/billing failures don't affect auth
- ✅ Fast, predictable auth flows with clear error messages
- ✅ Public routes load instantly (no tier checking)

---

## 🏗️ Architecture Overview

### Provider Hierarchy

```
<AuthProvider>                          ← Auth state ONLY (user, session, loading, error)
  <BrowserRouter>
    <Routes>
      {/* Public Routes - NO TierProvider */}
      <Route path="/signin" />          ← Auth pages load instantly
      <Route path="/signup" />
      <Route path="/auth/callback" />
      <Route path="/signup/complete" />

      {/* Protected Routes - TierProvider per route */}
      <Route path="/buyers/chat">
        <TierProvider>                  ← Business logic, lazy-loaded
          <ProtectedRoute>
            <Chat />
          </ProtectedRoute>
        </TierProvider>
      </Route>
    </Routes>
  </BrowserRouter>
</AuthProvider>
```

### Key Principles

1. **AuthProvider** = Session management ONLY
   - Manages: user, session, loading, error
   - Imports: Only Supabase client, no business logic
   - Timeout: 10 seconds max
   - Fail-safe: Clear error messages, never infinite loading

2. **TierProvider** = Business logic (optional enhancement)
   - Loaded ONLY on protected routes
   - Defaults to 'basic' tier on errors
   - Timeout: 10 seconds max
   - Never blocks auth flow

3. **Public Routes** = Zero dependencies
   - No TierProvider, no business logic contexts
   - Auth-only operations
   - Maximum performance

---

## 🚨 Critical Rules for Developers

### ✅ DO

1. **Keep auth simple**
   - Auth manages session state only
   - Fail fast with clear error messages
   - Use timeout protection (10 seconds max)

2. **Use sessionStorage for OAuth**
   - Store flow state in sessionStorage
   - Clear on ALL outcomes (success AND errors)
   - NEVER use URL parameters in callback URLs

3. **Make business logic lazy**
   - Load tier/billing/features AFTER auth succeeds
   - Default to safe values on errors ('basic' tier)
   - Never block app if business logic fails

4. **Add error boundaries**
   - Wrap all providers in try-catch
   - Set timeout on all async operations
   - Show user-friendly error messages

### ❌ DON'T

1. **Never import business logic into auth**
   ```typescript
   // ❌ BAD
   import { TierProvider } from '@/contexts/TierContext';
   import { BillingService } from '@/services/billing';
   // in auth.ts or useAuth.tsx
   ```

2. **Never use URL parameters in OAuth callbacks**
   ```typescript
   // ❌ BAD
   const callbackUrl = `${origin}/auth/callback?account_type=${type}`;

   // ✅ GOOD
   sessionStorage.setItem('oauth_account_type', type);
   const callbackUrl = `${origin}/auth/callback`;
   ```

3. **Never wrap public routes with business logic**
   ```typescript
   // ❌ BAD
   <TierProvider>
     <Route path="/signin" element={<SignIn />} />
   </TierProvider>

   // ✅ GOOD
   <Route path="/signin" element={<SignIn />} />
   ```

4. **Never let auth hang indefinitely**
   ```typescript
   // ❌ BAD
   const session = await supabase.auth.getSession();

   // ✅ GOOD
   const session = await withTimeout(
     supabase.auth.getSession(),
     AUTH_TIMEOUT_MS,
     'Session initialization'
   );
   ```

---

## 📁 File Structure & Boundaries

### Auth Module (Isolated)

```
src/
├── lib/
│   ├── auth.ts                   # 🚨 AUTH ISOLATION BOUNDARY
│   └── supabase.ts               # Only imports: @supabase/supabase-js
├── hooks/
│   └── useAuth.tsx               # 🚨 AUTH ISOLATION BOUNDARY
├── pages/auth/
│   ├── SignIn.tsx                # 🚨 AUTH ISOLATION BOUNDARY
│   ├── SignUp.tsx                # 🚨 AUTH ISOLATION BOUNDARY
│   ├── AuthCallback.tsx          # 🚨 AUTH ISOLATION BOUNDARY
│   └── CompleteProfile.tsx       # 🚨 AUTH ISOLATION BOUNDARY
├── components/
│   └── ProtectedRoute.tsx        # Uses: useAuth only
```

**Allowed imports**:
- ✅ `@supabase/supabase-js`
- ✅ `react`, `react-router-dom`
- ✅ UI components (Button, Input, Card)
- ✅ `lib/supabase.ts`

**Forbidden imports**:
- ❌ `contexts/TierContext.tsx`
- ❌ `services/*` (except supabase)
- ❌ Any feature-specific hooks/contexts
- ❌ Business logic utilities

### Business Logic Module (Separate)

```
src/
├── contexts/
│   ├── TierContext.tsx           # 🚨 BUSINESS LOGIC - NOT AUTH
│   └── DataCacheContext.tsx      # Can use: useAuth
├── pages/buyers/
│   ├── Chat.tsx                  # Can use: useAuth, useTierAccess
│   ├── Titles.tsx                # Can use: useAuth, useTierAccess
│   └── TitleDetail.tsx           # Can use: useAuth, useTierAccess
```

**Can import from auth**: ✅ Yes
**Auth can import from business logic**: ❌ No

---

## 🔧 Implementation Details

### 1. AuthProvider (useAuth.tsx)

**Responsibilities**:
- Initialize session on mount
- Listen for auth state changes
- Provide user, session, loading, error

**Timeout Protection**:
```typescript
const AUTH_TIMEOUT_MS = 10000; // 10 seconds

const { data: { session }, error: sessionError } = await withTimeout(
  supabase.auth.getSession(),
  AUTH_TIMEOUT_MS,
  'Session initialization'
);
```

**Error Handling**:
```typescript
if (mounted) {
  setLoading(false);
  setError(
    err.message?.includes('timed out')
      ? 'Connection timeout. Please check your network and try again.'
      : 'Authentication failed. Please refresh and try again.'
  );
}
```

### 2. TierProvider (TierContext.tsx)

**Responsibilities**:
- Fetch buyer tier from database
- Provide tier access checking
- Default to 'basic' on errors

**Fail-Safe Behavior**:
```typescript
if (queryError) {
  console.error('[TierProvider] Query error:', queryError);
  // Fail-safe: Default to 'basic' tier, don't block app
  setTier('basic');
  setError('Unable to load subscription tier. Defaulting to basic access.');
}
```

**Timeout Protection**:
```typescript
const TIER_FETCH_TIMEOUT_MS = 10000; // 10 seconds

const { data, error } = await withTimeout(
  supabase.from('user_buyers').select('tier').eq('id', user.id).maybeSingle(),
  TIER_FETCH_TIMEOUT_MS,
  'Tier fetch'
);
```

### 3. OAuth Callback (AuthCallback.tsx)

**Critical Changes**:
```typescript
// ✅ Read from sessionStorage ONLY
const accountType = sessionStorage.getItem('oauth_account_type');
const flow = sessionStorage.getItem('oauth_flow');

// ❌ DO NOT read from URL parameters
// const accountType = searchParams.get('account_type'); // WRONG
```

**Timeout Protection**:
```typescript
const CALLBACK_TIMEOUT_MS = 15000; // 15 seconds for entire flow

useEffect(() => {
  const timeoutId = setTimeout(() => {
    clearOAuthStorage();
    setError('Authentication timed out. Please try again.');
  }, CALLBACK_TIMEOUT_MS);

  handleOAuthCallback().finally(() => clearTimeout(timeoutId));
}, []);
```

**Storage Cleanup**:
```typescript
function clearOAuthStorage() {
  sessionStorage.removeItem('oauth_account_type');
  sessionStorage.removeItem('oauth_flow');
}

// Call on BOTH success AND errors
if (error) {
  clearOAuthStorage(); // ✅
  setError(error.message);
  return;
}

clearOAuthStorage(); // ✅
navigate('/buyers/chat');
```

### 4. Auth Service (auth.ts)

**OAuth Callback URL**:
```typescript
// ❌ WRONG (violates CLAUDE.md)
const callbackUrl = `${window.location.origin}/auth/callback?account_type=${accountType}`;

// ✅ CORRECT
sessionStorage.setItem('oauth_account_type', accountType);
sessionStorage.setItem('oauth_flow', flow);
const callbackUrl = `${window.location.origin}/auth/callback`;
```

**Timeout Protection on Database Queries**:
```typescript
export async function checkBuyerProfileExists(userId: string): Promise<boolean> {
  try {
    const { data, error } = await withTimeout(
      supabase.from('user_buyers').select('id').eq('id', userId).maybeSingle(),
      AUTH_TIMEOUT_MS,
      'Profile existence check'
    );

    if (error) return false;
    return !!data;
  } catch (error: any) {
    // Fail-safe: Return false on timeout
    return false;
  }
}
```

---

## 🧪 Testing Guide

### Manual Testing Checklist

**Email Auth**:
- [ ] Buyer signup completes successfully
- [ ] Email signin completes successfully
- [ ] Invalid credentials show clear error
- [ ] Network timeout shows error within 10 seconds

**OAuth Auth**:
- [ ] Google OAuth signup completes without timeout
- [ ] Google OAuth signin completes without timeout
- [ ] OAuth callback clears sessionStorage on success
- [ ] OAuth callback clears sessionStorage on error
- [ ] No URL parameters in callback URL (check browser network tab)

**Error Resilience**:
- [ ] Simulate database timeout → auth shows error, doesn't hang
- [ ] Simulate tier fetch failure → app works with 'basic' tier
- [ ] Simulate network offline → error within 10 seconds
- [ ] Check console for clear error messages (no technical jargon)

**Performance**:
- [ ] Public routes load instantly (no tier checking)
- [ ] Protected routes show loading state briefly
- [ ] Tier failures don't block page rendering

### Browser Console Checks

**OAuth Flow**:
```
🔄 OAuth callback processing { accountType: 'buyer', flow: 'signin' }
✅ OAuth session established { userId: '...', email: '...' }
```

**No URL Parameters**:
```
Network tab → /auth/callback → No query parameters ✅
```

**SessionStorage Cleanup**:
```javascript
// After OAuth completes
sessionStorage.getItem('oauth_account_type') // null ✅
sessionStorage.getItem('oauth_flow')         // null ✅
```

---

## 🚑 Troubleshooting

### Issue: Auth hangs with infinite loading

**Diagnosis**:
- Check browser console for timeout errors
- Look for `[AuthProvider] Initialization error` logs

**Solution**:
- Verify timeout protection is active (10 seconds)
- Check error state is set properly
- Ensure loading is set to `false` in error handler

### Issue: OAuth callback fails

**Diagnosis**:
- Check network tab for callback URL
- Look for URL parameters (should be NONE)
- Check sessionStorage before/after callback

**Solution**:
- Verify callback URL has no parameters
- Ensure sessionStorage is cleared on errors
- Check 15-second timeout hasn't expired

### Issue: Tier failures break app

**Diagnosis**:
- Check `[TierProvider] Query error` logs
- Verify tier is defaulting to 'basic'

**Solution**:
- Ensure TierProvider has timeout protection
- Check fail-safe defaults to 'basic' tier
- Verify error messages are user-friendly

### Issue: Changes to features break auth

**Diagnosis**:
- Check if new feature imports auth modules
- Look for provider ordering changes in App.tsx
- Verify public routes don't load TierProvider

**Solution**:
- Review import boundaries (auth can't import business logic)
- Ensure App.tsx structure matches this guide
- Add `🚨 AUTH ISOLATION BOUNDARY` comments

---

## 📊 Monitoring & Metrics

### Key Metrics to Track

1. **Auth Success Rate**
   - Email signup success: >95%
   - Email signin success: >98%
   - OAuth signup success: >90%
   - OAuth signin success: >95%

2. **Auth Performance**
   - Email auth: <2 seconds
   - OAuth callback: <3 seconds
   - Session initialization: <1 second

3. **Error Rates**
   - Timeout errors: <2%
   - Network errors: <5%
   - Tier fetch failures: <5%

4. **User Experience**
   - Zero infinite loading states
   - Clear error messages (no technical jargon)
   - Fast recovery from errors

### Logging Guidelines

**Auth Service**:
```typescript
console.log('[Auth Service] Starting email signup', { email });
console.error('[Auth Service] Signup error', error);
```

**Auth Provider**:
```typescript
console.error('[AuthProvider] Initialization error:', err);
```

**Tier Provider**:
```typescript
console.error('[TierProvider] Query error:', queryError);
console.warn('[TierProvider] No buyer profile found, defaulting to basic tier');
```

---

## 🔄 Future Improvements

### Short-term (1-2 weeks)

1. **Add retry logic**
   - Retry failed auth operations once before showing error
   - Exponential backoff for transient failures

2. **Enhanced monitoring**
   - Track auth success rates in analytics
   - Alert on error rate spikes

3. **User feedback**
   - Gather user feedback on error messages
   - Improve clarity of timeout messages

### Long-term (1-3 months)

1. **Edge function pattern**
   - Move more auth logic to edge functions
   - Reduce client-side complexity

2. **Unified auth service**
   - Share auth implementation across dashboard/dashboard-v2
   - Single source of truth

3. **Advanced error recovery**
   - Auto-retry with user notification
   - Progressive error recovery strategies

---

## 📝 Maintenance

### Monthly Reviews

- [ ] Review auth success rates
- [ ] Check timeout frequency
- [ ] Verify isolation boundaries maintained
- [ ] Update documentation with learnings

### When Adding New Features

1. **Before starting**:
   - Review this guide
   - Plan feature without auth dependencies

2. **During development**:
   - Use `useTierAccess` for business logic
   - Never import from auth module
   - Add timeout protection to async operations

3. **Before deploying**:
   - Test auth flows still work
   - Verify no new auth dependencies
   - Check error handling is graceful

---

## 📚 Related Documentation

- [AUTH_DOCUMENTATION.md](../../docs/active/AUTH_DOCUMENTATION.md) - Complete auth system reference
- [CACHE_POLICY.md](../../docs/active/CACHE_POLICY.md) - Session-based caching
- [SECURITY_BEST_PRACTICES.md](../../docs/active/SECURITY_BEST_PRACTICES.md) - Credential management
- [LOCAL_VS_PRODUCTION_DIFFERENCES.md](../../docs/active/LOCAL_VS_PRODUCTION_DIFFERENCES.md) - Environment setup

---

## 🆘 Support

### Questions or Issues?

1. Review this guide thoroughly
2. Check troubleshooting section
3. Review ADR: `docs/adr/AUTH_ISOLATION_PATTERN.md`
4. Check git history for recent auth changes
5. Contact: Auth system maintainer

### Reporting Auth Issues

Include:
- [ ] Browser console logs (`[Auth*]` messages)
- [ ] Network tab screenshot (OAuth callback URL)
- [ ] SessionStorage contents during failure
- [ ] Steps to reproduce
- [ ] Expected vs actual behavior

---

**Remember**: Auth isolation is not optional. It's critical for system stability. Follow these patterns religiously.
