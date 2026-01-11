---
description: Commit, push to v2 branch, and deploy to staging
allowed-tools: Bash(git status:*), Bash(git diff:*), Bash(git log:*), Bash(git add:*), Bash(git commit:*), Bash(git push:*), Bash(git branch:*), Bash(git pull:*), Bash(npm run build:*), Bash(cd apps/* && vercel:*), Bash(vercel:*), Bash(curl:*)
argument-hint: <app> [commit-message] (app: dashboard, creator, or all)
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
- `all` - Deploy both apps

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
   - End commit message with: `Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>`

### Step 4: Push to v2

Push the commit to origin/v2. If push fails, report the error and stop.

### Step 5: Build Verification

Run local build to catch errors before deploying:

```bash
# For dashboard
npm run build:dashboard

# For creator
npm run build:creator

# For all
npm run build
```

If build fails, stop and report the error. Do not proceed to deployment.

### Step 6: Deploy to Vercel Staging

**CRITICAL**: Always deploy from the monorepo ROOT directory, not from app directories.

```bash
# For dashboard
cd /Users/sungholee/code/kstorybridge
vercel link --project dashboard-staging --yes
vercel --prod

# For creator
cd /Users/sungholee/code/kstorybridge
vercel link --project creator-staging --yes
vercel --prod
```

For `all`, deploy apps in sequence:
1. Deploy dashboard first
2. Then deploy creator

Capture the deployment URL from Vercel output for the report.

### Step 7: Report Results

Show deployment summary:

```
## Staging Deployment Complete

**App**: [app name]
**Commit**: [hash] - [message]
**Staging URL**: https://dashboard-staging.kstorybridge.com (or creator-staging)

Test your changes at the staging URL.
When ready for production, run: /push
```

## Rules

- Never force push
- Never skip pre-commit hooks
- Always deploy from monorepo root, not app directory
- If build fails, do not attempt deployment
- If not on v2 branch, stop and warn user
- Exclude .env files and secrets from commits
