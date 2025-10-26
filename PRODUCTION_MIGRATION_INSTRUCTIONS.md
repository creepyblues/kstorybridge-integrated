# Production Migration Instructions - Survey Feature

**Date**: 2025-10-25
**Status**: Ready for execution
**Estimated Time**: 5 minutes

---

## Problem

The creator-v2 survey feature is failing with:
```
POST /rest/v1/title_drafts 404 (Not Found)
```

**Root Cause**: The `title_drafts`, `title_platforms`, and `title_documents` tables don't exist in production database yet.

---

## Solution

Apply the consolidated migration script via Supabase SQL Editor.

---

## Step-by-Step Instructions

### 1. Open Supabase SQL Editor

**URL**: https://supabase.com/dashboard/project/dlrnrgcoguxlkkcitlpd/sql/new

(Or navigate to: Dashboard → Project dlrnrgcoguxlkkcitlpd → SQL Editor → New Query)

### 2. Copy the Migration Script

**File Location**: `/Users/sungholee/code/kstorybridge/APPLY_SURVEY_MIGRATIONS_PRODUCTION.sql`

Open the file and copy all contents (it's a consolidated script with all 4 migrations).

### 3. Paste into SQL Editor

Paste the entire script into the Supabase SQL Editor.

### 4. Review the Script (Optional)

The script will:
- ✅ Create 3 new tables (title_platforms, title_documents, title_drafts)
- ✅ Add 30+ new columns to titles table (all NULLABLE)
- ✅ Create indexes for performance
- ✅ Enable RLS policies
- ✅ Add triggers for updated_at timestamps
- ✅ Run verification queries

**Safety Features**:
- Uses `IF NOT EXISTS` - won't fail if already exists
- All new columns NULLABLE - backward compatible
- DO blocks prevent duplicate policy errors
- Zero breaking changes to dashboard

### 5. Execute the Script

Click "Run" or press Cmd+Enter (Mac) / Ctrl+Enter (Windows).

### 6. Verify Success

Check the Results panel for:

```sql
table_name       | row_count
-----------------|----------
title_platforms  | 0
title_documents  | 0
title_drafts     | 0

column_name                 | data_type
----------------------------|----------
character_details           | jsonb
creator_achievements        | jsonb
is_official_english_title   | boolean
story_structure             | text

status
------
SUCCESS: Survey feature migrations applied to production!
```

---

## Post-Migration Testing

### 1. Refresh Creator-V2 Survey Page

**URL**: http://localhost:8085/titles/add-survey

### 2. Test Auto-Save

- Fill form data in Step 1
- Wait 30 seconds (or click "Save Draft Now")
- Auto-save indicator should show "Saved" (green checkmark)
- No more 404 errors in console

### 3. Test Draft Resume

- Refresh the page (F5)
- Data should be restored from draft
- Current step should be preserved

### 4. Test Submission

- Complete all required fields:
  - Step 2: Setting description + 1 character
  - Step 3: Story structure
- Submit the survey
- Verify new title created in database

---

## Dashboard Regression Testing

**CRITICAL**: Verify dashboard still works

1. **Test AI Chatbot**: https://dashboard.kstorybridge.com/chat
   - Should load without errors
   - Chat functionality works

2. **Test Titles List**: https://dashboard.kstorybridge.com/buyers/titles
   - Should load existing titles
   - No console errors

3. **Test Title Detail**: Click any title
   - Should show title details
   - No missing fields

---

## Rollback Plan (If Needed)

If critical issues occur, run the rollback script:

**File**: `/Users/sungholee/code/kstorybridge/rollback_questionnaire_changes.sql`

**Steps**:
1. Open Supabase SQL Editor
2. Paste rollback script
3. Execute
4. This will:
   - Drop all 3 new tables
   - Drop all 30+ new columns from titles table
   - Execution time: <2 minutes

---

## What Gets Created

### New Tables (3)

**title_platforms**:
- Purpose: Store multiple platform URLs (Naver, Kakao, Lezhin, etc.)
- Key Fields: platform_name, platform_url, views, subscribers
- Constraint: UNIQUE(title_id, platform_name) - one entry per platform per title

**title_documents**:
- Purpose: Store document metadata for file uploads
- Key Fields: document_type, file_url, file_name, shareable_with_nda
- Storage Bucket: title-documents (needs manual setup in Storage section)

**title_drafts**:
- Purpose: Auto-save functionality for incomplete surveys
- Key Fields: creator_id, draft_data (JSONB), current_step (1-5)
- Constraint: UNIQUE(creator_id) - one draft per creator

### New Columns in titles table (30+)

**Step 1 Fields**:
- is_official_english_title, english_title_type
- script_title_kr, script_title_en
- art_title_kr, art_title_en
- underlying_novel_kr, underlying_novel_en
- rights_holder_name, rights_holder_company

**Step 2 Fields**:
- inspiration, important_issues
- setting_description, world_lore, supernatural_concepts
- character_details (JSONB array)

**Step 3 Fields**:
- story_structure, planned_ending, narrative_arc

**Step 5 Fields**:
- awards (TEXT[]), sales_records, merchandise_deals
- print_editions, print_edition_details
- media_coverage, celebrity_endorsements
- creator_achievements (JSONB object)

---

## Success Criteria

✅ All 3 tables created
✅ All 30+ columns added to titles table
✅ RLS policies active
✅ Triggers created for updated_at
✅ No errors in dashboard
✅ Auto-save works in creator-v2
✅ Draft save/load works
✅ Survey submission creates title with questionnaire data

---

## Timeline

| Task | Time |
|------|------|
| Copy/paste script | 1 min |
| Execute script | 1 min |
| Verify results | 1 min |
| Test auto-save | 2 min |
| **Total** | **5 min** |

---

## Support

If you encounter errors:

1. **Check Supabase logs**: Dashboard → Logs → Postgres
2. **Check script output**: Look for ERROR messages in Results panel
3. **Share error message**: Copy full error text for debugging
4. **Rollback if needed**: Use rollback script to revert changes

---

## Notes

- The script is idempotent (can be run multiple times safely)
- All changes are backward compatible
- Dashboard functionality will not be affected
- Migration history may show as "out of sync" - this is expected, ignore it

---

**Created**: 2025-10-25
**Ready**: ✅ Yes
**Next Step**: Execute `APPLY_SURVEY_MIGRATIONS_PRODUCTION.sql` in Supabase SQL Editor
