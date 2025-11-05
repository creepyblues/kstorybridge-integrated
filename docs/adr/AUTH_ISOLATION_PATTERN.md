# ADR: Auth Isolation Pattern (Minimal Auth Provider)

**Status**: ✅ Accepted and Implemented
**Date**: 2025-11-03
**Decision Makers**: Development Team
**Affected Apps**: dashboard-v2

---

## Context

### Problem Statement

The dashboard-v2 application experienced repeated authentication failures after making changes to non-authentication features. Specifically:

1. **Frequent Auth Breakage**: Changes to tier system, billing, chat, or title features would intermittently break authentication flows
2. **OAuth Timeout Issues**: OAuth signup/signin would timeout or hang in production
3. **Infinite Loading States**: Tier fetching failures caused entire app to show loading spinner indefinitely
4. **Tight Coupling**: TierProvider wrapped entire app, creating dependency between auth and business logic

### Root Causes Identified

1. **Architectural Coupling**:
   ```typescript
   // Before: TierProvider blocks entire app
   <AuthProvider>
     <TierProvider>  // ❌ Loads immediately, blocks app on failure
       <BrowserRouter>
         <Routes>...</Routes>
       </BrowserRouter>
     </TierProvider>
   </AuthProvider>
   ```

2. **OAuth URL Parameters** (violating documented rules):
   ```typescript
   // ❌ Caused PKCE validation issues
   const callbackUrl = `${origin}/auth/callback?account_type=${type}&flow=${flow}`;
   ```

3. **Missing Timeout Protection**: Auth operations could hang indefinitely with no fail-safe
4. **No Error Boundaries**: Provider failures silently broke entire app
5. **Race Conditions**: TierProvider fetched data before OAuth profile creation completed

### Business Impact

- **User Experience**: Users unable to sign up/sign in intermittently
- **Development Velocity**: Fear of touching any code due to auth breakage
- **Debugging Cost**: Hours spent tracking down why unrelated changes broke auth
- **Production Incidents**: Multiple hotfixes required for auth-related issues

---

## Decision

Implement the **Minimal Auth Provider Pattern** to completely isolate authentication from business logic features.

### Core Principles

1. **AuthProvider = Session Management ONLY**
   - Manages: user, session, loading, error
   - NO business logic imports
   - Timeout protection: 10 seconds
   - Fail-safe error handling

2. **TierProvider = Optional Business Logic**
   - Loaded ONLY on protected routes (lazy)
   - Defaults to 'basic' tier on errors
   - Never blocks auth flow
   - Timeout protection: 10 seconds

3. **Public Routes = Zero Dependencies**
   - No TierProvider on signin/signup/callback
   - Auth-only operations
   - Maximum performance

4. **OAuth = SessionStorage ONLY**
   - NO URL parameters in callback URLs
   - Clear storage on ALL outcomes (success AND errors)
   - Single source of truth for flow state

### Implementation

```typescript
// After: Auth isolated, TierProvider lazy-loaded per route
<AuthProvider>
  <BrowserRouter>
    <Routes>
      {/* Public routes - NO TierProvider */}
      <Route path="/signin" element={<SignIn />} />
      <Route path="/auth/callback" element={<AuthCallback />} />

      {/* Protected routes - TierProvider lazy-loaded */}
      <Route path="/buyers/chat" element={
        <TierProvider>
          <ProtectedRoute>
            <Chat />
          </ProtectedRoute>
        </TierProvider>
      } />
    </Routes>
  </BrowserRouter>
</AuthProvider>
```

---

## Alternatives Considered

### Alternative 1: Separate Auth App/Domain

**Description**: Auth runs on separate subdomain (auth.kstorybridge.com), returns JWT tokens.

**Pros**:
- ✅ Complete isolation (separate codebase, deployment)
- ✅ Centralized for all apps (dashboard, creator, website)
- ✅ Security best practice

**Cons**:
- ❌ Complex infrastructure setup (new subdomain, CORS, deployments)
- ❌ Cross-domain cookies management
- ❌ Overkill for 2-3 apps
- ❌ 2-3 days implementation time

**Decision**: Rejected - Too complex for current scale

### Alternative 2: Edge Function First

**Description**: Move all auth logic to Supabase edge functions, client only handles redirects.

**Pros**:
- ✅ Eliminates race conditions (atomic operations)
- ✅ Minimal client code
- ✅ Server-side security

**Cons**:
- ❌ Different mental model (not React patterns)
- ❌ Harder debugging (Supabase logs vs React DevTools)
- ❌ Cold start latency
- ❌ 1-2 days migration effort

**Decision**: Deferred - Consider for future phase

### Alternative 3: Strict Module Boundaries

**Description**: Create isolated `/auth` module with enforced import rules (ESLint).

**Pros**:
- ✅ Clear visual architecture
- ✅ Gradual adoption possible
- ✅ Lint-enforceable

**Cons**:
- ❌ Depends on team discipline
- ❌ Easy to violate accidentally
- ❌ Not technically enforced
- ❌ Still shares React context (vulnerable to global state bugs)

**Decision**: Partial adoption (use `🚨 AUTH ISOLATION BOUNDARY` comments, but not primary solution)

### Alternative 4: Do Nothing (Status Quo)

**Description**: Keep current architecture, fix bugs as they occur.

**Pros**:
- ✅ No implementation cost
- ✅ No learning curve

**Cons**:
- ❌ Auth continues to break unpredictably
- ❌ Development velocity remains slow
- ❌ User experience suffers
- ❌ Debugging costs remain high

**Decision**: Rejected - Problem too critical to ignore

---

## Consequences

### Positive

1. **Auth Stability**:
   - ✅ Auth flows work independently of other features
   - ✅ Tier/billing failures don't affect auth
   - ✅ Clear, predictable error handling

2. **Development Velocity**:
   - ✅ Developers can change features without fear of breaking auth
   - ✅ Clear boundaries reduce cognitive load
   - ✅ Easier code reviews (check import boundaries)

3. **User Experience**:
   - ✅ Fast auth flows (public routes load instantly)
   - ✅ Clear error messages (no infinite loading)
   - ✅ Graceful degradation (tier failures default to 'basic')

4. **Maintenance**:
   - ✅ Well-documented pattern ([AUTH_ISOLATION_GUIDE.md](../../apps/dashboard-v2/AUTH_ISOLATION_GUIDE.md))
   - ✅ Clear troubleshooting guides
   - ✅ Easy to onboard new developers

### Negative

1. **Code Duplication**:
   - ⚠️ TierProvider instantiated per route (minor performance impact)
   - **Mitigation**: React Context is lightweight, negligible overhead

2. **Discipline Required**:
   - ⚠️ Developers must follow import rules
   - **Mitigation**: Clear documentation, code review checklist, `🚨` comments

3. **Small Delay on Tier Loading**:
   - ⚠️ Tier loads after route navigation (brief loading state)
   - **Mitigation**: Timeout protection ensures max 10 seconds, defaults to 'basic'

### Neutral

1. **Learning Curve**: New pattern for team to learn
2. **Documentation Overhead**: Need to maintain AUTH_ISOLATION_GUIDE.md
3. **Testing Overhead**: Manual testing checklist for auth flows

---

## Implementation Details

### Files Modified

**Phase 1: Critical Bug Fixes**
- `apps/dashboard-v2/src/lib/auth.ts` - Removed OAuth URL params, added timeout protection
- `apps/dashboard-v2/src/hooks/useAuth.tsx` - Added error boundary, timeout protection
- `apps/dashboard-v2/src/contexts/TierContext.tsx` - Added fail-safe defaults, timeout
- `apps/dashboard-v2/src/pages/auth/AuthCallback.tsx` - Removed URL params, added timeout
- `apps/dashboard-v2/src/pages/auth/CompleteProfile.tsx` - Updated to use sessionStorage

**Phase 2: Provider Decoupling**
- `apps/dashboard-v2/src/App.tsx` - Moved TierProvider to per-route lazy loading

**Phase 3: Timeout Protection**
- Added `withTimeout` helper to all async auth operations

**Phase 4: Documentation**
- `apps/dashboard-v2/AUTH_ISOLATION_GUIDE.md` - Complete implementation guide
- `apps/dashboard-v2/CLAUDE.md` - App-specific documentation
- `docs/adr/AUTH_ISOLATION_PATTERN.md` - This file

### Timeline

- **Planning**: 1 hour (analysis, architecture design)
- **Implementation**: 4 hours (code changes, testing)
- **Documentation**: 2 hours (guides, ADR, comments)
- **Total**: 7 hours (single day implementation)

### Breaking Changes

**None**. This is a refactor with no user-facing changes:
- Same auth flows (email, OAuth)
- Same URLs and routing
- Same UI/UX
- Backwards compatible with existing user sessions

---

## Verification

### Success Criteria

- [x] Auth flows work independently of tier system
- [x] No OAuth callback URL parameters
- [x] All async operations have 10-second timeout
- [x] Clear error messages (no infinite loading)
- [x] Public routes load instantly (no TierProvider)
- [x] Comprehensive documentation created

### Testing Performed

**Manual Testing** (2025-11-03):
- [x] Email signup (buyer) → ✅ Success
- [x] Email signin → ✅ Success
- [x] OAuth signup → ✅ Success (no timeout)
- [x] OAuth signin → ✅ Success (no timeout)
- [x] OAuth callback URL → ✅ No parameters in URL
- [x] SessionStorage cleanup → ✅ Cleared on success/error
- [x] Timeout protection → ✅ Error after 10 seconds
- [x] Tier failure → ✅ Defaults to 'basic', app continues

**Code Review**:
- [x] No business logic imports in auth modules
- [x] Timeout wrapper on all async operations
- [x] Error boundaries in all providers
- [x] `🚨 AUTH ISOLATION BOUNDARY` comments added

---

## Monitoring & Metrics

### Key Metrics to Track

1. **Auth Success Rate**:
   - Target: >95% for all flows
   - Alert: <90% success rate

2. **Auth Performance**:
   - Email auth: <2 seconds
   - OAuth callback: <3 seconds
   - Session init: <1 second

3. **Error Rates**:
   - Timeout errors: <2%
   - Tier fetch failures: <5%
   - OAuth failures: <5%

4. **User Experience**:
   - Zero infinite loading states
   - Clear error messages (user feedback)

### Review Schedule

- **Weekly**: Check auth success rates, timeout frequency
- **Monthly**: Review isolation boundaries maintained
- **Quarterly**: Re-evaluate pattern effectiveness, consider edge function migration

---

## Future Evolution

### Short-term (1-2 weeks)

1. **Add retry logic**: Retry failed operations once before showing error
2. **Enhanced monitoring**: Track auth metrics in analytics
3. **User feedback**: Gather feedback on error messages

### Medium-term (1-3 months)

1. **Edge function pattern**: Migrate more auth logic to edge functions
2. **Unified auth service**: Share auth across dashboard/dashboard-v2
3. **Advanced error recovery**: Auto-retry with user notification

### Long-term (3-6 months)

1. **Separate auth app**: Evaluate if scale justifies separate auth domain
2. **Advanced monitoring**: Real-time alerts, dashboards
3. **Performance optimization**: Reduce latency further

---

## References

### Documentation

- [AUTH_ISOLATION_GUIDE.md](../../apps/dashboard-v2/AUTH_ISOLATION_GUIDE.md) - Complete implementation guide
- [Root CLAUDE.md](../../CLAUDE.md) - Monorepo overview
- [AUTH_DOCUMENTATION.md](../active/AUTH_DOCUMENTATION.md) - General auth system
- [SECURITY_BEST_PRACTICES.md](../active/SECURITY_BEST_PRACTICES.md) - Security guidelines

### Related Commits

- `52c0e059` - fix: resolve OAuth signup timeout and remove URL parameters (dashboard app)
- `aa4c2254` - fix(auth): Add timeout protection to prevent OAuth signup hang
- `70174c0b` - fix: resolve creator OAuth signup failure (AuthProvider interference)

### External Resources

- [Supabase Auth Best Practices](https://supabase.com/docs/guides/auth/auth-helpers)
- [React Context Performance](https://react.dev/reference/react/useContext#optimizing-re-renders)
- [PKCE Flow](https://oauth.net/2/pkce/)

---

## Decision History

| Date | Decision | Rationale |
|------|----------|-----------|
| 2025-11-03 | Implement Minimal Auth Provider Pattern | Balance between isolation and simplicity |
| 2025-11-03 | Remove OAuth URL parameters | Violates documented rules, causes PKCE issues |
| 2025-11-03 | Add timeout protection (10s) | Prevent infinite hangs, fail fast |
| 2025-11-03 | Lazy-load TierProvider per route | Decouple auth from business logic |
| 2025-11-03 | Defer edge function migration | Quick fix now, consider for future |

---

## Approval

**Approved by**: Development Team
**Date**: 2025-11-03
**Review Cycle**: Quarterly (next review: 2026-02-03)

---

**Last Updated**: 2025-11-03 by Claude Code
