# Complete Embedding Update Workflow

**Last Updated**: 2025-10-19

This guide provides a complete workflow for updating embeddings after making changes to title metadata (keywords, genres, descriptions, etc.).

---

## Table of Contents

1. [When to Update Embeddings](#when-to-update-embeddings)
2. [Complete Workflow](#complete-workflow)
3. [Real-World Example](#real-world-example)
4. [Batch Processing Strategy](#batch-processing-strategy)
5. [Troubleshooting](#troubleshooting)
6. [Reference](#reference)

---

## When to Update Embeddings

Embeddings **must be regenerated** when you update any of these fields:

- ✅ **Keywords** (most common reason)
- ✅ **Genre** or tone
- ✅ **Title names** (English or Korean)
- ✅ **Synopsis** or tagline
- ✅ **Content format**
- ✅ **Author names**

**Why?** The AI chat uses vector embeddings for semantic search. These embeddings are generated from the title metadata and are NOT automatically updated when you change the database.

**Impact of not updating**:
- AI chat won't find titles using new keywords
- Semantic search won't reflect updated descriptions
- Recommendations won't be accurate

---

## Complete Workflow

### Step 1: Update Title Metadata

Update your titles in the database (via SQL, admin panel, etc.):

```sql
-- Example: Update keywords for a title
UPDATE titles
SET keywords = ARRAY['Romance', 'Comedy', 'School Life', 'Coming of Age'],
    updated_at = NOW()
WHERE title_name_kr = '어쩌다 발견한 7월';
```

**Important**: Always update `updated_at` so the script can find changed titles!

### Step 2: Identify Changed Titles

Determine the scope of titles needing embedding updates:

```sql
-- Find all titles updated in last 24 hours
SELECT
  title_id,
  title_name_en,
  title_name_kr,
  keywords,
  updated_at,
  embedding_updated_at
FROM titles
WHERE updated_at >= NOW() - INTERVAL '24 hours'
ORDER BY updated_at DESC;
```

Or check for titles with outdated embeddings:

```sql
-- Find titles where embeddings are older than content
SELECT
  title_id,
  title_name_en,
  keywords,
  updated_at,
  embedding_updated_at,
  CASE
    WHEN embedding_updated_at IS NULL THEN 'Never embedded'
    WHEN embedding_updated_at < updated_at THEN 'Needs update'
    ELSE 'Up to date'
  END as status
FROM titles
WHERE embedding_updated_at IS NULL
   OR embedding_updated_at < updated_at
ORDER BY updated_at DESC;
```

### Step 3: Set Required Environment Variables

```bash
# OpenAI API key (for generating embeddings)
export VITE_OPENAI_API_KEY=sk-your-actual-key-here

# Supabase Service Role key (REQUIRED for writing embeddings)
export SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
```

**Get Service Role Key**: https://app.supabase.com/project/dlrnrgcoguxlkkcitlpd/settings/api

⚠️ **Critical**: You MUST use the service_role key, not the anon key!

### Step 4: Preview with Dry Run

Before processing, preview what will be updated:

```bash
cd apps/dashboard

# Preview titles from last 24 hours
node update-recent-embeddings.js --hours=24 --dry-run

# Preview titles since specific date
node update-recent-embeddings.js --since=2025-10-18 --dry-run

# Preview with custom limit
node update-recent-embeddings.js --hours=24 --limit=100 --dry-run
```

**Dry run output shows**:
- List of titles that will be processed
- Keywords for each title
- Estimated cost
- Number of titles found

### Step 5: Process Embeddings

After verifying the dry run looks correct:

```bash
# Process titles from last 24 hours (default: 50 title limit)
node update-recent-embeddings.js --hours=24

# Process more titles (up to 100)
node update-recent-embeddings.js --hours=24 --limit=100

# Process since specific date
node update-recent-embeddings.js --since=2025-10-18 --limit=200
```

**What happens**:
1. Script fetches titles matching time filter
2. For each title, generates 4 embeddings (title, synopsis, content, combined)
3. Stores embeddings in database
4. Verifies storage succeeded
5. Shows progress, success rate, and cost

### Step 6: Verify Success

Check that embeddings were updated:

```sql
-- Verify recent embedding updates
SELECT
  title_name_en,
  keywords,
  embedding_model,
  embedding_updated_at,
  updated_at
FROM titles
WHERE embedding_updated_at >= NOW() - INTERVAL '10 minutes'
ORDER BY embedding_updated_at DESC;
```

Expected results:
- `embedding_model` = `text-embedding-ada-002`
- `embedding_updated_at` should be recent (within last few minutes)
- All titles from your update should appear

### Step 7: Test in AI Chat

Verify the changes work in production:

1. Go to AI chat: https://dashboard.kstorybridge.com/chat
2. Search using new keywords
3. Verify titles appear in results
4. Check semantic search accuracy

**Example**: If you added keyword "Time Travel", search for "stories about time travel" and verify the title appears.

---

## Real-World Example

**Scenario**: Updated keywords for 50 titles on October 19, 2025

### 1. Database Update
```sql
-- Updated keywords via SQL
UPDATE titles
SET keywords = ARRAY['Contemporary', 'Romance', 'Coming of Age'],
    updated_at = NOW()
WHERE title_id = '5a09f56d-2f9b-47c2-9725-37b02227ea44';
-- (Repeated for 50 titles)
```

### 2. Set API Keys
```bash
export VITE_OPENAI_API_KEY=sk-proj-...
export SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...
```

### 3. Preview
```bash
cd apps/dashboard
node update-recent-embeddings.js --hours=24 --dry-run
```

Output showed 50 titles, estimated cost: $0.05-0.25

### 4. First Batch (50 titles - default limit)
```bash
node update-recent-embeddings.js --hours=24
```

**Result**:
- ✅ 50 titles processed successfully
- 💰 Cost: $0.12
- ⏱️ Time: ~3.5 minutes

### 5. Second Batch (Remaining titles)
```bash
# Had more than 50 titles, needed to process remaining
# Used narrower time window to avoid re-processing first 50
node update-recent-embeddings.js --hours=12 --limit=100
```

**Result**:
- ✅ 45 more titles processed
- 💰 Cost: $0.11
- ⏱️ Time: ~3 minutes

### 6. Verification
```sql
SELECT COUNT(*)
FROM titles
WHERE embedding_updated_at >= '2025-10-19 18:00:00';
-- Result: 95 titles ✅
```

### 7. Testing
Tested chat with new keywords like "Coming of Age" and "Time Travel" - titles appeared correctly! ✅

---

## Batch Processing Strategy

For large updates (100+ titles):

### Strategy A: Single Large Batch
```bash
# Preview first
node update-recent-embeddings.js --since=2025-10-15 --limit=200 --dry-run

# Process all at once
node update-recent-embeddings.js --since=2025-10-15 --limit=200
```

**Pros**:
- Simple, one command
- Fastest for smaller batches (<200 titles)

**Cons**:
- No progress checkpoints
- If fails, must restart entire batch

### Strategy B: Multiple Small Batches
```bash
# Batch 1: First 50 titles
node update-recent-embeddings.js --since=2025-10-15 --limit=50

# Batch 2: Next 50 (use narrower time window)
node update-recent-embeddings.js --hours=12 --limit=50

# Batch 3: Remaining
node update-recent-embeddings.js --hours=6 --limit=50
```

**Pros**:
- Safe checkpoints after each batch
- Easy to recover from failures
- Can verify progress incrementally

**Cons**:
- More commands to run
- Need to adjust time windows

### Strategy C: Database-Driven Approach

For very large updates or complex filtering:

```sql
-- 1. Find titles needing updates
SELECT title_id
FROM titles
WHERE (embedding_updated_at IS NULL OR embedding_updated_at < updated_at)
  AND updated_at >= '2025-10-01'
ORDER BY updated_at DESC
LIMIT 100;
-- Copy title IDs
```

Then use `generate-embeddings.js` for specific title IDs (if script supports it) or use time-based filtering.

### Recommended: Strategy B for >100 titles

Break into batches of 50-100 titles each for best balance of safety and efficiency.

---

## Troubleshooting

### "No titles found that were updated in the specified time range"

**Cause**: Time filter doesn't match when titles were actually updated

**Solutions**:
```bash
# Try wider time range
node update-recent-embeddings.js --hours=48 --dry-run

# Or use specific date
node update-recent-embeddings.js --since=2025-10-15 --dry-run

# Check database directly
SELECT COUNT(*) FROM titles WHERE updated_at >= NOW() - INTERVAL '24 hours';
```

### "WARNING: Embedding stored but format is unexpected"

**This is NORMAL!** ✅

- Supabase serializes pgvector as strings (not JavaScript arrays)
- Embedding IS stored correctly
- Vector search WILL work
- No action needed

### Only processed 50 titles, but have more

**Cause**: Default limit is 50 titles

**Solution**:
```bash
# Increase limit
node update-recent-embeddings.js --hours=24 --limit=200

# Or process in batches (see Batch Processing Strategy)
```

### How to avoid re-processing titles already done?

**Option 1 - Narrower time window**:
```bash
# First batch processed last 24 hours
# Second batch: only last 2 hours (after first run)
node update-recent-embeddings.js --hours=2 --limit=100
```

**Option 2 - Check database**:
```sql
-- Find titles with outdated embeddings
SELECT title_id, title_name_en, updated_at, embedding_updated_at
FROM titles
WHERE updated_at > embedding_updated_at
   OR embedding_updated_at IS NULL
ORDER BY updated_at DESC;
```

### Script shows high cost estimate

**Check**:
- How many titles are being processed? (dry-run shows count)
- Do you really need to update all of them?

**Typical costs**:
- 50 titles: ~$0.05-0.25
- 100 titles: ~$0.10-0.50
- 200 titles: ~$0.20-1.00

Still very affordable! But use `--limit` to process smaller batches if concerned.

### Rate limit exceeded

**Cause**: OpenAI API rate limits

**Solution**: Script already waits 1 second between requests. If still hitting limits:
```bash
# Process smaller batches
node update-recent-embeddings.js --hours=24 --limit=20

# Wait 5 minutes between batches
# Then run next batch
```

---

## Reference

### Quick Commands

```bash
# Most common: Update last 24 hours
node update-recent-embeddings.js --hours=24

# Large batch: Update 100+ titles
node update-recent-embeddings.js --since=2025-10-15 --limit=200

# Avoid duplicates: Narrow time window
node update-recent-embeddings.js --hours=2 --limit=100

# Test single title
node test-single-embedding.js TITLE_ID
```

### SQL Helpers

```sql
-- Find titles needing updates
SELECT title_id, title_name_en, keywords, updated_at, embedding_updated_at
FROM titles
WHERE embedding_updated_at < updated_at OR embedding_updated_at IS NULL
ORDER BY updated_at DESC;

-- Count recent updates
SELECT COUNT(*)
FROM titles
WHERE embedding_updated_at >= NOW() - INTERVAL '10 minutes';

-- Verify specific title
SELECT title_name_en, keywords, embedding_model, embedding_updated_at
FROM titles
WHERE title_id = 'your-title-id';
```

### Related Documentation

- **QUICK_START_EMBEDDINGS.md** - Quick reference guide
- **UPDATE_EMBEDDINGS_GUIDE.md** - Detailed command reference
- **test-single-embedding.js** - Debug single title
- **diagnose-embeddings.sql** - Database diagnostics

### Script Files

- `update-recent-embeddings.js` - Main bulk update script
- `test-single-embedding.js` - Single title debug script
- `diagnose-embeddings.sql` - SQL diagnostics
- `generate-embeddings.js` - Generate for specific title IDs

---

## Summary Checklist

When updating embeddings:

- [ ] Update title metadata in database
- [ ] Set `VITE_OPENAI_API_KEY` environment variable
- [ ] Set `SUPABASE_SERVICE_ROLE_KEY` environment variable
- [ ] Run dry-run to preview (`--dry-run`)
- [ ] Verify dry-run output looks correct
- [ ] Run actual update with appropriate `--limit`
- [ ] Verify success in database (check `embedding_updated_at`)
- [ ] Test in AI chat with new keywords
- [ ] If >50 titles, run additional batches with narrower time windows

**Cost**: ~$0.001-0.005 per title (very affordable)

**Time**: ~2-4 seconds per title + 1 second delay

**Changes take effect**: Immediately (no cache, no restart needed)

---

**Questions?** See `UPDATE_EMBEDDINGS_GUIDE.md` or `QUICK_START_EMBEDDINGS.md` for more details.
