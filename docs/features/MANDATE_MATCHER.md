# Mandate Matcher - Feature Documentation

**Status**: ✅ LIVE (Deployed 2025-11-22)
**Route**: `/buyers/mandates`
**Access**: Buyer accounts only

---

## Overview

The Mandate Matcher is an AI-powered title recommendation system that helps producers find relevant content by describing their production mandates in natural language. Using semantic vector search with OpenAI embeddings, the system matches mandate descriptions to titles in the KStoryBridge library and returns ranked results with similarity scores.

## Key Features

### 1. Natural Language Input
- **Full-sentence descriptions**: Up to 1000 characters
- **Flexible format**: No rigid structure required
- **Example mandates**:
  - "Looking for action-thriller with strong female lead, Korean setting, suitable for streaming platform, budget under $5M"
  - "Need romantic comedy set in modern Seoul, light tone, suitable for theatrical release, targets 20-30 age group"
  - "Seeking sci-fi drama with ensemble cast, philosophical themes, premium production value for limited series format"

### 2. Smart Search Technology
- **AI Embeddings**: Uses OpenAI's `text-embedding-ada-002` model
- **Semantic Understanding**: Captures meaning, not just keywords
- **Vector Similarity**: Compares mandate embedding against 245 title embeddings
- **Relevance Threshold**: 30% minimum similarity (configurable)
- **Result Limit**: Top 15 most relevant matches

### 3. Visual Results Display
**Card Grid Layout**:
- 2-column responsive design
- Hover effects with elevation
- Image zoom on hover

**Match Score Badges**:
- 🟢 **Emerald (85%+)**: Excellent matches - highly relevant
- 🔵 **Blue (70-84%)**: Good matches - very relevant
- 🟣 **Purple (<70%)**: Fair matches - moderately relevant

**Title Information**:
- Cover image (with fallback)
- English and Korean titles
- Genre tags (up to 3)
- Tone indicator
- Content format
- Synopsis (3-line preview)
- Story and art creators

### 4. Search History Management
**Persistent Storage**:
- All searches saved to database
- Results cached for instant reload
- User-scoped access (RLS protected)

**Sidebar Interface**:
- Chronological list (newest first)
- Click any mandate to reload results
- Delete unwanted searches (hover action)
- Shows: mandate text (truncated), date, result count, avg match score
- Limit: 20 most recent searches displayed

### 5. User Experience
**Input Features**:
- Large textarea with placeholder examples
- Character counter (1000 max)
- Visual feedback (yellow at <100, red when over limit)
- Keyboard shortcut: ⌘+Enter (or Ctrl+Enter) to submit
- Clear button to reset

**Loading States**:
- Spinner animation during search
- Progress message: "Finding titles that match your mandate..."
- Processing time displayed in toast notification

**Empty States**:
- Helpful guidance before first search
- No results message with suggestions

---

## Technical Architecture

### Database Schema

**Table**: `mandate_searches`

```sql
CREATE TABLE mandate_searches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_email TEXT NOT NULL,
    mandate_text TEXT NOT NULL CHECK (char_length(mandate_text) <= 1000),
    search_results JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    result_count INTEGER DEFAULT 0,
    avg_match_score NUMERIC(5,2)
);

-- Indexes for performance
CREATE INDEX idx_mandate_searches_user_email ON mandate_searches(user_email);
CREATE INDEX idx_mandate_searches_created_at ON mandate_searches(created_at DESC);

-- RLS Policies
- Users can view their own mandates only
- Users can insert their own mandates
- Users can delete their own mandates
```

**Migration**: `20251121000000_add_mandate_searches_table.sql`

### Edge Function

**Location**: `supabase/functions/mandate-matcher/index.ts`

**Processing Flow**:
1. Validate input (mandate text, user email, length check)
2. Generate embedding using OpenAI API
   - Model: `text-embedding-ada-002`
   - Dimensions: 1536
   - Cost: ~$0.0001 per 1K tokens
3. Call database RPC function for vector search
   - Function: `match_titles_by_embedding_optimized`
   - Threshold: 0.3 (30% similarity minimum)
   - Limit: 15 results
4. Format results with match scores
5. Save search to database with cached results
6. Return response with processing time and cost

**Response Format**:
```typescript
interface MandateMatchResponse {
  results: TitleMatch[];      // Array of matching titles
  search_id: string;          // UUID of saved search
  processing_time_ms: number; // Total time taken
  cost_estimate: number;      // OpenAI API cost
}
```

### Vector Search RPC

**Function**: `match_titles_by_embedding_optimized`
- **Location**: `supabase/migrations/20251121175718_optimize_comp_navigator_vector_search.sql`
- **Purpose**: Shared vector search function used by both comps-navigator and mandate-matcher
- **Query Field**: `combined_embedding` (NOT `title_embedding`)
- **Algorithm**: Cosine distance (`<=>` operator)
- **Returns**: title_id, title_name_en, title_name_kr, synopsis, genre, tone, content_format, title_image, similarity

**Critical**: Both mandate and title embeddings must use the same model (`text-embedding-ada-002`) for accurate similarity matching.

### Service Layer

**File**: `src/services/mandateService.ts`

**Methods**:
```typescript
// Submit new mandate and get matches
searchMandates(mandateText: string, userEmail: string, limit?: number): Promise<MandateMatchResponse>

// Get user's recent searches
getRecentMandates(userEmail: string, limit?: number): Promise<MandateSearch[]>

// Get specific search by ID
getMandateById(mandateId: string): Promise<MandateSearch | null>

// Delete a search
deleteMandate(mandateId: string): Promise<void>

// Get count of user's searches
getMandateCount(userEmail: string): Promise<number>
```

### Frontend Components

**Page**: `src/pages/buyers/Mandates.tsx`
- Main orchestration component
- State management (loading, results, history)
- Toast notifications
- Scroll management

**Components**:

1. **MandateInput** (`src/components/mandates/MandateInput.tsx`)
   - Textarea with validation
   - Character counter
   - Submit and clear buttons
   - Keyboard shortcuts

2. **MandateHistorySidebar** (`src/components/mandates/MandateHistorySidebar.tsx`)
   - List of recent searches
   - Click to reload
   - Delete action
   - Empty state

3. **MandateResultsGrid** (`src/components/mandates/MandateResultsGrid.tsx`)
   - Loading state
   - Empty state
   - Grid layout
   - Result summary

4. **MandateTitleCard** (`src/components/mandates/MandateTitleCard.tsx`)
   - Title display
   - Match score badge
   - Genre/tone tags
   - Synopsis preview
   - Click to view details

---

## Performance & Cost

### Performance Metrics
- **Search Time**: 2-3 seconds average
  - Embedding generation: ~500ms
  - Vector search: ~1000ms
  - Database save: ~500ms
- **Cached Reload**: Instant (<100ms)
- **Result Rendering**: <500ms

### Cost Analysis

**Per Search**:
- OpenAI embedding: ~$0.0015
  - Average mandate: 15 tokens
  - Model: text-embedding-ada-002 ($0.0001 per 1K tokens)
- Database operations: Negligible (included in Supabase plan)
- **Total**: ~$0.0015 per search

**Monthly Estimates**:
| Usage Level | Searches/Month | Cost/Month |
|-------------|----------------|------------|
| Light       | 100            | $0.15      |
| Medium      | 500            | $0.75      |
| Heavy       | 1,000          | $1.50      |
| Very Heavy  | 5,000          | $7.50      |

**Comparison to Comps Navigator**:
- Comps: ~$0.014 per search (embedding + GPT-4 re-ranking)
- Mandates: ~$0.0015 per search (embedding only)
- **93% cheaper** than comps-navigator

---

## Common Issues & Troubleshooting

### Issue: 0 Results Returned

**Symptoms**:
- Search completes successfully
- Toast shows "Found 0 matching titles"
- Edge function logs show "✅ Found 0 matching titles"

**Possible Causes**:

1. **Wrong Embedding Model**
   - Mandate uses: `text-embedding-3-small`
   - Titles use: `text-embedding-ada-002`
   - **Solution**: Update edge function to use `text-embedding-ada-002`

2. **Threshold Too High**
   - Current: 0.5 (50% similarity)
   - Too strict for most queries
   - **Solution**: Lower to 0.3 (30% similarity)

3. **No Title Embeddings**
   - Database check: `SELECT COUNT(combined_embedding) FROM titles;`
   - If 0, titles haven't been embedded
   - **Solution**: Run embedding generation scripts

**Diagnostic Steps**:
```sql
-- Check if titles have embeddings
SELECT COUNT(*) as total_titles,
       COUNT(combined_embedding) as titles_with_embeddings
FROM titles;

-- Check RPC function exists
\df match_titles_by_embedding_optimized

-- Test RPC directly (using sample embedding)
SELECT * FROM match_titles_by_embedding_optimized(
  '[0.1, 0.2, ...]'::vector(1536),  -- Sample embedding
  0.3,  -- Threshold
  5     -- Limit
);
```

### Issue: CORS Error

**Symptoms**:
- "Access blocked by CORS policy" in browser console
- Edge function not responding

**Solution**:
1. Verify edge function is deployed: `npx supabase functions list`
2. Check CORS headers in edge function (should allow all origins)
3. Redeploy: `npx supabase functions deploy mandate-matcher`

### Issue: Table Not Found (404)

**Symptoms**:
- Database query returns 404
- "relation 'mandate_searches' does not exist"

**Solution**:
1. Check migration applied: `npx supabase migration list`
2. Apply migration: `npx supabase db push --include-all`
3. Verify table: `SELECT * FROM mandate_searches LIMIT 1;`

---

## Usage Examples

### Example 1: Action-Thriller
**Input**:
> "Looking for high-octane action-thriller with strong female protagonist, Korean setting, suitable for streaming platform, mid-range budget under $10M"

**Expected Results**:
- Korean action series with female leads
- Thriller/crime dramas
- Streaming-suitable formats (8-16 episodes)
- Match scores: 75-90%

### Example 2: Romantic Comedy
**Input**:
> "Need light-hearted romantic comedy set in modern Seoul, suitable for theatrical release, targets younger demographic (20-35), feel-good vibe"

**Expected Results**:
- Rom-com webtoons/novels
- Modern urban settings
- Light, humorous tone
- Match scores: 70-85%

### Example 3: Family Drama
**Input**:
> "Seeking heartfelt family drama with multi-generational storyline, explores Korean cultural values, premium production value for limited series"

**Expected Results**:
- Family-centric narratives
- Cultural/traditional themes
- Drama genre
- Match scores: 65-80%

---

## Future Enhancements

### Planned Features

1. **Bookmark System**
   - Save favorite mandates
   - Name/label important searches
   - Quick access to frequently used mandates

2. **Mandate Templates**
   - Pre-built templates for common scenarios
   - Genre-specific templates (action, romance, thriller, etc.)
   - Budget-based templates (low, mid, high budget)
   - Format-based templates (series, film, limited series)

3. **Collaboration Features**
   - Share mandate results with team members
   - Export as PDF/Excel for presentations
   - Collaborative mandate refinement

4. **Advanced Filters**
   - Filter results by genre, format, tone
   - Budget range filters
   - Rights availability filters
   - Platform suitability filters

5. **AI Assistance**
   - AI-suggested mandate improvements
   - Automatic mandate refinement based on results
   - Similar mandate suggestions
   - Trending mandate patterns

6. **Analytics**
   - Mandate usage statistics
   - Popular search patterns
   - Match quality metrics
   - Cost tracking per user

---

## Developer Notes

### Adding New Features

**To modify search algorithm**:
1. Update `supabase/functions/mandate-matcher/index.ts`
2. Test locally with sample mandates
3. Deploy: `npx supabase functions deploy mandate-matcher`
4. Monitor logs for 24 hours

**To change UI/UX**:
1. Components are in `src/components/mandates/`
2. Follow existing design patterns (card grid, badges)
3. Test responsive design (mobile, tablet, desktop)
4. Update this documentation

**To adjust similarity threshold**:
1. Edit edge function line 104: `match_threshold: 0.3`
2. Test with various mandates
3. Monitor result quality
4. Document changes

### Testing Checklist

- [ ] Database migration applied successfully
- [ ] Edge function deployed and responding
- [ ] UI loads without errors
- [ ] Search returns results
- [ ] Results display correctly
- [ ] History saves and loads
- [ ] Delete function works
- [ ] Toast notifications appear
- [ ] Loading states show
- [ ] Empty states display
- [ ] Responsive design works
- [ ] Navigation link appears
- [ ] Keyboard shortcuts function

---

## Version History

**v1.0 (2025-11-22)**
- Initial release
- Basic mandate matching with vector search
- Search history with persistence
- Beautiful card-based results display
- Navigation integration

**Planned v1.1**
- Bookmark system
- Mandate templates
- Export functionality

**Planned v2.0**
- Advanced filters
- Collaboration features
- Analytics dashboard

---

## Support & Contact

For issues or questions:
- Check logs: Supabase Dashboard → Functions → mandate-matcher → Logs
- Review this documentation
- Contact: Development team via internal channels

## Related Documentation

- [AI Chatbot Documentation](../chatbot/OVERVIEW.md)
- [Comps Navigator](../../apps/dashboard/CLAUDE.md#comps-navigator)
- [Vector Search Optimization](../../supabase/migrations/20251121175718_optimize_comp_navigator_vector_search.sql)
- [Dashboard CLAUDE.md](../../apps/dashboard/CLAUDE.md)
