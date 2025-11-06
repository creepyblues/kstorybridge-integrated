# Vercel Selective Deployment Guide

**Last Updated**: 2025-11-06

This guide explains how to configure Vercel to only deploy apps that have actually changed, saving build time and costs.

---

## Problem Statement

**Current Issue**: All 6 Vercel projects deploy on every commit, even when only one app changes.

**Goal**: Only deploy the apps that have code changes.

**Example**: When `apps/dashboard/src/pages/Chat.tsx` changes, ONLY dashboard should deploy. Creator and website should skip.

---

## Solution Options

We have **THREE approaches** to solve this:

1. **✅ Recommended: Custom Bash Script** - Most reliable, full control
2. **⚡ Simple: Vercel Built-in Folder Detection** - Easiest to set up, limited functionality
3. **🔧 Advanced: Turborepo turbo-ignore** - Most powerful, complex to debug

---

## Option 1: Custom Bash Script (RECOMMENDED)

### Why This Works

- ✅ **Simple logic**: Uses `git diff` to check changed files
- ✅ **Reliable**: No dependency on Turborepo or lockfile
- ✅ **Transparent**: Clear output shows exactly what changed
- ✅ **Fast**: Executes in ~1 second
- ✅ **No external dependencies**: Pure bash + git

### Setup Instructions

**Step 1: Script is Already Created**

The script is at `/scripts/check-app-changes.sh` and is executable.

**Step 2: Update Vercel Project Settings**

For each Vercel project, go to:
1. Vercel Dashboard → Select Project
2. Settings → Git
3. Scroll to **"Ignored Build Step"**
4. Select **"Custom"** from dropdown
5. Enter the command for that project:

| Vercel Project | Ignored Build Step Command |
|----------------|----------------------------|
| kstorybridge-dashboard | `bash scripts/check-app-changes.sh apps/dashboard` |
| dashboard-staging | `bash scripts/check-app-changes.sh apps/dashboard` |
| dashboard-v2 | `bash scripts/check-app-changes.sh apps/dashboard-v2` |
| kstorybridge-creator | `bash scripts/check-app-changes.sh apps/creator` |
| creator-staging | `bash scripts/check-app-changes.sh apps/creator` |
| kstorybridge-website | `bash scripts/check-app-changes.sh apps/website` |

**Step 3: Save Settings**

Click "Save" for each project.

### How It Works

```bash
# The script checks if any files changed in the app directory
git diff --name-only HEAD^ HEAD | grep "^apps/dashboard/"

# Exit code 0 (cancel build) if no match
# Exit code 1 (proceed with build) if match found
```

### Expected Behavior

**Scenario 1**: Change only `apps/dashboard/src/pages/Chat.tsx`
- ✅ kstorybridge-dashboard → Deploys (logs: "✅ Changes detected")
- ✅ dashboard-staging → Deploys
- ❌ kstorybridge-creator → Skips (logs: "⏭ No changes in apps/creator")
- ❌ kstorybridge-website → Skips

**Scenario 2**: Change only `apps/creator/src/pages/Home.tsx`
- ❌ kstorybridge-dashboard → Skips
- ✅ kstorybridge-creator → Deploys (logs: "✅ Changes detected")
- ❌ kstorybridge-website → Skips

**Scenario 3**: Change root-level file (e.g., `turbo.json`)
- ❌ All apps skip (safety consideration - see Limitations below)

### Limitations

**1. Doesn't Detect Shared Package Changes**

If you change `packages/auth/src/index.ts`:
- ❌ Dashboard won't auto-deploy (even though it depends on @kstorybridge/auth)
- ❌ Website won't auto-deploy (even though it depends on @kstorybridge/auth)

**Workaround**: Manually trigger deployments for affected apps, or extend the script (see Advanced section).

**2. First Commit on New Branch**

If there's no `HEAD^` (first commit), script defaults to proceeding with build as safety fallback.

**3. Root-Level Changes**

Changes to root files (package.json, turbo.json) won't trigger any app deployments unless you modify the script logic.

### Testing Locally

```bash
# Test creator (should skip when only dashboard changed)
bash scripts/check-app-changes.sh apps/creator
# Expected output: "⏭ No changes in apps/creator"
# Expected exit code: 0

# Test dashboard (should proceed when Chat.tsx changed)
bash scripts/check-app-changes.sh apps/dashboard
# Expected output: "✅ Changes detected in apps/dashboard"
# Expected exit code: 1
```

---

## Option 2: Vercel Built-in Folder Detection (SIMPLE)

### Why This Works

- ✅ **No custom code**: Native Vercel feature
- ✅ **Easy setup**: Select from dropdown menu
- ✅ **Fast**: ~1 second execution

### Setup Instructions

For each Vercel project:
1. Go to Settings → Git → Ignored Build Step
2. Select **"Only build if there are changes in a folder"** from dropdown
3. Enter the app folder path:
   - Dashboard: `apps/dashboard`
   - Creator: `apps/creator`
   - Website: `apps/website`
4. Save

### Limitations

**Same limitations as custom bash script**, but:
- ❌ No visibility into what's happening (no console output)
- ❌ Less control over logic
- ❌ Can't extend functionality

**Recommendation**: Use custom bash script instead for better transparency.

---

## Option 3: Turborepo turbo-ignore (ADVANCED)

### Current Status

**❌ NOT WORKING** - All attempts have failed despite:
- ✅ Adding workspace arguments
- ✅ Fixing lockfile (design-system package)
- ✅ Testing on branch with deployment history
- ❌ Still deploys all apps every time

### Why It's Not Working

**Root Cause (Suspected)**:
- Turborepo's filter command `--filter="@kstorybridge/creator...[previous_commit]"` incorrectly returns TRUE (creator is affected) even when only dashboard files changed
- Possible issues:
  1. Missing `inputs` configuration in turbo.json
  2. Workspace dependency graph miscalculation
  3. Vercel cache corruption
  4. Root-level file changes triggering all workspaces

### Configuration (For Reference)

**Vercel Ignored Build Step**:
```bash
cd ../.. && npx turbo-ignore @kstorybridge/[workspace]
```

| Vercel Project | Command |
|----------------|---------|
| kstorybridge-dashboard | `cd ../.. && npx turbo-ignore @kstorybridge/dashboard` |
| kstorybridge-creator | `cd ../.. && npx turbo-ignore @kstorybridge/creator` |
| kstorybridge-website | `cd ../.. && npx turbo-ignore @kstorybridge/website` |

### Why We're Not Using This

**Despite being the "official" Turborepo solution**, we encountered:
- Multiple failed test attempts (PR #16, #19, #20, #21)
- Complex debugging with no clear root cause
- Dependency on Turborepo internals and lockfile state
- Inconsistent behavior between local and Vercel environments

**Decision**: Use simpler custom bash script instead.

---

## Comparison Table

| Feature | Custom Bash Script | Vercel Built-in | turbo-ignore |
|---------|-------------------|-----------------|--------------|
| **Ease of Setup** | ⭐⭐⭐ Medium | ⭐⭐⭐⭐ Easy | ⭐⭐ Hard |
| **Reliability** | ⭐⭐⭐⭐ High | ⭐⭐⭐⭐ High | ⭐ Low (not working) |
| **Transparency** | ⭐⭐⭐⭐ Clear logs | ⭐ No logs | ⭐⭐⭐ Detailed logs |
| **Shared Packages** | ❌ Not supported | ❌ Not supported | ✅ Supported (in theory) |
| **Customizable** | ✅ Full control | ❌ No control | ⭐⭐ Limited |
| **Dependencies** | None (bash + git) | None | Turborepo, lockfile |
| **Status** | ✅ Working | ⏳ Untested | ❌ Not working |

**Recommendation**: Start with **Custom Bash Script** (Option 1).

---

## Advanced: Extending Custom Script for Shared Packages

If you need to detect shared package changes, modify the script:

```bash
# In check-app-changes.sh, add after checking app path:

# Check if app depends on any shared packages
SHARED_PACKAGES=()
case "$APP_PATH" in
  "apps/dashboard")
    SHARED_PACKAGES=("packages/auth" "packages/ui" "packages/build-config" "packages/testing")
    ;;
  "apps/website")
    SHARED_PACKAGES=("packages/auth" "packages/ui" "packages/testing")
    ;;
  "apps/creator")
    # Creator has no shared package dependencies
    ;;
esac

# Check if any shared packages changed
for PKG in "${SHARED_PACKAGES[@]}"; do
  if echo "$CHANGED_FILES" | grep -q "^$PKG/"; then
    echo "✅ Shared package changed: $PKG"
    echo "✓ Proceeding with build"
    exit 1
  fi
done
```

This extends the script to rebuild apps when their dependencies change.

---

## Troubleshooting

### Issue: All apps still deploy after setup

**Possible causes:**
1. Vercel settings not saved properly
2. Script not found (check file exists at root `/scripts/check-app-changes.sh`)
3. Script not executable (run `chmod +x scripts/check-app-changes.sh`)
4. First deployment on new branch (expected behavior)

**Solution**: Check Vercel build logs for script output.

### Issue: Script fails with "No such file or directory"

**Cause**: Script path incorrect or not in repository.

**Solution**: Ensure script is committed to repository at `/scripts/check-app-changes.sh`.

### Issue: Want to force build all apps

**Solution**: In Vercel, click "Redeploy" and uncheck "Use project's Ignore Build Step".

---

## Migration Path

### Phase 1: Test with One Project (NOW)
1. Update **kstorybridge-creator** to use custom bash script
2. Make dashboard-only change
3. Push to main
4. Verify creator deployment is canceled

### Phase 2: Roll Out to All Projects (After Phase 1 Success)
1. Update remaining 5 Vercel projects
2. Monitor deployments for 1 week
3. Document any edge cases

### Phase 3: Optimize (Optional)
1. Extend script to handle shared package changes
2. Add caching optimizations
3. Create monitoring dashboard

---

## Success Metrics

**Before**:
- ❌ 6 deployments per commit (100% deployment rate)
- ❌ ~12 minutes total build time per commit
- ❌ Wasted Vercel build minutes

**After**:
- ✅ 1-2 deployments per commit (~17% deployment rate)
- ✅ ~2-4 minutes total build time per commit
- ✅ 67-83% reduction in build time
- ✅ Significant cost savings

---

## Related Documentation

- [Vercel Ignored Build Step](https://vercel.com/docs/project-configuration/git-settings#ignored-build-step)
- [Turborepo turbo-ignore](https://turborepo.com/docs/reference/turbo-ignore)
- [Git Deployment Structure](./GIT_DEPLOYMENT_STRUCTURE.md)
- [Turborepo Vercel Setup](./TURBOREPO_VERCEL_SETUP.md) (deprecated - use this guide instead)

---

**Questions or Issues?**

If you encounter problems:
1. Check Vercel build logs for script output
2. Test script locally: `bash scripts/check-app-changes.sh apps/[app-name]`
3. Verify script is executable: `ls -la scripts/check-app-changes.sh`
4. Ensure script is committed to repository
