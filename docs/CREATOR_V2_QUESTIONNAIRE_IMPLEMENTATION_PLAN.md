# Creator V2: 5-Step Title Questionnaire Implementation Plan

**Date Created**: 2025-10-24
**Status**: IN PROGRESS
**Owner**: Creator V2 Team
**Dashboard Impact**: ZERO (verified safe)

---

## 📋 Executive Summary

Replace the existing single-page "Add Title" form in creator-v2 app with a comprehensive 5-step survey questionnaire based on the K-Story Bridge questionnaire. The implementation uses **additive-only database migrations** to ensure zero impact on the production dashboard app.

**Key Features**:
- 5-step multi-step form with progress indicator
- Auto-save draft functionality (30-second intervals)
- Multiple platform support (Naver, Kakao, Lezhin, etc.)
- File upload to Supabase Storage (PDFs, scripts, documents)
- Strategic required fields (setting, characters, narrative structure)

**Risk Assessment**: ✅ **MINIMAL** - All database changes are backward compatible

---

## 🎯 Requirements Analysis

### User Answers from Questionnaire
1. **Platform Metrics**: Multiple platforms (dynamic add/remove)
2. **Optional Fields**: Some required (setting, characters, ending), others optional
3. **File Storage**: Supabase Storage for uploads
4. **Progress**: Auto-save draft, resume later

### Questionnaire Structure (5 Steps)

#### **Step 1: Basic Information** (Mandatory)
- English Language Title + Type (official vs. translation)
- Hangul Title (script, art, underlying novel)
- Platform URLs (multi-platform with add/remove)
- Platform Metrics (views, subscribers, other)
- Completion Status (radio: completed/ongoing)
- Rights Holder
- Perfect For, Audience, Format
- Genre (multi-select checkboxes)
- Synopsis
- Keywords (multi-select checkboxes)

#### **Step 2: Story Details** (Some Required)
- Inspiration (optional)
- Comparables (optional)
- Important Issues (optional)
- **Setting Description** (REQUIRED)
- World Lore/Rules (optional)
- Supernatural Concepts (optional)
- **Character Details** (REQUIRED - structured JSONB)

#### **Step 3: Narrative Structure** (Required)
- **Beginning/Middle/End Summary** (REQUIRED)
- **Planned Ending if Ongoing** (REQUIRED if completed=false)

#### **Step 4: Existing Materials**
- Source Material PDF Upload (optional)
- NDA Shareability Toggle
- Creative Documents Upload (story bible, outline, script)
- External Links (fan synopsis, wiki, reviews, interviews)

#### **Step 5: Content & Creator Profile**
- Awards (multi-input)
- Sales Records
- Merchandise Deals
- Print Editions
- Media Coverage
- Celebrity Endorsements
- Creator Achievements

---

## 🔍 Dashboard Impact Assessment

### Current Dashboard Dependencies on `titles` Table

**CRITICAL FEATURES (DO NOT BREAK)**:
1. **AI Chatbot** - Uses `combined_embedding` (vector search)
2. **Pitch Analytics** - Uses `pitch` field + `title_content_analysis` join
3. **Featured Titles** - Homepage carousel
4. **Favorites** - `user_favorites` table joins `titles`
5. **Search** - 18+ fields: `keywords`, `genre`, `synopsis`, `tone`, `tags`, etc.

### Dashboard Query Patterns
```typescript
// Common patterns in dashboard (apps/dashboard/src)
titlesService.getAllTitles()           // SELECT *
titlesService.getTitleById(id)         // SELECT * + pitch_analysis
vectorSearchService.search(query)      // Uses combined_embedding
directApiService.getFeaturedTitles()   // JOIN featured with titles
favoritesService.getUserFavorites()    // JOIN user_favorites with titles
```

### Fields Used by Dashboard
```
title_id, title_name_en, title_name_kr, synopsis, genre, keywords,
combined_embedding, pitch, title_image, story_author, art_author,
tone, audience, perfect_for, comps, verified, priority, views, likes
```

**Strategy**: Add new fields as NULLABLE columns → Dashboard queries ignore them

---

## 🗄️ Database Schema Changes

### Phase 1: New Tables (ZERO RISK)

#### Migration 1: `title_platforms`
```sql
-- File: apps/creator-v2/supabase/migrations/20251024000001_create_title_platforms.sql
CREATE TABLE IF NOT EXISTS public.title_platforms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title_id UUID NOT NULL REFERENCES public.titles(title_id) ON DELETE CASCADE,
  platform_name TEXT NOT NULL, -- 'naver', 'kakao', 'lezhin', 'ridibooks', 'other'
  platform_url TEXT NOT NULL,
  views BIGINT DEFAULT 0,
  subscribers BIGINT DEFAULT 0,
  other_metrics JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT title_platforms_title_id_platform_name_unique UNIQUE(title_id, platform_name)
);

CREATE INDEX idx_title_platforms_title_id ON public.title_platforms(title_id);
ALTER TABLE public.title_platforms ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Creators manage platforms for their titles"
ON public.title_platforms FOR ALL
TO authenticated
USING (
  title_id IN (SELECT title_id FROM public.titles WHERE creator_id = auth.uid())
)
WITH CHECK (
  title_id IN (SELECT title_id FROM public.titles WHERE creator_id = auth.uid())
);

COMMENT ON TABLE public.title_platforms IS 'Multiple platform URLs and metrics per title';
```

#### Migration 2: `title_documents`
```sql
-- File: apps/creator-v2/supabase/migrations/20251024000002_create_title_documents.sql
CREATE TABLE IF NOT EXISTS public.title_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title_id UUID NOT NULL REFERENCES public.titles(title_id) ON DELETE CASCADE,
  document_type TEXT NOT NULL CHECK (document_type IN (
    'source_pdf', 'story_bible', 'outline', 'script',
    'press_release', 'interview', 'review', 'wiki', 'other'
  )),
  file_url TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_size BIGINT,
  shareable_with_nda BOOLEAN DEFAULT FALSE,
  external_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_title_documents_title_id ON public.title_documents(title_id);
CREATE INDEX idx_title_documents_type ON public.title_documents(document_type);
ALTER TABLE public.title_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Creators manage documents for their titles"
ON public.title_documents FOR ALL
TO authenticated
USING (
  title_id IN (SELECT title_id FROM public.titles WHERE creator_id = auth.uid())
)
WITH CHECK (
  title_id IN (SELECT title_id FROM public.titles WHERE creator_id = auth.uid())
);

COMMENT ON TABLE public.title_documents IS 'Uploaded creative documents and external links';
```

**Supabase Storage Bucket**:
```sql
-- Create storage bucket for title documents
INSERT INTO storage.buckets (id, name, public)
VALUES ('title-documents', 'title-documents', false)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS policies
CREATE POLICY "Creators upload docs for their titles"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'title-documents' AND
  (storage.foldername(name))[1] IN (
    SELECT title_id::text FROM titles WHERE creator_id = auth.uid()
  )
);

CREATE POLICY "Creators view docs for their titles"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'title-documents' AND
  (storage.foldername(name))[1] IN (
    SELECT title_id::text FROM titles WHERE creator_id = auth.uid()
  )
);

CREATE POLICY "Creators delete docs for their titles"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'title-documents' AND
  (storage.foldername(name))[1] IN (
    SELECT title_id::text FROM titles WHERE creator_id = auth.uid()
  )
);
```

#### Migration 3: `title_drafts`
```sql
-- File: apps/creator-v2/supabase/migrations/20251024000003_create_title_drafts.sql
CREATE TABLE IF NOT EXISTS public.title_drafts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  draft_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  current_step INTEGER DEFAULT 1 CHECK (current_step >= 1 AND current_step <= 5),
  last_saved_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT one_draft_per_creator UNIQUE(creator_id)
);

CREATE INDEX idx_title_drafts_creator_id ON public.title_drafts(creator_id);
CREATE INDEX idx_title_drafts_last_saved ON public.title_drafts(last_saved_at DESC);
ALTER TABLE public.title_drafts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Creators manage their own drafts"
ON public.title_drafts FOR ALL
TO authenticated
USING (auth.uid() = creator_id)
WITH CHECK (auth.uid() = creator_id);

COMMENT ON TABLE public.title_drafts IS 'Auto-saved draft data for incomplete title submissions';
```

**Risk**: ✅ **ZERO** - New tables, no existing dependencies

---

### Phase 2: Add Fields to `titles` Table (ADDITIVE ONLY)

```sql
-- File: apps/creator-v2/supabase/migrations/20251024000004_add_questionnaire_fields_to_titles.sql
BEGIN;

-- ✅ SAFE: All fields are NULLABLE (backward compatible)
-- Dashboard queries using SELECT * will ignore these new fields

-- Title type
ALTER TABLE public.titles ADD COLUMN IF NOT EXISTS is_official_english_title BOOLEAN DEFAULT NULL;
ALTER TABLE public.titles ADD COLUMN IF NOT EXISTS english_title_type TEXT CHECK (english_title_type IN ('official', 'translation', NULL));

-- Hangul titles (separate from existing title_name_kr)
ALTER TABLE public.titles ADD COLUMN IF NOT EXISTS script_title_kr TEXT;
ALTER TABLE public.titles ADD COLUMN IF NOT EXISTS script_title_en TEXT;
ALTER TABLE public.titles ADD COLUMN IF NOT EXISTS art_title_kr TEXT;
ALTER TABLE public.titles ADD COLUMN IF NOT EXISTS art_title_en TEXT;
ALTER TABLE public.titles ADD COLUMN IF NOT EXISTS underlying_novel_kr TEXT;
ALTER TABLE public.titles ADD COLUMN IF NOT EXISTS underlying_novel_en TEXT;

-- Rights holder (separate from existing 'rights' field)
ALTER TABLE public.titles ADD COLUMN IF NOT EXISTS rights_holder_name TEXT;
ALTER TABLE public.titles ADD COLUMN IF NOT EXISTS rights_holder_company TEXT;

-- Story details (strongly encouraged in questionnaire)
ALTER TABLE public.titles ADD COLUMN IF NOT EXISTS inspiration TEXT;
ALTER TABLE public.titles ADD COLUMN IF NOT EXISTS comparables TEXT[]; -- Distinct from 'comps'
ALTER TABLE public.titles ADD COLUMN IF NOT EXISTS important_issues TEXT;
ALTER TABLE public.titles ADD COLUMN IF NOT EXISTS setting_description TEXT; -- REQUIRED in UI
ALTER TABLE public.titles ADD COLUMN IF NOT EXISTS world_lore TEXT;
ALTER TABLE public.titles ADD COLUMN IF NOT EXISTS supernatural_concepts TEXT;

-- Character details (REQUIRED in UI)
ALTER TABLE public.titles ADD COLUMN IF NOT EXISTS character_details JSONB DEFAULT '[]'::jsonb;
-- Structure: [{name, age, gender, sexuality, ethnicity, background, traits, arc}, ...]

-- Narrative structure (REQUIRED in UI)
ALTER TABLE public.titles ADD COLUMN IF NOT EXISTS story_structure TEXT; -- Beginning/middle/end
ALTER TABLE public.titles ADD COLUMN IF NOT EXISTS planned_ending TEXT; -- For ongoing titles
ALTER TABLE public.titles ADD COLUMN IF NOT EXISTS narrative_arc TEXT;

-- Content profile
ALTER TABLE public.titles ADD COLUMN IF NOT EXISTS awards TEXT[];
ALTER TABLE public.titles ADD COLUMN IF NOT EXISTS sales_records TEXT;
ALTER TABLE public.titles ADD COLUMN IF NOT EXISTS merchandise_deals TEXT;
ALTER TABLE public.titles ADD COLUMN IF NOT EXISTS print_editions BOOLEAN DEFAULT FALSE;
ALTER TABLE public.titles ADD COLUMN IF NOT EXISTS print_edition_details TEXT;
ALTER TABLE public.titles ADD COLUMN IF NOT EXISTS media_coverage TEXT;
ALTER TABLE public.titles ADD COLUMN IF NOT EXISTS celebrity_endorsements TEXT;

-- Creator achievements (JSONB for flexibility)
ALTER TABLE public.titles ADD COLUMN IF NOT EXISTS creator_achievements JSONB DEFAULT '{}'::jsonb;

-- Add comments for documentation
COMMENT ON COLUMN public.titles.is_official_english_title IS 'Whether English title is official (vs. direct translation)';
COMMENT ON COLUMN public.titles.character_details IS 'JSONB array: [{name, age, gender, traits, arc}, ...]';
COMMENT ON COLUMN public.titles.story_structure IS 'Beginning/middle/end narrative summary (REQUIRED)';
COMMENT ON COLUMN public.titles.planned_ending IS 'Planned ending for ongoing titles (REQUIRED if completed=false)';

COMMIT;
```

**Risk**: ✅ **LOW**
- All fields are NULLABLE → backward compatible
- Dashboard queries ignore new fields
- No data type changes to existing fields
- No DROP operations

**Dashboard Verification**:
```typescript
// This query still works without any changes
const titles = await supabase.from('titles').select('*');
// New fields will be NULL for existing titles
```

---

## 🛠️ Backend Implementation

### New Services (apps/creator-v2/src/services/)

#### 1. `platformsService.ts`
```typescript
import { supabase } from '@/integrations/supabase/client';

export interface TitlePlatform {
  id: string;
  title_id: string;
  platform_name: 'naver' | 'kakao' | 'lezhin' | 'ridibooks' | 'other';
  platform_url: string;
  views: number;
  subscribers: number;
  other_metrics?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface CreatePlatformInput {
  title_id: string;
  platform_name: string;
  platform_url: string;
  views?: number;
  subscribers?: number;
  other_metrics?: Record<string, any>;
}

export const platformsService = {
  async addPlatform(input: CreatePlatformInput): Promise<TitlePlatform> {
    const { data, error } = await supabase
      .from('title_platforms')
      .insert(input)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async getPlatformsByTitleId(titleId: string): Promise<TitlePlatform[]> {
    const { data, error } = await supabase
      .from('title_platforms')
      .select('*')
      .eq('title_id', titleId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async updatePlatform(id: string, updates: Partial<CreatePlatformInput>): Promise<TitlePlatform> {
    const { data, error } = await supabase
      .from('title_platforms')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async deletePlatform(id: string): Promise<void> {
    const { error } = await supabase
      .from('title_platforms')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }
};
```

#### 2. `documentsService.ts`
```typescript
import { supabase } from '@/integrations/supabase/client';

export interface TitleDocument {
  id: string;
  title_id: string;
  document_type: 'source_pdf' | 'story_bible' | 'outline' | 'script' | 'press_release' | 'interview' | 'review' | 'wiki' | 'other';
  file_url: string;
  file_name: string;
  file_size: number;
  shareable_with_nda: boolean;
  external_url?: string;
  created_at: string;
  updated_at: string;
}

export interface UploadDocumentInput {
  title_id: string;
  document_type: string;
  file: File;
  shareable_with_nda?: boolean;
  external_url?: string;
}

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export const documentsService = {
  async uploadDocument(input: UploadDocumentInput): Promise<TitleDocument> {
    const { title_id, document_type, file, shareable_with_nda, external_url } = input;

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      throw new Error(`File size exceeds 10MB limit (${(file.size / 1024 / 1024).toFixed(2)}MB)`);
    }

    // Upload to Supabase Storage
    const filePath = `${title_id}/${Date.now()}_${file.name}`;
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('title-documents')
      .upload(filePath, file);

    if (uploadError) throw uploadError;

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('title-documents')
      .getPublicUrl(filePath);

    // Insert document record
    const { data, error } = await supabase
      .from('title_documents')
      .insert({
        title_id,
        document_type,
        file_url: publicUrl,
        file_name: file.name,
        file_size: file.size,
        shareable_with_nda: shareable_with_nda ?? false,
        external_url
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async getDocumentsByTitleId(titleId: string): Promise<TitleDocument[]> {
    const { data, error } = await supabase
      .from('title_documents')
      .select('*')
      .eq('title_id', titleId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async deleteDocument(id: string): Promise<void> {
    // Get document to extract file path
    const { data: doc, error: fetchError } = await supabase
      .from('title_documents')
      .select('file_url')
      .eq('id', id)
      .single();

    if (fetchError) throw fetchError;

    // Delete from storage
    const filePath = doc.file_url.split('/').slice(-2).join('/'); // Extract path from URL
    const { error: storageError } = await supabase.storage
      .from('title-documents')
      .remove([filePath]);

    if (storageError) console.error('Storage deletion error:', storageError);

    // Delete database record
    const { error } = await supabase
      .from('title_documents')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }
};
```

#### 3. `draftService.ts`
```typescript
import { supabase } from '@/integrations/supabase/client';

export interface TitleDraft {
  id: string;
  creator_id: string;
  draft_data: Record<string, any>;
  current_step: number;
  last_saved_at: string;
  created_at: string;
  updated_at: string;
}

export const draftService = {
  async saveDraft(userId: string, draftData: Record<string, any>, currentStep: number): Promise<TitleDraft> {
    const { data, error } = await supabase
      .from('title_drafts')
      .upsert({
        creator_id: userId,
        draft_data: draftData,
        current_step: currentStep,
        last_saved_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'creator_id'
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async loadDraft(userId: string): Promise<TitleDraft | null> {
    const { data, error } = await supabase
      .from('title_drafts')
      .select('*')
      .eq('creator_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') throw error; // Ignore "not found" error
    return data;
  },

  async deleteDraft(userId: string): Promise<void> {
    const { error } = await supabase
      .from('title_drafts')
      .delete()
      .eq('creator_id', userId);

    if (error) throw error;
  }
};
```

#### 4. Update `titlesService.ts`
```typescript
// Add new fields to CreateTitleInput type
export interface CreateTitleInput {
  // Existing fields...
  title_name_en: string;
  title_name_kr: string;
  // ... other existing fields

  // New questionnaire fields
  is_official_english_title?: boolean;
  english_title_type?: 'official' | 'translation';
  script_title_kr?: string;
  script_title_en?: string;
  art_title_kr?: string;
  art_title_en?: string;
  underlying_novel_kr?: string;
  underlying_novel_en?: string;
  rights_holder_name?: string;
  rights_holder_company?: string;
  inspiration?: string;
  comparables?: string[];
  important_issues?: string;
  setting_description?: string;
  world_lore?: string;
  supernatural_concepts?: string;
  character_details?: Array<{
    name: string;
    age?: number;
    gender?: string;
    sexuality?: string;
    ethnicity?: string;
    background?: string;
    traits?: string;
    arc?: string;
  }>;
  story_structure?: string;
  planned_ending?: string;
  narrative_arc?: string;
  awards?: string[];
  sales_records?: string;
  merchandise_deals?: string;
  print_editions?: boolean;
  print_edition_details?: string;
  media_coverage?: string;
  celebrity_endorsements?: string;
  creator_achievements?: Record<string, any>;
}
```

---

## 🎨 Frontend Implementation

### Component Structure

```
apps/creator-v2/src/
├── pages/
│   ├── AddTitleSurvey.tsx              # Main 5-step form page
│   └── Drafts.tsx                      # (Optional) List saved drafts
├── components/
│   ├── survey/
│   │   ├── MultiStepProgressBar.tsx    # Progress indicator (1-5)
│   │   ├── Step1BasicInfo.tsx          # Step 1 fields
│   │   ├── Step2StoryDetails.tsx       # Step 2 fields
│   │   ├── Step3Narrative.tsx          # Step 3 fields
│   │   ├── Step4Materials.tsx          # Step 4 fields
│   │   ├── Step5Profile.tsx            # Step 5 fields
│   │   ├── PlatformInput.tsx           # Dynamic platform URL + metrics
│   │   ├── FileUploadZone.tsx          # Drag-drop file upload
│   │   ├── CharacterDetailsInput.tsx   # Structured character entry
│   │   ├── DynamicTextArray.tsx        # Add/remove text inputs
│   │   └── AutoSaveIndicator.tsx       # "Last saved: 2 min ago"
```

### Key Components

#### `AddTitleSurvey.tsx` (Main Page)
```typescript
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAuth } from '@/hooks/useAuth';
import { draftService } from '@/services/draftService';
import { titlesService } from '@/services/titlesService';
import { platformsService } from '@/services/platformsService';
import { documentsService } from '@/services/documentsService';
import { MultiStepProgressBar } from '@/components/survey/MultiStepProgressBar';
import { AutoSaveIndicator } from '@/components/survey/AutoSaveIndicator';
import { step1Schema, step2Schema, step3Schema, step4Schema, step5Schema } from '@/schemas/titleSurvey';

export default function AddTitleSurvey() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm({
    resolver: zodResolver(getCurrentStepSchema(currentStep)),
    mode: 'onChange'
  });

  // Load draft on mount
  useEffect(() => {
    const loadDraft = async () => {
      if (!user?.id) return;
      const draft = await draftService.loadDraft(user.id);
      if (draft) {
        form.reset(draft.draft_data);
        setCurrentStep(draft.current_step);
        setLastSaved(new Date(draft.last_saved_at));
      }
    };
    loadDraft();
  }, [user?.id]);

  // Auto-save every 30 seconds
  useEffect(() => {
    if (!user?.id) return;

    const autoSave = async () => {
      const formData = form.getValues();
      await draftService.saveDraft(user.id, formData, currentStep);
      setLastSaved(new Date());
    };

    const interval = setInterval(autoSave, 30000); // 30 seconds
    return () => clearInterval(interval);
  }, [user?.id, currentStep, form]);

  const onSubmit = async (data: any) => {
    if (currentStep < 5) {
      setCurrentStep(currentStep + 1);
      return;
    }

    // Final submission
    setIsSubmitting(true);
    try {
      // 1. Create title
      const newTitle = await titlesService.createTitle({
        ...data,
        creator_id: user!.id
      });

      // 2. Create platforms
      if (data.platforms?.length > 0) {
        await Promise.all(
          data.platforms.map(p => platformsService.addPlatform({
            title_id: newTitle.title_id,
            ...p
          }))
        );
      }

      // 3. Upload documents
      if (data.documents?.length > 0) {
        await Promise.all(
          data.documents.map(d => documentsService.uploadDocument({
            title_id: newTitle.title_id,
            ...d
          }))
        );
      }

      // 4. Delete draft
      await draftService.deleteDraft(user!.id);

      // 5. Navigate to title detail
      navigate(`/titles/${newTitle.title_id}`);
    } catch (error) {
      console.error('Failed to create title:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto">
        <MultiStepProgressBar currentStep={currentStep} totalSteps={5} />
        <AutoSaveIndicator lastSaved={lastSaved} />

        <form onSubmit={form.handleSubmit(onSubmit)}>
          {currentStep === 1 && <Step1BasicInfo form={form} />}
          {currentStep === 2 && <Step2StoryDetails form={form} />}
          {currentStep === 3 && <Step3Narrative form={form} />}
          {currentStep === 4 && <Step4Materials form={form} />}
          {currentStep === 5 && <Step5Profile form={form} />}

          <div className="flex justify-between mt-8">
            {currentStep > 1 && (
              <Button
                type="button"
                variant="outline"
                onClick={() => setCurrentStep(currentStep - 1)}
              >
                Back
              </Button>
            )}
            <Button type="submit" disabled={isSubmitting}>
              {currentStep === 5 ? 'Submit' : 'Next'}
            </Button>
          </div>
        </form>
      </div>
    </MainLayout>
  );
}
```

---

## 🧪 Testing Strategy

### Phase 1: Database Migration Tests

```bash
# Local Supabase testing
cd /Users/sungholee/code/kstorybridge
npx supabase db reset  # Reset to clean state
npx supabase migration up  # Apply all migrations

# Verify tables created
psql $DATABASE_URL -c "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name LIKE 'title_%';"
```

### Phase 2: Dashboard Regression Tests

```bash
# Run existing dashboard tests
cd apps/dashboard
npm test -- --coverage

# Build verification
npm run build

# Manual smoke tests:
# 1. Open http://localhost:8081/buyers/chat
# 2. Test AI chatbot query: "Find me romance fantasy titles"
# 3. Verify vector search returns results
# 4. Check title detail page loads
# 5. Test favorites add/remove
```

### Phase 3: Creator-v2 Integration Tests

```bash
# Run creator-v2 tests
cd apps/creator-v2
npm run build  # Verify TypeScript compilation
npm test       # Run unit tests (if exist)

# Manual E2E test:
# 1. Navigate to /add-survey
# 2. Fill Step 1 → verify auto-save after 30s
# 3. Refresh page → verify draft restored
# 4. Fill all 5 steps → submit
# 5. Verify title created in database
# 6. Verify platforms created
# 7. Verify documents uploaded to storage
```

### Phase 4: Load Testing (Optional)

```bash
# Use k6 or similar tool to test database performance
# Ensure new JSONB columns don't slow down queries
```

---

## 🔄 Rollback Plan

### Immediate Rollback Script (< 5 minutes)

**File**: `/Users/sungholee/code/kstorybridge/rollback_questionnaire_changes.sql`

```sql
BEGIN;

-- Rollback: Drop new tables
DROP TABLE IF EXISTS public.title_drafts CASCADE;
DROP TABLE IF EXISTS public.title_documents CASCADE;
DROP TABLE IF EXISTS public.title_platforms CASCADE;

-- Rollback: Drop storage bucket
DELETE FROM storage.buckets WHERE id = 'title-documents';

-- Rollback: Remove new columns from titles table
ALTER TABLE public.titles DROP COLUMN IF EXISTS is_official_english_title;
ALTER TABLE public.titles DROP COLUMN IF EXISTS english_title_type;
ALTER TABLE public.titles DROP COLUMN IF EXISTS script_title_kr;
ALTER TABLE public.titles DROP COLUMN IF EXISTS script_title_en;
ALTER TABLE public.titles DROP COLUMN IF EXISTS art_title_kr;
ALTER TABLE public.titles DROP COLUMN IF EXISTS art_title_en;
ALTER TABLE public.titles DROP COLUMN IF EXISTS underlying_novel_kr;
ALTER TABLE public.titles DROP COLUMN IF EXISTS underlying_novel_en;
ALTER TABLE public.titles DROP COLUMN IF EXISTS rights_holder_name;
ALTER TABLE public.titles DROP COLUMN IF EXISTS rights_holder_company;
ALTER TABLE public.titles DROP COLUMN IF EXISTS inspiration;
ALTER TABLE public.titles DROP COLUMN IF EXISTS comparables;
ALTER TABLE public.titles DROP COLUMN IF EXISTS important_issues;
ALTER TABLE public.titles DROP COLUMN IF EXISTS setting_description;
ALTER TABLE public.titles DROP COLUMN IF EXISTS world_lore;
ALTER TABLE public.titles DROP COLUMN IF EXISTS supernatural_concepts;
ALTER TABLE public.titles DROP COLUMN IF EXISTS character_details;
ALTER TABLE public.titles DROP COLUMN IF EXISTS story_structure;
ALTER TABLE public.titles DROP COLUMN IF EXISTS planned_ending;
ALTER TABLE public.titles DROP COLUMN IF EXISTS narrative_arc;
ALTER TABLE public.titles DROP COLUMN IF EXISTS awards;
ALTER TABLE public.titles DROP COLUMN IF EXISTS sales_records;
ALTER TABLE public.titles DROP COLUMN IF EXISTS merchandise_deals;
ALTER TABLE public.titles DROP COLUMN IF EXISTS print_editions;
ALTER TABLE public.titles DROP COLUMN IF EXISTS print_edition_details;
ALTER TABLE public.titles DROP COLUMN IF EXISTS media_coverage;
ALTER TABLE public.titles DROP COLUMN IF EXISTS celebrity_endorsements;
ALTER TABLE public.titles DROP COLUMN IF EXISTS creator_achievements;

COMMIT;
```

**Execution**:
```bash
# Production rollback
psql $PRODUCTION_DATABASE_URL -f rollback_questionnaire_changes.sql

# Verify dashboard health
curl https://dashboard.kstorybridge.com/buyers/home
curl https://dashboard.kstorybridge.com/api/titles
```

### Verification After Rollback
1. ✅ Dashboard loads without errors
2. ✅ AI chatbot works (vector search functional)
3. ✅ Titles list displays correctly
4. ✅ Favorites functionality intact
5. ✅ Pitch analytics working

---

## 📅 Implementation Timeline

| Day | Phase | Tasks | Deliverables |
|-----|-------|-------|--------------|
| **Day 1** | Database Setup | Create migrations 1-4, test locally | 4 migration files |
| **Day 2** | Backend Services | platformsService, documentsService, draftService | 3 service files + tests |
| **Day 3** | UI Components (Part 1) | MultiStepProgressBar, PlatformInput, FileUploadZone | 3 components |
| **Day 4** | UI Components (Part 2) | Step1-5 components, CharacterDetailsInput | 6 components |
| **Day 5** | Integration | AddTitleSurvey page, auto-save logic, validation | Working E2E flow |
| **Day 6** | Testing | Dashboard regression, creator-v2 E2E, manual QA | Test report |
| **Day 7** | Deployment | Deploy to staging, production smoke tests | Live feature |

---

## ✅ Success Metrics

### Dashboard Health (Zero Degradation)
- ✅ AI chatbot response time < 5s (baseline: 3-5s)
- ✅ Vector search results quality (no change)
- ✅ Page load time < 2s (no change)
- ✅ Zero TypeScript errors in dashboard build
- ✅ Zero runtime errors in production logs (first 48 hours)

### Creator-v2 Adoption
- ✅ 5-step survey completion rate > 80%
- ✅ Auto-save success rate > 95%
- ✅ File upload success rate > 90%
- ✅ Average form completion time < 15 minutes
- ✅ User feedback: "Easy to use" rating > 4/5

---

## 🚨 Risk Matrix

| Risk | Probability | Impact | Mitigation |
|------|------------|--------|------------|
| Dashboard queries break | LOW | HIGH | Additive-only migrations, regression tests |
| Vector search fails | LOW | CRITICAL | No changes to embedding fields |
| Storage upload fails | MEDIUM | LOW | Error handling, retry logic |
| Auto-save data loss | LOW | MEDIUM | 30s intervals, local backup |
| Migration rollback needed | LOW | MEDIUM | Pre-written rollback script |

**Overall Risk**: ✅ **MINIMAL** - No breaking changes to production dashboard

---

## 📝 Migration Checklist

**Pre-Deployment**:
- [ ] Run migrations on local Supabase (`npx supabase db reset`)
- [ ] Verify all tables created with correct schemas
- [ ] Test RLS policies (creator isolation)
- [ ] Run dashboard regression tests (`npm test` in dashboard)
- [ ] Build dashboard without TypeScript errors (`npm run build`)
- [ ] Manual dashboard smoke test (AI chatbot, titles, favorites)

**Deployment**:
- [ ] Apply migrations to production Supabase
- [ ] Verify dashboard still works (visual check)
- [ ] Test AI chatbot in production
- [ ] Deploy creator-v2 to staging
- [ ] Full QA on staging environment
- [ ] Deploy creator-v2 to production
- [ ] Monitor logs for errors (first 1 hour)

**Post-Deployment**:
- [ ] Monitor dashboard metrics (response times, error rates)
- [ ] Collect user feedback (creator-v2 survey)
- [ ] Review Supabase database performance
- [ ] Update documentation with final schema

---

## 📚 Related Documentation

- [Creator App V2 Rebuild Plan](/docs/CREATOR_APP_V2_REBUILD_PLAN.md)
- [Database Schema Reference](/docs/active/DATABASE_SCHEMA.md)
- [Design System](/docs/active/DESIGN_SYSTEM.md)
- [Supabase Storage Guide](https://supabase.com/docs/guides/storage)

---

## 🔗 References

- **Original Questionnaire**: K-Story Bridge Questionnaire (provided by user)
- **Current Add Title Form**: `/apps/creator-v2/src/pages/AddTitle.tsx`
- **Dashboard Dependencies**: `/apps/dashboard/src/services/titlesService.ts`
- **Database Migrations**: `/apps/creator-v2/supabase/migrations/` (to be created)

---

**Status**: Ready for implementation
**Next Step**: Begin Phase 1 (Database migrations)
**Approval**: Pending user confirmation
