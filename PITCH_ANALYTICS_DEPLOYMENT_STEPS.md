# Pitch Analytics Deployment Guide

**Date**: 2025-10-21
**Status**: Ready for Deployment

---

## 📋 Pre-Deployment Checklist

- [x] Edge function deployed with pitch analytics code
- [x] TypeScript interfaces defined in chat-orchestrator
- [x] Feature flag `ENABLE_PITCH_CONTEXT` implemented
- [x] Migration file created: `20251021000000_add_pitch_to_vector_search.sql`
- [ ] Migration applied to production database
- [ ] Feature flag enabled
- [ ] Initial monitoring complete

---

## Step 1: Apply Database Migration

### Via Supabase SQL Editor

**URL**: https://supabase.com/dashboard/project/dlrnrgcoguxlkkcitlpd/sql

**SQL to Execute**:

```sql
-- Migration: Add pitch analytics to vector search results
-- Date: 2025-10-21
-- Purpose: Enable chatbot to use pitch deck analytics for richer responses

-- Drop existing function (all possible signatures)
DROP FUNCTION IF EXISTS match_titles_by_embedding(vector, float, int);
DROP FUNCTION IF EXISTS match_titles_by_embedding(vector(1536), float, int);

-- Recreate with pitch analytics fields (backward compatible)
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

## Step 2: Verify Migration

### Test Function Structure

Run this query to verify the function has the correct columns:

```sql
SELECT column_name, data_type, ordinal_position
FROM information_schema.routine_columns
WHERE routine_name = 'match_titles_by_embedding'
AND routine_schema = 'public'
ORDER BY ordinal_position;
```

**Expected Output**: 17 rows showing all columns including `pitch_analysis` (jsonb) and `processing_confidence` (double precision)

### Test Function Execution

```sql
SELECT
  title_name_en,
  pitch_analysis IS NOT NULL as has_pitch_data,
  processing_confidence
FROM match_titles_by_embedding(
  array_fill(0.1, ARRAY[1536])::vector,
  0.1,
  5
);
```

**Expected Output**: 5 titles with boolean `has_pitch_data` and numeric `processing_confidence` values

---

## Step 3: Record Migration in History

```sql
INSERT INTO supabase_migrations.schema_migrations (version, name, statements)
VALUES (
  '20251021000000',
  'add_pitch_to_vector_search',
  ARRAY['CREATE OR REPLACE FUNCTION match_titles_by_embedding']
)
ON CONFLICT (version) DO NOTHING;
```

---

## Step 4: Enable Feature Flag

### Via Supabase Dashboard

1. **Navigate to**: Edge Functions → chat-orchestrator → Settings → Environment Variables
2. **Add new environment variable**:
   - **Key**: `ENABLE_PITCH_CONTEXT`
   - **Value**: `true`
3. **Save** and **Redeploy** the edge function

### Verification

Check edge function logs (https://supabase.com/dashboard/project/dlrnrgcoguxlkkcitlpd/functions/chat-orchestrator/logs):

Look for log entry:
```
📊 Pitch Analytics Status: { featureEnabled: true, ... }
```

---

## Step 5: Initial Monitoring (First Hour)

### Metrics to Track

**Edge Function Logs** - Monitor for:

1. **Pitch Usage Rate**:
   ```
   📊 Pitch Analytics Status: {
     featureEnabled: true,
     totalResults: 10,
     withPitchData: 6,
     coveragePercent: 60
   }
   ```
   - Target: `coveragePercent` > 30%

2. **Token Counts**:
   ```
   📊 Pitch context formatted: 450 tokens (max: 800)
   ```
   - Target: < 800 tokens per title

3. **Hallucination Warnings**:
   ```
   ⚠️ Title hallucinations detected: [...]
   ```
   - Target: < 5% of queries

4. **Error Rate**:
   - Look for `❌` entries
   - Target: < 1%

5. **Response Times**:
   - Observe query completion times
   - Target: 3-5 seconds

### Manual Testing

Test these query types:

**Character Query**:
```
"Who are the main characters in True Beauty?"
```
Expected: Should mention character names, archetypes, descriptions from pitch_analysis

**Theme Query**:
```
"What are the main themes in Solo Leveling?"
```
Expected: Should reference primary_themes from pitch_analysis

**Market Query**:
```
"What is Omniscient Reader's Viewpoint similar to?"
```
Expected: Should reference comparable_titles from pitch_analysis

---

## Step 6: Extended Monitoring (24-48 Hours)

### Key Performance Indicators

| Metric | Baseline (Phase 1-2) | Target (Phase 3) | Alert Threshold |
|--------|---------------------|------------------|-----------------|
| Response Time | 2-4 seconds | 3-5 seconds | > 6 seconds |
| Token Count | 1,500-2,000 | 3,000-4,000 | > 5,000 |
| Cost per Query | $0.01 | $0.02 | > $0.03 |
| Hallucination Rate | < 5% | < 5% | > 10% |
| Pitch Usage | 0% | 30-50% | < 10% |
| Error Rate | < 1% | < 1% | > 2% |

### Log Analysis

**Daily Check** (Run these in edge function logs):

1. Count queries using pitch data:
   ```
   Search: "Pitch Analytics Status"
   Count: Entries with withPitchData > 0
   ```

2. Check average response quality:
   ```
   Search: "💾 Saving response"
   Note: responseLength values
   ```

3. Monitor errors:
   ```
   Search: "❌"
   Count: Error entries
   ```

---

## Rollback Procedure

### If Metrics Exceed Alert Thresholds

**Immediate Rollback** (1 minute):

1. **Go to**: Edge Functions → chat-orchestrator → Settings
2. **Set**: `ENABLE_PITCH_CONTEXT=false`
3. **Redeploy** edge function
4. **Verify** in logs: `featureEnabled: false`

**Impact**: Chatbot reverts to Phase 1-2 behavior immediately

### If Database Migration Causes Issues

**Revert Function** (5 minutes):

Run this SQL to restore previous version:

```sql
DROP FUNCTION IF EXISTS match_titles_by_embedding(vector(1536), float, int);

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
  comps text[]
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
    t.comps
  FROM titles t
  WHERE t.combined_embedding IS NOT NULL
    AND (1 - (t.combined_embedding <=> query_embedding)) > match_threshold
  ORDER BY t.combined_embedding <=> query_embedding
  LIMIT match_count;
END;
$$;
```

---

## Success Criteria Checklist

- [ ] Migration applied successfully (no errors)
- [ ] Test queries return 17 columns
- [ ] Some titles show `has_pitch_data: true`
- [ ] Feature flag enabled and visible in logs
- [ ] Pitch usage rate > 30% (first hour)
- [ ] Response time < 6 seconds (95th percentile)
- [ ] Error rate < 1%
- [ ] Hallucination rate < 5%
- [ ] No critical user complaints
- [ ] Token costs within budget ($0.02/query)

---

## Post-Deployment Tasks

### After 24 Hours

1. **Document metrics** in chatbot documentation
2. **Gather user feedback** if available
3. **Identify optimization opportunities**:
   - Titles with missing pitch data
   - Query types benefiting most from pitch analytics
   - Token cost optimization areas

### After 1 Week

1. **Update documentation** with Phase 3 status: "DEPLOYED"
2. **Plan Phase 4** enhancements:
   - Response caching (-30% token cost)
   - Hybrid search (+20% relevance)
   - Advanced prompt engineering (+15% quality)
3. **Create analytics dashboard** (if metrics are positive)

---

## Contact & Support

**Issues During Deployment**:
- Check edge function logs first
- Verify database function structure
- Review feature flag setting
- Test with manual queries

**Rollback Decision**:
- Minor issues (response time +1s): Monitor, optimize
- Major issues (error rate > 5%): Immediate feature flag rollback
- Critical issues (database errors): Database migration rollback + edge function revert

---

**For complete implementation details, see**:
- [Pitch Analytics Plan](docs/features/chatbot/PITCH_ANALYTICS.md)
- [Chatbot Overview](docs/features/chatbot/OVERVIEW.md)
