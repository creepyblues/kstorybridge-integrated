# Documentation Index

**Last Updated**: 2026-07-13

This is the master index of all active documentation for the KStoryBridge project.

---

## 📖 Getting Started

- **[Root CLAUDE.md](../CLAUDE.md)** - Main documentation, quick reference, critical rules
- **[README.md](../README.md)** - Project overview and setup

---

## 🗂️ System Documentation

### Core Systems (`docs/active/`)

| Document | Description |
|----------|-------------|
| **[AUTH_DOCUMENTATION.md](active/AUTH_DOCUMENTATION.md)** | Complete authentication system reference |
| **[ANALYTICS_EVENT_CONTRACT.md](active/ANALYTICS_EVENT_CONTRACT.md)** | Canonical cross-app event names, triggers, parameters, ownership, and privacy rules |
| **[ANALYTICS_FOUNDER_DECISION_BRIEF.md](active/ANALYTICS_FOUNDER_DECISION_BRIEF.md)** | Recommended north star, activation, retention, operating-model, and outcome-authority decisions awaiting founder approval |
| **[ANALYTICS_OPERATING_ARCHITECTURE.md](active/ANALYTICS_OPERATING_ARCHITECTURE.md)** | Operating data flow, responsibilities, release gates, schedules, alerts, and runbook |
| **[ANALYTICS_RELIABILITY_EXECUTION_PLAN.md](active/ANALYTICS_RELIABILITY_EXECUTION_PLAN.md)** | Living analytics reliability plan, acceptance criteria, and progress log |
| **[ANALYTICS_OUTCOME_SOURCE_MAP.md](active/ANALYTICS_OUTCOME_SOURCE_MAP.md)** | GA-to-Supabase/Stripe reconciliation keys, timestamps, confidence, and known truth gaps |
| **[ANALYTICS_REPORT_DELIVERY_AUDIT_DESIGN.md](active/ANALYTICS_REPORT_DELIVERY_AUDIT_DESIGN.md)** | Secure scheduled-report authentication, idempotent delivery ledger, and two-run acceptance design |
| **[migration-root-history-reconstruction-2026-07-13.md](active/migration-root-history-reconstruction-2026-07-13.md)** | Safe root Supabase history reconstruction, local acceptance evidence, and production-ledger reconciliation procedure |
| **[DATABASE_SCHEMA.md](active/DATABASE_SCHEMA.md)** | Database schema and query patterns |
| **[DESIGN_SYSTEM.md](active/DESIGN_SYSTEM.md)** | UI/UX standards, components, color palette |
| **[CACHE_POLICY.md](active/CACHE_POLICY.md)** | Session-based caching implementation |
| **[LOCAL_VS_PRODUCTION_DIFFERENCES.md](active/LOCAL_VS_PRODUCTION_DIFFERENCES.md)** | Environment comparison |
| **[EMAIL_POLICY_DOCUMENTATION.md](active/EMAIL_POLICY_DOCUMENTATION.md)** | Email system guidelines |
| **[SLACK_BLACKLIST_DOCUMENTATION.md](active/SLACK_BLACKLIST_DOCUMENTATION.md)** | Notification management |
| **[SECURITY_BEST_PRACTICES.md](active/SECURITY_BEST_PRACTICES.md)** | Credential management |
| **[USER_JOURNEY_MAP.md](active/USER_JOURNEY_MAP.md)** | Complete user flows |
| **[BUYER_TIER_FEATURES_MANUAL.md](active/BUYER_TIER_FEATURES_MANUAL.md)** | Tier system features |
| **[TIER_SYSTEM_MANUAL.md](active/TIER_SYSTEM_MANUAL.md)** | Tier management guide |
| **[SLACK_NOTIFICATIONS_COMPREHENSIVE_GUIDE.md](active/SLACK_NOTIFICATIONS_COMPREHENSIVE_GUIDE.md)** | Slack integration |
| **[DATABASE_REFERENCE.md](active/DATABASE_REFERENCE.md)** | Database reference |

---

## 🚀 Feature Documentation

### AI Chatbot System (`docs/features/chatbot/`)

| Document | Description |
|----------|-------------|
| **[OVERVIEW.md](features/chatbot/OVERVIEW.md)** | AI chatbot system overview (Phases 1-3) |
| **[PHASE_1_2_SUMMARY.md](features/chatbot/PHASE_1_2_SUMMARY.md)** | Phase 1 & 2 test results and verification |
| **[PITCH_ANALYTICS.md](features/chatbot/PITCH_ANALYTICS.md)** | Phase 3 pitch analytics integration plan |
| **[TESTING_GUIDE.md](features/chatbot/TESTING_GUIDE.md)** | Testing procedures and log interpretation |

**Related**: [AI_CHATBOT_DOCUMENTATION.md](../apps/dashboard/public/docs/AI_CHATBOT_DOCUMENTATION.md) (user-facing)

### Title Intelligence System (`docs/features/`)

| Document | Description |
|----------|-------------|
| **[TITLE_INTELLIGENCE.md](features/TITLE_INTELLIGENCE.md)** | ⭐ Complete Title Intelligence documentation (2025-11-27) |
| ~~TITLE_INTELLIGENCE_SYSTEM.md~~ | Deprecated - see TITLE_INTELLIGENCE.md |
| ~~TITLE_INTELLIGENCE_IMPLEMENTATION.md~~ | Deprecated - see TITLE_INTELLIGENCE.md |
| ~~TITLE_INTELLIGENCE_QUICKSTART.md~~ | Deprecated - see TITLE_INTELLIGENCE.md |

Multi-platform scraping tool for collecting metadata and popularity signals:
- Korean platforms: Naver Webtoon, Naver Series, Kakao Page, Kakao Webtoon
- English platforms: Manta
- Fan engagement: Reddit, AO3
- Field-level ingestion with audit trail

### Comps Navigator System (`docs/features/comps-navigator/`)

| Document | Description |
|----------|-------------|
| **[OPTIMIZATION_COMPLETE.md](features/comps-navigator/OPTIMIZATION_COMPLETE.md)** | ⭐ Complete optimization documentation (95-98% faster) |
| **[COMPS_NAVIGATOR_SAMPLES.md](features/COMPS_NAVIGATOR_SAMPLES.md)** | ⭐ 37 comp combinations + 35 mandate samples (2025-12-17) |
| **[COMPS_NAVIGATOR_PLAN.md](features/COMPS_NAVIGATOR_PLAN.md)** | Original feature plan and architecture |
| **[COMPS_NAVIGATOR_EMBEDDING_FIX.md](COMPS_NAVIGATOR_EMBEDDING_FIX.md)** | Embedding null safety review |
| **[COMPS_NAVIGATOR_OPTIMIZATION_SUMMARY.md](COMPS_NAVIGATOR_OPTIMIZATION_SUMMARY.md)** | Phase 1 optimization summary |
| **[COMPS_NAVIGATOR_PHASE2_OPTIMIZATION.md](COMPS_NAVIGATOR_PHASE2_OPTIMIZATION.md)** | Phase 2 optimization summary |

**Related**: [COMPS_NAVIGATOR_USER_GUIDE.md](../apps/dashboard/public/docs/COMPS_NAVIGATOR_USER_GUIDE.md) (user-facing)

### Format Fit Analyzer (`docs/features/`)

| Document | Description |
|----------|-------------|
| **[FORMAT_FIT.md](features/FORMAT_FIT.md)** | ⭐ Complete Format Fit documentation (2025-12-16) |

AI-powered format fit analysis for 5 content formats:
- Film, TV Series, Animation, Microdrama, Audio Drama
- GPT-4o story deconstruction and scoring
- Discover Titles format filtering (score ≥ 50)
- Admin integration via TitleEditModal

---

## 📘 Setup Guides (`docs/guides/`)

### Deployment & Infrastructure

| Document | Description |
|----------|-------------|
| **[TURBOREPO_VERCEL_SETUP.md](guides/TURBOREPO_VERCEL_SETUP.md)** | Turborepo + Vercel selective deployment guide ⭐ NEW |
| **[GIT_DEPLOYMENT_STRUCTURE.md](guides/GIT_DEPLOYMENT_STRUCTURE.md)** | Complete Git deployment configuration reference |
| **[DEPLOYMENT_STRATEGY.md](guides/DEPLOYMENT_STRATEGY.md)** | Deployment architecture |
| **[DEPLOYMENT_INSTRUCTIONS.md](guides/DEPLOYMENT_INSTRUCTIONS.md)** | Deployment procedures |
| **[STRIPE_SETUP_GUIDE.md](guides/STRIPE_SETUP_GUIDE.md)** | Stripe payment integration |
| **[OPENAI_PRODUCTION_SETUP.md](guides/OPENAI_PRODUCTION_SETUP.md)** | OpenAI API setup |
| **[SLACK_NOTIFICATION_INTEGRATION.md](guides/SLACK_NOTIFICATION_INTEGRATION.md)** | Slack integration setup |

### Standards & Conventions

| Document | Description |
|----------|-------------|
| **[FIELD_NAMING_STANDARDS.md](guides/FIELD_NAMING_STANDARDS.md)** | Database field naming conventions |
| **[CREDENTIAL_ROTATION_CHECKLIST.md](guides/CREDENTIAL_ROTATION_CHECKLIST.md)** | Security credential rotation |
| **[TITLE_DETAIL_NEW_DESIGN.md](guides/TITLE_DETAIL_NEW_DESIGN.md)** | Title detail page design |
| **[SUGGESTION_DATA_POLICY.md](guides/SUGGESTION_DATA_POLICY.md)** | ⭐ Single source of truth for suggestion examples (2025-12-17) |

---

## 📱 App-Specific Documentation

### Dashboard App (`apps/dashboard/`)

| Document | Description |
|----------|-------------|
| **[CLAUDE.md](../apps/dashboard/CLAUDE.md)** | Dashboard app documentation (312 lines) |
| **[docs/TOAST_SYSTEM.md](../apps/dashboard/docs/TOAST_SYSTEM.md)** | Toast notification system |
| **[docs/PITCH_DECK_SYSTEM.md](../apps/dashboard/docs/PITCH_DECK_SYSTEM.md)** | Pitch deck extraction |
| **[PITCH_DECK_EXTRACTION_GUIDE.md](../apps/dashboard/PITCH_DECK_EXTRACTION_GUIDE.md)** | Complete pitch extraction guide |
| **[PITCH_DECK_EXTRACTION_CHANGELOG.md](../apps/dashboard/PITCH_DECK_EXTRACTION_CHANGELOG.md)** | Pitch extraction version history |

### Creator App (`apps/creator/`)

| Document | Description |
|----------|-------------|
| **[CLAUDE.md](../apps/creator/CLAUDE.md)** | Creator V2 app documentation (primary) |
| **[CREATOR_APP_V2_REBUILD_PLAN.md](CREATOR_APP_V2_REBUILD_PLAN.md)** | Complete V2 rebuild history (Phases 1-6) |
| **[CREATOR_APP_V2_PRD.md](CREATOR_APP_V2_PRD.md)** | Product requirements document |
| **[DEPLOYMENT_GUIDE.md](../apps/creator/DEPLOYMENT_GUIDE.md)** | Vercel deployment instructions |
| **[OAUTH_SETUP.md](../apps/creator/OAUTH_SETUP.md)** | OAuth configuration guide |
| **[TESTING_CHECKLIST.md](../apps/creator/TESTING_CHECKLIST.md)** | Manual testing checklist |

**Legacy Reference**:
- **[Creator V1 CLAUDE.md](../apps/creator-v1/CLAUDE.md)** - 🗄️ Archived (historical reference only)

### Website App (`apps/website/`)

| Document | Description |
|----------|-------------|
| **[CLAUDE.md](../apps/website/CLAUDE.md)** | Website app documentation |

---

## 📦 Historical Documentation (`docs/archive/`)

Archived deployment reports, test results, and historical guides. See `/docs/archive/` directory for:

- Phase deployment reports (PHASE_*.md)
- Production deployment logs (PRODUCTION_*.md)
- Launch readiness checks (LAUNCH_*.md)
- Test and audit reports (*_TEST_*.md, *_AUDIT_*.md)
- Historical OAuth and auth fixes (OAUTH_FIX*.md, SEALED_*.md)
- Security fixes and remediations (SECURITY_FIX*.md, RLS_POLICY*.md)
- Analytics setup guides (GTM_*.md, GA4_*.md)

**Note**: These files are kept for historical reference but are not actively maintained.

---

## 🔍 Quick Navigation

### By Topic

**Authentication**:
- [AUTH_DOCUMENTATION.md](active/AUTH_DOCUMENTATION.md) - Complete reference
- [Root CLAUDE.md](../CLAUDE.md#authentication-flow) - Quick reference

**Database**:
- [DATABASE_SCHEMA.md](active/DATABASE_SCHEMA.md) - Complete schema
- [DATABASE_REFERENCE.md](active/DATABASE_REFERENCE.md) - Reference guide

**Design**:
- [DESIGN_SYSTEM.md](active/DESIGN_SYSTEM.md) - Complete standards
- [Dashboard CLAUDE.md](../apps/dashboard/CLAUDE.md#design-guidelines) - Quick reference

**Chatbot**:
- [Chatbot OVERVIEW.md](features/chatbot/OVERVIEW.md) - System overview
- [PITCH_ANALYTICS.md](features/chatbot/PITCH_ANALYTICS.md) - Phase 3 integration

**Pitch Decks**:
- [PITCH_DECK_SYSTEM.md](../apps/dashboard/docs/PITCH_DECK_SYSTEM.md) - Quick reference
- [PITCH_DECK_EXTRACTION_GUIDE.md](../apps/dashboard/PITCH_DECK_EXTRACTION_GUIDE.md) - Complete guide

**Build System & Deployment**:
- [TURBOREPO_VERCEL_SETUP.md](guides/TURBOREPO_VERCEL_SETUP.md) - Turborepo selective deployments ⭐
- [GIT_DEPLOYMENT_STRUCTURE.md](guides/GIT_DEPLOYMENT_STRUCTURE.md) - Git/Vercel configuration
- [DEPLOYMENT_STRATEGY.md](guides/DEPLOYMENT_STRATEGY.md) - Deployment architecture

---

## 📊 Documentation Statistics

### Before Reorganization (2025-10-21)

- Root directory: 80+ markdown files
- Root CLAUDE.md: 398 lines
- Dashboard CLAUDE.md: 1,009 lines
- No clear categorization

### After Reorganization (2025-10-21)

- Root directory: 3 markdown files (CLAUDE.md, README.md)
- Root CLAUDE.md: ~400 lines (to be updated)
- Dashboard CLAUDE.md: 312 lines (69% reduction)
- Clear categorization:
  - `/docs/active/` - 13 system docs
  - `/docs/features/chatbot/` - 4 chatbot docs
  - `/docs/guides/` - 8 setup guides
  - `/docs/archive/` - ~50 historical docs

---

## 🎯 Documentation Principles

1. **Single Source of Truth** - Each topic has one authoritative document
2. **Clear Hierarchy** - Navigation from general (CLAUDE.md) to specific (feature docs)
3. **Active vs Archive** - Historical docs archived, not mixed with active docs
4. **Concise Main Docs** - CLAUDE.md files are quick reference with links to detailed docs
5. **Regular Updates** - Update "Last Updated" dates when making changes

---

**For quick start, see [Root CLAUDE.md](../CLAUDE.md)**
**For app-specific guidance, see app CLAUDE.md files**
