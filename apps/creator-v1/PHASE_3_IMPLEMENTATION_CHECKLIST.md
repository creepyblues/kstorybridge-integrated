# Phase 3 Implementation Checklist

**Status**: 📋 Ready for Implementation
**Created**: 2025-10-12
**Dependencies**: Phase 1 & 2 Complete (6/6 improvements verified)

## 📚 Prerequisites - Read These First

**CRITICAL**: This is an EXECUTION-FOCUSED checklist. For detailed implementation code and architecture, read these comprehensive guides first:

1. **[CHATBOT_IMPROVEMENT_GUIDE.md](public/docs/CHATBOT_IMPROVEMENT_GUIDE.md)** (1577 lines) - PRIMARY reference
   - Lines 536-691: Adaptive Threshold + Query Expansion implementation
   - Lines 694-837: Conversation Summarization implementation
   - Lines 354-534: Advanced Hallucination Prevention
   - Lines 1122-1209: Testing procedures
   - Lines 1213-1304: Monitoring & analytics

2. **[AI_CHATBOT_DOCUMENTATION.md](public/docs/AI_CHATBOT_DOCUMENTATION.md)** - System architecture
3. **[CHATBOT_MONITORING_GUIDE.md](CHATBOT_MONITORING_GUIDE.md)** - Operational monitoring
4. **[CHATBOT_ENVIRONMENT_PARITY_GUIDE.md](CHATBOT_ENVIRONMENT_PARITY_GUIDE.md)** - Environment consistency

---

## 🎯 Phase 3 Overview

**Goal**: Improve search quality and response relevance by 30-50%

**Key Improvements**:
1. ✅ Adaptive Threshold - Code ready (CHATBOT_IMPROVEMENT_GUIDE.md lines 536-617)
2. ✅ Query Expansion - Code ready (CHATBOT_IMPROVEMENT_GUIDE.md lines 618-677)
3. ⚠️ Hybrid Search Scoring - Code needed (see Section 3 below)
4. ✅ Conversation Summarization - Code ready (CHATBOT_IMPROVEMENT_GUIDE.md lines 694-837)

**Implementation Strategy**: Gradual rollout with feature flags (safe, reversible)

---

## 🚀 Implementation Steps

### Step 1: Feature Flag Setup (Environment Variables)

**Location**: Supabase Dashboard → Project Settings → Edge Functions → Secrets

**Add these 4 feature flags**:

```bash
ENABLE_ADAPTIVE_THRESHOLD=false
ENABLE_QUERY_EXPANSION=false
ENABLE_HYBRID_SEARCH=false
ENABLE_CONVERSATION_SUMMARY=false
```

**Set via Supabase CLI**:
```bash
# From apps/dashboard/supabase/ directory
npx supabase secrets set ENABLE_ADAPTIVE_THRESHOLD=false
npx supabase secrets set ENABLE_QUERY_EXPANSION=false
npx supabase secrets set ENABLE_HYBRID_SEARCH=false
npx supabase secrets set ENABLE_CONVERSATION_SUMMARY=false
```

**Verification**:
```bash
npx supabase secrets list
```

**Why Feature Flags?**
- ✅ Safe rollout (enable one feature at a time)
- ✅ Easy rollback (set to `false` instantly)
- ✅ A/B testing capability
- ✅ No code deployment needed to enable/disable

---

### Step 2: Adaptive Threshold Implementation

**Objective**: Lower similarity threshold gradually until minimum results found (0.7 → 0.5)

**File**: `apps/dashboard/supabase/functions/chat-orchestrator/index.ts`

**Implementation**: Already written in CHATBOT_IMPROVEMENT_GUIDE.md (lines 559-616)

**Key Code Snippet** (add to edge function):
```typescript
// Feature flag check
const ENABLE_ADAPTIVE_THRESHOLD = Deno.env.get('ENABLE_ADAPTIVE_THRESHOLD') === 'true';

async function adaptiveVectorSearch(
  query: string,
  options: { minResults?: number; maxResults?: number } = {}
) {
  const config = {
    minResults: options.minResults || 5,
    maxResults: options.maxResults || 10,
    startThreshold: 0.70,
    minThreshold: 0.50
  };

  let threshold = config.startThreshold;
  let results: VectorSearchResult[] = [];

  while (results.length < config.minResults && threshold >= config.minThreshold) {
    results = await vectorSearch(query, undefined, {
      threshold,
      limit: config.maxResults
    });

    console.log(`🔍 Adaptive search: threshold ${threshold} → ${results.length} results`);

    if (results.length < config.minResults) {
      threshold -= 0.05;
    }
  }

  return results.slice(0, config.maxResults);
}

// Usage in main handler
const searchResults = ENABLE_ADAPTIVE_THRESHOLD
  ? await adaptiveVectorSearch(userQuery, { minResults: 5, maxResults: 10 })
  : await vectorSearch(userQuery, undefined, { threshold: 0.7, limit: 10 });
```

**Testing**:
- Test query: "Find obscure Korean mythology titles"
- Expected: Should lower threshold and find ~5-10 results instead of 0-2

---

### Step 3: Query Expansion Implementation

**Objective**: Expand queries with synonyms to improve search coverage

**File**: `apps/dashboard/supabase/functions/chat-orchestrator/index.ts`

**Implementation**: Already written in CHATBOT_IMPROVEMENT_GUIDE.md (lines 622-677)

**Key Code Snippet** (add to edge function):
```typescript
const ENABLE_QUERY_EXPANSION = Deno.env.get('ENABLE_QUERY_EXPANSION') === 'true';

const SYNONYM_MAP: Record<string, string[]> = {
  'romance': ['love', 'romantic', 'relationship', 'dating'],
  'thriller': ['suspense', 'mystery', 'psychological'],
  'action': ['fight', 'combat', 'battle', 'adventure'],
  'comedy': ['funny', 'humor', 'lighthearted', 'sitcom'],
  'drama': ['emotional', 'serious', 'realistic'],
  'fantasy': ['magic', 'supernatural', 'mythical'],
  'horror': ['scary', 'terror', 'creepy', 'dark'],
  'sci-fi': ['science fiction', 'futuristic', 'technology'],
  // Add more as needed
};

function expandQuery(query: string): string[] {
  const words = query.toLowerCase().split(/\s+/);
  const expandedQueries: string[] = [query];

  words.forEach(word => {
    if (SYNONYM_MAP[word]) {
      SYNONYM_MAP[word].forEach(synonym => {
        const expandedQuery = query.replace(new RegExp(word, 'gi'), synonym);
        expandedQueries.push(expandedQuery);
      });
    }
  });

  return expandedQueries.slice(0, 3); // Limit to 3 variations
}

// Usage in main handler
const queries = ENABLE_QUERY_EXPANSION
  ? expandQuery(userQuery)
  : [userQuery];

const allResults = [];
for (const q of queries) {
  const results = await vectorSearch(q);
  allResults.push(...results);
}

// Deduplicate by title_id
const uniqueResults = Array.from(
  new Map(allResults.map(r => [r.title_id, r])).values()
).slice(0, 10);
```

**Testing**:
- Test query: "Find romance titles"
- Expected: Should also search "love", "romantic", "relationship" and find more diverse results

---

### Step 4: Hybrid Search Scoring (NEW CODE)

**Objective**: Combine vector search (70%) + keyword search (30%) for better coverage

**File**: `apps/dashboard/supabase/functions/chat-orchestrator/index.ts`

**Implementation Code** (NEW - not in existing docs):

```typescript
const ENABLE_HYBRID_SEARCH = Deno.env.get('ENABLE_HYBRID_SEARCH') === 'true';

interface HybridSearchResult {
  title_id: string;
  title_name_en: string;
  title_name_kr: string;
  synopsis: string;
  vectorScore: number;    // 0-1 from similarity
  keywordScore: number;   // 0-1 from text search rank
  finalScore: number;     // Weighted combination
}

async function hybridSearch(query: string): Promise<HybridSearchResult[]> {
  console.log('🔍 Starting hybrid search...');

  // 1. Vector search (semantic similarity)
  const vectorResults = await vectorSearch(query, undefined, {
    threshold: 0.5,
    limit: 20
  });

  // 2. Keyword search (full-text search)
  const { data: keywordResults, error } = await supabaseClient
    .from('titles')
    .select('title_id, title_name_en, title_name_kr, synopsis')
    .textSearch('fts', query, { type: 'websearch', config: 'english' })
    .limit(20);

  if (error) {
    console.error('❌ Keyword search error:', error);
  }

  // 3. Merge results with weighted scoring
  const resultsMap = new Map<string, HybridSearchResult>();

  // Add vector results (70% weight)
  vectorResults.forEach((result, index) => {
    resultsMap.set(result.title_id, {
      ...result,
      vectorScore: result.similarity || (1 - index / vectorResults.length),
      keywordScore: 0,
      finalScore: 0
    });
  });

  // Add keyword results (30% weight)
  keywordResults?.forEach((result, index) => {
    const existing = resultsMap.get(result.title_id);
    const keywordScore = 1 - index / keywordResults.length;

    if (existing) {
      // Found in both - boost score
      existing.keywordScore = keywordScore;
      existing.finalScore = (existing.vectorScore * 0.7) + (keywordScore * 0.3);
    } else {
      // Only in keyword search
      resultsMap.set(result.title_id, {
        ...result,
        vectorScore: 0,
        keywordScore,
        finalScore: keywordScore * 0.3
      });
    }
  });

  // Update scores for vector-only results
  resultsMap.forEach(result => {
    if (result.finalScore === 0) {
      result.finalScore = result.vectorScore * 0.7;
    }
  });

  // 4. Sort by final score and return top 10
  const sortedResults = Array.from(resultsMap.values())
    .sort((a, b) => b.finalScore - a.finalScore)
    .slice(0, 10);

  console.log(`✅ Hybrid search: ${sortedResults.length} results`);
  console.log(`   Vector only: ${sortedResults.filter(r => r.keywordScore === 0).length}`);
  console.log(`   Keyword only: ${sortedResults.filter(r => r.vectorScore === 0).length}`);
  console.log(`   Both: ${sortedResults.filter(r => r.vectorScore > 0 && r.keywordScore > 0).length}`);

  return sortedResults;
}

// Usage in main handler
const searchResults = ENABLE_HYBRID_SEARCH
  ? await hybridSearch(userQuery)
  : await vectorSearch(userQuery, undefined, { threshold: 0.7, limit: 10 });
```

**Database Requirements**:
- Ensure `titles` table has full-text search index (FTS) configured
- If missing, add migration:
```sql
ALTER TABLE titles ADD COLUMN fts tsvector
  GENERATED ALWAYS AS (
    setweight(to_tsvector('english', coalesce(title_name_en, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(title_name_kr, '')), 'B') ||
    setweight(to_tsvector('english', coalesce(synopsis, '')), 'C')
  ) STORED;

CREATE INDEX titles_fts_idx ON titles USING GIN (fts);
```

**Testing**:
- Test query: "Korean detective series"
- Expected: Should find titles matching "detective" (keyword) AND semantically similar titles (vector)

---

### Step 5: Conversation Summarization

**Objective**: Compress long conversations (>10 messages) to maintain context without hitting token limits

**File**: `apps/dashboard/supabase/functions/chat-orchestrator/index.ts`

**Implementation**: Already written in CHATBOT_IMPROVEMENT_GUIDE.md (lines 697-837)

**Key Code Snippet** (add to edge function):
```typescript
const ENABLE_CONVERSATION_SUMMARY = Deno.env.get('ENABLE_CONVERSATION_SUMMARY') === 'true';

async function summarizeConversation(messages: Message[]): Promise<Message[]> {
  const SUMMARY_THRESHOLD = 10;
  const KEEP_RECENT = 4;

  if (messages.length <= SUMMARY_THRESHOLD) {
    return messages;
  }

  console.log(`📝 Summarizing conversation (${messages.length} messages)`);

  // Keep recent messages, summarize older ones
  const recentMessages = messages.slice(-KEEP_RECENT);
  const oldMessages = messages.slice(0, -KEEP_RECENT);

  // Create summary using OpenAI
  const summaryPrompt = `Summarize this conversation history concisely (2-3 sentences):

${oldMessages.map(m => `${m.role}: ${m.content}`).join('\n')}

Focus on: user preferences, mentioned titles, search criteria.`;

  const summaryResponse = await openai.chat.completions.create({
    model: 'gpt-4',
    messages: [{ role: 'user', content: summaryPrompt }],
    max_tokens: 150
  });

  const summary = summaryResponse.choices[0].message.content;

  // Return summary + recent messages
  return [
    { role: 'system', content: `Previous conversation summary: ${summary}` },
    ...recentMessages
  ];
}

// Usage in main handler
const conversationHistory = ENABLE_CONVERSATION_SUMMARY
  ? await summarizeConversation(messages)
  : messages;
```

**Testing**:
- Test with 15-message conversation
- Expected: Older messages compressed to 2-3 sentence summary, recent 4 messages preserved

---

## 🧪 Sample Test Scenarios

### Test Scenario 1: Adaptive Threshold

**Setup**: Enable `ENABLE_ADAPTIVE_THRESHOLD=true`

**Test Query**: "Find titles about ancient Korean mythology"

**Before (Phase 1 & 2)**:
- Fixed threshold: 0.7
- Expected results: 0-2 titles (very niche topic)
- Response: "I couldn't find many titles matching that specific criteria..."

**After (Phase 3 - Adaptive Threshold)**:
- Adaptive threshold: Starts at 0.7, lowers to 0.65, 0.60, 0.55...
- Expected results: 5-8 titles (broader semantic matching)
- Response: "Here are some titles related to Korean mythology and historical themes..."

**Success Criteria**:
- ✅ Edge function logs show: "🔍 Adaptive search: threshold 0.55 → 6 results"
- ✅ Response includes 5+ title recommendations
- ✅ No "couldn't find" messages

---

### Test Scenario 2: Query Expansion

**Setup**: Enable `ENABLE_QUERY_EXPANSION=true`

**Test Query**: "Find romance webtoons"

**Before (Phase 1 & 2)**:
- Single query: "Find romance webtoons"
- Expected results: 8-10 titles with "romance" tag
- Response: Lists titles tagged with "romance"

**After (Phase 3 - Query Expansion)**:
- Expanded queries:
  1. "Find romance webtoons"
  2. "Find love webtoons"
  3. "Find romantic webtoons"
- Expected results: 12-15 unique titles (deduplicated)
- Response: More diverse recommendations including "love stories" not explicitly tagged "romance"

**Success Criteria**:
- ✅ Edge function logs show: "🔍 Query expansion: 3 variations → 15 results → 10 unique"
- ✅ Response includes titles with "love", "relationship" themes even without "romance" tag
- ✅ No duplicate titles in recommendations

---

### Test Scenario 3: Hybrid Search

**Setup**: Enable `ENABLE_HYBRID_SEARCH=true`

**Test Query**: "Korean detective solving crimes"

**Before (Phase 1 & 2)**:
- Vector search only (semantic similarity)
- Expected results: 4-6 titles (limited by strict similarity threshold)
- Response: May miss titles with exact keyword matches but lower semantic similarity

**After (Phase 3 - Hybrid Search)**:
- Vector search (70%): Semantic similarity to "detective solving crimes"
- Keyword search (30%): Exact matches for "detective", "crimes"
- Expected results: 9-10 titles (better coverage)
- Response: Includes both semantically similar titles AND exact keyword matches

**Success Criteria**:
- ✅ Edge function logs show: "✅ Hybrid search: 10 results (Vector: 6, Keyword: 2, Both: 2)"
- ✅ Response includes titles matching "detective" keyword even if not semantically similar
- ✅ Final scores properly weighted (vector 70% + keyword 30%)

---

### Test Scenario 4: Conversation Summarization

**Setup**: Enable `ENABLE_CONVERSATION_SUMMARY=true`

**Test Conversation** (15 messages):
```
1. User: "Find romance titles"
2. AI: "Here are some romance titles..."
3. User: "What about action titles?"
4. AI: "Here are action titles..."
...
13. User: "Tell me about True Beauty"
14. AI: "True Beauty is a romantic comedy..."
15. User: "What other titles are like that?"
```

**Before (Phase 1 & 2)**:
- All 15 messages sent to OpenAI
- Token count: ~3,500 tokens
- Risk: May hit token limit in longer conversations

**After (Phase 3 - Conversation Summarization)**:
- Messages 1-11 summarized: "User requested romance and action titles. Discussed several recommendations."
- Messages 12-15 preserved as-is
- Token count: ~1,200 tokens (66% reduction)

**Success Criteria**:
- ✅ Edge function logs show: "📝 Summarizing conversation (15 messages) → 5 messages"
- ✅ Recent context (True Beauty discussion) fully preserved
- ✅ Older context (romance/action requests) compressed but not lost
- ✅ AI response still references earlier conversation appropriately

---

## 🚀 Deployment Safety Checklist

### Pre-Deployment

- [ ] **Read comprehensive documentation** (CHATBOT_IMPROVEMENT_GUIDE.md)
- [ ] **Run local tests** with `test-chatbot-improvements.js`
- [ ] **Verify environment variables** set to `false` initially
- [ ] **Create rollback plan** (document current edge function version)
- [ ] **Backup edge function** code before changes
- [ ] **Test database FTS index** exists (for hybrid search)

### Code Changes

- [ ] **Add feature flag checks** at top of edge function
- [ ] **Implement adaptive threshold** with flag guard
- [ ] **Implement query expansion** with flag guard
- [ ] **Implement hybrid search** with flag guard
- [ ] **Implement conversation summarization** with flag guard
- [ ] **Add comprehensive logging** for each feature
- [ ] **Test locally** with feature flags enabled one at a time

### Deployment

- [ ] **Deploy edge function** via Supabase CLI
```bash
cd apps/dashboard/supabase
npx supabase functions deploy chat-orchestrator
```
- [ ] **Verify deployment** successful
- [ ] **Check edge function logs** for errors
- [ ] **Keep feature flags disabled** initially

### Gradual Rollout (Week-by-Week)

**Week 1: Adaptive Threshold**
- [ ] Set `ENABLE_ADAPTIVE_THRESHOLD=true`
- [ ] Monitor edge function logs for threshold patterns
- [ ] Run 10 test queries with niche topics
- [ ] Check "no results" rate (should drop from 15% to <5%)
- [ ] If issues: Set flag to `false` immediately

**Week 2: Query Expansion**
- [ ] Set `ENABLE_QUERY_EXPANSION=true` (keep adaptive enabled)
- [ ] Monitor edge function logs for expansion patterns
- [ ] Run 10 test queries with common genres
- [ ] Check result diversity (should increase by 20-30%)
- [ ] If issues: Set flag to `false` immediately

**Week 3: Hybrid Search**
- [ ] Set `ENABLE_HYBRID_SEARCH=true` (keep previous enabled)
- [ ] Monitor edge function logs for hybrid scoring
- [ ] Run 10 test queries with specific keywords
- [ ] Check result coverage (should reach 10 results consistently)
- [ ] If issues: Set flag to `false` immediately

**Week 4: Conversation Summarization**
- [ ] Set `ENABLE_CONVERSATION_SUMMARY=true` (all enabled)
- [ ] Monitor edge function logs for summarization triggers
- [ ] Test with 15+ message conversations
- [ ] Check token usage (should reduce by 50-70% for long conversations)
- [ ] If issues: Set flag to `false` immediately

### Post-Deployment Monitoring

- [ ] **Monitor response times** (target: <4 seconds)
- [ ] **Monitor error rates** (target: <1%)
- [ ] **Monitor hallucination warnings** (target: <5%)
- [ ] **Monitor "no results" rate** (target: <2%)
- [ ] **Gather user feedback** via ChatbotFeedback system
- [ ] **Check edge function logs daily** for first week
- [ ] **Update CHATBOT_TEST_RESULTS.md** with Phase 3 results

### Rollback Procedure (If Needed)

**Immediate Rollback** (within 1 minute):
```bash
# Disable problematic feature via Supabase secrets
npx supabase secrets set ENABLE_ADAPTIVE_THRESHOLD=false
npx supabase secrets set ENABLE_QUERY_EXPANSION=false
npx supabase secrets set ENABLE_HYBRID_SEARCH=false
npx supabase secrets set ENABLE_CONVERSATION_SUMMARY=false
```

**Full Rollback** (if multiple issues):
```bash
# Redeploy previous edge function version
cd apps/dashboard/supabase
git checkout <previous-commit>
npx supabase functions deploy chat-orchestrator
```

---

## 📊 Success Metrics

**Phase 3 Goals** (to be measured after 4-week rollout):

| Metric | Phase 2 Baseline | Phase 3 Target | Measurement Method |
|--------|------------------|----------------|-------------------|
| Search Coverage | 8.5 avg results | 9.5+ avg results | Edge function logs |
| "No Results" Rate | 2% | <1% | Query analysis |
| Response Diversity | N/A | +30% unique titles | Result analysis |
| Token Usage (long conversations) | ~3,500 tokens | ~1,200 tokens | OpenAI usage logs |
| Response Time | 2-4 seconds | 2-5 seconds | Performance monitoring |
| Hallucination Rate | <5% | <5% (maintain) | Validation system |

**Data Collection**:
- Edge function logs: https://supabase.com/dashboard/project/dlrnrgcoguxlkkcitlpd/functions
- User feedback: ChatbotFeedback table
- Performance metrics: Supabase monitoring dashboard

---

## 📝 Documentation Updates

After successful Phase 3 deployment:

- [ ] Update `CHATBOT_TEST_RESULTS.md` with Phase 3 verification results
- [ ] Update `TESTING_GUIDE.md` with new test procedures for Phase 3 features
- [ ] Update `AI_CHATBOT_DOCUMENTATION.md` with Phase 3 architecture changes
- [ ] Update root `CLAUDE.md` to reflect Phase 3 complete status
- [ ] Create `PHASE_3_DEPLOYMENT_REPORT.md` with metrics and findings

---

## ❓ Troubleshooting

### Issue: Adaptive threshold too aggressive (too many low-quality results)

**Solution**: Increase `minThreshold` from 0.50 to 0.55 or 0.60

### Issue: Query expansion creating too many duplicates

**Solution**: Improve deduplication logic, limit expanded queries to 2 instead of 3

### Issue: Hybrid search favoring keyword too much

**Solution**: Adjust weights (try 80% vector / 20% keyword instead of 70/30)

### Issue: Conversation summarization losing important context

**Solution**: Increase `KEEP_RECENT` from 4 to 6 messages

### Issue: Feature flag changes not taking effect

**Solution**:
1. Verify secrets set correctly: `npx supabase secrets list`
2. Redeploy edge function: `npx supabase functions deploy chat-orchestrator`
3. Check edge function logs for feature flag read errors

---

## 🔗 Quick Reference Links

- **Edge Function**: `/apps/dashboard/supabase/functions/chat-orchestrator/index.ts`
- **Test Suite**: `/apps/dashboard/test-chatbot-improvements.js`
- **Comprehensive Guide**: `/apps/dashboard/public/docs/CHATBOT_IMPROVEMENT_GUIDE.md`
- **Architecture**: `/apps/dashboard/public/docs/AI_CHATBOT_DOCUMENTATION.md`
- **Monitoring**: `/apps/dashboard/CHATBOT_MONITORING_GUIDE.md`
- **Edge Function Logs**: https://supabase.com/dashboard/project/dlrnrgcoguxlkkcitlpd/functions

---

**Next Steps**:
1. Read comprehensive documentation (CHATBOT_IMPROVEMENT_GUIDE.md)
2. Set up feature flags (all disabled initially)
3. Implement code changes with feature flag guards
4. Deploy edge function
5. Follow gradual rollout schedule (Week 1-4)
6. Monitor metrics and gather feedback
7. Update documentation with results
