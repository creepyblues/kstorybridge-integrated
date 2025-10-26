# Backend Services Testing Guide

**Date**: 2025-10-25
**Phase**: Phase 2 Testing (Before Phase 3 UI Components)
**Purpose**: Verify database migrations and backend services work correctly in local environment

---

## Prerequisites

Before testing, ensure you have:

- ✅ Docker Desktop installed and running
- ✅ Supabase CLI installed (`npm install -g supabase`)
- ✅ All migration files created (Phase 1 complete)
- ✅ All backend services created (Phase 2 complete)

---

## Step 1: Start Docker Desktop

1. **Open Docker Desktop application**
   - If not installed: Download from https://www.docker.com/products/docker-desktop

2. **Wait for Docker to start**
   - Look for "Docker Desktop is running" status
   - This may take 1-2 minutes on first launch

3. **Verify Docker is running**:
   ```bash
   docker --version
   # Should output: Docker version 24.x.x or similar
   ```

---

## Step 2: Start Local Supabase

1. **Navigate to project root**:
   ```bash
   cd /Users/sungholee/code/kstorybridge
   ```

2. **Start Supabase (first time)**:
   ```bash
   npx supabase start
   ```

   **Expected output**:
   ```
   Started supabase local development setup.

           API URL: http://localhost:54321
        GraphQL URL: http://localhost:54321/graphql/v1
             DB URL: postgresql://postgres:postgres@localhost:54322/postgres
         Studio URL: http://localhost:54323
       Inbucket URL: http://localhost:54324
         JWT secret: super-secret-jwt-token-with-at-least-32-characters-long
           anon key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   service_role key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```

3. **Access Supabase Studio** (optional):
   - Open http://localhost:54323 in browser
   - View tables, run SQL queries, inspect data visually

---

## Step 3: Apply Migrations

1. **Apply all migrations** (including new questionnaire migrations):
   ```bash
   npx supabase db reset
   ```

   **What this does**:
   - Drops all existing local database objects
   - Runs all migrations in order from `/apps/dashboard/supabase/migrations/`
   - Includes our 4 new migrations:
     - `20251024000001_create_title_platforms.sql`
     - `20251024000002_create_title_documents.sql`
     - `20251024000003_create_title_drafts.sql`
     - `20251024000004_add_questionnaire_fields_to_titles.sql`

2. **Expected output**:
   ```
   Resetting local database...
   Applying migration 20251024000001_create_title_platforms.sql...
   Applying migration 20251024000002_create_title_documents.sql...
   Applying migration 20251024000003_create_title_drafts.sql...
   Applying migration 20251024000004_add_questionnaire_fields_to_titles.sql...
   Finished supabase db reset.
   ```

3. **Verify migrations applied**:
   ```bash
   npx supabase migration list
   ```

   Should show all migrations with timestamps, including the 4 new ones.

---

## Step 4: Verify Tables and Columns

### Option A: Using Supabase Studio (Visual)

1. Open http://localhost:54323
2. Navigate to "Table Editor" in sidebar
3. Verify new tables exist:
   - ✅ `title_platforms`
   - ✅ `title_documents`
   - ✅ `title_drafts`
4. Click on `titles` table
5. Scroll right to see new columns:
   - ✅ `is_official_english_title`
   - ✅ `script_title_kr`
   - ✅ `character_details`
   - ✅ `story_structure`
   - ✅ `awards`
   - ✅ etc. (30+ new columns)

### Option B: Using psql (Command Line)

1. **Connect to local database**:
   ```bash
   psql postgresql://postgres:postgres@localhost:54322/postgres
   ```

2. **List all tables**:
   ```sql
   \dt title_*
   ```

   **Expected output**:
   ```
   List of relations
   Schema |       Name        | Type  |  Owner
   --------+-------------------+-------+----------
   public | title_documents   | table | postgres
   public | title_drafts      | table | postgres
   public | title_platforms   | table | postgres
   public | titles            | table | postgres
   ```

3. **Describe titles table** (see new columns):
   ```sql
   \d titles
   ```

   Should show 30+ new columns added by migration `20251024000004`.

4. **Exit psql**:
   ```sql
   \q
   ```

---

## Step 5: Run Backend Services Test Script

1. **Make test script executable**:
   ```bash
   cd /Users/sungholee/code/kstorybridge/apps/creator-v2
   ```

2. **Install dependencies** (if not already installed):
   ```bash
   npm install
   ```

3. **Run test script**:
   ```bash
   node test-backend-services.js
   ```

4. **Expected output**:
   ```
   🧪 Backend Services Test Suite
   ================================

   📋 Test 1: Verify new tables exist
     ✅ title_platforms table exists
     ✅ title_documents table exists
     ✅ title_drafts table exists

   📋 Test 2: Verify new columns in titles table
     ✅ New questionnaire columns exist in titles table

   📋 Test 3: Create test title
     ✅ Test title created: [UUID]

   📋 Test 4: platformsService - Add platforms
     ✅ Added 2 platforms
     📊 Platform IDs: naver, kakao

   📋 Test 5: platformsService - Get platforms
     ✅ Retrieved 2 platforms
        - naver: 1,000,000 views
        - kakao: 800,000 views

   📋 Test 6: platformsService - Update platform
     ✅ Updated platform views: 1,500,000

   📋 Test 7: draftService - Save draft
     ✅ Draft saved: [UUID]
     📝 Current step: 2

   📋 Test 8: draftService - Load draft
     ✅ Draft loaded: [UUID]
     📝 Draft data keys: title_name_en, title_name_kr, genre, step1, step2
     ⏰ Last saved: [time]

   📋 Test 9: draftService - Update draft (upsert)
     ✅ Draft updated (upserted)
     📝 New current step: 3
     📊 Draft data updated: 7 keys

   📋 Test 10: documentsService - Add external link
     ✅ External link added: interview
     🔗 URL: https://example.com/interview

   📋 Test 11: documentsService - Get documents
     ✅ Retrieved 1 document(s)
        - interview: Author Interview

   🧹 Cleanup: Removing test data
     ✅ Draft deleted
     ✅ Documents deleted
     ✅ Platforms deleted
     ✅ Test title deleted

   ================================
   📊 Test Summary
   ================================
   ✅ Passed: 11/11
   ❌ Failed: 0/11

   🎉 All tests passed! Backend services are working correctly.
   ```

---

## Step 6: Run Dashboard Regression Tests

**Purpose**: Verify that new migrations don't break existing dashboard functionality.

1. **Navigate to dashboard app**:
   ```bash
   cd /Users/sungholee/code/kstorybridge/apps/dashboard
   ```

2. **Run tests**:
   ```bash
   npm test
   ```

3. **Expected results**:
   - Critical systems pass: ✅ AI chatbot, OAuth, design system, webhooks
   - Pre-existing failures: ~28 tests (unrelated to migrations)
   - **Zero new failures** from migrations

4. **Key tests to verify**:
   - ✅ `Chat.test.tsx` - AI chatbot functionality
   - ✅ `vectorSearchService.test.ts` - Vector search (uses `combined_embedding`)
   - ✅ `titlesService.test.ts` - Title queries (SELECT *)
   - ✅ Design system components

---

## Step 7: Manual Smoke Test (Optional)

1. **Start creator-v2 app**:
   ```bash
   cd /Users/sungholee/code/kstorybridge/apps/creator-v2
   npm run dev
   ```

2. **Open browser**: http://localhost:8083

3. **Test existing functionality**:
   - ✅ Sign in with test account
   - ✅ View titles list
   - ✅ Open existing title detail page
   - ✅ Edit existing title (old form should still work)

4. **Verify no errors in console**

---

## Troubleshooting

### Docker Issues

**Error**: `Cannot connect to the Docker daemon`
- **Fix**: Start Docker Desktop application

**Error**: `port already in use`
- **Fix**: Stop other services using ports 54321-54324
  ```bash
  npx supabase stop
  npx supabase start
  ```

### Migration Issues

**Error**: `migration already exists`
- **Fix**: Use `db reset` to reapply all migrations
  ```bash
  npx supabase db reset
  ```

**Error**: `relation "title_platforms" already exists`
- **Fix**: Migrations already applied, proceed to testing

### Test Script Issues

**Error**: `Cannot find module '@supabase/supabase-js'`
- **Fix**: Install dependencies
  ```bash
  cd apps/creator-v2
  npm install
  ```

**Error**: `RLS policy violation` or `permission denied`
- **Fix**: Test script uses anon key, RLS policies may block operations
- **Solution**: Temporarily disable RLS for testing OR use service role key
  ```javascript
  // In test script, replace SUPABASE_ANON_KEY with:
  const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' // service_role key from npx supabase start
  ```

---

## Success Criteria

Before proceeding to Phase 3 (UI Components), verify:

- ✅ All 4 migration files applied successfully
- ✅ All 3 new tables exist (`title_platforms`, `title_documents`, `title_drafts`)
- ✅ All 30+ new columns exist in `titles` table
- ✅ Backend services test script: **11/11 tests passing**
- ✅ Dashboard regression tests: **No new failures**
- ✅ Existing dashboard features work (AI chatbot, titles list, etc.)

---

## Next Steps After Testing

### If All Tests Pass ✅

**Option A**: Proceed to Phase 3 - UI Components
- Create survey components (MultiStepProgressBar, Step1-5, etc.)
- Build main AddTitleSurvey page
- Integrate backend services with UI

**Option B**: Deploy migrations to staging first
- Test in staging environment before building UI
- Verify production-like environment behavior

### If Tests Fail ❌

1. **Review error messages** in test output
2. **Check Supabase Studio** for table/column structure
3. **Review migration files** for syntax errors
4. **Use rollback script** if critical issues found:
   ```bash
   psql postgresql://postgres:postgres@localhost:54322/postgres -f /Users/sungholee/code/kstorybridge/rollback_questionnaire_changes.sql
   ```
5. **Fix migrations** and retest

---

## Rollback Procedure (Emergency)

If migrations cause critical issues in local testing:

1. **Run rollback script**:
   ```bash
   psql postgresql://postgres:postgres@localhost:54322/postgres -f /Users/sungholee/code/kstorybridge/rollback_questionnaire_changes.sql
   ```

2. **Verify rollback**:
   ```bash
   psql postgresql://postgres:postgres@localhost:54322/postgres -c "\dt title_*"
   # Should only show 'titles' table, NOT platforms/documents/drafts
   ```

3. **Fix migration files** and retry

---

## Files Created for Testing

- ✅ `/apps/creator-v2/test-backend-services.js` - Comprehensive test suite
- ✅ `/BACKEND_SERVICES_TESTING_GUIDE.md` - This guide (step-by-step instructions)
- ✅ `/MIGRATION_IMPLEMENTATION_SUMMARY.md` - Phase 1 summary with next steps
- ✅ `/rollback_questionnaire_changes.sql` - Emergency rollback script

---

**Last Updated**: 2025-10-25
**Status**: Ready for testing
**Next Action**: Start Docker Desktop → Run tests
