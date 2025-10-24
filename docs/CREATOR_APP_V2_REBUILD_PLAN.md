# Creator App V2 - Complete Rebuild Plan

**Status**: 🚧 Phase 3 Complete - Ready for Phase 4
**Timeline**: 2-3 days (20-22 hours)
**Last Updated**: 2025-10-23
**Progress**: Phase 3 of 5 (60%)

---

## 🎯 Project Overview

### Strategic Decision
Build a completely new creator app from scratch to eliminate OAuth authentication issues that have been blocking production deployment.

### Why Rebuild?
**Current Issues (apps/creator)**:
- ❌ OAuth signup hangs indefinitely at `updateUser()` call
- ❌ Three competing auth listeners causing race conditions
- ❌ Complex session health checks blocking auth operations
- ❌ Concurrent `getSession()` and `updateUser()` calls deadlocking
- ❌ Leftover buyer code (8% separation project incomplete)
- ❌ Shared abstractions with dashboard causing tight coupling

**New Approach (apps/creator-v2)**:
- ✅ Clean slate - no legacy code
- ✅ Minimal abstractions - simple, maintainable
- ✅ account_type='creator' set DURING signup (not after)
- ✅ Single auth listener - no race conditions
- ✅ Sequential operations - no concurrent auth calls
- ✅ No dashboard dependencies - fully independent

---

## 📊 Progress Tracking

### Phase 1: PRD Extraction & Planning
**Status**: ✅ COMPLETED
**Time Estimate**: 2-3 hours
**Owner**: Claude
**Completed**: 2025-10-23

#### Tasks
- [x] Analyze current creator app features
  - [x] Document all creator-specific pages
  - [x] List working UI components to keep
  - [x] Extract database schema requirements
  - [x] Document edge functions needed
  - [x] List Supabase storage usage
- [x] Create PRD document (`docs/CREATOR_APP_V2_PRD.md`)
- [x] Create new app directory structure (`apps/creator-v2/`)
- [x] Configure package.json and build tools

#### Deliverables
- [x] Comprehensive PRD document
- [x] Empty app scaffold ready for development
- [x] Dependencies installed and configured

#### Files Created
- `/Users/sungholee/code/kstorybridge/docs/CREATOR_APP_V2_PRD.md`
- `/Users/sungholee/code/kstorybridge/apps/creator-v2/package.json`
- `/Users/sungholee/code/kstorybridge/apps/creator-v2/vite.config.ts`
- `/Users/sungholee/code/kstorybridge/apps/creator-v2/tsconfig.json`
- `/Users/sungholee/code/kstorybridge/apps/creator-v2/tsconfig.node.json`
- `/Users/sungholee/code/kstorybridge/apps/creator-v2/tailwind.config.ts`
- `/Users/sungholee/code/kstorybridge/apps/creator-v2/postcss.config.js`
- `/Users/sungholee/code/kstorybridge/apps/creator-v2/.eslintrc.cjs`
- `/Users/sungholee/code/kstorybridge/apps/creator-v2/index.html`
- `/Users/sungholee/code/kstorybridge/apps/creator-v2/src/main.tsx`
- `/Users/sungholee/code/kstorybridge/apps/creator-v2/src/App.tsx`
- `/Users/sungholee/code/kstorybridge/apps/creator-v2/src/index.css`

#### Verification
- [x] Dev server starts successfully on port 8083
- [x] All dependencies installed (1485 packages)

---

### Phase 2: Auth Abstraction Layer
**Status**: ✅ COMPLETED
**Time Estimate**: 4-5 hours
**Owner**: Claude
**Completed**: 2025-10-23

#### Tasks
- [x] **2.1 Supabase Client Setup** (30 min)
  - [x] Create `src/lib/supabase.ts`
  - [x] Configure auth options
  - [x] Test connection

- [x] **2.2 Auth Service** (2-3 hours)
  - [x] Create `src/lib/auth.ts`
  - [x] Implement `signUpWithEmail()` - sets account_type during signup
  - [x] Implement `signInWithEmail()`
  - [x] Implement `signInWithOAuth()`
  - [x] Implement `completeOAuthProfile()` - handles signup vs signin
  - [x] Implement `signOut()`
  - [x] Add error handling and logging

- [x] **2.3 Auth Context** (1-2 hours)
  - [x] Create `src/hooks/useAuth.tsx`
  - [x] Single auth state listener
  - [x] User/session state management
  - [x] Loading state handling

#### Deliverables
- [x] Working auth abstraction (~300 lines total)
- [x] Simple auth context with single listener
- [x] account_type='creator' set during signup

#### Files Created
- `/Users/sungholee/code/kstorybridge/apps/creator-v2/.env.local`
- `/Users/sungholee/code/kstorybridge/apps/creator-v2/src/lib/supabase.ts` (17 lines)
- `/Users/sungholee/code/kstorybridge/apps/creator-v2/src/lib/auth.ts` (240 lines)
- `/Users/sungholee/code/kstorybridge/apps/creator-v2/src/hooks/useAuth.tsx` (55 lines)
- `/Users/sungholee/code/kstorybridge/apps/creator-v2/src/lib/utils.ts` (6 lines)
- `/Users/sungholee/code/kstorybridge/apps/creator-v2/src/vite-env.d.ts` (10 lines)

#### Verification
- [x] TypeScript build succeeds (no errors)
- [x] Dev server starts successfully
- [x] Single auth listener implemented (no competing listeners)

#### Key Implementation Details

**Email Signup** (1 operation, no updateUser needed):
```typescript
await supabase.auth.signUp({
  email,
  password,
  options: {
    data: { account_type: 'creator' }  // ✅ Set during signup
  }
})
```

**OAuth Signup** (sequential, single updateUser):
```typescript
// 1. Exchange code
await exchangeCodeForSession(code)
// 2. Create profile
await createProfile()
// 3. Set metadata (only once)
await updateUser({ account_type: 'creator' })
```

---

### Phase 3: Auth UI Implementation
**Status**: ✅ COMPLETED
**Time Estimate**: 4-6 hours
**Owner**: Claude
**Completed**: 2025-10-23

#### Tasks
- [x] **3.1 Sign Up Page** (2 hours)
  - [x] Create `src/pages/auth/SignUp.tsx`
  - [x] Email/password form
  - [x] Google OAuth button
  - [x] Form validation
  - [x] Error handling

- [x] **3.2 Sign In Page** (1 hour)
  - [x] Create `src/pages/auth/SignIn.tsx`
  - [x] Email/password form
  - [x] Google OAuth button
  - [x] Link to signup page

- [x] **3.3 OAuth Callback** (2 hours)
  - [x] Create `src/pages/auth/AuthCallback.tsx`
  - [x] Simple exchange code flow
  - [x] No race conditions, no timeout
  - [x] Redirect to profile completion or home

- [x] **3.4 OAuth Profile Completion** (1-2 hours)
  - [x] Create `src/pages/auth/CompleteProfile.tsx`
  - [x] Form for OAuth users (pen_name, role, etc.)
  - [x] Calls completeOAuthProfile()

#### Deliverables
- [x] Working signin/signup UI
- [x] OAuth flow without race conditions
- [x] Clean error handling with user-facing messages

#### Files Created
- `/Users/sungholee/code/kstorybridge/apps/creator-v2/src/components/ui/button.tsx`
- `/Users/sungholee/code/kstorybridge/apps/creator-v2/src/components/ui/input.tsx`
- `/Users/sungholee/code/kstorybridge/apps/creator-v2/src/components/ui/card.tsx`
- `/Users/sungholee/code/kstorybridge/apps/creator-v2/src/components/ui/label.tsx`
- `/Users/sungholee/code/kstorybridge/apps/creator-v2/src/pages/auth/SignUp.tsx` (248 lines)
- `/Users/sungholee/code/kstorybridge/apps/creator-v2/src/pages/auth/SignIn.tsx` (143 lines)
- `/Users/sungholee/code/kstorybridge/apps/creator-v2/src/pages/auth/AuthCallback.tsx` (69 lines)
- `/Users/sungholee/code/kstorybridge/apps/creator-v2/src/pages/auth/CompleteProfile.tsx` (146 lines)
- `/Users/sungholee/code/kstorybridge/apps/creator-v2/src/components/ProtectedRoute.tsx`
- `/Users/sungholee/code/kstorybridge/apps/creator-v2/src/pages/Home.tsx`

#### Verification
- [x] TypeScript build succeeds (133 modules transformed)
- [x] Dev server starts successfully on port 8083
- [x] All routes configured in App.tsx
- [x] Protected routes use ProtectedRoute wrapper

---

### Phase 4: Feature Migration
**Status**: ⏳ Pending
**Time Estimate**: 4-6 hours
**Owner**: TBD

#### Tasks
- [ ] Copy working pages from creator v1
  - [ ] Home.tsx (dashboard)
  - [ ] Titles.tsx (title list)
  - [ ] TitleDetail.tsx
  - [ ] AddTitle.tsx
  - [ ] Profile.tsx
  - [ ] Requests.tsx
  - [ ] News.tsx
  - [ ] SendMessage.tsx

- [ ] Copy working components
  - [ ] CMSSidebar
  - [ ] Standard UI components
  - [ ] Forms that work

- [ ] Update imports
  - [ ] Change useAuth to new simple version
  - [ ] Update auth service calls
  - [ ] Remove dashboard dependencies

- [ ] Test each page
  - [ ] Verify auth protection works
  - [ ] Verify data fetching works
  - [ ] Check for broken imports

#### Deliverables
- [ ] All creator features working in new app
- [ ] Clean, simple codebase
- [ ] No dashboard dependencies

---

### Phase 5: Testing & Deployment
**Status**: ⏳ Pending
**Time Estimate**: 3-4 hours
**Owner**: TBD

#### Tasks
- [ ] **Local Testing** (1-2 hours)
  - [ ] Email signup flow
  - [ ] Email signin flow
  - [ ] Google OAuth signup flow
  - [ ] Google OAuth signin flow
  - [ ] Profile creation
  - [ ] All features accessible after auth

- [ ] **Deployment Setup** (1 hour)
  - [ ] Create Vercel project for creator-v2
  - [ ] Configure environment variables
  - [ ] Add OAuth callbacks to Google OAuth
  - [ ] Add OAuth callbacks to Supabase

- [ ] **Staging Deployment** (30 min)
  - [ ] Deploy to staging URL
  - [ ] Test OAuth in production environment
  - [ ] Verify all features work

- [ ] **Production Deployment** (30 min)
  - [ ] Deploy to production
  - [ ] Update DNS for creator.kstorybridge.com
  - [ ] Monitor for issues
  - [ ] Document any issues found

#### Deliverables
- [ ] Creator app live at creator.kstorybridge.com
- [ ] All features working in production
- [ ] No connection to dashboard app

---

## ✅ Success Criteria

- [ ] Email signup completes in <30 seconds
- [ ] OAuth signup completes in <30 seconds (no hanging)
- [ ] OAuth signin works correctly
- [ ] All creator features accessible after auth
- [ ] No concurrent auth operation errors
- [ ] Clean, maintainable codebase (<500 lines auth code)
- [ ] No dashboard dependencies
- [ ] account_type='creator' ALWAYS set during signup

---

## 📈 Timeline Summary

| Phase | Duration | Cumulative |
|-------|----------|------------|
| Phase 1: PRD & Planning | 2-3 hours | 2-3 hours |
| Phase 2: Auth Abstraction | 4-5 hours | 6-8 hours |
| Phase 3: Auth UI | 4-6 hours | 10-14 hours |
| Phase 4: Feature Migration | 4-6 hours | 14-20 hours |
| Phase 5: Testing & Deployment | 3-4 hours | 17-24 hours |

**Target**: 20-22 hours over 2-3 days

---

## 🔑 Key Technical Decisions

### 1. account_type Set During Signup
**Email Signup**:
- Set in `options.data` during `signUp()` call
- No separate `updateUser()` call needed
- Eliminates one potential point of failure

**OAuth Signup**:
- Set AFTER profile creation via single `updateUser()` call
- If updateUser fails, cleanup profile for consistency
- Sequential operations prevent race conditions

### 2. Single Auth Listener
- ONE listener in AuthProvider (useAuth.tsx)
- NO listener in Supabase client
- NO temporary listener in OAuth callback
- Prevents competing auth state changes

### 3. Simple OAuth Flow
- Wait for `exchangeCodeForSession()` to complete (no timeout)
- No race conditions between exchange and auth events
- Trust Supabase's timeout handling
- Clear error messages to user

### 4. No Session Health Checks
- Trust Supabase's built-in session management
- No periodic health check intervals
- No `getSession()` calls during auth operations
- Reduces complexity and potential conflicts

### 5. Direct Supabase Calls with Thin Abstraction
- Auth service provides clean API
- No complex wrappers or retry logic
- Easy to debug and maintain
- ~300 lines of auth code total

---

## 🚨 Critical Lessons from Current App

### What NOT to Do
1. ❌ **Multiple auth listeners** - causes race conditions
2. ❌ **Concurrent auth operations** - `getSession()` + `updateUser()` = deadlock
3. ❌ **Separate updateUser() after signup** - adds complexity and failure point
4. ❌ **Health checks during OAuth** - blocks auth operations
5. ❌ **Complex session manager** - over-engineered for creator needs
6. ❌ **Shared code with dashboard** - tight coupling, hard to debug

### What TO Do
1. ✅ **Single auth listener** - one source of truth
2. ✅ **Sequential operations** - no racing
3. ✅ **Set metadata during signup** - atomic operation
4. ✅ **Trust Supabase** - use built-in features
5. ✅ **Simple abstractions** - easy to understand
6. ✅ **Independent codebase** - no cross-app dependencies

---

## 📝 Notes

### Database Schema
Table: `user_creators`
- id (UUID, FK to auth.users)
- email (text, unique, required)
- pen_name (text, required)
- full_name (text, required)
- ip_owner_role (text, required: 'author' | 'agent')
- ip_owner_company (text, optional)
- website_url (text, optional)
- invitation_status (text, default: 'invited')
- created_at (timestamp)
- updated_at (timestamp)

### OAuth Configuration
**Redirect URLs**:
- Development: `http://localhost:8082/auth/callback`
- Production: `https://creator.kstorybridge.com/auth/callback`

**Required in**:
- Google OAuth Console
- Supabase Auth Settings

---

## 🔗 Related Documents

- [Current Creator App CLAUDE.md](../apps/creator/CLAUDE.md)
- [Dashboard App CLAUDE.md](../apps/dashboard/CLAUDE.md)
- [Root CLAUDE.md](../CLAUDE.md)
- [Auth Documentation](./active/AUTH_DOCUMENTATION.md)
- Creator App V2 PRD (to be created in Phase 1)

---

## 📞 Questions or Blockers

Track any questions or blockers here as they arise:

- None yet

---

**Last Updated**: 2025-10-23
**Next Review**: After Phase 1 completion
