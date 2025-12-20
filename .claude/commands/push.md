---
description: Commit, push to v2 branch, and create PR to main
allowed-tools: Bash(git status:*), Bash(git diff:*), Bash(git log:*), Bash(git add:*), Bash(git commit:*), Bash(git push:*), Bash(gh pr create:*), Bash(gh pr list:*)
argument-hint: [commit-message (optional)]
---

## Context

- Current branch: !`git branch --show-current`
- Git status: !`git status --short`
- Staged changes: !`git diff --cached --stat`
- Unstaged changes: !`git diff --stat`
- Recent commits: !`git log --oneline -5`

## Task

Complete the following steps:

1. **Verify branch**: Ensure we're on the `v2` branch. If not, warn the user.

2. **Stage changes**: Add all modified and new files to staging (excluding .env files and secrets).

3. **Create commit**:
   - If commit message provided: use "$ARGUMENTS"
   - If no message: analyze the changes and generate a clear, concise commit message

4. **Push to v2**: Push the commit to origin/v2.

5. **Create PR**: Create a pull request from v2 → main using GitHub CLI:
   - Check if a PR already exists from v2 to main
   - If PR exists, just update it (push is enough)
   - If no PR exists, create one with:
     - Title based on the commit message
     - Summary of changes in the body
     - Include "🤖 Generated with Claude Code" footer

6. **Report**: Show the PR URL when complete.

## Rules

- Never force push
- Never skip pre-commit hooks
- If there are no changes to commit, inform the user and stop
- If not on v2 branch, ask user to switch first
