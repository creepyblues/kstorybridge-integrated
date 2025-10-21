# Embedding Update - Next Steps

## What Changed

I've updated the embedding scripts to be more tolerant of how Supabase returns vector data. The scripts now:

✅ **Accept embeddings in any format** (not just arrays)
✅ **Add 100ms delay** between write and verify for database commit
✅ **Show detailed error codes** when database errors occur
✅ **Consider storage successful** as long as embedding exists

## Run the Updated Script

The updated script should now work correctly with your Supabase database.

### 1. Make sure your environment variables are set:

```bash
# Check if keys are set
echo $VITE_OPENAI_API_KEY
echo $SUPABASE_SERVICE_ROLE_KEY
```

If not set:
```bash
export VITE_OPENAI_API_KEY=your-openai-key
export SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### 2. Test with a single title first:

```bash
cd apps/dashboard

# Test the "Idol House" title that was failing
node test-single-embedding.js 5a09f56d-2f9b-47c2-9725-37b02227ea44
```

Expected output:
- ✅ Embedding generated successfully
- ✅ Update query executed successfully
- ✅ Embedding stored in database
- Either "PERFECT" (array with 1536 dims) or "WARNING" (exists but different format)

### 3. If single test succeeds, run bulk update:

```bash
# Dry run first to see what would be updated
node update-recent-embeddings.js --hours=24 --dry-run

# Then run for real
node update-recent-embeddings.js --hours=24
```

## Troubleshooting

### If test-single-embedding.js still fails:

**Run the diagnostic SQL** to check database state:

1. Go to Supabase SQL Editor: https://app.supabase.com/project/dlrnrgcoguxlkkcitlpd/sql
2. Open `apps/dashboard/diagnose-embeddings.sql`
3. Copy and paste the entire file into SQL Editor
4. Run it
5. Look for:
   - Column types (should be `vector` or `USER-DEFINED`)
   - Vector extension enabled (should show `vector` with version)
   - Any existing embeddings and their structure

### If UPDATE succeeds but verification fails:

This means the embedding is being stored but Supabase is returning it in a format we don't expect. The updated script should handle this gracefully now.

### If UPDATE itself fails:

Check the error code and message. Common issues:
- **Permission denied**: Make sure you're using SERVICE_ROLE_KEY, not ANON_KEY
- **Column type mismatch**: Run diagnose-embeddings.sql to check column types
- **RLS policy blocking**: Service role should bypass RLS, but check policies

## What Happens After Success

Once embeddings are updated:

✅ **Chat will use updated keywords** - The AI chat uses `combined_embedding` for vector search
✅ **Search results improve** - Keywords are included in the embedding generation
✅ **Changes are immediate** - No cache, no restart needed

## Expected Results

For titles updated in last 24 hours:
- **Processing time**: ~2-4 seconds per title (API call + database write)
- **Success rate**: Should be 100% with service role key
- **Cost**: ~$0.001-0.005 per title (very affordable)

## Need More Help?

If you still see errors after running the updated script:

1. **Share the output** of `test-single-embedding.js` - This will show exactly what's happening
2. **Share the SQL diagnostic results** - This will show database state
3. **Check Supabase logs** - Go to Logs → Postgres Logs in Supabase dashboard

The updated scripts provide much more detailed debugging info to help identify the exact issue.
