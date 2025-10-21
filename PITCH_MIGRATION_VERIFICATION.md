# Pitch Analytics Migration - Verification Queries

**Date**: 2025-10-21
**Purpose**: Verify the pitch analytics database migration is applied correctly

---

## ✅ Quick Test (Recommended - Run This First)

This query will immediately tell you if the migration is applied:

```sql
-- Test if pitch_analysis and processing_confidence columns are accessible
SELECT
  title_name_en,
  title_name_kr,
  pitch_analysis,
  processing_confidence
FROM match_titles_by_embedding(
  array_fill(0.1, ARRAY[1536])::vector,
  0.1,
  3
)
LIMIT 3;
```

### Possible Results:

**✅ SUCCESS** - Query returns 3 rows with columns:
- `title_name_en`
- `title_name_kr`
- `pitch_analysis` (JSONB - may be NULL)
- `processing_confidence` (numeric - may be NULL)

**→ Migration is applied! Skip to enabling feature flag.**

---

**❌ ERROR** - "column pitch_analysis does not exist" or similar:

**→ Migration needs to be applied. Continue to Step 1 below.**

---

## Step 1: Apply Migration (If Test Failed)

Copy and run this SQL in Supabase SQL Editor:

```sql
-- Migration: Add pitch analytics to vector search results
-- Date: 2025-10-21

-- Drop existing function
DROP FUNCTION IF EXISTS match_titles_by_embedding(vector, float, int);
DROP FUNCTION IF EXISTS match_titles_by_embedding(vector(1536), float, int);

-- Recreate with pitch analytics fields
CREATE OR REPLACE FUNCTION match_titles_by_embedding(
  query_embedding vector(1536),
  match_threshold float DEFAULT 0.7,
  match_count int DEFAULT 10
)
RETURNS TABLE (
  title_id uuid,
  title_name_en text,
  title_name_kr text,
  description text,
  similarity float,
  synopsis text,
  genre text[],
  tone text,
  content_format text,
  perfect_for text,
  audience text,
  age_rating text,
  story_author text,
  art_author text,
  comps text[],
  pitch_analysis jsonb,
  processing_confidence float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    t.title_id,
    t.title_name_en,
    t.title_name_kr,
    COALESCE(t.synopsis, t.description_kr, '')::text as description,
    (1 - (t.combined_embedding <=> query_embedding))::float AS similarity,
    t.synopsis,
    t.genre,
    t.tone,
    t.content_format::text,
    t.perfect_for,
    t.audience,
    t.age_rating,
    t.story_author,
    t.art_author,
    t.comps,
    tca.pitch_analysis,
    tca.processing_confidence
  FROM titles t
  LEFT JOIN title_content_analysis tca ON t.title_id = tca.title_id
  WHERE t.combined_embedding IS NOT NULL
    AND (1 - (t.combined_embedding <=> query_embedding)) > match_threshold
  ORDER BY t.combined_embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

COMMENT ON FUNCTION match_titles_by_embedding IS 'Vector similarity search with pitch analytics';
```

---

## Step 2: Verify Migration Applied

After applying the migration, run the Quick Test query again. It should now succeed.

---

## Additional Verification Queries (Optional)

### Check Function Exists

```sql
SELECT EXISTS (
  SELECT 1
  FROM pg_proc p
  JOIN pg_namespace n ON p.pronamespace = n.oid
  WHERE n.nspname = 'public'
    AND p.proname = 'match_titles_by_embedding'
) as function_exists;
```

**Expected**: `true`

### View Function Definition

```sql
SELECT pg_get_functiondef(oid) as function_definition
FROM pg_proc
WHERE proname = 'match_titles_by_embedding'
  AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public');
```

**Look for**: `pitch_analysis jsonb` and `processing_confidence float` in the RETURNS TABLE section

### Check Pitch Data Availability

```sql
-- Count titles with pitch analytics data
SELECT
  COUNT(*) as total_titles,
  COUNT(pitch_analysis) as titles_with_pitch,
  ROUND(100.0 * COUNT(pitch_analysis) / COUNT(*), 1) as coverage_percent
FROM title_content_analysis;
```

**Shows**: How many titles have pitch data available

### Sample Pitch Data

```sql
-- View sample pitch analytics data
SELECT
  t.title_name_en,
  tca.processing_confidence,
  jsonb_pretty(tca.pitch_analysis) as pitch_data
FROM title_content_analysis tca
JOIN titles t ON t.title_id = tca.title_id
WHERE tca.pitch_analysis IS NOT NULL
  AND tca.processing_confidence >= 0.70
LIMIT 1;
```

**Shows**: Actual pitch analytics structure for one title

---

## Troubleshooting

### Error: "function match_titles_by_embedding does not exist"

**Solution**: Apply the migration SQL from Step 1.

### Error: "relation title_content_analysis does not exist"

**Check**: Does the table exist?

```sql
SELECT EXISTS (
  SELECT 1 FROM information_schema.tables
  WHERE table_schema = 'public'
    AND table_name = 'title_content_analysis'
) as table_exists;
```

**If false**: You need to apply pitch deck extraction migrations first:
- `20250119000000_add_pitch_extraction_v2_fields.sql`
- `20250119000001_add_pitch_analysis_jsonb.sql`

### Query Succeeds But All pitch_analysis are NULL

**This is normal if**:
- Pitch deck extraction hasn't been run yet for titles
- Titles don't have pitch decks uploaded

**To check**: Run the "Check Pitch Data Availability" query above

---

## Success Criteria

✅ Quick Test query executes without errors
✅ Function returns 17 columns
✅ At least some titles show `pitch_analysis` data (not all NULL)
✅ `processing_confidence` values are between 0.0 and 1.0 where present

---

## Next Step

Once verified, proceed to enable the feature flag:

**URL**: https://supabase.com/dashboard/project/dlrnrgcoguxlkkcitlpd/functions/chat-orchestrator

**Environment Variable**:
- Key: `ENABLE_PITCH_CONTEXT`
- Value: `true`

Then **Redeploy** the edge function.
