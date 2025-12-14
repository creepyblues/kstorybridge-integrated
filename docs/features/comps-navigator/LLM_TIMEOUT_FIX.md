# Comps Navigator: LLM Timeout Fix

**Date**: 2025-12-14
**Status**: Resolved

## Problem

The Comps Navigator was intermittently returning 400 errors after ~46 seconds of execution. Users would see "Edge Function returned a non-2xx status code" in the browser console.

## Root Cause

The OpenAI GPT-4o-mini LLM request was timing out at 45 seconds:

```
Error: Request timed out after 45000ms at fetchWithTimeout
```

### Why It Happened

1. **Phase 1** (Embeddings + Vector Search): Takes ~3-5 seconds
2. **Phase 2** (LLM Re-Ranking): Sometimes took >45 seconds
3. GPT-4o-mini can be slow when analyzing 5 candidates with 8-dimensional scoring
4. The timeout was intermittent because OpenAI response times vary

## Solution

Increased the LLM timeout from 45 seconds to 90 seconds.

**File**: `/supabase/functions/comp-navigator/index.ts`
**Line**: ~698

```typescript
// Before:
}, 45000) // 45 second timeout for LLM re-ranking

// After:
}, 90000) // 90 second timeout for LLM re-ranking (increased from 45s due to OpenAI latency)
```

## Timeout Configuration Reference

| Operation | Timeout | Location |
|-----------|---------|----------|
| General fetch timeout | 30,000ms | Line 26: `REQUEST_TIMEOUT_MS` |
| Embedding generation | 15,000ms | Line 450 |
| LLM re-ranking | 90,000ms | Line 698 |

## Deployment

```bash
cd /Users/sungholee/code/kstorybridge
npx supabase functions deploy comp-navigator
```

## Impact

- Search requests may take 60-70 seconds on slow OpenAI responses
- Success rate improved significantly (no more timeout-related 400 errors)
- User experience: Loading indicator shows during the longer wait time
