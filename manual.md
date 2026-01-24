# KStoryBridge Operations Manual

**Last Updated**: 2026-01-24

This manual documents all available skills (slash commands), agents, and operational workflows for the KStoryBridge monorepo.

---

## Table of Contents

1. [Skills (Slash Commands)](#skills-slash-commands)
   - [Deployment Skills](#deployment-skills)
   - [Git & Version Control](#git--version-control)
   - [Data & Analytics](#data--analytics)
   - [AI & Content Processing](#ai--content-processing)
   - [Testing & Quality](#testing--quality)
   - [Infrastructure](#infrastructure)
2. [Agents](#agents)
3. [Common Workflows](#common-workflows)

---

## Skills (Slash Commands)

Skills are invoked using `/skill-name` syntax. They provide specialized functionality for common operations.

### Deployment Skills

#### `/deploy-staging`
Deploys specified app(s) to Vercel staging environment with build verification, smoke tests, and notifications.

**Usage:**
```
/deploy-staging
/deploy-staging dashboard
/deploy-staging creator
```

**When to use:**
- When ready to test changes in staging environment
- After completing feature development on v2 branch
- Before creating production PR

---

#### `/deploy-functions`
Deploys Supabase edge functions individually or in groups with health verification and notifications.

**Usage:**
```
/deploy-functions
/deploy-functions auth
/deploy-functions payments
/deploy-functions ai
```

**Function Groups:**
- `auth` - Authentication-related functions
- `payments` - Stripe/payment functions
- `ai` - AI/ML functions (chatbot, embeddings)
- `data` - Data processing functions
- `email` - Email service functions

---

#### `/stage`
Commits changes, pushes to v2 branch, and deploys to staging. One-command staging workflow.

**Usage:**
```
/stage
```

**What it does:**
1. Creates a git commit
2. Pushes to v2 branch
3. Deploys to staging environment

---

#### `/push`
Commits changes, pushes to v2 branch, and creates a PR to main for production deployment.

**Usage:**
```
/push
```

**What it does:**
1. Creates a git commit
2. Pushes to v2 branch
3. Creates pull request from v2 → main

---

### Git & Version Control

#### `/commit`
Creates a git commit with a well-formatted message following repository conventions.

**Usage:**
```
/commit
/commit -m "feat: Add new feature"
```

**Commit message format:**
- `feat:` - New features
- `fix:` - Bug fixes
- `refactor:` - Code refactoring
- `docs:` - Documentation changes
- `chore:` - Maintenance tasks

---

#### `/commit-push-pr`
Full workflow: commit, push, and open a pull request in one command.

**Usage:**
```
/commit-push-pr
```

---

#### `/clean_gone`
Cleans up all git branches marked as `[gone]` (branches deleted on remote but still exist locally), including removing associated worktrees.

**Usage:**
```
/clean_gone
```

**When to use:**
- After merging PRs to clean up local branches
- Periodic repository maintenance

---

#### `/pr-production`
Creates a streamlined pull request from v2 (staging) to main (production) with change summary, affected apps detection, and deployment checklist.

**Usage:**
```
/pr-production
```

**Output includes:**
- Summary of changes
- List of affected apps
- Deployment checklist
- Review requirements

---

### Data & Analytics

#### `/analytics`
Generates GA4 analytics reports for KStoryBridge dashboard. Supports daily summaries, weekly deep-dives, funnel analysis, and traffic source breakdowns.

**Usage:**
```
/analytics
/analytics daily
/analytics weekly
```

**Report types:**
- Daily summary
- Weekly deep-dive
- Funnel analysis
- Traffic source breakdown
- Realtime monitoring

---

#### `/funnel-report`
Generates comprehensive signup funnel analysis. Analyzes user journey from first visit through trial to signup completion.

**Usage:**
```
/funnel-report
```

**Output includes:**
- Drop-off point identification
- Conversion rates by stage
- Actionable recommendations

---

#### `/cost-report`
Tracks and reports API costs for OpenAI, Stripe, and other paid services used by edge functions.

**Usage:**
```
/cost-report
```

**When to use:**
- Monitoring API spending
- Identifying cost optimization opportunities
- Setting up cost alerts

---

### AI & Content Processing

#### `/title-intelligence`
Orchestrates data collection from Korean webtoon/webnovel platforms and fan engagement sources.

**Usage:**
```
/title-intelligence
/title-intelligence "Title Name"
```

**Supported platforms:**
- Naver Webtoon
- Naver Series
- Kakao Page
- Kakao Webtoon
- Manta
- Reddit (fan engagement)
- AO3 (fan engagement)

---

#### `/batch-intelligence`
Batch data collection from Korean platforms with auto-ingest to titles table.

**Usage:**
```
/batch-intelligence
```

**When to use:**
- Collecting metrics on multiple titles
- Refreshing stale data
- Gathering data for titles missing views/ratings

---

#### `/title-pipeline`
Orchestrates full title processing workflow: collect → embed → comps → format-fit.

**Usage:**
```
/title-pipeline
/title-pipeline "Title Name"
```

**Pipeline steps:**
1. **Collect** - Gather platform data
2. **Embed** - Generate vector embeddings
3. **Comps** - Generate Hollywood comparables
4. **Format-fit** - Analyze format suitability

---

#### `/batch-comps`
Batch generation of Hollywood comparable titles using GPT-4o.

**Usage:**
```
/batch-comps
```

**When to use:**
- Generating comps on multiple titles
- Filling gaps in catalog coverage
- Overnight batch processing

---

#### `/batch-format-fit`
Batch format suitability analysis across 5 content formats.

**Usage:**
```
/batch-format-fit
```

**Formats analyzed:**
- Film
- TV Series
- Animation
- Microdrama
- Audio Drama

---

#### `/regenerate-embeddings`
Manages OpenAI embeddings for title vector search, including batch regeneration, single title updates, and verification.

**Usage:**
```
/regenerate-embeddings
/regenerate-embeddings verify
```

**When to use:**
- Regenerating embeddings for new titles
- Fixing missing embeddings
- Updating embeddings after content changes

---

### Testing & Quality

#### `/test-e2e`
Runs Playwright E2E tests with smart targeting by app and feature.

**Usage:**
```
/test-e2e
/test-e2e dashboard
/test-e2e creator login
```

**Environments:**
- `local` - Local development
- `staging` - Staging environment
- `production` - Production (read-only tests)

---

#### `/code-review`
Code review a pull request with detailed feedback.

**Usage:**
```
/code-review
/code-review 123
```

---

#### `/health-check`
Verifies system health across all apps, edge functions, and database connectivity.

**Usage:**
```
/health-check
```

**When to use:**
- Quick deployment verification
- Debugging service issues
- Daily operations checks
- Before/after major deployments

---

### Infrastructure

#### `/safe-migrate`
Safely creates and applies database migrations with automatic destructive operation detection, backup creation, and rollback generation.

**Usage:**
```
/safe-migrate
/safe-migrate "add_new_column"
```

**Safety features:**
- Detects destructive operations (DROP, TRUNCATE)
- Creates automatic backups
- Generates rollback scripts
- Requires confirmation for dangerous operations

---

#### `/skill-creator`
Guide for creating effective skills that extend Claude's capabilities.

**Usage:**
```
/skill-creator
```

**When to use:**
- Creating a new skill
- Updating an existing skill

---

### Vercel Commands

#### `/vercel:deploy`
Deploy the current project to Vercel.

**Usage:**
```
/vercel:deploy
```

---

#### `/vercel:logs`
View deployment logs from Vercel.

**Usage:**
```
/vercel:logs
```

---

#### `/vercel:setup`
Set up Vercel CLI and configure the project.

**Usage:**
```
/vercel:setup
```

---

### Frontend Design

#### `/frontend-design`
Create distinctive, production-grade frontend interfaces with high design quality.

**Usage:**
```
/frontend-design
```

**When to use:**
- Building new web components or pages
- Getting design guidance
- UI/UX reviews

---

## Agents

Agents are specialized sub-processes that handle complex, multi-step tasks autonomously. They are invoked automatically by Claude when appropriate.

### Explore Agent
**Type:** `Explore`

Fast agent for exploring codebases. Use for finding files, searching code, or answering questions about the codebase.

**Thoroughness levels:**
- `quick` - Basic searches
- `medium` - Moderate exploration
- `very thorough` - Comprehensive analysis

**Best for:**
- Finding files by pattern
- Searching code for keywords
- Understanding codebase structure

---

### Plan Agent
**Type:** `Plan`

Software architect agent for designing implementation plans.

**Best for:**
- Planning implementation strategy
- Identifying critical files
- Considering architectural trade-offs

---

### Frontend Designer Agent
**Type:** `frontend-designer`

Design audit and UX review specialist.

**Best for:**
- Design consistency audits
- UX reviews
- Frontend aesthetic improvements
- Before major releases

---

### Bash Agent
**Type:** `Bash`

Command execution specialist for terminal operations.

**Best for:**
- Git operations
- Command execution
- Terminal tasks

---

### General Purpose Agent
**Type:** `general-purpose`

For researching complex questions and executing multi-step tasks.

**Best for:**
- Complex searches
- Multi-step research tasks
- When unsure which agent to use

---

### Claude Code Guide Agent
**Type:** `claude-code-guide`

Answers questions about Claude Code, Agent SDK, and Anthropic API.

**Best for:**
- Questions about Claude Code features
- Agent SDK development
- API usage questions

---

### Agent SDK Verifiers
**Types:** `agent-sdk-dev:agent-sdk-verifier-py`, `agent-sdk-dev:agent-sdk-verifier-ts`

Verify Agent SDK applications are properly configured.

**Best for:**
- After creating/modifying Agent SDK apps
- Checking SDK best practices
- Deployment readiness

---

## Common Workflows

### Deploy to Staging
```bash
# Option 1: One command
/stage

# Option 2: Step by step
/commit
git push origin v2
/deploy-staging
```

### Deploy to Production
```bash
# 1. Ensure staging is tested
/health-check

# 2. Create production PR
/pr-production

# 3. Review and merge PR on GitHub
# (Production auto-deploys after merge)
```

### Add New Title with Full Processing
```bash
# 1. Collect platform data
/title-intelligence "Title Name"

# 2. Or run full pipeline
/title-pipeline "Title Name"
```

### Batch Update Titles
```bash
# 1. Collect data for multiple titles
/batch-intelligence

# 2. Generate comps
/batch-comps

# 3. Analyze format fit
/batch-format-fit
```

### Database Migration
```bash
# Always use safe-migrate for schema changes
/safe-migrate "descriptive_migration_name"
```

### Daily Operations Check
```bash
# 1. Check system health
/health-check

# 2. Review analytics
/analytics daily

# 3. Check costs
/cost-report
```

### Code Review Workflow
```bash
# 1. Review PR
/code-review 123

# 2. Run E2E tests
/test-e2e
```

---

## Quick Reference

| Task | Command |
|------|---------|
| Deploy to staging | `/stage` or `/deploy-staging` |
| Deploy to production | `/pr-production` then merge |
| Commit changes | `/commit` |
| Full commit workflow | `/push` |
| Run E2E tests | `/test-e2e` |
| Health check | `/health-check` |
| Analytics report | `/analytics` |
| Cost report | `/cost-report` |
| Database migration | `/safe-migrate` |
| Title data collection | `/title-intelligence` |
| Batch title processing | `/title-pipeline` |
| Clean git branches | `/clean_gone` |
| Code review | `/code-review` |

---

## Notes

- All skills follow repository conventions for commits and deployments
- Staging uses v2 branch, production uses main branch
- Always run `/health-check` after deployments
- Use `/safe-migrate` for ALL database changes (never raw SQL for schema changes)
- Skills with notifications will alert via configured channels
