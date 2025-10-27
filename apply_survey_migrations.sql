-- Apply Survey Feature Migrations to Production
-- Date: 2025-10-25
-- Description: Create title_platforms, title_documents, title_drafts tables and add questionnaire fields

-- Migration 1: Create title_platforms table
\i /Users/sungholee/code/kstorybridge/apps/dashboard/supabase/migrations/20251024000001_create_title_platforms.sql

-- Migration 2: Create title_documents table
\i /Users/sungholee/code/kstorybridge/apps/dashboard/supabase/migrations/20251024000002_create_title_documents.sql

-- Migration 3: Create title_drafts table
\i /Users/sungholee/code/kstorybridge/apps/dashboard/supabase/migrations/20251024000003_create_title_drafts.sql

-- Migration 4: Add questionnaire fields to titles table
\i /Users/sungholee/code/kstorybridge/apps/dashboard/supabase/migrations/20251024000004_add_questionnaire_fields_to_titles.sql
