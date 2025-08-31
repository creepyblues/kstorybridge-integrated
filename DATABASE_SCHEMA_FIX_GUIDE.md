# 🛠️ Database Schema Fix Guide for Vector Search

## 🔍 **Problem Identified**

The vector search function `match_titles_by_embedding` is trying to access a column `t.description` that doesn't exist in the `titles` table. 

**Available columns:** `synopsis`, `description_kr`  
**Missing column:** `description`

## 🎯 **Solution**

Update the database function to use existing columns (`synopsis` and `description_kr`).

---

## 📋 **Method 1: Supabase Dashboard (Recommended)**

### Step 1: Access Supabase SQL Editor

1. Go to [Supabase Dashboard](https://supabase.com/dashboard/projects)
2. Select your project (`dlrnrgcoguxlkkcitlpd`)
3. Navigate to **SQL Editor** in the left sidebar

### Step 2: Execute the Fix

Copy and paste this SQL code into the editor and click **Run**:

```sql
-- Fix vector search function to use existing database columns
-- Drop existing function if it exists
DROP FUNCTION IF EXISTS match_titles_by_embedding(vector(1536), float, int);

-- Create the corrected vector search function  
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
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    t.title_id,
    t.title_name_en,
    t.title_name_kr,
    -- Use synopsis (English) first, fallback to description_kr
    COALESCE(t.synopsis, t.description_kr, '')::text as description,
    -- Calculate cosine similarity using combined_embedding
    CASE 
      WHEN t.combined_embedding IS NOT NULL 
      THEN (1 - (t.combined_embedding <=> query_embedding))::float
      ELSE 0::float
    END AS similarity
  FROM titles t
  WHERE t.combined_embedding IS NOT NULL
    AND (1 - (t.combined_embedding <=> query_embedding)) > match_threshold
  ORDER BY t.combined_embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- Test the function
SELECT 'Vector search function updated successfully!' as status;

-- Quick test with dummy data
SELECT COUNT(*) as total_titles_with_embeddings 
FROM titles 
WHERE combined_embedding IS NOT NULL;
```

### Step 3: Verify the Fix

After running the SQL, you should see:
- ✅ "Vector search function updated successfully!"
- ✅ A count of titles that have embeddings

---

## 📋 **Method 2: Command Line (Alternative)**

If you have the Supabase CLI set up:

```bash
# Navigate to dashboard directory
cd apps/dashboard

# Apply the migration
npx supabase db reset --linked
```

---

## 🧪 **Test the Fix**

After applying the fix, test it by running:

```bash
# Test the database fix
node debug-database-schema.js
```

You should now see:
- ✅ Vector search function works without errors
- ✅ Returns results (even if 0 due to no embeddings)

---

## 🚀 **What Happens Next**

### 1. **Immediate Effect**
- ✅ Vector search function will no longer error
- ✅ OpenAI chatbot will attempt vector search successfully
- ⚠️ Results will be limited because titles don't have embeddings yet

### 2. **In the OpenAI Chatbot**
You should now see:
```
🔍 Vector search enabled - attempting with fallback handling
✅ Vector search found X semantic matches (or 0 if no embeddings)
```

### 3. **Next Steps** (Optional)
To get real vector search results:
- Populate title embeddings using OpenAI's embedding API
- Enable real embedding generation instead of mock embeddings

---

## 🔧 **Troubleshooting**

### Error: "permission denied for function"
- Use the service role key or run from Supabase Dashboard

### Error: "extension vector does not exist"  
Add this to your SQL:
```sql
CREATE EXTENSION IF NOT EXISTS vector;
```

### Still getting column errors?
Double-check the column names in your database match:
- ✅ `synopsis` 
- ✅ `description_kr`
- ✅ `combined_embedding`

---

## ✅ **Success Indicators**

After applying the fix, you should see in your OpenAI chatbot logs:
- ✅ No more "column t.description does not exist" errors
- ✅ "Vector search enabled" messages
- ✅ Either vector search results or graceful fallback to text search

---

**🎉 Once you apply this fix, your vector search will be fully functional!**