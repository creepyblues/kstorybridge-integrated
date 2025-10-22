# Phase 2 Enhanced Personality Testing Guide - Three-Way A/B Test

## Overview

This guide walks through the THREE-WAY A/B testing process for Phase 2 enhanced personality. We'll test 15 carefully designed queries with THREE personality variants to measure conversational improvement and incremental enhancement:

1. **FORMAL BASELINE** - Non-conversational, pure informational responses
2. **ORIGINAL** - Conversational with story craft language (current production)
3. **ENHANCED** - Enthusiastic "story nerd" personality (Phase 2 target)

## Prerequisites

1. **Supabase CLI** installed and authenticated
2. **Node.js** installed (v18 or later)
3. **Test buyer account** credentials (email + password)
4. **Supabase dependencies** installed

## Setup

### 1. Install Dependencies

```bash
cd /Users/sungholee/code/kstorybridge-v2/apps/dashboard
npm install @supabase/supabase-js
```

### 2. Set Environment Variables

```bash
export TEST_EMAIL="your-test-buyer@example.com"
export TEST_PASSWORD="your-test-password"
```

**Important**: Use a real buyer account that exists in production.

### 3. Verify Current Flag State

The flag should already be set to `false` for baseline testing:

```bash
# Verify current secrets (optional)
npx supabase secrets list --project-ref dlrnrgcoguxlkkcitlpd
```

## Running the Tests

### Automated Three-Way Testing

The test script now runs **THREE consecutive test phases automatically**:

1. **Run the test script**:
```bash
export TEST_EMAIL="your-test-buyer@example.com"
export TEST_PASSWORD="your-test-password"
node test-phase-2-personality.js
```

2. The script will automatically:

   **Phase 1/3: FORMAL BASELINE**
   - Set `USE_FORMAL_BASELINE=true` via Supabase CLI
   - Wait 60 seconds for edge function reload
   - Run 15 queries with formal (non-conversational) prompt

   **Phase 2/3: ORIGINAL CONVERSATIONAL**
   - Set `USE_FORMAL_BASELINE=false` (both flags OFF)
   - Wait 60 seconds for edge function reload
   - Run 15 queries with conversational story craft language

   **Phase 3/3: ENHANCED ENTHUSIASTIC**
   - Set `ENABLE_NEW_PERSONALITY=true`
   - Wait 60 seconds for edge function reload
   - Run 15 queries with enthusiastic "story nerd" personality

   **Save Results**
   - Save all 45 responses to `phase-2-test-results-three-way-[timestamp].json`

3. **Total Runtime**: ~60-75 minutes (15 queries × 3 variants + wait times)

## Test Queries

The script tests 15 queries across all 5 intent types:

### Discovery (5 queries)
1. "I'm looking for character-driven Korean content with strong emotional arcs"
2. "Show me action titles"
3. "romantic webtoon"
4. "I want something dark and psychological"
5. "Find me stories about family dynamics"

### Information (3 queries)
6. "Tell me about First Love"
7. "What's the story about Bride of the Water God?"
8. "First Love"

### Comparison (2 queries)
9. "What's the difference between Korean romance webtoons and Korean thriller webtoons?"
10. "How does First Love compare to other romance titles?"

### Recommendation (3 queries)
11. "I need something for Netflix that can work as a limited series"
12. "What would you recommend for a female 25-34 audience?"
13. "I'm developing for Apple TV+, what fits their brand?"

### Follow-up (2 queries)
14. "Tell me more"
15. "What else is similar?"

## Results Format

The script saves results to: `phase-2-test-results-three-way-[timestamp].json`

### JSON Structure
```json
{
  "metadata": {
    "testDate": "2025-10-15T...",
    "totalQueries": 15,
    "totalResponses": 45,
    "testType": "Three-Way A/B Test",
    "variants": [
      "FORMAL BASELINE (USE_FORMAL_BASELINE=true)",
      "ORIGINAL conversational (both flags false)",
      "ENHANCED enthusiastic (ENABLE_NEW_PERSONALITY=true)"
    ]
  },
  "formalResults": [
    {
      "testId": 1,
      "query": "...",
      "intent": "discovery",
      "response": "...",
      "responseTime": 2500,
      "variant": "FORMAL"
    }
    // ... 14 more
  ],
  "originalResults": [
    // ... 15 conversational responses
  ],
  "enhancedResults": [
    // ... 15 enthusiastic responses
  ],
  "testQueries": [
    // ... query metadata
  ]
}
```

## Scoring the Results

After running the tests, score each response pair on 5 metrics (1-5 scale):

### 1. Enthusiasm Level (1-5)
- Look for: "Oh, you found a gem!", "Love it—", "Great question!"
- **1**: Completely flat, robotic
- **3**: Neutral, professional
- **5**: Enthusiastically engaged, "story nerd" energy

### 2. Conversational Quality (1-5)
- Look for: Natural paragraph flow vs rigid bullet lists
- **1**: Pure bullet points, no personality
- **3**: Mix of bullets and paragraphs
- **5**: Flowing paragraphs, feels like conversation

### 3. Story Craft Depth (1-5)
- Look for: Deep terminology, structural breakdowns (arcs, hooks, themes)
- **1**: Surface-level only
- **3**: Some craft terminology
- **5**: Deep analysis with expert terminology

### 4. Opening Hook Quality (1-5)
- Look for: Enthusiastic acknowledgment vs generic start
- **1**: Generic "Here is..."
- **3**: Professional acknowledgment
- **5**: Exciting, personalized opening ("Oh, you found a gem!")

### 5. Development Questions (1-5)
- Look for: Natural, collaborative questions in paragraph form
- **1**: No questions asked
- **3**: Generic questions
- **5**: Thoughtful, curiosity-driven questions

## Calculating Improvements

For each metric, calculate THREE improvement percentages:

### 1. FORMAL → ORIGINAL (Conversational Baseline Impact)
```
Conversational Improvement = ((Original Avg - Formal Avg) / Formal Avg) × 100%
```
**Measures**: Value of adding conversational story craft language

### 2. ORIGINAL → ENHANCED (Incremental Enhancement)
```
Incremental Improvement = ((Enhanced Avg - Original Avg) / Original Avg) × 100%
```
**Measures**: Value of Phase 2 enhancement (current target)

### 3. FORMAL → ENHANCED (Total Improvement)
```
Total Improvement = ((Enhanced Avg - Formal Avg) / Formal Avg) × 100%
```
**Measures**: Total transformation from formal to enthusiastic

### Success Criteria

**Phase 2 is successful if**:
- ✅ FORMAL → ORIGINAL: ≥ 40% improvement (proves conversational baseline value)
- ✅ ORIGINAL → ENHANCED: ≥ 10-15% improvement (validates Phase 2 enhancement)
- ✅ FORMAL → ENHANCED: ≥ 50% total improvement
- ✅ No degradation in story craft depth (metric #3 must maintain or improve)
- ✅ No increase in hallucinations (check edge function logs)
- ✅ Response times remain acceptable (<4 seconds p95)

## Next Steps

1. ✅ Run automated tests (this guide)
2. ⏳ Score all 45 responses (15 queries × 3 variants)
3. ⏳ Calculate THREE improvement percentages:
   - FORMAL → ORIGINAL (conversational baseline)
   - ORIGINAL → ENHANCED (incremental enhancement)
   - FORMAL → ENHANCED (total improvement)
4. ⏳ Create `PHASE_2_TEST_RESULTS.md` with three-way analysis
5. ⏳ Make go/no-go recommendation

## Troubleshooting

### Authentication Errors
- Ensure TEST_EMAIL and TEST_PASSWORD are set correctly
- Verify the account is a buyer account (not creator)
- Check that the account exists in production

### Edge Function Errors
- Check edge function logs: https://supabase.com/dashboard/project/dlrnrgcoguxlkkcitlpd/functions
- Verify flag is set correctly: `npx supabase secrets list`
- Wait longer for edge function reload (try 60 seconds)

### "No messages provided" Error
- The edge function expects: `{ messages: [{ role: 'user', content: 'query' }] }`
- NOT: `{ message: 'query', conversationHistory: [] }`
- This has been fixed in the latest test script version

### "Unexpected token" / JSON Parse Errors
- The edge function returns Server-Sent Events (SSE) streaming format
- Response format: `data: {...}\ndata: {...}\ndata: [DONE]`
- The test script now properly handles streaming responses
- If you see parse errors, ensure you're using the latest version of `test-phase-2-personality.js`

### "No content received from streaming response" Error
- This was caused by event type mismatch
- Edge function sends: `{ type: 'text', text: 'chunk' }`
- Earlier versions looked for: `{ type: 'content', content: 'chunk' }`
- This has been fixed - ensure you're using the latest test script version

### Rate Limiting
- The script waits 2 seconds between requests
- If you hit rate limits, increase the delay in the script

## Edge Function Logs

Monitor logs during testing:
- URL: https://supabase.com/dashboard/project/dlrnrgcoguxlkkcitlpd/functions
- Click: "chat-orchestrator"
- Look for:
  - `📝 Using ORIGINAL personality prompt (Phase 2 OFF)`
  - `🎭 Using ENHANCED personality prompt (Phase 2 ACTIVE)`

This confirms which prompt is being used for each test run.

## Rollback Plan

If issues are detected during testing:

```bash
# Immediately disable the flag
npx supabase secrets set ENABLE_NEW_PERSONALITY=false --project-ref dlrnrgcoguxlkkcitlpd
```

**Rollback time**: <1 minute
