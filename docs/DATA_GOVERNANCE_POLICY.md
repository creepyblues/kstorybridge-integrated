# Title Data Governance Policy

**Status**: Active
**Last Updated**: 2026-01-08
**Version**: 1.0

---

## Overview

This document establishes data governance policies for title data across all sources in the KStoryBridge platform. It defines field ownership, source of truth hierarchy, audit logging requirements, and override procedures.

---

## 1. Data Source Classification

### Source 1: Creator Input
**Owner**: Content Creator
**Authority**: Creative content, authorship, rights

**Entry Points**:
- Quick Add (`/titles/add`) - 6 core fields
- 5-Step Survey (`/titles/add-title`) - 100+ fields
- Edit Form (`/titles/:id/edit`) - All editable fields

**Key Fields Owned**:
| Field | DB Column |
|-------|-----------|
| Title names | `title_name_kr`, `title_name_en` |
| Authors | `story_author`, `art_author`, `original_author` |
| Synopsis | `synopsis`, `synopsis_kr` |
| Story details | `inspiration`, `setting_description`, `world_lore` |
| Rights | `rights_available[]`, `rights_holder_name` |
| Achievements | `awards[]`, `sales_records`, `media_coverage` |
| Documents | `title_documents` table |
| Platforms | `title_platforms` table |

### Source 2: Platform Intelligence (Automated)
**Owner**: System
**Authority**: Platform-specific metrics

**Entry Point**: Title Intelligence System

**Supported Platforms**:
- Naver Webtoon, Naver Series
- Kakao Page, Kakao Webtoon
- Manta

**Key Fields Owned**:
| Intelligence Field | Maps To |
|--------------------|---------|
| `views` | `titles.views` |
| `subscribers` | `titles.likes` |
| `rating_score` | `titles.rating` |
| `rating_count` | `titles.rating_count` |
| `episode_count` | `titles.chapters` |
| `synopsis_kr` | `titles.synopsis_kr` (if empty) |
| `thumbnail` | `titles.title_image` |

### Source 3: Admin Editorial
**Owner**: Admin Team
**Authority**: Business, editorial, visibility

**Entry Point**: Dashboard Admin Panel (`/admin/titles/:id/edit`)

**Admin-Only Fields**:
| Field | DB Column |
|-------|-----------|
| Priority | `priority` |
| Verified | `verified` |
| Description | `description` |
| Notes | `note`, `note_kr` |
| CP | `cp` |

### Source 4: AI-Generated
**Owner**: System
**Authority**: Derived insights

**Entry Points**:
- `generate-embedding` - Vector embeddings
- `format-fit-analyze` - Format scores
- `comps-generator` - Comparable titles
- `fan-signal` - Fan engagement analysis

### Source 5: System-Generated
**Owner**: System
**Authority**: Timestamps, IDs

**Fields**: `title_id`, `created_at`, `updated_at`, `creator_id`

---

## 2. Source of Truth Hierarchy

### Priority Order (Highest to Lowest)

```
1. CREATOR INPUT (creative content)
   - Story content, author names, rights info
   - Creator corrections always take precedence

2. ADMIN EDITORIAL (business decisions)
   - Visibility, priority, editorial notes
   - Can override any field for business reasons

3. PLATFORM INTELLIGENCE (metrics)
   - Views, ratings, subscribers, chapters
   - Most accurate for metrics when scraped

4. AI-GENERATED (derived)
   - Embeddings, format-fit, comps
   - Regenerated as needed
```

### Field-Specific Rules

| Field Category | Source of Truth | Override Rules |
|----------------|-----------------|----------------|
| Title names | Creator | Admin can edit for marketing |
| Authors | Creator | Intelligence only if empty |
| Synopsis | Creator | Admin can enhance |
| Metrics (views/rating) | Intelligence | Admin manual override allowed |
| Rights | Creator | Cannot be overridden |
| Visibility | Admin | Creator cannot control |
| Embeddings | AI | Auto-regenerate on content change |

---

## 3. Audit Logging Requirements

### Audit Tables

| Table | Purpose | Tracked Sources |
|-------|---------|-----------------|
| `intelligence_ingestion_log` | Intelligence data ingestion | Platform scrapers |
| `title_edit_history` | Manual edits | Admin, Creator, API |

### Required Audit Fields

For `intelligence_ingestion_log`:
- `intelligence_title_id` - Source intelligence record
- `target_title_id` - Title being updated
- `ingested_fields` - JSON with `{ field: { old_value, new_value, source, source_id } }`
- `ingested_by` - Email of user triggering ingestion
- `ingested_at` - Timestamp

For `title_edit_history`:
- `title_id` - Title being edited
- `edited_by` - Email of editor
- `edit_source` - 'admin' | 'creator' | 'system' | 'api'
- `changed_fields` - JSON with `{ field: { old, new } }`
- `edit_reason` - Optional reason for edit
- `created_at` - Timestamp

### Provenance Columns on Titles Table

Every title update must set these fields:
- `last_modified_by` - Email of last modifier (null for system)
- `last_modified_source` - 'creator' | 'admin' | 'intelligence' | 'ai' | 'system'

---

## 4. Code Implementation

### Functions with Audit Logging

```typescript
// Intelligence ingestion WITH audit - PREFERRED
import { ingestToTitleWithAudit } from '@kstorybridge/tools';

await ingestToTitleWithAudit(
  supabase,
  titleId,
  fields,
  intelligenceTitleId,
  userEmail,
  'Optional notes'
);

// Direct update WITHOUT audit - DEPRECATED
// Only use when intelligenceTitleId unavailable
import { directIngestToTitle } from '@kstorybridge/tools';
```

### Admin Edit Pattern

```typescript
// TitleEditModal.tsx pattern
const handleSave = async () => {
  // 1. Build changed fields audit record
  const changedFields = {};
  for (const [key, newValue] of Object.entries(updates)) {
    if (originalData[key] !== newValue) {
      changedFields[key] = { old: originalData[key], new: newValue };
    }
  }

  // 2. Update title with provenance
  await updateTitle(titleId, {
    ...updates,
    last_modified_by: user.email,
    last_modified_source: 'admin',
  });

  // 3. Log to title_edit_history
  if (Object.keys(changedFields).length > 0) {
    await supabase.from('title_edit_history').insert({
      title_id: titleId,
      edited_by: user.email,
      edit_source: 'admin',
      changed_fields: changedFields,
    });
  }
};
```

---

## 5. Override Procedures

### When Admin Overrides Creator Data

1. Admin makes edit in TitleEditModal
2. System logs change with `edit_source: 'admin'`
3. `last_modified_source` becomes 'admin'
4. Creator can view audit trail but cannot revert directly

### When Intelligence Overwrites Manual Data

1. User explicitly clicks "Ingest" button
2. System shows preview of changes (old vs new values)
3. User confirms ingestion
4. Audit record created with both old/new values
5. `last_modified_source` becomes 'intelligence'

### Reverting Changes

To revert a change:
1. Query `title_edit_history` or `intelligence_ingestion_log`
2. Find the relevant audit record
3. Manually restore old values with new edit (creates new audit entry)

---

## 6. Data Quality Standards

### Required Fields

Every title must have:
- `title_name_en` OR `title_name_kr` (at least one)
- `content_format`
- `creator_id` (link to creator)

### Validation Rules

| Field | Validation |
|-------|------------|
| `views` | Non-negative integer |
| `rating` | 0.0 - 5.0 (or 0.0 - 10.0 per platform) |
| `genre` | Array from allowed genre list |
| `content_format` | Enum: webtoon, web_novel, book, script, etc. |

### Staleness Thresholds

| Data Type | Refresh Frequency |
|-----------|-------------------|
| Platform metrics | 7 days |
| Embeddings | On content change |
| Format-fit scores | 30 days |

---

## 7. Related Files

### Migration Files
- `20251127000000_add_ingestion_tables.sql` - Intelligence audit tables
- `20260108000710_add_title_edit_history.sql` - Admin edit audit table
- `20260108001000_add_provenance_columns.sql` - Provenance tracking columns

### Service Files
- `packages/tools/src/services/intelligenceService.ts` - Audited ingestion functions
- `apps/dashboard/src/components/admin/TitleEditModal.tsx` - Admin edit logging
- `apps/creator/src/services/intelligenceService.ts` - Creator app ingestion

### Documentation
- `docs/DATA_GOVERNANCE_PLAN.md` - Implementation tracker
- `docs/active/DATABASE_SCHEMA.md` - Complete schema reference

---

## Changelog

| Date | Version | Change |
|------|---------|--------|
| 2026-01-08 | 1.0 | Initial policy document |
