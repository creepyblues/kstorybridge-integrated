# Comps Navigator: Embedding Validation Fix

**Date**: 2025-11-21
**Status**: ✅ Fixed and Deployed
**Issue**: Vector search failing with "invalid input syntax for type vector" error

---

## Problem Summary

The Comps Navigator edge function was failing with PostgreSQL errors when attempting vector search:

```
invalid input syntax for type vector: "[null,null,null,null,null,35.0019999433,..."
```

**Root Cause**: Cached embeddings in `comp_title_cache` table contained `null` values instead of proper numbers, causing PostgreSQL's `vector` type to reject them.

---

## Solution Implemented

### 1. Enhanced Cache Validation

Added comprehensive validation in `getOrGenerateEmbedding()` function:

```typescript
// Validate embedding is an array of numbers without nulls
if (Array.isArray(embedding) &&
    embedding.length === 1536 &&
    embedding.every(v => typeof v === 'number' && !isNaN(v))) {
  console.log(`[COMPS] Cache hit for "${compTitle}"`)
  return embedding
} else {
  console.warn(`[COMPS] Invalid cached embedding for "${compTitle}" - regenerating`)
  // Delete invalid cache entry
  await supabaseClient
    .from('comp_title_cache')
    .delete()
    .eq('comp_title', normalizedTitle)
}
```

**Validation Checks**:
- ✅ Embedding is an array
- ✅ Embedding has exactly 1536 dimensions
- ✅ All values are numbers (no `null`, `undefined`, or `NaN`)

**Auto-Healing**:
- Invalid cache entries are automatically deleted
- Fresh embeddings are generated from OpenAI API
- New embeddings are cached for future use

### 2. Improved Error Handling

- Changed `.single()` to `.maybeSingle()` to avoid errors on cache misses
- Added try-catch around cache insert operations
- Added warning logs for cache errors (non-fatal)
- Function continues even if caching fails (embedding is still valid)

### 3. Database Cleanup

Created migration `20251121040000_clear_invalid_comp_cache.sql`:
- Truncated `comp_title_cache` table to remove all invalid entries
- Added documentation comment explaining the cleanup

---

## Files Modified

1. **Edge Function** (deployed):
   - `/supabase/functions/comp-navigator/index.ts`
   - Enhanced `getOrGenerateEmbedding()` function

2. **Database Migration** (applied):
   - `/supabase/migrations/20251121040000_clear_invalid_comp_cache.sql`
   - Cleared invalid cache entries

3. **Test Script** (updated):
   - `/test-comp-navigator.js`
   - Added proper authentication headers
   - Updated anon key

4. **Diagnostic Scripts** (created):
   - `/scripts/check-comp-cache.js` - Check cache validity
   - `/scripts/clear-comp-cache.sql` - Manual cache cleanup

---

## Testing Results

### Before Fix
```
❌ Error: Vector search failed: invalid input syntax for type vector
```

### After Fix
```
✅ Success!
Response: {
  "results": [],
  "processing_time_ms": 6445,
  "cost_estimate": 0.0142
}
```

**Note**: Empty results are expected if no Korean titles in database match the comps well. The important fix is that the function **no longer crashes** with vector syntax errors.

---

## Prevention Measures

1. **Automatic Validation**: All cached embeddings are validated before use
2. **Self-Healing**: Invalid cache entries are deleted and regenerated
3. **Graceful Degradation**: Cache failures don't prevent embedding generation
4. **Comprehensive Logging**: All cache operations are logged for debugging

---

## Edge Function Deployment

```bash
cd /Users/sungholee/code/kstorybridge
npx supabase functions deploy comp-navigator
```

**Deployed**: 2025-11-21 03:40 UTC
**Version**: Latest with validation logic

---

## Database Migration

```bash
cd /Users/sungholee/code/kstorybridge
npx supabase db push
```

**Applied**: 2025-11-21 03:41 UTC
**Migration**: `20251121040000_clear_invalid_comp_cache.sql`

---

## Future Improvements

1. **Proactive Monitoring**: Add metrics to track cache hit/miss rates
2. **Batch Validation**: Periodically scan cache for invalid entries
3. **Dimension Flexibility**: Support multiple embedding models (1536, 3072, etc.)
4. **Expiration Policy**: Auto-expire old cache entries (e.g., 90 days)

---

## Related Documentation

- [Comps Navigator User Guide](../../../apps/dashboard/public/docs/COMPS_NAVIGATOR_USER_GUIDE.md)
- [Comps Navigator Plan](COMPS_NAVIGATOR_PLAN.md)
- [Database Schema](../../active/DATABASE_SCHEMA.md)

---

## Contact

For questions or issues:
- Check Supabase Edge Function logs
- Review cache table: `SELECT * FROM comp_title_cache LIMIT 10;`
- Run diagnostic: `node scripts/check-comp-cache.js`
