# Vercel Deployment Architecture

**Last Updated**: 2025-11-09

This document provides a complete reference for the KStoryBridge Vercel deployment architecture, including the mapping of app directories to Vercel projects and how deployment control works.

---

## Table of Contents

1. [Overview](#overview)
2. [6 Vercel Projects ↔ 4 App Directories Mapping](#6-vercel-projects--4-app-directories-mapping)
3. [How One App Controls Multiple Projects](#how-one-app-controls-multiple-projects)
4. [Complete Vercel Project Configuration](#complete-vercel-project-configuration)
5. [Deployment Control via git.deploymentEnabled](#deployment-control-via-gitdeploymentenabled)
6. [FAQ](#faq)

---

## Overview

The KStoryBridge monorepo uses a **6 Vercel projects, 4 app directories** architecture where:

- **4 app directories** in the monorepo (`apps/dashboard`, `apps/creator`, `apps/dashboard-next`, `apps/website`)
- **6 separate Vercel projects** (3 production + 3 staging)
- **Each app directory controls 1-2 Vercel projects** through a single `vercel.json` file

This architecture allows for:
- ✅ Separate staging and production deployments
- ✅ Manual staging deployments for testing
- ✅ Automatic production deployments with selective builds
- ✅ Branch-based deployment control (v2 = staging, main = production)

---

## 6 Vercel Projects ↔ 4 App Directories Mapping

### Complete Mapping Table

| App Directory | Vercel Project (Production) | Vercel Project (Staging) | vercel.json Location | Domains |
|---------------|----------------------------|-------------------------|---------------------|---------|
| **apps/dashboard** | `kstorybridge-dashboard` | `dashboard-staging` | `apps/dashboard/vercel.json` | dashboard.kstorybridge.com<br>dashboard-staging.kstorybridge.com |
| **apps/creator** | `creator` | `creator-staging` | `apps/creator/vercel.json` | creator.kstorybridge.com<br>creator-staging.kstorybridge.com |
| **apps/dashboard-next** | `dashboard-next` | N/A | `apps/dashboard-next/vercel.json` | dashboard-next.kstorybridge.com (TBD) |
| **apps/website** | `kstorybridge-website` | N/A | `apps/website/vercel.json` | kstorybridge.com |

### Key Insights

1. **Dashboard and Creator apps each control TWO Vercel projects**:
   - One production project (auto-deploy on main branch)
   - One staging project (manual deploy only)

2. **Dashboard-next and Website control ONE Vercel project each**:
   - Dashboard-next: Development version (manual deploy for both branches)
   - Website: Production only (no separate staging project)

3. **One vercel.json file, multiple projects**:
   - Each app has a single `vercel.json` file
   - Both production and staging projects read the same file
   - Deployment behavior differs based on branch configuration

---

## How One App Controls Multiple Projects

### The Mechanism

Each app directory's `vercel.json` file is read by BOTH production and staging Vercel projects. The `git.deploymentEnabled` object uses **branch names as keys** to control deployment behavior.

### Example: apps/dashboard/vercel.json

```json
{
  "git": {
    "deploymentEnabled": {
      "v2": false,    // Controls dashboard-staging behavior
      "main": true    // Controls kstorybridge-dashboard behavior
    }
  }
}
```

**How It Works:**

1. **dashboard-staging Vercel project**:
   - Configured to deploy from `v2` branch
   - Reads `apps/dashboard/vercel.json`
   - Checks `deploymentEnabled.v2` → sees `false`
   - **Result**: Auto-deploy DISABLED (manual deployment required)

2. **kstorybridge-dashboard Vercel project**:
   - Configured to deploy from `main` branch
   - Reads `apps/dashboard/vercel.json`
   - Checks `deploymentEnabled.main` → sees `true`
   - **Result**: Auto-deploy ENABLED (deploys automatically on push to main)

### Example: apps/creator/vercel.json

```json
{
  "git": {
    "deploymentEnabled": {
      "v2": false,    // Controls creator-staging behavior
      "main": true    // Controls creator (production) behavior
    }
  }
}
```

Same mechanism as dashboard - one file controls two projects.

### Example: apps/dashboard-next/vercel.json

```json
{
  "git": {
    "deploymentEnabled": {
      "v2": false,    // Manual only on v2 branch
      "main": false   // Manual only on main branch (not production-ready yet)
    }
  }
}
```

Both branches require manual deployment because dashboard-next is still under development.

---

## Complete Vercel Project Configuration

### Production Projects (Auto-Deploy on main)

| Vercel Project | App Directory | Branch | Auto-Deploy | Domain | Selective Build |
|----------------|---------------|--------|-------------|---------|----------------|
| `kstorybridge-dashboard` | `apps/dashboard` | main | ✅ Yes | dashboard.kstorybridge.com | ✅ turbo-ignore |
| `creator` | `apps/creator` | main | ✅ Yes | creator.kstorybridge.com | ✅ turbo-ignore |
| `kstorybridge-website` | `apps/website` | main | ✅ Yes | kstorybridge.com | ✅ turbo-ignore |

### Staging Projects (Manual Deploy Only)

| Vercel Project | App Directory | Branch | Auto-Deploy | Domain | Deployment Method |
|----------------|---------------|--------|-------------|---------|-------------------|
| `dashboard-staging` | `apps/dashboard` | v2 | ❌ No | dashboard-staging.kstorybridge.com | Manual via `vercel` CLI |
| `creator-staging` | `apps/creator` | v2 | ❌ No | creator-staging.kstorybridge.com | Manual via `vercel` CLI |

### Development Projects (Manual Deploy Only)

| Vercel Project | App Directory | Branch | Auto-Deploy | Domain | Status |
|----------------|---------------|--------|-------------|---------|--------|
| `dashboard-next` | `apps/dashboard-next` | main | ❌ No | dashboard-next.kstorybridge.com (TBD) | Under development |

---

## Deployment Control via git.deploymentEnabled

### Configuration Syntax

```json
{
  "git": {
    "deploymentEnabled": {
      "<branch-name>": true | false
    }
  }
}
```

- **Key**: Git branch name (e.g., `"v2"`, `"main"`, `"staging"`)
- **Value**: `true` (auto-deploy) or `false` (manual deploy only)

### How Vercel Reads This Configuration

1. **On every push** to any branch, Vercel checks if the branch has a configuration key
2. **If key exists**: Uses the value to determine deployment behavior
3. **If key missing**: Defaults to `true` (auto-deploy enabled)

**Example:**
```json
{
  "git": {
    "deploymentEnabled": {
      "v2": false,
      "main": true
    }
  }
}
```

- Push to `v2` branch → Auto-deploy disabled (manual only)
- Push to `main` branch → Auto-deploy enabled (automatic)
- Push to `feature-branch` → Auto-deploy enabled (no key = default true)

### Production Configuration (All Apps)

**apps/dashboard/vercel.json:**
```json
{
  "git": {
    "deploymentEnabled": {
      "v2": false,
      "main": true
    }
  }
}
```

**apps/creator/vercel.json:**
```json
{
  "git": {
    "deploymentEnabled": {
      "v2": false,
      "main": true
    }
  }
}
```

**apps/dashboard-next/vercel.json:**
```json
{
  "git": {
    "deploymentEnabled": {
      "v2": false,
      "main": false
    }
  }
}
```

**apps/website/vercel.json:**
```json
{
  "git": {
    "deploymentEnabled": {
      "v2": false,
      "main": true
    }
  }
}
```

---

## FAQ

### Q: Why 6 Vercel projects for 4 apps?

**A:** Each production app has TWO Vercel projects: one for staging (v2 branch), one for production (main branch). This allows separate staging and production deployments with different deployment controls.

- `apps/dashboard` → `dashboard-staging` (staging) + `kstorybridge-dashboard` (production)
- `apps/creator` → `creator-staging` (staging) + `creator` (production)
- `apps/dashboard-next` → `dashboard-next` (development only)
- `apps/website` → `kstorybridge-website` (production only)

### Q: How does one vercel.json file control two Vercel projects?

**A:** The `git.deploymentEnabled` object has **branch-name keys**. Each Vercel project is configured to deploy from a specific branch and reads the key matching that branch:

- `dashboard-staging` reads `deploymentEnabled.v2` (its production branch is v2)
- `kstorybridge-dashboard` reads `deploymentEnabled.main` (its production branch is main)

### Q: What happens if I push to v2 branch?

**A:** NONE of the projects auto-deploy (all have `"v2": false`). You must manually deploy using:

```bash
cd apps/dashboard  # or apps/creator
vercel              # Deploy to staging
```

### Q: What happens if I merge to main branch?

**A:** Only apps that changed will deploy (detected by `turbo-ignore` wrapper script):

- ✅ `kstorybridge-dashboard` (if dashboard app changed)
- ✅ `creator` (if creator app changed)
- ✅ `kstorybridge-website` (if website app changed)
- ❌ `dashboard-staging` (auto-deploy disabled)
- ❌ `creator-staging` (auto-deploy disabled)
- ❌ `dashboard-next` (manual only, still in development)

### Q: Can I have different vercel.json settings for staging vs production?

**A:** No. Both projects read the SAME file from your app directory. However, you can use **branch-based keys** in `git.deploymentEnabled` to differentiate behavior:

```json
{
  "git": {
    "deploymentEnabled": {
      "v2": false,    // Staging behavior
      "main": true    // Production behavior
    }
  }
}
```

### Q: How do I manually deploy to staging?

**A:**

```bash
# Deploy dashboard to staging
cd apps/dashboard
vercel

# Deploy creator to staging
cd apps/creator
vercel
```

See [MANUAL_DEPLOYMENT_GUIDE.md](../../MANUAL_DEPLOYMENT_GUIDE.md) for complete workflow.

### Q: How does selective deployment work on production?

**A:** All production projects use the enhanced wrapper script in Vercel's "Ignored Build Step":

```bash
cd ../.. && bash scripts/vercel-ignore-turbo.sh
```

This script:
1. Detects which app changed using Turborepo's dependency graph
2. Only builds if the app or its dependencies changed
3. Skips build if nothing changed (saves build minutes)

See [Root CLAUDE.md - Turborepo Build System](../../CLAUDE.md#turborepo-build-system) for details.

### Q: Why is dashboard-next set to manual for both v2 and main?

**A:** Dashboard-next is the next-generation buyer dashboard (v2.0) still under development. It's not production-ready yet, so both branches require manual deployment to prevent accidental production releases.

When ready for production:
1. Change `apps/dashboard-next/vercel.json` to `"main": true`
2. Commit and push to main
3. Dashboard-next will auto-deploy on future main branch changes

### Q: What if I want to auto-deploy on a feature branch?

**A:** Add the branch name to `git.deploymentEnabled`:

```json
{
  "git": {
    "deploymentEnabled": {
      "v2": false,
      "main": true,
      "feature-xyz": true  // Auto-deploy this feature branch
    }
  }
}
```

**Warning**: Feature branch deployments count against your Vercel deployment quota.

---

## Related Documentation

- **[Root CLAUDE.md](../../CLAUDE.md)** - Monorepo overview, quick start, Turborepo setup
- **[MANUAL_DEPLOYMENT_GUIDE.md](../../MANUAL_DEPLOYMENT_GUIDE.md)** - Step-by-step manual deployment workflow
- **[GIT_DEPLOYMENT_STRUCTURE.md](./GIT_DEPLOYMENT_STRUCTURE.md)** - Complete deployment configuration reference
- **[DEPLOYMENT_STRATEGY.md](./DEPLOYMENT_STRATEGY.md)** - ⚠️ DEPRECATED (legacy workflow)
- **[TURBOREPO_VERCEL_SETUP.md](./TURBOREPO_VERCEL_SETUP.md)** - ⚠️ LEGACY REFERENCE (old turbo-ignore setup)

---

**Last Updated**: 2025-11-09
**Architecture Version**: Hybrid Deployment Model (Manual Staging + Auto Production)
