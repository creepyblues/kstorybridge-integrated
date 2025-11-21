# Comps Navigator: "I Became a Doting Father" Not Showing Issue

**Date**: 2025-11-21
**Status**: 🔧 In Progress
**Title**: I Became a Doting Father (딸 바보가 되었습니다)
**Expected Comp**: This Is Us

---

## Problem Summary

User searched for titles similar to "This Is Us", but "I Became a Doting Father" did not appear in results, even though it has "This is Us" listed in its `comps` array.

---

## Investigation Results

### 1. Invalid Embedding Dimension ❌

**Finding**: The title has a corrupted embedding

```
Title: I Became a Doting Father
Comps: [ 'Party of Five', 'This is Us' ]
Embedding Length: 19,428 dimensions (INVALID - should be 1,536)
Synopsis: 294 chars
Genre: [ 'COMEDY' ]
Tone: HEART-
Format: webtoon
```

**Impact**: The 19,428-dimension embedding cannot properly participate in vector similarity calculations with the 1,536-dimension query embedding from "This Is Us".

**Root Cause**: Unknown - possibly from:
- Data migration/import error
- Multiple embeddings concatenated accidentally
- Bug in original embedding generation

### 2. Cache System Not Working ❌

**Finding**: The `comp_title_cache` table is empty and not being populated

```
Cache entries after search: 0
"This Is Us" embedding: NOT FOUND in cache
```

**Impact**:
- Every search regenerates embeddings ($0.0001 per embedding)
- Slower search performance
- Unable to verify if caching would help with matching

**Root Cause**: Unknown - possibilities:
- RLS policy blocking service role inserts (unlikely - policies look correct)
- Service role key not configured in edge function secrets
- Silent error in edge function cache insertion

### 3. Vector Search Threshold Too High? ⚠️

**Current threshold**: 0.6 similarity
**Finding**: With invalid embedding, we cannot test actual similarity

With a valid 1,536-dimension embedding for "I Became a Doting Father", the similarity with "This Is Us" might be:
- Above 0.6 → Would appear in results
- Below 0.6 → Would be filtered out

### 4. LLM Re-ranking Filtering All Results ⚠️

**Finding**: Search found 30 candidates but LLM returned 0 results

```
Phase 1: Vector search found 30 candidates (threshold: 0.6)
Phase 2: LLM re-ranking returned 0 results
```

**Possible causes**:
- Candidates genuinely poor matches
- LLM being too strict in matching criteria
- LLM response parsing issue (though logs show no errors)

---

## Solution Steps

### Step 1: Fix Invalid Embeddings (HIGH PRIORITY)

**Action**: Regenerate embedding for "I Became a Doting Father" and any other titles with invalid dimensions

**SQL Migration**: Created `20251121041000_fix_invalid_embeddings.sql`
- Identifies all titles with embeddings != 1,536 dimensions
- Clears invalid embeddings (sets to NULL)
- Titles will need embeddings regenerated via separate process

**Follow-up Required**:
- Create edge function or script to regenerate embeddings for NULL titles
- Or manually regenerate via OpenAI API

### Step 2: Fix Cache Insertion (MEDIUM PRIORITY)

**Action**: Debug why edge function cannot insert into `comp_title_cache`

**Changes Made**:
- Updated edge function to use `upsert` instead of `insert`
- Added explicit error logging
- Deployed new version

**Testing Required**:
- Check Supabase edge function logs for cache errors
- Verify service role key is set in edge function secrets
- Test RLS policies with service role manually

### Step 3: Lower Similarity Threshold (OPTIONAL)

**Current**: 0.6 similarity threshold
**Proposed**: 0.5 similarity threshold

**Trade-offs**:
- ✅ More candidates pass to LLM re-ranking
- ❌ More false positives
- ❌ Higher LLM costs (more candidates to rank)

**Recommendation**: Wait until Step 1 is complete, then test with valid embeddings before lowering threshold.

### Step 4: Review LLM Re-ranking Logic (LOW PRIORITY)

**Action**: Investigate why LLM filters out all 30 candidates

**Possible improvements**:
- Adjust LLM prompt to be less strict
- Lower minimum match_score threshold
- Add fallback to return top N candidates even if LLM gives low scores

---

## Testing Plan

### Test 1: After Fixing Embeddings

1. Regenerate embedding for "I Became a Doting Father"
2. Search for "This Is Us"
3. Check if title appears in:
   - Vector search results (Phase 1)
   - LLM re-ranked results (Phase 2)
4. Verify similarity score

**Expected Result**: Title should appear with similarity > 0.6

### Test 2: Cache Verification

1. Run search for "This Is Us"
2. Check `comp_title_cache` table immediately after
3. Verify embedding is cached with:
   - `comp_title = 'this is us'`
   - `embedding.length = 1536`
   - No null values

**Expected Result**: Cache entry should exist and be valid

### Test 3: End-to-End

1. Search for "This Is Us"
2. Verify "I Became a Doting Father" appears in results
3. Check match_score and explanation
4. Verify comp_alignments include "This Is Us"

**Expected Result**: Title appears with reasonable match score (70-85)

---

## Files Modified

1. **Edge Function**: `/supabase/functions/comp-navigator/index.ts`
   - Enhanced cache validation
   - Changed insert to upsert
   - Added success logging

2. **Migration**: `/supabase/migrations/20251121041000_fix_invalid_embeddings.sql`
   - Clears invalid embeddings
   - Needs to be applied

3. **Diagnostic Scripts**:
   - `/scripts/check-doting-father.js` - Check title details
   - `/scripts/test-this-is-us-search.js` - Test specific search
   - `/scripts/test-cache-after-search.js` - Verify caching
   - `/scripts/fix-doting-father-embedding.js` - Fix script (needs service key)

---

## Next Actions

1. ✅ **Apply migration** to clear invalid embeddings
   ```bash
   npx supabase db push
   ```

2. ⏳ **Regenerate embeddings** for titles with NULL combined_embedding
   - Need to create edge function or admin script
   - Use OpenAI API with correct dimensions

3. ⏳ **Debug cache insertion**
   - Check Supabase dashboard logs
   - Verify service role key
   - Test RLS policies manually

4. ⏳ **Retest** once embeddings are valid

---

## Related Documentation

- [Embedding Validation Fix](EMBEDDING_VALIDATION_FIX.md)
- [Comps Navigator Plan](COMPS_NAVIGATOR_PLAN.md)
- [Database Schema](../../active/DATABASE_SCHEMA.md)

---

## Notes

- **comps** field format: Array of strings, e.g. `['Party of Five', 'This is Us']`
- **Case sensitivity**: Edge function normalizes to lowercase (`'this is us'`)
- **Embedding model**: text-embedding-ada-002 (1,536 dimensions)
- **Vector operator**: `<=>` (cosine distance) in PostgreSQL
- **Similarity calculation**: `1 - (embedding <=> query_embedding)`
