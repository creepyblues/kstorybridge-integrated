# Vercel Project Update Required

**Date**: 2025-11-08
**Action**: Directory rename `dashboard-v2` → `dashboard-next`

---

## Summary

The `apps/dashboard-v2` directory has been renamed to `apps/dashboard-next` to avoid confusion with the `v2` git branch name (which is actually the staging branch). This requires updating 1 Vercel project configuration.

---

## Vercel Project to Update

### Project: `dashboard-next` (or `kstorybridge-dashboard-v2`)

**Current Settings**:
- **Production Branch**: `v2`
- **Root Directory**: `apps/dashboard-v2` ❌
- **Build Command**: `npm run build`
- **Ignored Build Step**: `cd ../.. && npx turbo-ignore @kstorybridge/dashboard-v2` ❌

**New Settings**:
- **Production Branch**: `v2` (no change)
- **Root Directory**: `apps/dashboard-next` ✅
- **Build Command**: `npm run build` (no change)
- **Ignored Build Step**: `cd ../.. && npx turbo-ignore @kstorybridge/dashboard-next` ✅

---

## Update Instructions

### Via Vercel Dashboard

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select the project (search for "dashboard-v2" or "dashboard-next")
3. Go to **Settings** → **General**
4. Update **Root Directory**:
   - Change from: `apps/dashboard-v2`
   - Change to: `apps/dashboard-next`
5. Go to **Settings** → **Git**
6. Update **Ignored Build Step** command:
   - Change from: `cd ../.. && npx turbo-ignore @kstorybridge/dashboard-v2`
   - Change to: `cd ../.. && npx turbo-ignore @kstorybridge/dashboard-next`
7. Save changes

### Verification

After updating:
1. Push a commit to the `v2` branch
2. Verify that Vercel triggers a build (or skips it if no changes)
3. Check deployment logs to ensure build completes successfully

---

## Why This Change Was Made

**Problem**: The directory name `dashboard-v2` created confusion because:
- `v2` in the directory name suggests "version 2"
- `v2` git branch is actually the **staging** branch
- This caused confusion when discussing "v2" - did it mean the directory or the branch?

**Solution**: Renamed to `dashboard-next` which:
- Clearly indicates it's the **next generation** of the dashboard
- Eliminates confusion with git branch naming
- Better reflects its purpose as a replacement for the current dashboard

---

## Files Changed

**Git Status**: All files tracked as renamed (not deleted/added), preserving history:
- 130+ files in `apps/dashboard-next/`
- `package.json` workspace name: `@kstorybridge/dashboard-next`
- Documentation updated in:
  - Root `CLAUDE.md`
  - `apps/dashboard-next/CLAUDE.md`
  - `docs/DASHBOARD_APP_V2_PRD.md`
  - `docs/guides/TURBOREPO_VERCEL_SETUP.md`

**Impact**:
- ✅ Low risk - only 1 Vercel project affected
- ✅ Easy rollback - simple git revert if needed
- ✅ No code changes - purely directory rename and documentation updates

---

## Testing

**Local Build**: Tested (pre-existing TypeScript errors unrelated to rename)
**Git Tracking**: ✅ All files correctly tracked as renamed
**Documentation**: ✅ Updated across all relevant files

---

## Next Steps

1. Update Vercel project settings (see instructions above)
2. Deploy to staging to verify configuration
3. Monitor first deployment to ensure no issues
4. Close this ticket after successful deployment

---

**Status**: ⏳ Waiting for Vercel configuration update
