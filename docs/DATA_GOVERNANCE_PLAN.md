# Title Data Governance Plan

**Created**: 2026-01-07
**Status**: Implementation Complete (2026-01-08)
**Priority**: High (Critical audit gap identified)

---

## Overview

This document establishes data governance policies for title data across all sources (Creator App, Dashboard Admin, Automated Tools). It addresses data ownership, source of truth hierarchy, and audit logging requirements.

---

## Progress Tracker

### Phase 1: Fix Critical Audit Gap (Priority 1) ✅ COMPLETE
- [x] Add `ingestToTitleWithAudit()` to `packages/tools/src/services/intelligenceService.ts` ✅ (2026-01-07)
- [x] Update `directIngestToTitle()` with deprecation notice ✅ (2026-01-07)
- [x] Export function from services index ✅ (2026-01-07)
- [x] Update dashboard wrapper service ✅ (2026-01-07)
- [x] Update TitleEditModal to use audited ingestion ✅ (2026-01-07)
- [x] Verify build compiles successfully ✅ (2026-01-07)

### Phase 2: Add Admin Edit Tracking (Priority 2) ✅ COMPLETE
- [x] Create migration `20260108000710_add_title_edit_history.sql` ✅ (2026-01-08)
- [x] Apply migration to database ✅ (2026-01-08)
- [x] Update `apps/dashboard/src/components/admin/TitleEditModal.tsx` with audit logging ✅ (2026-01-08)
- [ ] Test admin edits create history entries

### Phase 3: Add Field Provenance Columns (Priority 3) ✅ COMPLETE
- [x] Create migration `20260108001000_add_provenance_columns.sql` ✅ (2026-01-08)
- [x] Apply migration to database ✅ (2026-01-08)
- [x] Update all data entry points to set `last_modified_by` and `last_modified_source` ✅ (2026-01-08)
  - TitleEditModal.tsx (admin edits) - sets 'admin' source
  - ingestToTitleWithAudit() - sets 'intelligence' source
  - directIngestToTitle() - sets 'system' source (deprecated)
- [ ] Test provenance tracking

### Phase 4: Documentation (Priority 4) ✅ COMPLETE
- [x] Create `/docs/DATA_GOVERNANCE_POLICY.md` (permanent policy doc) ✅ (2026-01-08)
- [ ] Update CLAUDE.md files with data governance references (optional)

---

## Data Source Classification

### Source 1: Creator Input (85+ fields)
**Owner**: Content Creator
**Authority**: Creative content, authorship, rights

**Entry Points**:
- Quick Add (`/titles/add`) - 6 core fields
- 5-Step Survey (`/titles/add-title`) - 100+ fields
- Edit Form (`/titles/:id/edit`) - All fields

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

### Source 3: Admin Editorial (73+ fields)
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

## Source of Truth Hierarchy

```
Priority Order (Highest to Lowest):

1. CREATOR INPUT (creative content)
   └─ Story content, author names, rights info
   └─ Creator corrections always take precedence

2. ADMIN EDITORIAL (business decisions)
   └─ Visibility, priority, editorial notes
   └─ Can override any field for business reasons

3. PLATFORM INTELLIGENCE (metrics)
   └─ Views, ratings, subscribers, chapters
   └─ Most accurate for metrics when scraped

4. AI-GENERATED (derived)
   └─ Embeddings, format-fit, comps
   └─ Regenerated as needed
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

## Critical Gap: Audit Logging

### Problem Identified

**Location**: `packages/tools/src/services/intelligenceService.ts:350-368`

The shared `directIngestToTitle()` function **bypasses audit logging** despite the `intelligence_ingestion_log` table existing:

```typescript
// BROKEN: No audit logging
export async function directIngestToTitle(
  supabase: SupabaseClientType,
  titleId: string,
  fields: Partial<ExtractedIntelligenceData>
): Promise<void> {
  const updateData = { ...fields, updated_at: new Date().toISOString() };
  // NO old value capture, NO source tracking, NO audit log
  await supabase.from('titles').update(updateData).eq('title_id', titleId);
}
```

### Correct Pattern (Reference)

**Location**: `apps/creator/src/services/intelligenceService.ts:334-431`

```typescript
// CORRECT: Full audit logging
export async function executeIngestion(requestId: string, executedBy: string) {
  // 1. Fetch current values
  const { data: currentTitle } = await supabase.from('titles').select('*')...

  // 2. Build audit record with old/new values
  const ingestedFields = { [field]: { old_value, new_value, source, source_id } }

  // 3. Update title
  await supabase.from('titles').update(...)

  // 4. Create audit log entry ✅
  await supabase.from('intelligence_ingestion_log').insert({...})
}
```

### Existing Audit Table

Table `intelligence_ingestion_log` already exists (migration `20251127000000`):

```sql
CREATE TABLE intelligence_ingestion_log (
  id uuid PRIMARY KEY,
  ingestion_request_id uuid,
  intelligence_title_id uuid NOT NULL,
  target_title_id uuid NOT NULL,
  ingested_fields jsonb NOT NULL,  -- { field: { old_value, new_value, source } }
  ingested_by text NOT NULL,
  ingested_at timestamptz,
  notes text
);
```

---

## Implementation Details

### Phase 1: Fix Audit Gap

**File**: `packages/tools/src/services/intelligenceService.ts`

Add new function:
```typescript
export async function ingestToTitleWithAudit(
  supabase: SupabaseClientType,
  titleId: string,
  fields: Partial<ExtractedIntelligenceData>,
  intelligenceTitleId: string,
  ingestedBy: string,
  notes?: string
): Promise<void> {
  // 1. Fetch current title for old values
  const { data: currentTitle } = await supabase
    .from('titles').select('*').eq('title_id', titleId).single();

  // 2. Build audit record
  const ingestedFields: Record<string, IngestedField> = {};
  for (const [key, value] of Object.entries(fields)) {
    ingestedFields[key] = {
      old_value: currentTitle?.[key] ?? null,
      new_value: value,
      source: 'intelligence',
      source_id: intelligenceTitleId,
    };
  }

  // 3. Update title
  await supabase.from('titles').update({
    ...fields, updated_at: new Date().toISOString()
  }).eq('title_id', titleId);

  // 4. Create audit log
  await supabase.from('intelligence_ingestion_log').insert({
    intelligence_title_id: intelligenceTitleId,
    target_title_id: titleId,
    ingested_fields: ingestedFields,
    ingested_by: ingestedBy,
    notes,
  });
}
```

### Phase 2: Admin Edit Tracking

**Migration** (`supabase/migrations/YYYYMMDD_add_title_edit_history.sql`):
```sql
CREATE TABLE title_edit_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title_id uuid NOT NULL REFERENCES titles(title_id) ON DELETE CASCADE,
  edited_by text NOT NULL,
  edit_source text NOT NULL DEFAULT 'admin',
  changed_fields jsonb NOT NULL,
  edit_reason text,
  created_at timestamptz DEFAULT now()
);
CREATE INDEX idx_title_edit_history_title ON title_edit_history(title_id);
```

**Code Change** (`apps/dashboard/src/components/admin/TitleEditModal.tsx`):
```typescript
// Before updating title, log changes
const changedFields = {};
for (const [key, newValue] of Object.entries(formData)) {
  if (originalData[key] !== newValue) {
    changedFields[key] = { old: originalData[key], new: newValue };
  }
}
if (Object.keys(changedFields).length > 0) {
  await supabase.from('title_edit_history').insert({
    title_id, edited_by: user.email, edit_source: 'admin', changed_fields
  });
}
```

### Phase 3: Provenance Columns

**Migration** (`supabase/migrations/YYYYMMDD_add_provenance_columns.sql`):
```sql
ALTER TABLE titles ADD COLUMN IF NOT EXISTS last_modified_by text;
ALTER TABLE titles ADD COLUMN IF NOT EXISTS last_modified_source text DEFAULT 'system';

COMMENT ON COLUMN titles.last_modified_by IS 'Email of last modifier';
COMMENT ON COLUMN titles.last_modified_source IS 'Source: creator|admin|intelligence|ai|system';
```

---

## Files to Modify

| File | Changes | Phase |
|------|---------|-------|
| `packages/tools/src/services/intelligenceService.ts` | Add `ingestToTitleWithAudit()` | 1 |
| `apps/dashboard/src/components/admin/TitleEditModal.tsx` | Add edit history logging | 2 |
| `supabase/migrations/YYYYMMDD_add_title_edit_history.sql` | Create table | 2 |
| `supabase/migrations/YYYYMMDD_add_provenance_columns.sql` | Add columns | 3 |

---

## Testing Checklist

### Phase 1
- [ ] Ingest via Intelligence → check `intelligence_ingestion_log` entry
- [ ] Verify old/new values captured correctly
- [ ] Verify `ingested_by` email recorded

### Phase 2
- [ ] Edit title in admin panel → check `title_edit_history` entry
- [ ] Verify only changed fields logged
- [ ] Verify admin email recorded

### Phase 3
- [ ] Create title → `last_modified_source = 'creator'`
- [ ] Admin edit → `last_modified_source = 'admin'`
- [ ] Intelligence ingest → `last_modified_source = 'intelligence'`

---

## Risk Assessment

| Risk | Severity | Mitigation |
|------|----------|------------|
| Breaking existing ingestion | Medium | Keep `directIngestToTitle()` as wrapper |
| Performance impact | Low | Async logging, non-blocking |
| Migration failures | Low | Non-destructive ALTERs only |
| Incomplete audit history | Low | Only affects new changes |

---

## References

- Plan file: `/Users/sungholee/.claude/plans/smooth-imagining-feather.md`
- Intelligence service: `packages/tools/src/services/intelligenceService.ts`
- Creator ingestion: `apps/creator/src/services/intelligenceService.ts`
- Audit table migration: `supabase/migrations/20251127000000_add_ingestion_tables.sql`
