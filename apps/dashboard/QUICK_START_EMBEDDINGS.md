# Quick Start: Update Embeddings After Keyword Changes

## Copy-Paste Commands

### 1. Set API Keys (Required - Do This First!)
```bash
# Set your OpenAI key
export VITE_OPENAI_API_KEY=sk-your-openai-key-here

# Set Supabase Service Role key (REQUIRED for writing embeddings)
export SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
```

**Get Service Role Key:** https://app.supabase.com/project/dlrnrgcoguxlkkcitlpd/settings/api
→ Copy the `service_role` key (not the anon key!)

---

### 2. Preview What Will Be Updated
```bash
cd apps/dashboard

# See titles updated in last 24 hours
node update-recent-embeddings.js --hours=24 --dry-run
```

---

### 3. Run the Update
```bash
# Update titles from last 24 hours
node update-recent-embeddings.js --hours=24

# OR update since specific date
node update-recent-embeddings.js --since=2025-10-18
```

---

## Common Scenarios

### Update Today's Changes
```bash
node update-recent-embeddings.js --hours=24
```

### Update This Week's Changes
```bash
node update-recent-embeddings.js --hours=168
```

### Update Since Specific Date
```bash
node update-recent-embeddings.js --since=2025-10-18
```

### Safe Test (Limited to 10 titles)
```bash
node update-recent-embeddings.js --hours=24 --limit=10
```

### Process Large Batches (100+ titles)
```bash
# Process 100 titles
node update-recent-embeddings.js --hours=24 --limit=100

# Process 200 titles
node update-recent-embeddings.js --since=2025-10-18 --limit=200

# Process all titles (no limit)
node update-recent-embeddings.js --since=2025-10-01 --limit=1000
```

**Default limit is 50 titles** - use `--limit=N` to process more.

### Avoid Re-processing Titles
```bash
# If you already processed 50 titles, narrow the time window:
node update-recent-embeddings.js --hours=2 --limit=100

# Or use specific date:
node update-recent-embeddings.js --since=2025-10-19 --limit=200
```

---

## ⚠️ Troubleshooting

### Error: "Embedding verification failed"
**Cause:** Missing or wrong Supabase key
**Fix:**
```bash
# Make sure you're using SERVICE_ROLE key, not ANON key!
export SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...your-service-role-key
```

**Note**: The updated script (2025-01-30) is now more tolerant of different vector formats and should succeed as long as the embedding exists in the database.

### Error: "OpenAI API key not found"
**Fix:**
```bash
export VITE_OPENAI_API_KEY=sk-your-openai-key
```

### Warning: "Using ANON_KEY may cause permission errors"
**Fix:** Set the service role key (see above)

### Warning: "Embedding stored but format is unexpected"
**This is NORMAL!** Supabase returns pgvector as strings (not arrays).
- ✅ Embedding IS stored correctly
- ✅ Vector search WILL work
- ❌ Only worry if you see "No embedding found"

### Test Single Title First
If you're still seeing issues, test with one title:
```bash
node test-single-embedding.js TITLE_ID
```

This will show detailed step-by-step debugging output.

---

## What Happens

1. ✅ Script finds titles updated in your time range
2. ✅ Shows you the list with keywords
3. ✅ Generates new embeddings (includes your updated keywords!)
4. ✅ Saves to database
5. ✅ Verifies embeddings were stored correctly
6. ✅ Shows cost and success rate

---

## Cost Estimate

- **Per title**: ~$0.001-0.005
- **20 titles**: ~$0.02-0.10
- **50 titles**: ~$0.05-0.25
- **100 titles**: ~$0.10-0.50
- **200 titles**: ~$0.20-1.00

Very affordable! The script shows exact cost after completion.

**Time estimate**: ~2-4 seconds per title + 1 second delay between requests

---

## After Running

✅ Your updated keywords are now searchable in the AI chat
✅ Chat will use new keywords for recommendations
✅ Search results will reflect keyword changes

Changes take effect **immediately** - no restart needed!

---

## Full Documentation

See `UPDATE_EMBEDDINGS_GUIDE.md` for complete details.
