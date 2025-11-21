# Comps Navigator - Implementation Plan

**Status**: Ready for Implementation
**Created**: 2025-11-20
**Target Completion**: 5 days
**Feature Owner**: Product Team

---

## Executive Summary

The **Comps Navigator** is a new tool that allows producers (buyers) to find Korean titles similar to combinations of Hollywood/global comparable titles ("comps"). Users can select 1-3 comp titles, add optional text refinement, and receive AI-powered recommendations with match explanations.

**Key Features**:
- Select up to 3 comp titles for combination matching
- Add text refinement ("more comedic", "female lead", etc.)
- AI-powered hybrid search (vector embeddings + GPT-4 re-ranking)
- Match explanations showing WHY titles match the comp combo
- Save/bookmark searches for future reference

**Target Users**: All buyers (basic tier and above)

**Performance Goals**:
- Response time: 5-6 seconds
- Match accuracy: 85-90%
- Cost per search: <$0.02

---

## User Flow

### 1. Access Comps Navigator
- Navigate to `/buyers/comps-navigator`
- See clean interface with comp selection fields

### 2. Select Comps
- Enter 1-3 comp titles via text input
- Examples shown: "Try: Squid Game + Parasite + Stranger Things"
- Comps displayed as removable chips

### 3. Add Refinement (Optional)
- Text area for additional context
- Examples: "more comedic tone", "female lead", "lower production budget"
- Character limit: 500

### 4. Search
- Click "Find Matches" button
- Loading state shows:
  - Phase 1: "Finding semantic matches..." (2-3 sec)
  - Phase 2: "Re-ranking with AI..." (2-3 sec)

### 5. View Results
- Grid of 10-15 title cards
- Each card shows:
  - Match score badge (0-100%)
  - Title poster image
  - Match explanation preview
  - "View Details" button

### 6. Explore Details
- Click title → Detail modal
- Full comp alignment breakdown:
  - Comp 1 alignment: "Class themes (85%), survival elements (78%)"
  - Comp 2 alignment: "Tech dystopia (82%), episodic structure (76%)"
  - Comp 3 alignment: "Dark comedy (88%), ensemble cast (80%)"
- Link to full title detail page

### 7. Save Search
- "Save This Search" button
- Name the search: "Squid Game + Parasite combo"
- Access later from "Saved Searches" sidebar

---

## Technical Architecture

### Database Schema

#### New Table: `comp_searches`
```sql
CREATE TABLE comp_searches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_email text NOT NULL,
  comp_titles text[] NOT NULL CHECK (array_length(comp_titles, 1) BETWEEN 1 AND 3),
  refinement_text text,
  search_name text, -- For bookmarked searches
  search_results jsonb, -- Cached results
  created_at timestamptz DEFAULT now(),
  is_bookmarked boolean DEFAULT false,
  result_count int,
  avg_match_score float
);

CREATE INDEX idx_comp_searches_user ON comp_searches(user_email);
CREATE INDEX idx_comp_searches_bookmarked ON comp_searches(user_email, is_bookmarked);
```

#### New Table: `comp_title_cache`
```sql
CREATE TABLE comp_title_cache (
  comp_title text PRIMARY KEY,
  embedding vector(1536) NOT NULL,
  source text DEFAULT 'user_input', -- 'user_input' | 'database' | 'external_api'
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX idx_comp_cache_updated ON comp_title_cache(updated_at);
```

### Edge Function: `comp-navigator`

**Location**: `supabase/functions/comp-navigator/index.ts`

**Input**:
```typescript
interface CompNavigatorRequest {
  comp_titles: string[]; // 1-3 comp titles
  refinement_text?: string; // Optional text refinement
  user_email: string;
  save_search?: boolean; // Whether to save to history
  search_name?: string; // For bookmarking
}
```

**Output**:
```typescript
interface CompNavigatorResponse {
  results: Array<{
    title_id: string;
    title_name_en: string;
    title_name_kr: string;
    match_score: number; // 0-100
    explanation: string; // Why this matches
    comp_alignments: Array<{
      comp_title: string;
      alignment_score: number;
      reasons: string[];
    }>;
    title_image?: string;
    synopsis: string;
    genre: string[];
    tone: string;
  }>;
  search_id?: string; // If saved
  processing_time_ms: number;
  cost_estimate: number;
}
```

**Processing Pipeline**:

1. **Input Validation**:
   - Check 1-3 comp titles provided
   - Validate refinement text length (<500 chars)
   - Verify user authentication

2. **Phase 1: Semantic Retrieval (2-3 seconds)**:
   ```typescript
   // Generate or retrieve cached embeddings
   const compEmbeddings = await Promise.all(
     req.comp_titles.map(title => getOrGenerateEmbedding(title))
   );

   // Average embeddings
   const avgEmbedding = averageEmbeddings(compEmbeddings);

   // Blend with refinement if provided
   if (req.refinement_text) {
     const refinementEmbed = await generateEmbedding(req.refinement_text);
     finalEmbedding = combineEmbeddings(avgEmbedding, refinementEmbed, 0.7, 0.3);
   }

   // Vector search
   const { data: candidates } = await supabase.rpc('match_titles_by_embedding', {
     query_embedding: finalEmbedding,
     match_threshold: 0.6,
     match_count: 30
   });
   ```

3. **Phase 2: LLM Re-Ranking (2-3 seconds)**:
   ```typescript
   const topCandidates = candidates.slice(0, 20);

   const prompt = `
   You are an expert at matching Korean content to Hollywood/global comps.

   COMP COMBINATION:
   ${req.comp_titles.map((t, i) => `${i+1}. ${t}`).join('\n')}

   USER REFINEMENT: ${req.refinement_text || 'None'}

   CANDIDATE KOREAN TITLES:
   ${topCandidates.map(formatCandidate).join('\n\n')}

   TASK:
   1. Rank candidates 1-20 by relevance to the comp combination
   2. Assign match score 0-100 for each
   3. Explain WHY each matches (character types, themes, tone, story structure)
   4. For each candidate, show alignment with EACH individual comp

   Return JSON array:
   [{
     rank: number,
     title_id: string,
     match_score: number,
     explanation: string,
     comp_alignments: [{
       comp_title: string,
       alignment_score: number,
       reasons: string[]
     }]
   }]
   `;

   const response = await openai.chat.completions.create({
     model: 'gpt-4-turbo',
     messages: [{ role: 'user', content: prompt }],
     temperature: 0.3,
     response_format: { type: 'json_object' }
   });
   ```

4. **Save Search (if requested)**:
   ```typescript
   if (req.save_search) {
     await supabase.from('comp_searches').insert({
       user_email: req.user_email,
       comp_titles: req.comp_titles,
       refinement_text: req.refinement_text,
       search_name: req.search_name,
       search_results: results,
       is_bookmarked: !!req.search_name,
       result_count: results.length,
       avg_match_score: calculateAvgScore(results)
     });
   }
   ```

**Helper Functions**:

```typescript
async function getOrGenerateEmbedding(compTitle: string): Promise<number[]> {
  // Check cache first
  const cached = await supabase
    .from('comp_title_cache')
    .select('embedding')
    .eq('comp_title', compTitle.toLowerCase())
    .single();

  if (cached.data) {
    return cached.data.embedding;
  }

  // Generate new embedding
  const response = await openai.embeddings.create({
    model: 'text-embedding-ada-002',
    input: compTitle
  });

  const embedding = response.data[0].embedding;

  // Cache for future use
  await supabase.from('comp_title_cache').insert({
    comp_title: compTitle.toLowerCase(),
    embedding,
    source: 'user_input'
  });

  return embedding;
}

function averageEmbeddings(embeddings: number[][]): number[] {
  const dim = embeddings[0].length;
  const avg = new Array(dim).fill(0);

  for (const embedding of embeddings) {
    for (let i = 0; i < dim; i++) {
      avg[i] += embedding[i];
    }
  }

  for (let i = 0; i < dim; i++) {
    avg[i] /= embeddings.length;
  }

  return avg;
}

function combineEmbeddings(
  embed1: number[],
  embed2: number[],
  weight1: number,
  weight2: number
): number[] {
  return embed1.map((val, i) => val * weight1 + embed2[i] * weight2);
}
```

### Frontend Implementation

#### New Page: `/buyers/comps-navigator`

**Component Structure**:
```
CompsNavigator/
├─ CompSelector.tsx (comp input fields)
├─ RefinementInput.tsx (text refinement)
├─ SearchButton.tsx (trigger search)
├─ ResultsGrid.tsx (results display)
├─ TitleMatchCard.tsx (individual result card)
├─ MatchDetailModal.tsx (detail view)
├─ SavedSearchesSidebar.tsx (search history)
└─ index.tsx (main page)
```

**Main Page Component**:
```typescript
// src/pages/buyers/CompsNavigator.tsx

import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import CompSelector from '@/components/comps-navigator/CompSelector';
import RefinementInput from '@/components/comps-navigator/RefinementInput';
import ResultsGrid from '@/components/comps-navigator/ResultsGrid';
import SavedSearchesSidebar from '@/components/comps-navigator/SavedSearchesSidebar';

export default function CompsNavigator() {
  const { user } = useAuth();
  const { toast } = useToast();

  const [compTitles, setCompTitles] = useState<string[]>([]);
  const [refinementText, setRefinementText] = useState('');
  const [results, setResults] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingPhase, setLoadingPhase] = useState<'semantic' | 'reranking' | null>(null);

  const handleSearch = async () => {
    if (compTitles.length === 0) {
      toast({
        title: "No Comps Selected",
        description: "Please add at least one comparable title to search",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    setLoadingPhase('semantic');

    try {
      const { data, error } = await supabase.functions.invoke('comp-navigator', {
        body: {
          comp_titles: compTitles,
          refinement_text: refinementText || null,
          user_email: user?.email,
          save_search: true
        }
      });

      if (error) throw error;

      setResults(data.results);

      toast({
        title: "Matches Found",
        description: `Found ${data.results.length} titles matching your comp combination`
      });
    } catch (error) {
      console.error('Search error:', error);
      toast({
        title: "Search Failed",
        description: error.message || "Failed to find matches. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
      setLoadingPhase(null);
    }
  };

  return (
    <div className="flex">
      {/* Main Content */}
      <div className="flex-1 p-6">
        <h1 className="text-3xl font-bold mb-2">Comps Navigator</h1>
        <p className="text-gray-600 mb-8">
          Find Korean titles similar to your favorite shows and films
        </p>

        <CompSelector
          compTitles={compTitles}
          onChange={setCompTitles}
          maxComps={3}
        />

        <RefinementInput
          value={refinementText}
          onChange={setRefinementText}
          maxLength={500}
        />

        <button
          onClick={handleSearch}
          disabled={isLoading || compTitles.length === 0}
          className="btn btn-primary"
        >
          {isLoading ? 'Searching...' : 'Find Matches'}
        </button>

        {loadingPhase && (
          <div className="loading-indicator mt-4">
            {loadingPhase === 'semantic' && "Finding semantic matches..."}
            {loadingPhase === 'reranking' && "Re-ranking with AI..."}
          </div>
        )}

        {results && (
          <ResultsGrid results={results} />
        )}
      </div>

      {/* Saved Searches Sidebar */}
      <SavedSearchesSidebar
        userEmail={user?.email}
        onLoadSearch={(search) => {
          setCompTitles(search.comp_titles);
          setRefinementText(search.refinement_text || '');
        }}
      />
    </div>
  );
}
```

**Component Details**:

1. **CompSelector**:
   - 3 text input fields
   - Add/remove comp chips
   - Validation (max 3 comps)

2. **RefinementInput**:
   - Textarea with character counter
   - Examples shown as placeholder
   - Optional field

3. **ResultsGrid**:
   - Responsive grid (2-3-4 columns)
   - TitleMatchCard components
   - Sort by match score (default)

4. **TitleMatchCard**:
   - Match score badge (color-coded)
   - Title poster image
   - Match explanation preview (first 100 chars)
   - "View Details" button → MatchDetailModal

5. **MatchDetailModal**:
   - Full match explanation
   - Individual comp alignments with scores
   - Link to full title detail page
   - Save title button

6. **SavedSearchesSidebar**:
   - Recent searches (last 10)
   - Bookmarked searches
   - Load/delete actions

---

## Service Layer

**Location**: `src/services/compsNavigatorService.ts`

```typescript
export interface CompSearch {
  id: string;
  comp_titles: string[];
  refinement_text?: string;
  search_name?: string;
  created_at: string;
  is_bookmarked: boolean;
  result_count: number;
  avg_match_score: number;
}

export const compsNavigatorService = {
  // Get recent searches
  async getRecentSearches(userEmail: string, limit = 10): Promise<CompSearch[]> {
    const { data, error } = await supabase
      .from('comp_searches')
      .select('*')
      .eq('user_email', userEmail)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data;
  },

  // Get bookmarked searches
  async getBookmarkedSearches(userEmail: string): Promise<CompSearch[]> {
    const { data, error } = await supabase
      .from('comp_searches')
      .select('*')
      .eq('user_email', userEmail)
      .eq('is_bookmarked', true)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  },

  // Bookmark a search
  async bookmarkSearch(searchId: string, searchName: string): Promise<void> {
    const { error } = await supabase
      .from('comp_searches')
      .update({
        is_bookmarked: true,
        search_name: searchName
      })
      .eq('id', searchId);

    if (error) throw error;
  },

  // Delete a search
  async deleteSearch(searchId: string): Promise<void> {
    const { error } = await supabase
      .from('comp_searches')
      .delete()
      .eq('id', searchId);

    if (error) throw error;
  }
};
```

---

## Navigation Integration

Add to main navigation in `/buyers/home`:

```typescript
const navigationItems = [
  { label: 'Chat', path: '/buyers/chat', icon: MessageSquare },
  { label: 'Titles', path: '/buyers/titles', icon: Library },
  { label: 'Comps Navigator', path: '/buyers/comps-navigator', icon: Compass }, // NEW
  { label: 'Saved', path: '/buyers/saved', icon: Heart },
  { label: 'News', path: '/buyers/news', icon: Newspaper },
  { label: 'Profile', path: '/buyers/profile', icon: User }
];
```

---

## Cost Analysis

### Per Search Costs

**Embedding Generation**:
- 3 comps × $0.0001 per embedding = $0.0003
- 1 refinement text × $0.0001 = $0.0001
- **Subtotal**: $0.0004 (cached after first use)

**Vector Search**:
- Free (PostgreSQL + pgvector)

**LLM Re-Ranking**:
- GPT-4 Turbo input: ~8,000 tokens × $0.01/1K = $0.08
- GPT-4 Turbo output: ~2,000 tokens × $0.03/1K = $0.06
- **Subtotal**: $0.014

**Total per search**: ~$0.015 (first time), ~$0.014 (cached comps)

### Monthly Projections

**1,000 searches/month**:
- 500 unique comp combos (caching helps)
- Embedding costs: $0.20
- LLM costs: $14.00
- Database/storage: $5.00
- **Total**: ~$19.20/month

**10,000 searches/month**:
- 2,000 unique comp combos
- Embedding costs: $0.80
- LLM costs: $140.00
- Database/storage: $15.00
- **Total**: ~$155.80/month

---

## Performance Targets

### Response Time Breakdown

**Target: 5-6 seconds total**

1. Embedding generation/retrieval: 0.5-1.0 sec
2. Vector search: 0.5-1.0 sec
3. LLM re-ranking: 3.0-4.0 sec
4. Result formatting: 0.2-0.5 sec

**Optimization Strategies**:
- Cache comp embeddings aggressively
- Stream vector results to UI immediately (progressive enhancement)
- Show "Finding matches..." then "Re-ranking..." loading states
- Consider making LLM re-ranking optional (toggle for power users)

### Match Quality Targets

**Minimum Acceptable**: 80% accuracy on manual evaluation

**Target**: 85-90% accuracy

**Evaluation Method**:
- 20 test comp combinations
- 5 expert reviewers rate top 5 results per combo
- Score: % of results rated "Good Match" or "Excellent Match"

**Sample Test Cases**:
1. Squid Game + Parasite + Black Mirror
2. Stranger Things + Dark + The OA
3. Money Heist + Breaking Bad + Narcos
4. The Handmaid's Tale + Black Mirror + Westworld
5. Game of Thrones + Vikings + The Last Kingdom

---

## Implementation Timeline

### Day 1: Database & Edge Function Scaffolding
- [ ] Create `comp_searches` table with RLS policies
- [ ] Create `comp_title_cache` table
- [ ] Set up edge function `comp-navigator` with basic structure
- [ ] Test database connectivity and RLS
- [ ] **Deliverable**: Working database schema, edge function boilerplate

### Day 2: Core Search Logic
- [ ] Implement embedding generation/caching logic
- [ ] Add vector averaging and blending
- [ ] Integrate `match_titles_by_embedding` RPC call
- [ ] Test Phase 1 (semantic retrieval) end-to-end
- [ ] **Deliverable**: Vector search working with test comps

### Day 3: LLM Re-Ranking
- [ ] Design GPT-4 prompt for re-ranking
- [ ] Implement LLM re-ranking logic
- [ ] Add match explanation generation
- [ ] Add comp alignment breakdown
- [ ] Test full pipeline (Phase 1 + Phase 2)
- [ ] **Deliverable**: Complete backend working, tested with sample data

### Day 4: Frontend Implementation
- [ ] Create main page `/buyers/comps-navigator`
- [ ] Build CompSelector component
- [ ] Build RefinementInput component
- [ ] Build ResultsGrid and TitleMatchCard components
- [ ] Build MatchDetailModal
- [ ] Add navigation integration
- [ ] **Deliverable**: Working UI connected to backend

### Day 5: Save/Bookmark & Polish
- [ ] Build SavedSearchesSidebar component
- [ ] Implement save/bookmark functionality
- [ ] Add loading states and error handling
- [ ] Write user documentation
- [ ] Comprehensive testing (20 test combos)
- [ ] Performance optimization (caching, query tuning)
- [ ] **Deliverable**: Production-ready feature with documentation

---

## Testing Plan

### Unit Tests

**Edge Function**:
- [ ] Test embedding generation/caching
- [ ] Test vector averaging logic
- [ ] Test embedding blending with refinement
- [ ] Test LLM prompt formatting
- [ ] Test error handling (invalid input, API failures)

**Frontend Components**:
- [ ] Test CompSelector (add/remove comps, validation)
- [ ] Test RefinementInput (character limit, validation)
- [ ] Test ResultsGrid (sorting, filtering)
- [ ] Test SavedSearchesSidebar (load/delete)

### Integration Tests

- [ ] End-to-end search flow (select comps → results)
- [ ] Save/bookmark functionality
- [ ] Load saved search
- [ ] Error scenarios (network failures, API errors)

### Manual Testing

**20 Test Comp Combinations** (representative sample):

1. **Thriller + Drama**:
   - Squid Game + Parasite + Mindhunter
   - Expected: Dark psychological thrillers with social commentary

2. **Sci-Fi + Mystery**:
   - Black Mirror + Dark + Stranger Things
   - Expected: Sci-fi with mystery/suspense, technology themes

3. **Crime + Action**:
   - Money Heist + Breaking Bad + Ozark
   - Expected: Crime dramas with complex characters

4. **Fantasy + Adventure**:
   - Game of Thrones + The Witcher + Vikings
   - Expected: Epic fantasy/historical with action

5. **Horror + Thriller**:
   - The Haunting of Hill House + Stranger Things + Dark
   - Expected: Horror with supernatural elements

(Continue with 15 more test cases covering diverse genres and combinations)

**Evaluation Criteria**:
- **Relevance**: Do results match comp themes?
- **Diversity**: Are results varied or repetitive?
- **Explanation Quality**: Are match reasons clear and accurate?
- **Comp Alignment**: Do individual comp scores make sense?

**Success Threshold**: 80%+ of test cases have >3 "good matches" in top 5 results

---

## Monitoring & Analytics

### Metrics to Track

**Usage Metrics**:
- Total searches per day/week/month
- Unique users searching
- Average comps per search (1, 2, or 3)
- % searches with refinement text
- Saved/bookmarked searches count

**Performance Metrics**:
- Average response time (target: 5-6 sec)
- P95 response time (target: <8 sec)
- Cache hit rate for comp embeddings (target: >60%)
- LLM re-ranking success rate (target: >95%)

**Quality Metrics**:
- Average match score (target: 70-80%)
- User engagement: Click-through rate on results
- Save rate: % of searches saved/bookmarked
- Repeat usage: % users with >3 searches

**Cost Metrics**:
- Daily/monthly API costs (OpenAI)
- Cost per search (target: <$0.02)
- Cost per active user

### Admin Dashboard

Create `/admin/comps-analytics` page with:
- Search volume chart (daily/weekly)
- Top comp combinations (most searched)
- Average match scores over time
- Cost tracking and projections
- Popular refinement keywords

### Logging

**Edge Function Logs**:
```typescript
console.log('[COMPS] Search started', {
  comp_titles: req.comp_titles,
  has_refinement: !!req.refinement_text,
  user_email: req.user_email
});

console.log('[COMPS] Phase 1 complete', {
  candidates_found: candidates.length,
  avg_similarity: avgSimilarity,
  cache_hits: cacheHits,
  duration_ms: phase1Duration
});

console.log('[COMPS] Phase 2 complete', {
  results_count: results.length,
  avg_match_score: avgScore,
  duration_ms: phase2Duration
});

console.log('[COMPS] Search complete', {
  total_duration_ms: totalDuration,
  cost_estimate: costEstimate,
  results_count: results.length
});
```

---

## Risk Mitigation

### Risk 1: Poor Match Quality
**Probability**: Medium | **Impact**: High

**Mitigation**:
- Comprehensive testing with 20+ test combos before launch
- Collect user feedback early (beta testers)
- A/B test different prompt strategies
- Allow users to report poor matches

**Fallback**:
- Show "Not finding what you need?" feedback form
- Offer manual refinement suggestions
- Fall back to keyword search if vector results poor

### Risk 2: Slow Response Times
**Probability**: Low | **Impact**: Medium

**Mitigation**:
- Aggressive caching of comp embeddings
- Stream vector results first (progressive UX)
- Monitor P95 latency, optimize if needed
- Consider making LLM re-ranking optional

**Fallback**:
- Disable LLM re-ranking temporarily
- Show vector-only results (faster but less accurate)
- Add "Quick Search" mode (vector only)

### Risk 3: Cost Overruns
**Probability**: Low | **Impact**: Medium

**Mitigation**:
- Set hard cost limits in edge function ($0.05/search max)
- Cache aggressively (60%+ cache hit rate target)
- Monitor daily costs, set up alerts at $50/day
- Rate limit: 10 searches/hour per user

**Fallback**:
- Disable feature temporarily if costs spike
- Move to pro/suite tier only
- Reduce LLM re-ranking to top 10 candidates (vs 20)

### Risk 4: Low Adoption
**Probability**: Medium | **Impact**: Medium

**Mitigation**:
- Prominent navigation placement
- Onboarding tooltip on first visit
- Example searches to inspire usage
- Email announcement to all buyers

**Fallback**:
- Gather user feedback: why not using?
- Simplify UI if too complex
- Add preset comp combinations for one-click search

---

## Success Criteria

### Launch Criteria (Day 5)
- [ ] All 20 test comp combinations pass (80%+ accuracy)
- [ ] Response time <8 seconds (P95)
- [ ] Cost per search <$0.02
- [ ] No critical bugs in testing
- [ ] User documentation complete
- [ ] Admin monitoring dashboard live

### Week 1 Success (After Launch)
- [ ] 50+ searches from 20+ unique users
- [ ] Average match score >70%
- [ ] <5% error rate
- [ ] Positive user feedback (survey)
- [ ] Daily costs <$10

### Month 1 Success
- [ ] 500+ searches from 100+ users
- [ ] 20%+ save/bookmark rate
- [ ] 30%+ repeat usage (users with >3 searches)
- [ ] Match quality maintained (>80% accuracy)
- [ ] Feature mentioned in user testimonials

---

## Future Enhancements (Post-MVP)

### Phase 2 Features (Weeks 2-4)

1. **TMDB API Integration**:
   - Rich autocomplete with posters
   - Pre-populated comp metadata
   - Better comp normalization

2. **Advanced Filters**:
   - Genre checkboxes
   - Tone selector
   - Production complexity slider
   - Content format filter

3. **Batch Analysis**:
   - Upload CSV of comp combinations
   - Bulk processing
   - Export results to Excel

4. **Social Features**:
   - Share searches with team members
   - Collaborative bookmarks
   - Comments on saved searches

### Phase 3 Features (Month 2-3)

1. **ML Improvements**:
   - Fine-tuned ranking model
   - User feedback loop (thumbs up/down)
   - Personalized results based on viewing history

2. **Analytics Deep Dive**:
   - Trend analysis: emerging comp patterns
   - Competitive intelligence: what comps are popular
   - Title recommendations for creators based on popular comps

3. **API Access**:
   - RESTful API for programmatic access
   - Webhook notifications for new matches
   - Integration with external tools

---

## Documentation Deliverables

### User Documentation
**Location**: `/apps/dashboard/public/docs/COMPS_NAVIGATOR_GUIDE.md`

**Contents**:
- What is Comps Navigator?
- How to use (step-by-step guide)
- Example searches
- Tips for better results
- FAQs

### Developer Documentation
**Location**: `/docs/features/comps-navigator/`

**Files**:
- `TECHNICAL_ARCHITECTURE.md` (this document)
- `API_REFERENCE.md` (edge function API)
- `TESTING_GUIDE.md` (how to test)
- `MONITORING_GUIDE.md` (metrics and alerts)

### Admin Documentation
**Location**: `/docs/features/comps-navigator/ADMIN_GUIDE.md`

**Contents**:
- How to monitor usage and costs
- How to investigate poor matches
- How to optimize performance
- How to handle user feedback

---

## Appendix

### Sample Prompts

**LLM Re-Ranking Prompt**:
```
You are an expert at matching Korean content to Hollywood/global comparable titles.

COMP COMBINATION:
1. Squid Game (Netflix series about deadly games with social commentary)
2. Black Mirror (Anthology series exploring dark side of technology)
3. Parasite (Film about class struggle and deception)

USER REFINEMENT: "More comedic tone, lower production budget"

CANDIDATE KOREAN TITLES (rank these by relevance):

1. Sweet Home (webtoon)
   Synopsis: A reclusive high school student must fight for survival when mysterious creatures turn humans into monsters.
   Genre: Horror, Thriller, Drama
   Tone: Dark, suspenseful

2. The Uncanny Counter (webtoon)
   Synopsis: A group of demon hunters with supernatural powers run a noodle shop as their cover.
   Genre: Action, Supernatural, Comedy
   Tone: Action-packed with comedic elements

[... 18 more candidates ...]

TASK:
1. Rank all 20 candidates by relevance to the comp combination
2. Assign match score 0-100 for each candidate
3. Explain WHY each matches (specific themes, tones, character types, story structures)
4. For each candidate, show alignment with EACH individual comp

Consider:
- Squid Game: Survival games, class struggle, social commentary, violence
- Black Mirror: Technology dystopia, psychological thriller, anthology format
- Parasite: Class divide, deception, dark comedy, ensemble cast
- User wants: More comedic tone (vs Squid Game's grimness), lower budget production

Return JSON array ONLY (no additional text):
[
  {
    "rank": 1,
    "title_id": "sweet-home-123",
    "match_score": 87,
    "explanation": "Strong match for survival horror themes similar to Squid Game, but with supernatural twist. Matches Black Mirror's dystopian atmosphere and psychological elements. Class commentary present but not as pronounced as Parasite. Medium budget production suitable for streaming.",
    "comp_alignments": [
      {
        "comp_title": "Squid Game",
        "alignment_score": 82,
        "reasons": [
          "Survival horror with life-or-death stakes",
          "Ensemble cast with diverse backgrounds",
          "Social commentary on isolation and desperation"
        ]
      },
      {
        "comp_title": "Black Mirror",
        "alignment_score": 75,
        "reasons": [
          "Dystopian setting with technology failure",
          "Psychological thriller elements",
          "Exploration of human nature under pressure"
        ]
      },
      {
        "comp_title": "Parasite",
        "alignment_score": 68,
        "reasons": [
          "Class dynamics in confined apartment setting",
          "Deception and hidden truths",
          "Dark comedic moments amid horror"
        ]
      }
    ]
  },
  ...
]
```

### Sample Database Queries

**Get Recent Searches**:
```sql
SELECT
  id,
  comp_titles,
  refinement_text,
  search_name,
  created_at,
  is_bookmarked,
  result_count,
  avg_match_score
FROM comp_searches
WHERE user_email = 'user@example.com'
ORDER BY created_at DESC
LIMIT 10;
```

**Get Popular Comp Combinations**:
```sql
SELECT
  comp_titles,
  COUNT(*) as search_count,
  AVG(avg_match_score) as avg_score,
  MAX(created_at) as last_searched
FROM comp_searches
WHERE created_at > NOW() - INTERVAL '30 days'
GROUP BY comp_titles
ORDER BY search_count DESC
LIMIT 20;
```

**Get Cached Embeddings**:
```sql
SELECT
  comp_title,
  source,
  created_at,
  updated_at
FROM comp_title_cache
ORDER BY updated_at DESC
LIMIT 100;
```

### Test Data

**Sample Comp Combinations for Testing**:

| Test # | Comp 1 | Comp 2 | Comp 3 | Refinement | Expected Genre |
|--------|--------|--------|--------|------------|----------------|
| 1 | Squid Game | Parasite | Black Mirror | more comedic | Dark thriller + comedy |
| 2 | Stranger Things | Dark | The OA | - | Sci-fi mystery |
| 3 | Money Heist | Breaking Bad | Ozark | female lead | Crime drama |
| 4 | Game of Thrones | Vikings | The Last Kingdom | lower budget | Historical/fantasy |
| 5 | The Handmaid's Tale | Black Mirror | Westworld | - | Dystopian sci-fi |
| 6 | True Detective | Mindhunter | The Sinner | - | Crime thriller |
| 7 | Euphoria | Skins | 13 Reasons Why | - | Teen drama |
| 8 | The Crown | Downton Abbey | Succession | - | Family drama |
| 9 | The Witcher | Shadow and Bone | Cursed | - | Fantasy adventure |
| 10 | You | Dexter | Killing Eve | - | Psychological thriller |

---

**End of Implementation Plan**

**Status**: ✅ Ready for Implementation
**Estimated Completion**: 5 days
**Next Step**: Begin Day 1 tasks (database schema + edge function scaffolding)
