# AI Chatbot System - Overview

**Status**: ✅ Production (Phases 1-3 Complete)
**Last Updated**: 2025-10-21

---

## System Architecture

The KStoryBridge AI chatbot ("Jinu") is a conversational AI assistant that helps buyers discover Korean content through natural language queries. The system uses GPT-4 with vector search, intent classification, and pitch deck analytics integration.

### Core Components

**Edge Function**: `chat-orchestrator`
**Location**: `/apps/dashboard/supabase/functions/chat-orchestrator/index.ts`
**Frontend**: `/apps/dashboard/src/pages/Chat.tsx`
**Database**: Vector search via `match_titles_by_embedding()` function

---

## Deployment Phases

### ✅ Phase 1: Quick Wins (Completed 2025-10-04)

**Improvements**:
1. **Vector Search Increase** (5→10 results) - +100% coverage
2. **Anti-Hallucination Validation** - <5% false recommendations
3. **Fuzzy Title Matching** - 80% similarity threshold, +40% link success

**Performance**:
- Search results: 10 titles (up from 5) with >0.8 similarity scores
- Response times: 2-4 seconds average
- Hallucination detection: Active (9 instances caught in testing)

### ✅ Phase 2: Prompt Engineering (Completed 2025-10-04)

**Improvements**:
4. **Intent Classification** - 5 types (discovery, comparison, information, recommendation, follow-up)
5. **Conversation Context Weighting** - Recent message prioritization, title mention tracking
6. **Fallback Keyword Search** - PostgreSQL full-text search when vector fails

**Performance**:
- Intent accuracy: 100% across all test queries
- Zero-results prevention: ~87% reduction (15% → 2%)

### ✅ Phase 3: Pitch Analytics Integration (Deployed 2025-10-21)

**Status**: IMPLEMENTED, FEATURE FLAG CONTROLLED

**Implementation**:
- Database migration: `20250130000000_add_pitch_to_vector_search.sql` ✅ Applied
- Edge function: TypeScript interfaces and `formatPitchAnalytics()` function ✅ Deployed
- Feature flag: `ENABLE_PITCH_CONTEXT` environment variable

**Enhanced Query Categories** (60+ query types):
1. Character-Focused Queries (8 types)
2. Story Craft Queries (10 types)
3. Market Positioning Queries (10 types)
4. Source Material & Metrics Queries (10 types)
5. Korean Cultural Queries (8 types)
6. IP Value & Business Queries (10 types)
7. Production Details Queries (8 types)
8. Content Classification Queries (9 types)
9. Creative Team Queries (8 types)

**Data Source**: `title_content_analysis` table (pitch_analysis JSONB field)

**Quality Threshold**: Only uses pitch data with `processing_confidence >= 0.70`

**Token Management**:
- Max 800 tokens per title
- Arrays limited to 3-4 items
- Long strings truncated to 100-150 characters

---

## Feature Flags

The chatbot uses environment variables for safe, gradual rollout:

| Flag | Purpose | Risk | Rollback |
|------|---------|------|----------|
| `USE_FORMAL_BASELINE` | Testing only - formal baseline for A/B testing | TESTING | N/A |
| `ENABLE_NEW_PERSONALITY` | "Story nerd" conversational tone | LOW | Set to `false` |
| `ENABLE_EXPLORATION_MODE` | Ask questions before recommending | MEDIUM | Set to `false` |
| `ENABLE_CONDITIONAL_INFO` | Conditional information detail | LOW | Set to `false` |
| **`ENABLE_PITCH_CONTEXT`** | **Pitch analytics integration** | **MEDIUM** | **Set to `false`** |

**Deployment Strategy**: Deploy with flag OFF → Enable for 10% → 50% → 100%

---

## Performance Metrics

### Current Performance (Phase 1-2)
- **Response Time**: 2-4 seconds average
- **Search Results**: 10 titles per query
- **Hallucination Rate**: <5%
- **Zero-Results Rate**: ~2%
- **Intent Accuracy**: 100%

### Target Performance (Phase 3 with Pitch Analytics)
- **Response Time**: 3-5 seconds average (+1s acceptable)
- **Token Count**: 3,000-4,000 per query (+100% from baseline)
- **Cost per Query**: $0.02 (up from $0.01)
- **Hallucination Rate**: <5% (maintain)
- **Pitch Coverage**: 30-50% of queries use pitch data

---

## Monitoring

### Edge Function Logs

**Access**: https://supabase.com/dashboard/project/dlrnrgcoguxlkkcitlpd/functions

**Key Log Patterns**:
```bash
# Pitch context usage
grep "📊 Pitch Analytics Status" logs.txt

# Token counts
grep "📊 Pitch context formatted" logs.txt

# Hallucination warnings
grep "⚠️ Title hallucinations detected" logs.txt

# Errors
grep "❌" logs.txt
```

### Success Metrics

**Proceed to Next Phase If**:
- ✅ Error rate < 1%
- ✅ Response time < 6 seconds (95th percentile)
- ✅ Hallucination rate < 5%
- ✅ Pitch usage > 30% (indicates good data coverage)

**Rollback If**:
- ❌ Error rate > 5%
- ❌ Response time > 8 seconds
- ❌ Hallucination rate > 10%
- ❌ User complaints about accuracy

---

## Documentation

- **[PHASE_1_2_SUMMARY.md](./PHASE_1_2_SUMMARY.md)** - Complete test results with log evidence
- **[PITCH_ANALYTICS.md](./PITCH_ANALYTICS.md)** - Phase 3 implementation plan and status
- **[TESTING_GUIDE.md](./TESTING_GUIDE.md)** - Testing procedures and log interpretation
- **[AI_CHATBOT_DOCUMENTATION.md](/apps/dashboard/public/docs/AI_CHATBOT_DOCUMENTATION.md)** - User-facing system documentation

---

## Testing

### Automated Testing

**Test Suite**: `/apps/dashboard/test-chatbot-improvements.js`

**Run Tests**:
```bash
# Get auth token
export SUPABASE_AUTH_TOKEN=$(node get-auth-token.js)

# Run test suite
node test-chatbot-improvements.js
```

**Expected Results**: 6/6 tests passed (Phase 1 & 2)

### Manual Testing

**See**: [TESTING_GUIDE.md](./TESTING_GUIDE.md) for detailed procedures

**Test Queries**:
- Character queries: "Who are the main characters in [title]?"
- Theme queries: "What are the main themes in [title]?"
- Market queries: "What is [title] similar to?"
- Source queries: "How popular is [title]?"

---

## Future Enhancements

### Phase 4: Advanced Features (Planned)

**Not yet implemented**:
- Hybrid search (vector + pitch metadata filtering)
- Response caching (reduce token costs by 30%)
- A/B testing dashboard
- Analytics dashboard (admin UI)
- Advanced prompt engineering (query-specific context)

**Estimated Impact**:
- +20% search relevance (hybrid search)
- -30% token cost (caching)
- +15% response quality (advanced prompts)

---

## Quick Links

- **Edge Function**: [chat-orchestrator/index.ts](/apps/dashboard/supabase/functions/chat-orchestrator/index.ts)
- **Frontend**: [Chat.tsx](/apps/dashboard/src/pages/Chat.tsx)
- **Logs**: https://supabase.com/dashboard/project/dlrnrgcoguxlkkcitlpd/functions
- **Database Function**: `match_titles_by_embedding()` in titles table
- **Pitch Data**: `title_content_analysis` table

---

**For implementation details, see [PITCH_ANALYTICS.md](./PITCH_ANALYTICS.md)**
**For testing procedures, see [TESTING_GUIDE.md](./TESTING_GUIDE.md)**
