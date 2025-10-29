# Documentation Index

**Last Updated**: 2025-10-28

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

---

## 📘 Setup Guides (`docs/guides/`)

### Deployment & Infrastructure

| Document | Description |
|----------|-------------|
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

### Creator App (`apps/creator-v2/`)

| Document | Description |
|----------|-------------|
| **[CLAUDE.md](../apps/creator-v2/CLAUDE.md)** | Creator V2 app documentation (primary) |
| **[CREATOR_APP_V2_REBUILD_PLAN.md](CREATOR_APP_V2_REBUILD_PLAN.md)** | Complete V2 rebuild history (Phases 1-6) |
| **[CREATOR_APP_V2_PRD.md](CREATOR_APP_V2_PRD.md)** | Product requirements document |
| **[DEPLOYMENT_GUIDE.md](../apps/creator-v2/DEPLOYMENT_GUIDE.md)** | Vercel deployment instructions |
| **[OAUTH_SETUP.md](../apps/creator-v2/OAUTH_SETUP.md)** | OAuth configuration guide |
| **[TESTING_CHECKLIST.md](../apps/creator-v2/TESTING_CHECKLIST.md)** | Manual testing checklist |

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
