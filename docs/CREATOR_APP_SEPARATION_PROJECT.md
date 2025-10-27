# Creator App Separation Project

**Project Start Date**: 2025-10-21
**Status**: 🔄 In Progress (Phase 1 Complete)
**Last Updated**: 2025-10-21

---

## 📋 Project Overview

### Objective
Separate the creator dashboard from the monolithic dashboard app into a dedicated application at `creator.kstorybridge.com` with clean URLs (no `/creators` prefix).

### Rationale
- **No existing creator users** - Perfect timing for migration (zero migration risk)
- **Brand differentiation** - Dedicated domain communicates creator-first focus
- **Independent evolution** - Separate feature roadmaps and release cycles
- **Optimized performance** - Smaller bundle size, faster load times
- **Clean URLs** - `/home`, `/titles` instead of `/creators/home`, `/creators/titles`

### Architecture Decision
- **Directory**: `apps/creator/` (not `apps/creator-dashboard/`)
- **Port**: 8082 (dashboard: 8081, website: 5173)
- **Domain**: `creator.kstorybridge.com` (production)
- **Shared code**: Extract to `packages/shared-components/` and `packages/auth/`

---

## 🎯 Implementation Plan

### Phase 1: App Scaffolding ✅ COMPLETE
**Timeline**: Day 1
**Status**: ✅ Complete

- [x] Create `apps/creator/` from dashboard template
- [x] Update `package.json` (name: `@kstorybridge/creator`)
- [x] Update `vite.config.ts` (port: 8082)
- [x] Add root-level scripts (`dev:creator`, `build:creator`, `lint:all`, `build:all`)
- [x] Remove buyer-specific pages (BuyerHome, Chat, Favorites, Deals, Browse, etc.)
- [x] Remove `BuyerProtectedLayout.tsx`
- [x] Create new `App.tsx` with creator-only routes (no `/creators` prefix)
- [x] Simplify `CMSSidebar.tsx` for creator-only navigation

**Files Modified**:
- `/apps/creator/package.json` - Changed name to `@kstorybridge/creator`
- `/apps/creator/vite.config.ts` - Changed port to 8082
- `/apps/creator/src/App.tsx` - New creator-only routing (147 lines)
- `/apps/creator/src/components/layout/CMSSidebar.tsx` - Simplified sidebar (164 lines)
- `/package.json` - Added `dev:creator`, `build:creator` scripts

**Files Deleted**:
- `src/pages/BuyerHome.tsx`
- `src/pages/BuyerDashboardNew.tsx`
- `src/pages/BuyersPricing.tsx`
- `src/pages/BuyerSignupPage.tsx`
- `src/pages/BuyerSigninPage.tsx`
- `src/pages/Chat.tsx`
- `src/pages/ChatTest.tsx`
- `src/pages/ChatHistory.tsx`
- `src/pages/Favorites.tsx`
- `src/pages/Deals.tsx`
- `src/pages/Browse.tsx`
- `src/components/BuyerProtectedLayout.tsx`

---

### Phase 2: Shared Code Extraction ⏳ PENDING
**Timeline**: Day 2
**Status**: ⏳ Not Started

#### 2.1 Create Shared Components Package
- [ ] Create `packages/shared-components/` directory structure
- [ ] Extract `Profile.tsx` → `packages/shared-components/Profile.tsx`
- [ ] Extract `News.tsx` → `packages/shared-components/News.tsx`
- [ ] Extract `TitleDetailNew.tsx` → `packages/shared-components/TitleDetail.tsx`
- [ ] Extract `SendMessage.tsx` → `packages/shared-components/SendMessage.tsx`
- [ ] Create package.json for shared-components
- [ ] Update imports in both dashboard and creator apps

**Rationale**: These components are used by both buyers and creators. Extracting prevents code duplication.

#### 2.2 Enhance Shared Auth Package
- [ ] Extract `useAccountType.tsx` to `packages/auth/useAccountType.ts`
- [ ] Extract `useProfile.tsx` to `packages/auth/useProfile.ts`
- [ ] Add cross-domain redirect logic (buyers → dashboard, creators → creator app)
- [ ] Update imports in both apps

**Critical**: Auth logic must handle cross-domain redirects for production deployment.

---

### Phase 3: Cross-Domain Redirect Logic ⚠️ CRITICAL
**Timeline**: Day 2-3
**Status**: ⏳ Not Started

#### 3.1 Update `AccountTypeProtectedRoute.tsx` (Creator App)
- [ ] Detect if user is buyer (account_type === 'buyer')
- [ ] Redirect to `https://dashboard.kstorybridge.com/buyers/chat` (production)
- [ ] Redirect to `http://localhost:8081/buyers/chat` (development)
- [ ] Add environment variable: `VITE_DASHBOARD_URL`

#### 3.2 Update `AccountTypeProtectedRoute.tsx` (Dashboard App)
- [ ] Detect if user is creator (account_type === 'creator')
- [ ] Redirect to `https://creator.kstorybridge.com/home` (production)
- [ ] Redirect to `http://localhost:8082/home` (development)
- [ ] Add environment variable: `VITE_CREATOR_URL`

#### 3.3 Environment Variables
**Dashboard App** (`.env.local`):
```bash
VITE_CREATOR_URL=http://localhost:8082  # Development
VITE_CREATOR_URL=https://creator.kstorybridge.com  # Production (Vercel)
```

**Creator App** (`.env.local`):
```bash
VITE_DASHBOARD_URL=http://localhost:8081  # Development
VITE_DASHBOARD_URL=https://dashboard.kstorybridge.com  # Production (Vercel)
```

---

### Phase 4: Dashboard App Cleanup ⏳ PENDING
**Timeline**: Day 3
**Status**: ⏳ Not Started

#### 4.1 Remove Creator Code
- [ ] Delete creator routes from `src/App.tsx` (lines 201-234)
- [ ] Delete `CreatorProtectedLayout.tsx`
- [ ] Remove creator pages:
  - `CreatorHome.tsx`
  - `CreatorAddTitlePage.tsx`
  - `CreatorEditTitlePage.tsx`
  - `CreatorTitleDetailNew.tsx`
  - `CreatorSignupPage.tsx`
  - `CreatorSigninPage.tsx`
  - `CreatorDashboard.tsx`
  - `CreatorTitleDetailPage.tsx`

#### 4.2 Update Sidebar
- [ ] Remove creator menu items from `CMSSidebar.tsx`
- [ ] Simplify to buyer-only navigation
- [ ] Remove account type switching logic

#### 4.3 Update Signup Routes
- [ ] Keep `/signup/buyer` route (buyers sign up in dashboard)
- [ ] Remove `/signup/creator` route (creators sign up in creator app)
- [ ] Update universal `/signup` to redirect based on context

---

### Phase 5: Website App Updates ⏳ PENDING
**Timeline**: Day 3
**Status**: ⏳ Not Started

#### 5.1 Update Marketing Links
**File**: `apps/website/src/pages/Creators.tsx`
- [ ] Change "Sign Up" CTA → `https://creator.kstorybridge.com/signup`
- [ ] Change "Sign In" link → `https://creator.kstorybridge.com/signin`
- [ ] Update navigation links

**File**: `apps/website/src/components/Header.tsx` (if applicable)
- [ ] Update creator signup link
- [ ] Add environment variable support for creator domain

#### 5.2 Environment Variables
**Website App** (`.env.local`):
```bash
VITE_CREATOR_URL=http://localhost:8082  # Development
VITE_CREATOR_URL=https://creator.kstorybridge.com  # Production
```

---

### Phase 6: Infrastructure Setup ⚠️ CRITICAL
**Timeline**: Day 3-4
**Status**: ⏳ Not Started

#### 6.1 Vercel Project Setup
1. **Create new Vercel project**: `kstorybridge-creator`
2. **Configuration**:
   - Root Directory: `apps/creator`
   - Build Command: `npm run build`
   - Output Directory: `dist`
   - Install Command: `npm install`
3. **Domain**: `creator.kstorybridge.com`
4. **Git Integration**: Deploy from `v2` branch (staging), `main` branch (production)

#### 6.2 Environment Variables (Vercel)
Copy from dashboard project + add creator-specific:
```bash
VITE_SUPABASE_URL=https://dlrnrgcoguxlkkcitlpd.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
VITE_DASHBOARD_URL=https://dashboard.kstorybridge.com
VITE_OPENAI_API_KEY=sk-...  # If creators need chatbot access
```

#### 6.3 DNS Configuration
1. **Add DNS record** (via domain registrar):
   - Type: CNAME
   - Name: `creator`
   - Value: `cname.vercel-dns.com`
   - TTL: 3600
2. **Verify in Vercel**: Domains → Add `creator.kstorybridge.com`
3. **SSL**: Auto-provisioned by Vercel

#### 6.4 Supabase Configuration
**Location**: Supabase Dashboard → Authentication → URL Configuration

1. **Add to Site URL allowlist**:
   - `https://creator.kstorybridge.com`
   - `http://localhost:8082` (for development)

2. **Add to Redirect URLs allowlist**:
   - `https://creator.kstorybridge.com/auth/callback`
   - `http://localhost:8082/auth/callback`

3. **Update CORS origins**:
   - Add `https://creator.kstorybridge.com`
   - Add `http://localhost:8082`

---

### Phase 7: OAuth Provider Configuration ⚠️ CRITICAL
**Timeline**: Day 4
**Status**: ⏳ Not Started

#### 7.1 Google OAuth
**Location**: Google Cloud Console → APIs & Services → Credentials

1. Select your OAuth 2.0 Client ID
2. **Add Authorized redirect URIs**:
   - `https://creator.kstorybridge.com/auth/callback`
   - `http://localhost:8082/auth/callback`
3. **Keep existing URIs** (don't remove dashboard URLs):
   - `https://dashboard.kstorybridge.com/auth/callback`
   - `http://localhost:8081/auth/callback`
4. Save changes

#### 7.2 LinkedIn OAuth (if used)
**Location**: LinkedIn Developer Portal → App → Auth

1. **Add redirect URLs**:
   - `https://creator.kstorybridge.com/auth/callback`
   - `http://localhost:8082/auth/callback`
2. **Keep existing URLs**
3. Save

#### 7.3 Other OAuth Providers
Repeat for:
- [ ] Facebook (if used)
- [ ] Apple (if used)
- [ ] GitHub (if used)

**⚠️ Critical Note**: All OAuth providers require pre-registration of callback URLs. Missing this step will cause OAuth failures in production.

---

### Phase 8: Unit Tests 🧪 PENDING
**Timeline**: Day 4
**Status**: ⏳ Not Started

#### 8.1 Shared Auth Utilities Tests
**File**: `packages/auth/__tests__/useAccountType.test.ts`

Test cases:
- [ ] Returns 'buyer' for user with account_type: 'buyer'
- [ ] Returns 'creator' for user with account_type: 'creator'
- [ ] Returns null for user without account_type
- [ ] Uses metadata as primary source
- [ ] Falls back to database query if metadata missing
- [ ] Handles loading states correctly

#### 8.2 Account Type Routing Tests
**File**: `apps/creator/src/components/__tests__/AccountTypeProtectedRoute.test.tsx`

Test cases:
- [ ] Allows creators to access creator routes
- [ ] Redirects buyers to dashboard.kstorybridge.com
- [ ] Shows loading state while checking account type
- [ ] Handles unauthenticated users
- [ ] Uses correct redirect URL based on environment

**File**: `apps/dashboard/src/components/__tests__/AccountTypeProtectedRoute.test.tsx`

Test cases:
- [ ] Allows buyers to access buyer routes
- [ ] Redirects creators to creator.kstorybridge.com
- [ ] Shows loading state while checking account type
- [ ] Handles unauthenticated users

---

### Phase 9: Code Review 👀 PENDING
**Timeline**: Day 5
**Status**: ⏳ Not Started

#### 9.1 Creator App Review
**Verification Checklist**:
- [ ] No buyer-specific pages exist (`grep -r "Buyer" apps/creator/src/pages`)
- [ ] No buyer routes in App.tsx
- [ ] No BuyerProtectedLayout component
- [ ] Sidebar only shows creator menu items
- [ ] All routes use clean URLs (no `/creators` prefix)
- [ ] Cross-domain redirect logic implemented
- [ ] Environment variables configured

**Review Command**:
```bash
cd /Users/sungholee/code/kstorybridge/apps/creator
grep -r "buyer" src/ --ignore-case | grep -v "node_modules"
```

#### 9.2 Dashboard App Review
**Verification Checklist**:
- [ ] No creator-specific pages exist (`grep -r "Creator" apps/dashboard/src/pages`)
- [ ] No creator routes in App.tsx
- [ ] No CreatorProtectedLayout component
- [ ] Sidebar only shows buyer menu items
- [ ] Cross-domain redirect logic implemented
- [ ] Environment variables configured

**Review Command**:
```bash
cd /Users/sungholee/code/kstorybridge/apps/dashboard
grep -r "creator" src/ --ignore-case | grep -v "node_modules" | grep -v "account_type"
```

---

### Phase 10: Local Testing 🧪 CRITICAL
**Timeline**: Day 5
**Status**: ⏳ Not Started

#### 10.1 Run All Apps Simultaneously
```bash
# Terminal 1: Website
npm run dev:website  # localhost:5173

# Terminal 2: Dashboard
npm run dev:dashboard  # localhost:8081

# Terminal 3: Creator
npm run dev:creator  # localhost:8082
```

#### 10.2 Creator Signup Flow Test
**Steps**:
1. Navigate to `http://localhost:5173` (website)
2. Click "For Creators" → "Sign Up"
3. Verify redirect to `http://localhost:8082/signup`
4. Complete signup with test account:
   - Email: `test-creator@example.com`
   - Account type: `creator`
5. Verify redirect to `http://localhost:8082/home`
6. Verify sidebar shows creator menu items
7. Test navigation: Home, My Titles, News, Profile

**Expected Results**:
- ✅ Clean URLs (`/home`, `/titles`, not `/creators/home`)
- ✅ Creator sidebar navigation
- ✅ No buyer menu items visible
- ✅ OAuth works on localhost:8082

#### 10.3 Buyer Signup Flow Test
**Steps**:
1. Navigate to `http://localhost:5173` (website)
2. Click "For Buyers" → "Sign Up"
3. Verify redirect to `http://localhost:8081/signup/buyer`
4. Complete signup with test account:
   - Email: `test-buyer@example.com`
   - Account type: `buyer`
5. Verify redirect to `http://localhost:8081/buyers/chat`
6. Verify sidebar shows buyer menu items
7. Test navigation: Chat, Featured, Title Library

**Expected Results**:
- ✅ Buyer dashboard URLs (`/buyers/*`)
- ✅ Buyer sidebar navigation
- ✅ No creator menu items visible

#### 10.4 Cross-Domain Redirect Test
**Test A: Buyer tries to access creator app**
1. Sign in as buyer on `http://localhost:8081`
2. Manually navigate to `http://localhost:8082/home`
3. **Expected**: Immediate redirect to `http://localhost:8081/buyers/chat`

**Test B: Creator tries to access dashboard app**
1. Sign in as creator on `http://localhost:8082`
2. Manually navigate to `http://localhost:8081/buyers/chat`
3. **Expected**: Immediate redirect to `http://localhost:8082/home`

#### 10.5 Shared Components Test
**Test**: Profile page works identically in both apps
1. Update profile on creator app (`/profile`)
2. Verify changes saved to database
3. Sign in as buyer, view profile
4. Verify same data displayed
5. Test: News page, SendMessage page

---

### Phase 11: Documentation Updates 📝 PENDING
**Timeline**: Day 5
**Status**: ⏳ Not Started

#### 11.1 Root CLAUDE.md Updates
**File**: `/CLAUDE.md`

Updates needed:
- [ ] Update architecture section (3 apps: website, dashboard, creator)
- [ ] Update development commands:
  ```bash
  npm run dev:dashboard     # http://localhost:8081
  npm run dev:website       # http://localhost:5173
  npm run dev:creator       # http://localhost:8082
  ```
- [ ] Update authentication flow (separate domains)
- [ ] Update deployment strategy (3 Vercel projects)
- [ ] Add cross-domain redirect documentation

#### 11.2 Creator App CLAUDE.md
**File**: `apps/creator/CLAUDE.md` (NEW)

Create comprehensive documentation:
```markdown
# CLAUDE.md - Creator App

**App Scope**: Creator dashboard for IP owners, authors, and agents

**Last Updated**: 2025-10-21

## Development Commands
- `npm run dev` - Start on port 8082
- `npm run build` - Production build

## Architecture
- React 18 + TypeScript + Vite
- Supabase auth (shared with dashboard)
- Clean URLs (no /creators prefix)

## Key Routes
- `/home` - Creator home dashboard
- `/titles` - My titles
- `/titles/add` - Add new title
- `/profile` - Profile management
- `/news` - K-content news

## Authentication
- Signup: `/signup` or `/signup/creator`
- Signin: `/signin` or `/signin/creator`
- OAuth callback: `/auth/callback`

## Cross-Domain Behavior
- Buyers redirected to dashboard.kstorybridge.com
- Creators stay on creator.kstorybridge.com
```

#### 11.3 Dashboard App CLAUDE.md Updates
**File**: `apps/dashboard/CLAUDE.md`

Updates needed:
- [ ] Remove creator-specific documentation
- [ ] Update to "buyer-only" scope
- [ ] Add cross-domain redirect documentation
- [ ] Update architecture section

---

### Phase 12: Deployment Guide 🚀 PENDING
**Timeline**: Day 5
**Status**: ⏳ Not Started

#### 12.1 Create Deployment Checklist
**File**: `docs/guides/CREATOR_APP_DEPLOYMENT.md` (NEW)

**Content**:
```markdown
# Creator App Deployment Guide

## Pre-Deployment Checklist

### 1. Code Preparation
- [ ] All tests passing (`npm run test:all`)
- [ ] Linting clean (`npm run lint:all`)
- [ ] Build successful (`npm run build:creator`)

### 2. Vercel Setup
- [ ] Create project: `kstorybridge-creator`
- [ ] Configure root directory: `apps/creator`
- [ ] Set environment variables (see below)
- [ ] Add domain: `creator.kstorybridge.com`

### 3. DNS Configuration
- [ ] Add CNAME record: `creator` → `cname.vercel-dns.com`
- [ ] Verify propagation (15-60 minutes)

### 4. Supabase Configuration
- [ ] Add `creator.kstorybridge.com` to allowed origins
- [ ] Add `/auth/callback` to redirect URLs
- [ ] Test auth flow on staging

### 5. OAuth Providers
- [ ] Google OAuth: Add callback URL
- [ ] LinkedIn OAuth: Add callback URL
- [ ] Test OAuth on staging

### 6. Testing on Staging
- [ ] Deploy to `creator-staging.kstorybridge.com`
- [ ] Test creator signup flow
- [ ] Test cross-domain redirects
- [ ] Test OAuth providers
- [ ] Performance check (Lighthouse score >90)

### 7. Production Deployment
- [ ] Merge to `main` branch
- [ ] Monitor deployment logs
- [ ] Smoke test all critical flows
- [ ] Monitor error tracking (Sentry/LogRocket)

## Environment Variables (Vercel)

```bash
VITE_SUPABASE_URL=https://dlrnrgcoguxlkkcitlpd.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
VITE_DASHBOARD_URL=https://dashboard.kstorybridge.com
```

## Rollback Plan

If issues arise:
1. Revert Vercel deployment (one-click in dashboard)
2. Remove DNS CNAME record (traffic stops)
3. Investigate logs
4. Fix and redeploy

## Monitoring

Post-deployment:
- [ ] Check Vercel analytics (traffic, errors)
- [ ] Monitor Supabase logs (auth errors)
- [ ] Check OAuth success rates
- [ ] User feedback collection
```

---

## 📊 Progress Tracking

### Completed (Phase 1)
| Task | Status | Date | Notes |
|------|--------|------|-------|
| Create apps/creator structure | ✅ | 2025-10-21 | Copied from dashboard |
| Configure package.json | ✅ | 2025-10-21 | Name: @kstorybridge/creator |
| Configure vite.config.ts | ✅ | 2025-10-21 | Port: 8082 |
| Add root-level scripts | ✅ | 2025-10-21 | dev:creator, build:creator |
| Remove buyer pages | ✅ | 2025-10-21 | 11 files deleted |
| Remove BuyerProtectedLayout | ✅ | 2025-10-21 | Component deleted |
| Create new App.tsx | ✅ | 2025-10-21 | Clean URLs, creator-only |
| Simplify CMSSidebar | ✅ | 2025-10-21 | Creator menu only |

### Pending (Phases 2-12)
| Phase | Task Count | Priority | Blocking? |
|-------|-----------|----------|-----------|
| Phase 2: Shared Code | 8 tasks | Medium | No |
| Phase 3: Cross-Domain Redirects | 6 tasks | **CRITICAL** | Yes |
| Phase 4: Dashboard Cleanup | 7 tasks | High | No |
| Phase 5: Website Updates | 4 tasks | Medium | No |
| Phase 6: Infrastructure | 12 tasks | **CRITICAL** | Yes |
| Phase 7: OAuth Config | 6 tasks | **CRITICAL** | Yes |
| Phase 8: Unit Tests | 8 tasks | High | No |
| Phase 9: Code Review | 6 tasks | High | No |
| Phase 10: Local Testing | 15 tasks | **CRITICAL** | Yes |
| Phase 11: Documentation | 10 tasks | Medium | No |
| Phase 12: Deployment Guide | 7 tasks | Medium | No |

**Total Remaining**: 89 tasks across 11 phases

---

## 🚨 Critical Blockers

### 1. Cross-Domain Redirect Logic (Phase 3)
**Impact**: Without this, buyers can access creator app and vice versa
**Priority**: CRITICAL
**Estimated Effort**: 2-3 hours
**Dependencies**: None

### 2. Infrastructure Setup (Phase 6)
**Impact**: Cannot deploy to production without Vercel project
**Priority**: CRITICAL
**Estimated Effort**: 2-4 hours
**Dependencies**: Code complete (Phases 2-5)

### 3. OAuth Configuration (Phase 7)
**Impact**: OAuth signin will fail in production
**Priority**: CRITICAL
**Estimated Effort**: 1-2 hours
**Dependencies**: Infrastructure setup (Phase 6)

### 4. Local Testing (Phase 10)
**Impact**: Cannot verify functionality before deployment
**Priority**: CRITICAL
**Estimated Effort**: 3-4 hours
**Dependencies**: Phases 2-9 complete

---

## 📈 Estimated Timeline

### Conservative Estimate (Full-time work)
- **Phase 1**: ✅ Complete (4 hours)
- **Phases 2-5**: 1.5 days (shared code + redirects + cleanup)
- **Phases 6-7**: 0.5 days (infrastructure + OAuth)
- **Phases 8-9**: 1 day (tests + review)
- **Phase 10**: 0.5 days (local testing)
- **Phases 11-12**: 0.5 days (documentation)

**Total**: 4-5 developer days remaining (Phase 1 already complete)

### Aggressive Estimate (Focused work)
- **Phases 2-5**: 1 day
- **Phases 6-7**: 0.5 day
- **Phases 8-10**: 1 day
- **Phases 11-12**: 0.25 day

**Total**: 2.75-3 developer days remaining

---

## 🎯 Next Steps (Immediate)

### Option A: Continue Full Migration
1. Complete Phase 2 (Shared Code Extraction)
2. Complete Phase 3 (Cross-Domain Redirects) ← CRITICAL
3. Complete Phase 4 (Dashboard Cleanup)
4. Complete Phase 5 (Website Updates)
5. Test locally (Phase 10)

### Option B: Pause and Test Current State
1. Run `npm run dev:creator` to verify app starts
2. Test creator routes manually
3. Identify any blocking issues
4. Resume with Phase 2

### Option C: Focus on Critical Path Only
1. Phase 3: Cross-Domain Redirects (CRITICAL)
2. Phase 6: Infrastructure Setup (CRITICAL)
3. Phase 7: OAuth Config (CRITICAL)
4. Phase 10: Local Testing (CRITICAL)
5. Deploy to staging, iterate on remaining phases

---

## 📝 Notes & Decisions

### Key Decisions Made
1. **Directory name**: `apps/creator/` (not `apps/creator-dashboard/`)
2. **Port**: 8082 (dashboard: 8081, website: 5173)
3. **URL structure**: Clean URLs without `/creators` prefix
4. **Shared code strategy**: Extract to `packages/` for reusability
5. **OAuth strategy**: Add new callback URLs, keep existing ones

### Assumptions
- Supabase project remains shared (same `dlrnrgcoguxlkkcitlpd`)
- Database schema unchanged (no new tables needed)
- Zero existing creator users (confirmed by user)
- v2 branch for staging, main branch for production

### Risks & Mitigations
| Risk | Impact | Mitigation |
|------|--------|------------|
| OAuth callback misconfiguration | High | Pre-configure all providers before deployment |
| Cross-domain redirect loops | High | Thorough local testing + environment variable validation |
| Shared component version drift | Medium | Use packages/ with proper versioning |
| DNS propagation delays | Low | Deploy during low-traffic window, 301 redirects |
| Bundle size increase | Low | Code splitting already configured |

---

## 🔗 Related Documentation

- [Root CLAUDE.md](../../CLAUDE.md) - Monorepo documentation
- [Dashboard CLAUDE.md](../../apps/dashboard/CLAUDE.md) - Dashboard app docs
- [Auth Documentation](../../docs/active/AUTH_DOCUMENTATION.md) - Auth system reference
- [Deployment Strategy](../../docs/guides/DEPLOYMENT_STRATEGY.md) - Deployment architecture

---

## 📞 Questions & Support

### Open Questions
- [ ] Should creators have access to chatbot? (currently included in routes)
- [ ] Admin users: Which dashboard should they see by default?
- [ ] Staging environment: Deploy creator-staging.kstorybridge.com?
- [ ] Analytics: Separate Google Analytics property for creator app?

### Support Contacts
- **Technical Lead**: [Your name/email]
- **DevOps**: [Vercel admin]
- **Product**: [Product owner]

---

**End of Documentation**

_Last updated: 2025-10-21 by Claude Code_
