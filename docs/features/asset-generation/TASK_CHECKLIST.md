# Creative Asset Generation - Task Checklist

**Status**: Phase 1 In Progress
**Last Updated**: 2025-11-06

---

## Phase 1: Database Setup ✅ COMPLETE

- [x] Create documentation directory
- [x] Create `IMPLEMENTATION_PLAN.md`
- [x] Create `TASK_CHECKLIST.md`
- [x] Create `RISK_ASSESSMENT.md`
- [x] Create `title_marketing_assets` table migration
- [x] Set up RLS policies for admin access
- [x] Create `marketing-assets` storage bucket migration
- [x] Create test script for verification
- [x] Perform risk assessment
- [x] Revert modified existing migrations
- [x] Commit Phase 1 changes (commit: `1db41d49`)

**Completed**: 2025-11-06
**Next**: Deploy to staging (v2 branch) for verification

---

## Phase 2: Backend - Asset Analysis

- [ ] Create edge function `analyze-pitch-for-assets/index.ts`
- [ ] Design GPT-4 prompt for asset idea generation
- [ ] Implement title + pitch_analysis data fetching
- [ ] Parse AI response and validate JSON structure
- [ ] Insert asset ideas to database (status: pending)
- [ ] Add error handling (title not found, no pitch data)
- [ ] Add logging and cost tracking
- [ ] Test with 3 sample titles
- [ ] Verify 10-15 ideas generated per title

**Estimated Time**: 3-4 hours

---

## Phase 3: Backend - Asset Generation

- [ ] Create edge function `generate-asset/index.ts`
- [ ] Integrate DALL-E 3 API
- [ ] Implement image download from OpenAI URL
- [ ] Upload images to Supabase Storage (`marketing-assets/`)
- [ ] Generate signed URLs for previews (24-hour expiry)
- [ ] Update asset records with URLs and costs
- [ ] Track generation attempts (increment counter)
- [ ] Add retry logic for API failures
- [ ] Handle different image sizes (1024x1024, 1792x1024)
- [ ] Test with various asset types
- [ ] Verify cost tracking accuracy

**Estimated Time**: 4-5 hours

---

## Phase 4: Frontend - Core UI

- [ ] Create `AssetGeneration.tsx` main page
- [ ] Create `TitleSelector.tsx` component
- [ ] Fetch titles with pitch_analysis data only
- [ ] Add "Analyze & Generate Ideas" button
- [ ] Implement loading state for analysis
- [ ] Create `AssetIdeaList.tsx` component
- [ ] Group assets by category (social_media, ad_creative, pitch_material)
- [ ] Create `AssetGenerationCard.tsx` component
- [ ] Show status badges (pending/generating/completed/failed)
- [ ] Add "Generate" button per asset
- [ ] Show inline progress indicators
- [ ] Add toast notifications
- [ ] Test user flow end-to-end

**Estimated Time**: 4-5 hours

---

## Phase 5: Frontend - Preview & Actions

- [ ] Create `AssetPreviewModal.tsx` component
- [ ] Display generated images inline (thumbnails)
- [ ] Add full-screen preview on click
- [ ] Implement "Retry" button functionality
- [ ] Add prompt editing capability (textarea)
- [ ] Create approval workflow (approve/reject buttons)
- [ ] Add "Download" button for approved assets
- [ ] Update database on approval
- [ ] Handle signed URL expiry (regenerate if needed)
- [ ] Test all interactive features
- [ ] Test modal accessibility (ESC key, click outside)

**Estimated Time**: 3-4 hours

---

## Phase 6: Frontend - Stats & Tracking

- [ ] Create `GenerationStats.tsx` component
- [ ] Show total cost across all generations
- [ ] Display count by status (pending/generating/completed/failed)
- [ ] Show breakdown by category
- [ ] Add total generated count for selected title
- [ ] Add total across all titles (optional)
- [ ] Format costs with 2 decimal places
- [ ] Style as card with clear visual hierarchy
- [ ] Test with various data scenarios

**Estimated Time**: 2-3 hours

---

## Phase 7: Services & Integration

- [ ] Create `assetGenerationService.ts`
- [ ] Implement `getTitlesWithPitchAnalysis()`
- [ ] Implement `getAssetsByTitle(titleId)`
- [ ] Implement `analyzePitchForAssets(titleId)`
- [ ] Implement `generateAsset(assetId, customPrompt?)`
- [ ] Implement `approveAsset(assetId, adminId)`
- [ ] Implement `getAssetPreviewUrl(storagePath)`
- [ ] Create `useAssetGeneration.ts` hook
- [ ] Set up React Query with auto-refetch
- [ ] Add polling for status updates (every 2s during generation)
- [ ] Calculate stats (total, by status, by category)
- [ ] Add optimistic updates for better UX
- [ ] Implement error boundary
- [ ] Test service layer independently

**Estimated Time**: 2-3 hours

---

## Phase 8: Routes & Navigation

- [ ] Add route `/admin/asset-generation` in `App.tsx`
- [ ] Wrap with `AdminProtectedRoute`
- [ ] Add navigation item in `AdminLayout.tsx`
- [ ] Set icon: `ImagePlus` from lucide-react
- [ ] Set description: "Generate creative assets"
- [ ] Test navigation from admin menu
- [ ] Test access control (admin only)
- [ ] Test active route highlighting

**Estimated Time**: 1 hour

---

## Phase 9: Testing & Refinement

- [ ] Test with 5-10 diverse titles (different genres, lengths)
- [ ] Verify cost accuracy (compare with OpenAI dashboard)
- [ ] Test API failure scenarios (network errors, rate limits)
- [ ] Test edge cases (no pitch data, empty responses)
- [ ] Test multiple concurrent generations (10+ at once)
- [ ] Test on mobile devices (responsive design)
- [ ] Test in Safari, Chrome, Firefox
- [ ] Run user acceptance testing with admin
- [ ] Fix any bugs found
- [ ] Performance optimization if needed

**Estimated Time**: 3-4 hours

---

## Phase 10: Documentation

- [ ] Create `ASSET_GENERATION_GUIDE.md` (user guide)
- [ ] Create `PROMPT_ENGINEERING.md` (best practices)
- [ ] Create `API_REFERENCE.md` (technical reference)
- [ ] Document cost management strategies
- [ ] Add troubleshooting section
- [ ] Add screenshots of UI
- [ ] Update `CLAUDE.md` with new feature
- [ ] Update admin documentation
- [ ] Create video demo (optional)

**Estimated Time**: 2-3 hours

---

## Summary

**Total Tasks**: 97
**Completed**: 11 (Phase 1)
**In Progress**: 0
**Remaining**: 86

**Total Estimated Time**: 25-30 hours
**Time Spent (Phase 1)**: ~2 hours
**Current Phase**: Phase 1 Complete - Ready for Staging Deployment
**Next Phase**: Phase 2 - Backend Asset Analysis

---

## Progress Tracking

Update this file after completing each task. Mark with:
- `[x]` for completed tasks
- `[ ]` for pending tasks

**Phase Completion**:
- Phase 1: ✅ 100% (11/11 tasks) - **COMPLETE**
- Phase 2: ⏸️ Not started
- Phase 3: ⏸️ Not started
- Phase 4: ⏸️ Not started
- Phase 5: ⏸️ Not started
- Phase 6: ⏸️ Not started
- Phase 7: ⏸️ Not started
- Phase 8: ⏸️ Not started
- Phase 9: ⏸️ Not started
- Phase 10: ⏸️ Not started

---

**Last Completed**: Phase 1 - Database setup, risk assessment, migrations committed (2025-11-06)
**Commit**: `1db41d49`
**Next Up**: Deploy to staging (v2 branch) and verify migrations
