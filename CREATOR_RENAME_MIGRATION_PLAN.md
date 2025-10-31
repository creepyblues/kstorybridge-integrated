# Creator-v2 → Creator Rename Migration Plan

**Status**: 🟡 IN PROGRESS (Phase 1 Complete)
**Created**: 2025-10-29
**Estimated Time**: ~90 minutes + DNS propagation

---

## Migration Overview

Complete rename of creator-v2 to creator across:
- Git repository: `apps/creator` → `apps/creator`
- Vercel staging project: `creator-staging` → `creator-staging`
- Staging domain: `creator-staging.kstorybridge.com` → `creator-staging.kstorybridge.com`
- Package name: `@kstorybridge/creator` → `@kstorybridge/creator`
- All documentation (45+ files)

---

## Pre-Migration Checklist

- [ ] **Verify clean working directory**: `git status` shows no uncommitted changes
- [ ] **Create backup branch**: `git checkout -b backup-before-creator-rename`
- [ ] **Verify staging site working**: Visit https://creator-staging.kstorybridge.com
- [ ] **Test current OAuth**: Sign in with Google on staging
- [ ] **Document current Vercel URLs**: Note deployment URLs for rollback
- [ ] **Notify team**: If applicable, alert team about upcoming changes

---

## Phase 1: Prepare OAuth Redirect URLs (CRITICAL - Do First!)

**⚠️ MUST complete BEFORE any code changes to prevent auth breakage**

### 1.1 Supabase Configuration
- [x] Go to: https://app.supabase.com/project/dlrnrgcoguxlkkcitlpd/auth/url-configuration
- [x] Add NEW redirect URL: `https://creator-staging.kstorybridge.com/auth/callback`
- [x] **Keep existing**: `https://creator-staging.kstorybridge.com/auth/callback` (for rollback)
- [x] Save changes

### 1.2 Google OAuth Console
- [x] Go to: Google Cloud Console → APIs & Services → Credentials
- [x] Select OAuth 2.0 Client ID for KStoryBridge
- [x] Add NEW Authorized redirect URI: `https://creator-staging.kstorybridge.com/auth/callback`
- [x] **Keep existing**: `https://creator-staging.kstorybridge.com/auth/callback` (for rollback)
- [x] Save changes

**Status**: ✅ COMPLETE (2025-10-29)

---

## Phase 2: Git Repository Changes

**Work on `v2` branch**

### 2.1 Rename Directory (Preserves Git History)
```bash
git checkout v2
git mv apps/creator apps/creator
```

- [ ] Execute `git mv` command
- [ ] Verify: `ls apps/` shows `creator` directory
- [ ] Verify: `git status` shows rename detected

### 2.2 Update Package Configurations (4 files)

**File 1: `apps/creator/package.json`**
- [ ] Change `"name": "@kstorybridge/creator"` → `"name": "@kstorybridge/creator"`

**File 2: Root `package.json`**
- [ ] Line 14: Update `"dev:creator"` script path
- [ ] Line 15: Update `"dev:creator-v2"` script path (or remove if keeping only dev:creator)
- [ ] Line 19: Update `"build:creator"` script path
- [ ] Line 20: Update `"build:creator-v2"` script path (or remove)
- [ ] Line 22: Update `"build:all"` script references
- [ ] Line 23: Update `"lint:all"` script path

**File 3: `.claude/settings.local.json`**
- [ ] Line 24: Update WebFetch permission domain reference
- [ ] Line 28: Update WebFetch permission domain reference

**File 4: `package-lock.json`**
- [ ] Will auto-update when running `npm install` (no manual edit needed)

### 2.3 Update Source Code OAuth URLs (1 CRITICAL file)

**File: `apps/creator/src/lib/auth.ts`**
- [ ] Line 152: Change `'creator-staging.kstorybridge.com'` → `'creator-staging.kstorybridge.com'`
- [ ] Line 156: Change `'https://creator-staging.kstorybridge.com/auth/callback'` → `'https://creator-staging.kstorybridge.com/auth/callback'`

### 2.4 Update Test Configurations (4 files)

**File 1: `tests/helpers/test-config.ts`**
- [ ] Line 19: Update staging creator URL

**File 2: `tests/creator.spec.ts`**
- [ ] Line 399: Update OAuth redirect URL check

**File 3: `tests/SETUP_GUIDE.md`**
- [ ] Line 200: Update staging creator URL reference

**File 4: `tests/README.md`**
- [ ] Line 119: Update creator staging URL reference

### 2.5 Update Documentation (45+ files)

**Root-Level Critical Docs (Priority 1)**
- [ ] `CLAUDE.md` (lines 33, 91, 128, 545)
- [ ] `README.md` (lines 18, 78, 157)
- [ ] `docs/INDEX.md` (lines 87, 91, 94-96)
- [ ] `docs/guides/GIT_DEPLOYMENT_STRUCTURE.md` (8+ references)
- [ ] `docs/guides/DEPLOYMENT_STRATEGY.md` (8+ references)

**App-Specific Docs (Priority 2)**
- [ ] `apps/creator/CLAUDE.md` (entire file - path references)
- [ ] `apps/creator/README.md` (10+ references)
- [ ] `apps/creator/DEPLOYMENT_GUIDE.md` (10+ references)
- [ ] `apps/creator/OAUTH_SETUP.md` (20+ references)

**Test/Historical Docs (Priority 3)**
- [ ] `TEST_RUN_2_NOTES.md`
- [ ] `TEST_RUN_3_RESULTS.md`
- [ ] `TEST_RUN_5_NOTES.md`
- [ ] `FIX_SSL_GUIDE.md`
- [ ] `TEST_RESULTS_INITIAL.md`
- [ ] `V2_TO_MAIN_TEST_PLAN.md`
- [ ] `BACKEND_SERVICES_TESTING_GUIDE.md`
- [ ] `MIGRATION_CONSOLIDATION_DISCOVERY_REPORT.md`
- [ ] `MIGRATION_CONSOLIDATION_COMPLETE.md`
- [ ] `CREATOR_V2_SURVEY_COMPLETE.md`
- [ ] `FIXES_APPLIED_SUMMARY.md`
- [ ] `PHASE2_TESTING_RESULTS.md`
- [ ] `PHASE3_COMPLETE_SUMMARY.md`
- [ ] `PHASE3_UI_COMPONENTS_PROGRESS.md`
- [ ] `PHASES_1-4_COMPLETE_SUMMARY.md`
- [ ] `PRODUCTION_MIGRATION_INSTRUCTIONS.md`
- [ ] `MIGRATION_IMPLEMENTATION_SUMMARY.md`
- [ ] `docs/CREATOR_APP_V2_REBUILD_PLAN.md` (100+ references)
- [ ] `docs/CREATOR_APP_V2_PRD.md`
- [ ] `docs/CREATOR_V2_QUESTIONNAIRE_IMPLEMENTATION_PLAN.md`
- [ ] `docs/MIGRATION_POLICY.md`
- [ ] `docs/TESTING_AUTOMATION_PLAN.md`
- [ ] `docs/DASHBOARD_APP_V2_PRD.md`
- [ ] `apps/creator/PRODUCTION_TEST_REPORT.md`
- [ ] `apps/creator/EMAIL_CONFIRMATION_IMPLEMENTATION_COMPLETE.md`
- [ ] Other dashboard-v2 references (if needed)

### 2.6 Reinstall Dependencies
```bash
npm install
```

- [ ] Run `npm install` from root
- [ ] Verify no errors
- [ ] Check `package-lock.json` updated correctly

### 2.7 Build Verification
```bash
npm run build:creator
```

- [ ] Build succeeds without errors
- [ ] Output directory `apps/creator/dist` created

### 2.8 Commit Changes
```bash
git add .
git commit -m "refactor: rename creator-v2 to creator for consistency

- Rename apps/creator → apps/creator
- Update package name to @kstorybridge/creator
- Update staging domain to creator-staging.kstorybridge.com
- Update OAuth redirect URLs
- Update all documentation references
"
git push origin v2
```

- [ ] Stage all changes
- [ ] Commit with descriptive message
- [ ] Push to v2 branch
- [ ] Wait for Vercel staging deploy to start

**Status**: ⬜ Not Started

---

## Phase 3: Vercel Configuration Updates

### 3.1 Staging Project Configuration

**Project: creator-staging → creator-staging**

- [ ] Go to: https://vercel.com/[your-team]/creator-staging/settings
- [ ] **Update Root Directory**:
  - Settings > General > Root Directory
  - Change: `apps/creator` → `apps/creator`
  - Save
- [ ] **Rename Vercel Project** (optional but recommended):
  - Settings > General > Project Name
  - Change: `creator-staging` → `creator-staging`
  - Save
- [ ] **Trigger Redeploy**:
  - Go to Deployments tab
  - Click "Redeploy" on latest v2 branch deployment
  - Wait for build to complete (~2-3 minutes)
- [ ] **Verify Build Success**: Check deployment logs for errors

### 3.2 Update Staging Custom Domain

- [ ] Go to: Settings > Domains
- [ ] **Add new domain**: `creator-staging.kstorybridge.com`
  - Click "Add"
  - Enter domain
  - Vercel will show DNS instructions
- [ ] **Keep old domain temporarily**: Leave `creator-staging.kstorybridge.com` active (for rollback)

### 3.3 Production Project Configuration

**Project: kstorybridge-creator**

- [ ] Go to: https://vercel.com/[your-team]/kstorybridge-creator/settings
- [ ] **Update Root Directory ONLY**:
  - Settings > General > Root Directory
  - Change: `apps/creator` → `apps/creator`
  - Save
- [ ] **No other changes** (domain already correct: `creator.kstorybridge.com`)
- [ ] **Do NOT redeploy yet** (wait for Phase 6)

**Status**: ⬜ Not Started

---

## Phase 4: DNS Configuration

**Update DNS in your DNS provider (e.g., Namecheap, Cloudflare, etc.)**

- [ ] Log into DNS provider
- [ ] **Add new CNAME record**:
  - Name: `creator-staging`
  - Type: `CNAME`
  - Value: `cname.vercel-dns.com`
  - TTL: `Auto` or `300`
- [ ] **Keep old record active**: `creator-v2` CNAME (for rollback)
- [ ] Save DNS changes
- [ ] Wait for DNS propagation (1-5 minutes typically)
- [ ] **Verify DNS**: `dig creator-staging.kstorybridge.com` shows Vercel IP

**Status**: ⬜ Not Started

---

## Phase 5: Staging Verification

**Test on: https://creator-staging.kstorybridge.com**

### 5.1 Basic Functionality
- [ ] Site loads without errors
- [ ] No console errors in browser DevTools
- [ ] All assets load correctly (no 404s)
- [ ] Navigation works (/home, /titles, /profile, /settings)

### 5.2 Authentication Testing
- [ ] **Email signin works**:
  - [ ] Sign out if currently logged in
  - [ ] Sign in with email/password
  - [ ] Verify redirect to /home after signin
- [ ] **Google OAuth works**:
  - [ ] Sign out
  - [ ] Click "Sign in with Google"
  - [ ] Verify redirect to Google
  - [ ] Verify redirect back to creator-staging domain
  - [ ] Verify no errors in browser console
  - [ ] Verify user lands on /home

### 5.3 Feature Testing
- [ ] **Title List**: Titles load on /titles page
- [ ] **Title Detail**: Click on a title, details page loads
- [ ] **Title Create**: Create new title (if permissions allow)
- [ ] **Profile Page**: /profile loads user data
- [ ] **Settings Page**: /settings loads correctly

### 5.4 Cross-Domain Testing (if applicable)
- [ ] Links to dashboard/website work correctly
- [ ] Session persists across domains (if shared auth)

**If ANY test fails**:
- [ ] Document the issue
- [ ] Execute Rollback Plan (see Phase 8)
- [ ] Do NOT proceed to Phase 6

**Status**: ⬜ Not Started

---

## Phase 6: Production Deployment

**⚠️ Only proceed if Phase 5 testing is 100% successful**

### 6.1 Merge to Main Branch
```bash
git checkout main
git pull origin main    # Sync with remote
git merge v2            # Merge staging-tested code
git push origin main
```

- [ ] Checkout main branch
- [ ] Pull latest changes
- [ ] Merge v2 branch
- [ ] Resolve any conflicts (should be none)
- [ ] Push to main branch

### 6.2 Monitor Production Deployment
- [ ] Watch Vercel deployment: https://vercel.com/[your-team]/kstorybridge-creator/deployments
- [ ] Wait for build to complete (~2-3 minutes)
- [ ] Check deployment logs for errors
- [ ] Verify "Ready" status

### 6.3 Production Verification
**Test on: https://creator.kstorybridge.com**

- [ ] Site loads correctly
- [ ] Email signin works
- [ ] Google OAuth works
- [ ] Navigation works
- [ ] Title operations work
- [ ] No console errors

### 6.4 Monitor for 2 hours
- [ ] Check for error reports from users
- [ ] Monitor Vercel logs for runtime errors
- [ ] Check Supabase logs for auth errors

**Status**: ⬜ Not Started

---

## Phase 7: Cleanup (After 48 Hours of Stability)

**⚠️ Wait 48 hours after production deployment before cleanup**

### 7.1 Remove Old OAuth Redirect URLs
- [ ] **Supabase**: Remove `https://creator-staging.kstorybridge.com/auth/callback`
- [ ] **Google OAuth**: Remove `https://creator-staging.kstorybridge.com/auth/callback`

### 7.2 Remove Old Vercel Domain
- [ ] Go to: creator-staging project > Settings > Domains
- [ ] Remove domain: `creator-staging.kstorybridge.com`

### 7.3 Remove Old DNS Record
- [ ] Log into DNS provider
- [ ] Delete CNAME record: `creator-v2`

### 7.4 Delete Backup Branch
```bash
git branch -D backup-before-creator-rename
```

- [ ] Delete local backup branch
- [ ] Optionally delete remote if pushed: `git push origin --delete backup-before-creator-rename`

**Status**: ⬜ Not Started

---

## Phase 8: Rollback Plan (Emergency Use Only)

### Option A: Quick Rollback (Vercel Only - No Code Changes)

**Use if**: Site is down but code is fine, just config issue

1. **Revert Vercel Staging Domain**:
   - [ ] creator-staging project > Settings > Domains
   - [ ] Make `creator-staging.kstorybridge.com` primary domain
   - [ ] Remove `creator-staging.kstorybridge.com`

2. **Revert Vercel Root Directory**:
   - [ ] creator-staging: Change Root Directory back to `apps/creator`
   - [ ] kstorybridge-creator: Change Root Directory back to `apps/creator`

3. **Redeploy Both Projects**:
   - [ ] Trigger manual redeploy on both projects

**Time**: ~5 minutes

---

### Option B: Full Rollback (Git + Vercel)

**Use if**: Code changes broke something, need to revert everything

1. **Revert Git Changes**:
```bash
git checkout v2
git revert [commit-hash]  # Hash from Phase 2.8
git push origin v2 --force
```

2. **Revert Vercel Configuration** (same as Option A)

3. **Wait for Auto-Deploy**: Vercel will redeploy from reverted v2 branch

4. **If Urgent**: Manually trigger redeploy

**Time**: ~10 minutes

---

### Option C: Nuclear Rollback (Restore from Backup Branch)

**Use if**: Everything is broken, need clean slate

1. **Restore from Backup**:
```bash
git checkout v2
git reset --hard backup-before-creator-rename
git push origin v2 --force
```

2. **Revert Vercel Configuration** (same as Option A)

3. **Wait for Auto-Deploy**

**Time**: ~10 minutes

---

## Risk Assessment

| Risk | Severity | Likelihood | Mitigation |
|------|----------|------------|------------|
| OAuth breakage | HIGH | LOW | Pre-add new URLs, keep old URLs active |
| DNS propagation delay | MEDIUM | MEDIUM | Test with hosts file first |
| Build failure | MEDIUM | LOW | Test build locally before push |
| Wrong Vercel Root Directory | HIGH | LOW | Double-check settings, test staging first |
| Documentation out of sync | LOW | LOW | Comprehensive search & replace |
| Package dependency issues | MEDIUM | LOW | Test with npm install, verify lock file |

---

## Key Success Metrics

- [ ] Zero downtime on production
- [ ] OAuth works on all domains (staging + production)
- [ ] All 45+ documentation files updated
- [ ] Build times unchanged
- [ ] No increase in error rates
- [ ] User workflows unaffected

---

## Timeline Estimate

| Phase | Duration | Notes |
|-------|----------|-------|
| Phase 1: OAuth Prep | 10 min | Manual Supabase/Google config |
| Phase 2: Git Changes | 30 min | Code + docs updates |
| Phase 3: Vercel Config | 15 min | Project settings, redeploy |
| Phase 4: DNS | 5 min + propagation | Typically 1-5 min propagation |
| Phase 5: Staging Tests | 20 min | Thorough testing |
| Phase 6: Production Deploy | 10 min | Merge + monitor |
| Phase 7: Cleanup | 10 min | After 48 hours |
| **Total Active Time** | **~90 min** | Excluding DNS/monitoring wait time |

---

## Notes & Observations

**Date**: 2025-10-29
- Migration plan created
- Identified 45+ documentation files requiring updates
- OAuth URLs prepared in advance to prevent auth breakage
- Rollback plan available for emergencies

---

## Completion Checklist

- [ ] All phases marked complete
- [ ] Production stable for 48+ hours
- [ ] Cleanup phase complete
- [ ] No outstanding issues
- [ ] Team notified of completion
- [ ] This plan archived for reference

---

**Last Updated**: 2025-10-29
**Status**: 🔴 NOT STARTED
