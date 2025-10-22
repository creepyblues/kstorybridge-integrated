# Guide: Update Embeddings After Keyword Changes

## Problem
When you update keywords (or other searchable fields) in the titles table, the AI chat and search won't reflect these changes until you regenerate the vector embeddings.

## Quick Start

### 1. Set Required API Keys
```bash
# OpenAI API key (for generating embeddings)
export VITE_OPENAI_API_KEY=sk-your-actual-key-here

# Supabase Service Role key (for writing embeddings - REQUIRED)
export SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...your-service-role-key
```

**Where to get Service Role Key:**
1. Go to: https://app.supabase.com/project/dlrnrgcoguxlkkcitlpd/settings/api
2. Copy the `service_role` key (secret, starts with `eyJ...`)
3. ⚠️ **Keep it secret!** This key bypasses all security rules

### 2. Preview What Will Be Updated (Dry Run)
```bash
cd apps/dashboard

# See titles updated in last 24 hours
node update-recent-embeddings.js --hours=24 --dry-run

# See titles updated since specific date
node update-recent-embeddings.js --since=2025-10-18 --dry-run
```

### 3. Actually Update Embeddings
```bash
# Update titles modified in last 24 hours
node update-recent-embeddings.js --hours=24

# Update titles modified since October 18
node update-recent-embeddings.js --since=2025-10-18

# Update with safety limit
node update-recent-embeddings.js --hours=48 --limit=20
```

## Command Options

| Option | Description | Example | Default |
|--------|-------------|---------|---------|
| `--dry-run` | Preview without updating | `--dry-run` | - |
| `--hours=N` | Update titles from last N hours | `--hours=24` | 24 |
| `--since=DATE` | Update titles since date | `--since=2025-10-18` | - |
| `--limit=N` | Maximum titles to process | `--limit=200` | 50 |

## Examples

### Update Today's Changes
```bash
node update-recent-embeddings.js --hours=24
```

### Update Last Week's Changes
```bash
node update-recent-embeddings.js --hours=168  # 7 days * 24 hours
```

### Update Specific Date Range
```bash
node update-recent-embeddings.js --since=2025-10-15
```

### Safe Test Run
```bash
# Preview first
node update-recent-embeddings.js --hours=24 --dry-run

# Update with limit
node update-recent-embeddings.js --hours=24 --limit=10
```

### Process More Than 50 Titles
```bash
# Process 100 titles
node update-recent-embeddings.js --hours=24 --limit=100

# Process 200 titles
node update-recent-embeddings.js --since=2025-10-15 --limit=200

# Process all titles (use very high number)
node update-recent-embeddings.js --since=2025-10-01 --limit=1000
```

**Cost for Large Batches**:
- 100 titles: ~$0.10-0.50
- 200 titles: ~$0.20-1.00
- Time estimate: ~2-4 seconds per title + 1 second delay

## What Gets Updated

The script regenerates embeddings from:
- **Title names** (English + Korean)
- **Synopsis** and tagline
- **Genre** and tone
- **Keywords** ← Your updated keywords are included here!
- **Content format**
- **Authors**

## Cost Estimation

- **Model**: `text-embedding-ada-002`
- **Cost**: ~$0.0001 per 1,000 tokens
- **Per Title**: ~$0.001-0.005 (generates 4 embeddings per title)
- **Example**: 20 titles ≈ $0.02-0.10

The script shows cost estimates in dry-run mode.

## Verification

After running, verify embeddings were updated:

```sql
-- Check recently updated embeddings
SELECT
  title_name_en,
  keywords,
  embedding_updated_at,
  embedding_model,
  updated_at
FROM titles
WHERE updated_at >= '2025-10-18'
ORDER BY embedding_updated_at DESC;
```

## Avoiding Re-processing Titles

If you've already processed some titles and want to avoid duplicates:

### Option 1: Use Narrower Time Window (EASIEST)
```bash
# First batch: Process last 24 hours (50 titles)
node update-recent-embeddings.js --hours=24

# Second batch: Only process last 2 hours (titles updated after first run)
node update-recent-embeddings.js --hours=2 --limit=100
```

### Option 2: Use Specific Date Range
```bash
# Process titles updated on or after specific date
node update-recent-embeddings.js --since=2025-10-19 --limit=200
```

### Option 3: Check Database for Titles Needing Updates
```sql
-- Find titles where embeddings are older than content
-- (meaning keywords were updated but embeddings weren't)
SELECT
  title_id,
  title_name_en,
  title_name_kr,
  updated_at,
  embedding_updated_at,
  CASE
    WHEN embedding_updated_at IS NULL THEN 'Never embedded'
    WHEN embedding_updated_at < updated_at THEN 'Embedding outdated'
    ELSE 'Up to date'
  END as status
FROM titles
WHERE updated_at >= '2025-10-15'  -- Your keyword update date
  AND (
    embedding_updated_at IS NULL
    OR embedding_updated_at < updated_at
  )
ORDER BY updated_at DESC;
```

### Option 4: Batch Processing Strategy

For large updates (100+ titles):

1. **First batch** (test with small limit):
   ```bash
   node update-recent-embeddings.js --since=2025-10-18 --limit=20 --dry-run
   node update-recent-embeddings.js --since=2025-10-18 --limit=20
   ```

2. **Verify first batch succeeded**:
   ```sql
   SELECT COUNT(*)
   FROM titles
   WHERE embedding_updated_at >= NOW() - INTERVAL '10 minutes';
   ```

3. **Process remaining** (use narrower time window or higher limit):
   ```bash
   # Option A: Increase limit
   node update-recent-embeddings.js --since=2025-10-18 --limit=200

   # Option B: Use recent time window
   node update-recent-embeddings.js --hours=48 --limit=200
   ```

## Troubleshooting

### "No titles found"
- Try a longer time period: `--hours=48`
- Or earlier date: `--since=2025-10-15`
- Check that titles were actually updated in database

### "OpenAI API key not found"
```bash
export VITE_OPENAI_API_KEY=sk-your-actual-key-here
```

### "Embedding verification failed"
This means the script couldn't write to the database. Make sure you set the service role key:
```bash
export SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
```

Get it from: https://app.supabase.com/project/dlrnrgcoguxlkkcitlpd/settings/api (service_role key)

### "WARNING: Embedding stored but format is unexpected"
**This is NORMAL and NOT an error!**

The script may show this warning:
```
⚠️ WARNING: Embedding stored but format is unexpected
   This may be how Supabase serializes pgvector types
   As long as the embedding exists, vector search should work
```

**What this means**:
- Supabase's JavaScript client serializes pgvector columns as **strings** (not arrays)
- The embedding IS stored correctly in the database ✅
- PostgreSQL handles the vector type correctly for search ✅
- The AI chat will work perfectly ✅

**Action required**: None! This is expected behavior. The warning is informational only.

**When to worry**: Only if you see "❌ No embedding found" or "❌ Embedding verification failed"

### "Rate limit exceeded"
The script automatically waits 1 second between requests. If you still hit limits:
- Use `--limit=N` to process fewer titles
- Run multiple times with smaller batches

## How It Works

1. **Finds Recent Titles**: Queries `titles` table where `updated_at >= cutoff`
2. **Clears Old Embeddings**: Prepares for regeneration
3. **Generates New Embeddings**: Creates 4 embeddings per title:
   - Title embedding (just the title)
   - Synopsis embedding (description)
   - Content embedding (everything combined)
   - Combined embedding (formatted metadata) ← Used by chat
4. **Stores in Database**: Updates `combined_embedding` column
5. **Verifies**: Checks that embeddings were stored correctly

## Search/Chat Integration

Once embeddings are updated:
- **AI Chat** immediately uses new embeddings for semantic search
- **Keyword Search** already uses the keywords column (no update needed)
- **Vector Search** queries use the `combined_embedding` field

Your updated keywords will now be searchable and will influence AI recommendations!

## Related Scripts

- `generate-embeddings.js` - Generate embeddings for specific title IDs
- `embeddingService.ts` - Service layer for embedding operations
- `chat-orchestrator/index.ts` - AI chat using vector search

## Notes

- Embeddings are **NOT** automatically updated when you change keywords
- You **MUST** run this script to reflect keyword changes in search/chat
- The `combined_embedding` field is what the AI chat uses for semantic search
- Keywords are included in the embedding generation process
