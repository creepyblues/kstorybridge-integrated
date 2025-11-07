# Creative Asset Generation System - Implementation Plan

**Project**: KStoryBridge Monorepo
**Feature**: AI-Powered Marketing Asset Generator
**Location**: Dashboard Admin Section
**Status**: In Development (Phase 1 - Isolated Design)
**Last Updated**: 2025-11-06

---

## ⚡ DESIGN CHANGE: Fully Isolated Architecture

**IMPORTANT**: This feature is designed with **complete isolation** from existing app structures.

**Isolation Principles**:
- ✅ **NO foreign keys** to existing tables (titles, admin)
- ✅ **NO RLS queries** to other tables (admin list hardcoded)
- ✅ **Standalone operation** - can work with just parameters
- ✅ **Data stored directly** - title names, admin emails (no lookups)
- ✅ **Can be extracted** to separate microservice if needed

---

## 📋 Executive Summary

Build a **standalone admin tool** that analyzes pitch decks using AI to generate creative asset ideas (images/videos) for marketing purposes. Admin can review AI-generated prompts and execute them individually to create actual assets using OpenAI APIs.

**Key Capabilities:**
- Analyze pitch content to generate 10-15 asset ideas per title
- AI-generated prompts for each asset type
- On-demand image generation via DALL-E 3
- Future: Video generation when OpenAI video API launches
- Track generation history, costs, and approvals
- Retry mechanism for quality control
- **Completely independent** from existing database structures

---

## 🚀 Deployment Strategy

**Status**: Phase 1 Refactored for Isolation
**Branch Strategy**: Deploy to `v2` branch for staging verification first

### Phase 1 Deployment (Isolated Database Setup)

**Status**: 🔄 Refactored - Ready for Deployment

**Migration Files** (Isolated Design):
- `20251106100000_create_isolated_marketing_assets.sql` - **NO foreign keys**, hardcoded admin emails
- `20251106100001_setup_isolated_marketing_assets_storage.sql` - **NO admin table queries**

**Deployment Steps**:

1. **Push to v2 branch** (staging):
   ```bash
   git checkout v2
   git merge main  # or cherry-pick 1db41d49
   git push origin v2
   ```

2. **Verify in staging**:
   - Migrations apply automatically in Supabase
   - Run test script remotely (via edge function or admin UI)
   - Verify table exists: `title_marketing_assets`
   - Verify bucket exists: `marketing-assets`

3. **Test table access**:
   - Admin user can query table (JWT email check)
   - RLS policies work correctly (no table joins)
   - **NO foreign keys** - completely independent

4. **Merge to main** (production):
   ```bash
   git checkout main
   git merge v2
   git push origin main
   ```

**Note on Local Development**:
- Local `npx supabase db reset` may fail due to pre-existing table naming inconsistencies
- This is a known issue not introduced by these migrations
- Recommended: Test in staging environment instead of local reset
- Alternative: Apply migrations individually with `npx supabase migration up`

**Risk Assessment**: See [RISK_ASSESSMENT.md](./RISK_ASSESSMENT.md) for complete safety analysis

---

## 🎯 User Workflow

### Step 1: Select Title
- Admin navigates to `/admin/asset-generation`
- Dropdown shows only titles with pitch analysis data
- Selects title: e.g., "True Beauty (여신강림)"

### Step 2: Generate Asset Ideas
- Clicks "Analyze & Generate Ideas" button
- System calls GPT-4 to analyze pitch_analysis data
- Returns 10-15 structured asset ideas across 3 categories:
  - **Social Media Posts** (Instagram, Facebook, Twitter)
  - **Ad Creatives** (Display ads, YouTube thumbnails)
  - **Pitch Materials** (Concept art, key scenes, character cards)

### Step 3: Review Generated Ideas
- System displays ideas in organized categories
- Each idea shows:
  - Asset type and format
  - Description of what to generate
  - AI-generated prompt for image/video API
  - Estimated cost

### Step 4: Generate Individual Assets
- Admin reviews prompt, edits if needed
- Clicks "Generate" button for specific asset
- System shows progress indicator
- Generated asset appears inline with preview
- Admin can:
  - Approve/reject
  - Retry with same prompt
  - Edit prompt and retry
  - Download asset

### Step 5: Track Progress
- View all generated assets for title
- See total costs across all titles
- Export asset package
- Download generation report

---

## 🏗️ Technical Architecture

### Database Schema (ISOLATED DESIGN)

**New Table: `title_marketing_assets`**

**KEY CHANGES FROM ORIGINAL**:
- ❌ **NO** `REFERENCES titles(title_id)` foreign key
- ❌ **NO** `REFERENCES admin(id)` foreign key
- ✅ `title_id TEXT` instead of UUID with FK
- ✅ `title_name TEXT` stored directly (no lookup)
- ✅ `approved_by_email TEXT` instead of FK to admin

```sql
CREATE TABLE title_marketing_assets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Title reference (TEXT, NO foreign key)
  title_id TEXT NOT NULL,           -- External ID only
  title_name TEXT NOT NULL,          -- Stored directly

  -- Asset categorization
  asset_category TEXT NOT NULL CHECK (asset_category IN (
    'social_media',
    'ad_creative',
    'pitch_material'
  )),
  asset_type TEXT NOT NULL, -- 'instagram_story', 'poster', 'concept_art', etc.
  asset_format TEXT, -- '1080x1920', '1200x628', '1024x1024', etc.

  -- Content
  description TEXT NOT NULL,
  prompt_template TEXT NOT NULL, -- Original AI-generated prompt
  prompt_used TEXT, -- Actual prompt used (if edited)

  -- Generated assets
  image_url TEXT, -- Supabase Storage URL
  video_url TEXT, -- Future: video generation

  -- Generation metadata
  generation_api TEXT CHECK (generation_api IN ('dall-e-3', 'openai-video')),
  generation_model TEXT, -- 'dall-e-3', 'dall-e-3-hd', etc.
  generation_cost NUMERIC(10,4) DEFAULT 0,
  generation_attempts INTEGER DEFAULT 0,

  -- Status tracking
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN (
    'pending',      -- Idea created, not generated yet
    'generating',   -- API call in progress
    'completed',    -- Successfully generated
    'failed'        -- Generation failed
  )),

  -- Approval workflow (NO foreign key)
  approved BOOLEAN DEFAULT FALSE,
  approved_by_email TEXT,              -- Email stored directly (e.g., 'sungho@dadble.com')
  approved_at TIMESTAMP WITH TIME ZONE,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_marketing_assets_title_id ON title_marketing_assets(title_id);
CREATE INDEX idx_marketing_assets_status ON title_marketing_assets(status);
CREATE INDEX idx_marketing_assets_category ON title_marketing_assets(asset_category);
```

**RLS Policies (ISOLATED - NO table queries)**:
```sql
-- Check JWT email directly, NO admin table lookup
CREATE POLICY "Admins can manage assets"
  ON title_marketing_assets FOR ALL
  TO authenticated
  USING (
    (auth.jwt() ->> 'email') IN (
      'sungho@dadble.com',
      'kevin@sandstoneartists.com'
    )
  );
```

**Supabase Storage Bucket:**
- Name: `marketing-assets`
- Structure: `{title_id}/{asset_type}-{timestamp}.png`
- Access: Private (signed URLs for previews)
- **RLS**: Hardcoded admin emails (NO admin table queries)

---

### Edge Functions (ISOLATED DESIGN)

#### **Function 1: `analyze-pitch-for-assets`**

**Purpose:** Analyze pitch content and generate asset ideas with prompts

**Input (PARAMETER-BASED - NO database lookups):**
```typescript
{
  title_id: string,                    // External ID (passed from UI)
  title_name: string,                   // Passed from UI (no lookup)
  pitch_deck_url: string,              // Direct Supabase Storage URL
  pitch_analysis?: object,             // Optional pre-extracted data
  admin_email: string                  // From JWT (e.g., 'sungho@dadble.com')
}
```

**Process:**
1. **NO database queries** - all data passed as parameters
2. Construct GPT-4 prompt from provided pitch_analysis
3. Call OpenAI API
4. Parse response and validate structure
5. Insert asset ideas to `title_marketing_assets` (NEW table only)

**Output:**
```typescript
{
  success: true,
  assets_created: 12,
  cost: 0.05,
  ideas: [...]
}
```

#### **Function 2: `generate-asset`**

**Purpose:** Generate actual image/video from asset idea

**Input:**
```typescript
{
  asset_id: string,
  custom_prompt?: string
}
```

**Process:**
1. Fetch asset record
2. Update status to 'generating'
3. Call DALL-E 3 API
4. Download generated image
5. Upload to Supabase Storage
6. Create signed URL
7. Update asset record with results

**Output:**
```typescript
{
  success: true,
  asset_id: string,
  image_url: string,
  storage_path: string,
  cost: 0.08
}
```

---

### Frontend Implementation

#### **Page: `/admin/asset-generation`**

**Component Structure:**
```
AssetGeneration (main page)
├── TitleSelector (dropdown with search)
├── AssetIdeaList (grouped by category)
│   └── AssetGenerationCard (individual asset)
│       ├── Status badge
│       ├── Prompt preview
│       ├── Generate button
│       └── Action buttons (view/retry)
├── AssetPreviewModal (full-screen preview)
└── GenerationStats (cost tracking)
```

**Key Features:**
- Filter titles: Only show titles with `pitch_analysis` data
- Two-stage workflow: Analyze first → Generate individually
- Real-time progress indicators
- Preview generated images inline
- Edit prompt before generation
- Retry with same/different prompt
- Approve/reject workflow
- Cost tracking per asset and total

---

## 📁 File Structure

### New Files to Create (16 files)

**Database:**
1. `/supabase/migrations/[timestamp]_create_marketing_assets_table.sql`
2. `/supabase/migrations/[timestamp]_setup_marketing_assets_storage.sql`

**Edge Functions:**
3. `/apps/dashboard/supabase/functions/analyze-pitch-for-assets/index.ts`
4. `/apps/dashboard/supabase/functions/generate-asset/index.ts`

**Admin Pages:**
5. `/apps/dashboard/src/pages/admin/AssetGeneration.tsx`

**Components:**
6. `/apps/dashboard/src/components/admin/TitleSelector.tsx`
7. `/apps/dashboard/src/components/admin/AssetIdeaList.tsx`
8. `/apps/dashboard/src/components/admin/AssetGenerationCard.tsx`
9. `/apps/dashboard/src/components/admin/AssetPreviewModal.tsx`
10. `/apps/dashboard/src/components/admin/GenerationStats.tsx`

**Services & Hooks:**
11. `/apps/dashboard/src/services/assetGenerationService.ts`
12. `/apps/dashboard/src/hooks/useAssetGeneration.ts`

**Types:**
13. `/apps/dashboard/src/types/asset-generation.ts`

**Documentation:**
14. `/docs/features/asset-generation/ASSET_GENERATION_GUIDE.md`
15. `/docs/features/asset-generation/PROMPT_ENGINEERING.md`
16. `/docs/features/asset-generation/API_REFERENCE.md`

### Files to Modify (2 files)

1. `/apps/dashboard/src/App.tsx` - Add route
2. `/apps/dashboard/src/components/layout/AdminLayout.tsx` - Add navigation item

---

## 🚀 Implementation Phases

### **Phase 1: Database Setup** ✅ IN PROGRESS
- [ ] Create `title_marketing_assets` table migration
- [ ] Set up RLS policies for admin access
- [ ] Create `marketing-assets` storage bucket
- [ ] Test bucket access and signed URLs

**Deliverable:** Database ready to store asset records and files

---

### **Phase 2: Backend - Asset Analysis**
- [ ] Create edge function `analyze-pitch-for-assets`
- [ ] Design GPT-4 prompt for asset idea generation
- [ ] Implement title data fetching
- [ ] Parse AI response and validate structure
- [ ] Insert asset ideas to database
- [ ] Add error handling and logging
- [ ] Test with 3 sample titles

**Deliverable:** Working edge function that generates 10-15 asset ideas per title

---

### **Phase 3: Backend - Asset Generation**
- [ ] Create edge function `generate-asset`
- [ ] Integrate DALL-E 3 API
- [ ] Implement image download logic
- [ ] Upload images to Supabase Storage
- [ ] Generate signed URLs for previews
- [ ] Update asset records with results
- [ ] Track generation attempts and costs
- [ ] Add retry logic for failures
- [ ] Test with various asset types

**Deliverable:** Working edge function that generates images from prompts

---

### **Phase 4: Frontend - Core UI**
- [ ] Create `AssetGeneration.tsx` main page
- [ ] Implement `TitleSelector` component
- [ ] Add "Analyze" button with loading state
- [ ] Create `AssetIdeaList` component
- [ ] Implement category grouping
- [ ] Add status badges
- [ ] Create `AssetGenerationCard` component
- [ ] Add "Generate" buttons per asset
- [ ] Show inline progress indicators
- [ ] Test user flow end-to-end

**Deliverable:** Functional admin page for asset generation

---

### **Phase 5: Frontend - Preview & Actions**
- [ ] Create `AssetPreviewModal` component
- [ ] Display generated images inline
- [ ] Add full-screen preview on click
- [ ] Implement "Retry" functionality
- [ ] Add prompt editing capability
- [ ] Create approval workflow
- [ ] Add "Download" button
- [ ] Test all interactive features

**Deliverable:** Complete asset review and approval workflow

---

### **Phase 6: Frontend - Stats & Tracking**
- [ ] Create `GenerationStats` component
- [ ] Show total cost across all generations
- [ ] Display count by status
- [ ] Show breakdown by category
- [ ] Add total generated count
- [ ] Test with various data scenarios

**Deliverable:** Comprehensive generation tracking dashboard

---

### **Phase 7: Services & Integration**
- [ ] Create `assetGenerationService.ts`
- [ ] Implement all API methods
- [ ] Create `useAssetGeneration` hook
- [ ] Set up React Query with auto-refetch
- [ ] Add optimistic updates
- [ ] Implement error boundary
- [ ] Add toast notifications
- [ ] Test service layer independently

**Deliverable:** Robust data layer with React Query integration

---

### **Phase 8: Routes & Navigation**
- [ ] Add route `/admin/asset-generation` in `App.tsx`
- [ ] Add admin auth protection
- [ ] Add navigation item in `AdminLayout.tsx`
- [ ] Set icon and description
- [ ] Test navigation and access control

**Deliverable:** Asset generation page accessible from admin menu

---

### **Phase 9: Testing & Refinement**
- [ ] Test with 5-10 diverse titles
- [ ] Verify cost accuracy
- [ ] Test error scenarios
- [ ] Test edge cases
- [ ] Performance testing
- [ ] Mobile responsiveness check
- [ ] Cross-browser testing
- [ ] User acceptance testing

**Deliverable:** Production-ready feature with comprehensive testing

---

### **Phase 10: Documentation**
- [ ] Create `ASSET_GENERATION_GUIDE.md`
- [ ] Create `PROMPT_ENGINEERING.md`
- [ ] Create `API_REFERENCE.md`
- [ ] Document cost management strategies
- [ ] Add troubleshooting section
- [ ] Update `CLAUDE.md`
- [ ] Create video demo (optional)

**Deliverable:** Complete documentation package

---

## 💰 Cost Analysis

### OpenAI API Pricing

**GPT-4 Turbo (Analysis):**
- Input: ~$10/1M tokens
- Output: ~$30/1M tokens
- Per analysis: ~5000 tokens = **$0.05**

**DALL-E 3 (Image Generation):**
- Standard 1024x1024: **$0.04**
- HD 1024x1024: **$0.08**
- HD 1024x1792: **$0.12**

### Projected Costs

**Scenario 1: Small Scale (10 titles)**
- Analysis: 10 × $0.05 = $0.50
- Images: 10 titles × 10 assets × $0.08 = $8.00
- **Total: $8.50**

**Scenario 2: Medium Scale (50 titles)**
- Analysis: 50 × $0.05 = $2.50
- Images: 50 titles × 10 assets × $0.08 = $40.00
- **Total: $42.50**

**Scenario 3: Large Scale (200 titles)**
- Analysis: 200 × $0.05 = $10.00
- Images: 200 titles × 10 assets × $0.08 = $160.00
- **Total: $170.00**

---

## ✅ Success Criteria

### Functional Requirements
- ✅ Admin can select titles with pitch data
- ✅ System generates 10-15 asset ideas per title
- ✅ Each idea includes description and prompt
- ✅ Admin can generate images individually
- ✅ Admin can edit prompts before generation
- ✅ Admin can retry failed generations
- ✅ System tracks costs accurately
- ✅ Admin can approve/reject assets
- ✅ Generated assets stored in Supabase Storage

### Performance Requirements
- ✅ Analysis completes in <10 seconds
- ✅ Image generation completes in <30 seconds
- ✅ UI remains responsive during generation
- ✅ Auto-refetch works without manual refresh
- ✅ Handles 10 concurrent generations

### Quality Requirements
- ✅ Generated prompts are relevant to title content
- ✅ Images match prompt descriptions
- ✅ Image quality is professional (HD)
- ✅ No hallucinated or incorrect information
- ✅ Consistent visual style across assets

---

## 🎯 Future Enhancements

### Phase 2 Features (Post-Launch)
1. **Video Generation** - Integrate OpenAI video API when available
2. **Batch Operations** - Generate all assets for title at once
3. **Template Library** - Pre-defined prompt templates
4. **A/B Testing** - Generate variants, compare performance
5. **Export Package** - Download all assets as ZIP
6. **Analytics Dashboard** - Track usage, costs, approval rates
7. **Scheduling** - Schedule generations for off-peak hours
8. **Collaboration** - Multiple admins can review/approve

---

## 📞 Support & Questions

### Common Questions

**Q: What if title doesn't have pitch_analysis data?**
A: Run pitch extraction first at `/admin/pitch-extraction-test`

**Q: Can I edit prompts after generation?**
A: Yes, click "Retry" and edit prompt before regenerating

**Q: How do I control costs?**
A: Preview all prompts first, only generate approved assets

**Q: What happens if generation fails?**
A: Status updates to 'failed', you can retry with same prompt

**Q: Can I generate multiple versions?**
A: Yes, use "Retry" to generate variations

**Q: How long do signed URLs last?**
A: 24 hours for preview, permanent storage URLs in database

---

**Document Version:** 1.0
**Status:** Phase 1 In Progress
**Estimated Total Time:** 25-30 hours
**Estimated Total Cost (Testing):** $20-50
