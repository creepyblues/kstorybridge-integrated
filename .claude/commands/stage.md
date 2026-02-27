---
description: Commit, push to v2 branch, and deploy to staging
allowed-tools: Bash(git status:*), Bash(git diff:*), Bash(git log:*), Bash(git add:*), Bash(git commit:*), Bash(git push:*), Bash(git branch:*), Bash(git pull:*), Bash(npm run build:*), Bash(cd apps/* && vercel:*), Bash(vercel:*), Bash(curl:*), Bash(cp:*), Bash(rm:*), Bash(cat:*)
argument-hint: <app> [commit-message] (app: dashboard, creator, website, or all)
---

## Context

- Current branch: !`git branch --show-current`
- Git status: !`git status --short`
- Recent commits: !`git log --oneline -3`

## Task

Complete the following steps to commit, push, and deploy to staging:

### Step 1: Validate Arguments

The first argument must be the app to deploy:
- `dashboard` - Deploy dashboard-staging
- `creator` - Deploy creator-staging
- `website` - Deploy kstorybridge-website (production, no staging project)
- `all` - Deploy all three apps

If no app is specified or an invalid app name is given, show an error message listing the valid options. Do not proceed.

Parse "$ARGUMENTS" to extract:
- First word = app name
- Remaining text = commit message (optional)

### Step 2: Verify Branch

Ensure we're on the `v2` branch. If not, warn the user and stop. Do not switch branches automatically.

### Step 3: Stage and Commit Changes

1. Check if there are changes to commit (modified or untracked files)
2. If no changes: inform the user "No changes to commit. Proceeding to deploy." and skip to Step 5
3. If changes exist:
   - Stage all modified and new files (excluding .env files, secrets, and node_modules)
   - Create commit with message:
     - If commit message provided in arguments: use that message
     - If no message: analyze the staged changes and generate a concise commit message following conventional commits format (feat:, fix:, chore:, etc.)
   - End commit message with: `Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>`

### Step 4: Push to v2

Push the commit to origin/v2. If push fails, report the error and stop.

### Step 5: Build Verification

Run local build to catch errors before deploying:

```bash
# For dashboard
npm run build:dashboard

# For creator
npm run build:creator

# For website
npm run build:website

# For all
npm run build
```

If build fails, stop and report the error. Do not proceed to deployment.

### Step 6: Deploy to Vercel

**CRITICAL**: Always deploy from the monorepo ROOT directory (`/Users/sungholee/code/kstorybridge`), not from app directories. The root `.vercel/project.json` must be swapped to target the correct project, then restored afterward.

#### Vercel project mapping

| App | Vercel Project | Deploy Flag | URL |
|-----|---------------|-------------|-----|
| dashboard | `dashboard-staging` | `--prod` | dashboard-staging.kstorybridge.com |
| creator | `creator-staging` | `--prod` | creator-staging.kstorybridge.com |
| website | `kstorybridge-website` | `--prod` | kstorybridge.com |

#### Deploy procedure (per app)

```bash
# 1. Save current link
cp .vercel/project.json .vercel/project.json.bak

# 2. Link to target project
vercel link --yes --project <vercel-project-name>

# 3. Deploy
vercel --yes --prod

# 4. Restore original link
cp .vercel/project.json.bak .vercel/project.json
rm .vercel/project.json.bak
```

For `all`, deploy apps in sequence: dashboard → creator → website.

Capture the deployment URL from Vercel output for the report.

### Step 7: Smoke Test

After deployment, verify the app is reachable:

```bash
# Check HTTP status
curl -s -o /dev/null -w "%{http_code}" https://<staging-url>/
```

Expected: 200.

### Step 8: Report Results

Show deployment summary:

```
## Staging Deployment Complete

**App**: [app name]
**Commit**: [hash] - [message]
**URL**: [staging/production URL]
**Smoke Test**: [PASS/FAIL]

Test your changes at the URL above.
When ready for production, run: /push
```

## Rules

- Never force push
- Never skip pre-commit hooks
- Always deploy from monorepo root, not app directory
- Always restore `.vercel/project.json` after deployment (backup/restore pattern)
- If build fails, do not attempt deployment
- If not on v2 branch, stop and warn user
- Exclude .env files and secrets from commits
