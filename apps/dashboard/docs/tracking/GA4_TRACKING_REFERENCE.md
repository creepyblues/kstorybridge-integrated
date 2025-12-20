# GA4 Tracking Reference

**Last Updated**: 2025-12-19
**Measurement ID**: `G-DWL6MV0MC2`
**Implementation**: `src/utils/analytics.ts`

---

## Overview

This document provides a complete reference for all GA4 events tracked in the Dashboard app. Events are organized by user funnel and page.

---

## Event Categories

### 1. Authentication Funnel

| Event | Trigger | Parameters |
|-------|---------|------------|
| `signup_form_viewed` | SignUp page loaded | - |
| `signup_attempted` | User submits signup form | `method: 'email' \| 'google'` |
| `signup_completed` | Profile created successfully | `method`, `account_type` |
| `signup_error` | Signup failed | `method`, `error_message` |
| `signin_form_viewed` | SignIn page loaded | - |
| `signin_attempted` | User submits signin form | `method: 'email' \| 'google'` |
| `signin_completed` | Session created successfully | `method` |
| `signin_error` | Signin failed | `method`, `error_message` |

**Files**: `SignUp.tsx`, `SignIn.tsx`, `AuthCallback.tsx`, `CompleteProfile.tsx`

---

### 2. AI Chat Funnel

| Event | Trigger | Parameters |
|-------|---------|------------|
| `chat_message_sent` | User sends message | `message_length`, `session_id` |
| `chat_message_received` | AI responds | `response_length`, `latency_ms`, `session_id` |
| `chat_title_click` | User clicks title in response | `title_id`, `title_name`, `position` |
| `chat_message_source` | Message sent (with source) | `source: 'typed' \| 'example' \| 'suggestion' \| 'url_param'`, `message_length` |
| `chat_example_clicked` | User clicks example prompt | `example_text` |
| `chat_suggestion_click` | User clicks suggested query | `suggestion_text`, `query_text`, `position` |
| `session_searches` | Page leave | `tool: 'chat'`, `search_count` |

**Files**: `Chat.tsx`, `ChatEmptyState.tsx`, `SuggestedQueries.tsx`

**Input Source Types**:
- `typed` - User typed message manually in input field
- `example` - Clicked example prompt in ChatEmptyState (initial state)
- `suggestion` - Clicked suggested follow-up query after AI response
- `url_param` - Message came from URL parameter (shared/deeplink)

---

### 3. Comps Navigator Funnel

| Event | Trigger | Parameters |
|-------|---------|------------|
| `comps_search` | Search executed | `comp_titles[]`, `result_count`, `processing_time_ms` |
| `comps_result_click` | User clicks result card | `title_id`, `title_name`, `match_score`, `position` |
| `comps_example_used` | User clicks "Try Example" | `example_name` (category), `comp_titles`, `comp_count` |
| `session_searches` | Page leave | `tool: 'comps'`, `search_count` |

**Files**: `CompsNavigator.tsx`, `ExamplesSection.tsx`, `TitleMatchCard.tsx`, `ResultsGrid.tsx`

---

### 4. Mandate Matcher Funnel

| Event | Trigger | Parameters |
|-------|---------|------------|
| `mandate_search_submitted` | Search executed | `mandate_text`, `result_count`, `processing_time_ms` |
| `mandate_example_used` | User clicks example mandate | `example_text` |
| `mandate_result_click` | User clicks result card | `title_id`, `title_name`, `match_score`, `position` |
| `session_searches` | Page leave | `tool: 'mandates'`, `search_count` |

**Files**: `Mandates.tsx`, `MandateExamples.tsx`, `MandateTitleCard.tsx`

---

### 5. Title Discovery Funnel

| Event | Trigger | Parameters |
|-------|---------|------------|
| `title_search` | Vector search executed | `query`, `result_count`, `search_type: 'vector'` |
| `title_detail_view` | Title detail page loaded | `title_id`, `title_name` |
| `title_card_click` | User clicks title card | `title_id`, `title_name`, `source`, `position` |
| `favorite_added` | User saves title | `title_id`, `title_name` |
| `favorite_removed` | User removes title | `title_id`, `title_name` |
| `titles_filter_applied` | Format filter changed | `filter_type: 'format'`, `filter_value` |
| `search_zero_results` | Search returns no results | `query`, `search_type` |
| `session_searches` | Page leave | `tool: 'titles'`, `search_count` |

**Files**: `Titles.tsx`, `TitleDetail.tsx`, `TitleCard.tsx`

---

### 6. Checkout Funnel

| Event | Trigger | Parameters |
|-------|---------|------------|
| `checkout_started` | User initiates checkout | `tier`, `price` |
| `checkout_completed` | Payment successful | `tier`, `price`, `transaction_id` |
| `checkout_cancelled` | User cancels checkout | `tier` |
| `checkout_error` | Payment failed | `tier`, `error_message` |

**Files**: `Plan.tsx`, `Checkout.tsx`, `CheckoutSuccess.tsx`

---

### 7. Trial Funnel

| Event | Trigger | Parameters |
|-------|---------|------------|
| `trial_page_view` | Trial page loaded | - |
| `trial_chat_sent` | Trial chat message sent | `message_length` |
| `trial_comps_search` | Trial comps search | `comp_titles[]`, `result_count` |
| `trial_mandate_search` | Trial mandate search | `mandate_text`, `result_count` |
| `trial_title_click` | Title clicked in trial | `title_id`, `position`, `source` |
| `trial_limit_reached` | User hits trial limit | `feature`, `current_count`, `limit` |
| `trial_signup_clicked` | CTA to signup clicked | `source` |

**Files**: `Trial.tsx`, `TrialChatSection.tsx`, `TrialCompsSection.tsx`, `TrialMandatesSection.tsx`

---

## Session-Level Tracking

Session search counts are tracked per page using `useRef` and fired on component unmount:

```typescript
const searchCountRef = useRef(0);

// Increment on each search
searchCountRef.current += 1;

// Track on page leave
useEffect(() => {
  return () => {
    if (searchCountRef.current > 0) {
      trackSessionSearches('chat', searchCountRef.current);
    }
  };
}, []);
```

**Pages with Session Tracking**:
| Page | Tool ID |
|------|---------|
| Chat | `chat` |
| Comps Navigator | `comps` |
| Mandate Matcher | `mandates` |
| Titles | `titles` |

---

## Utility Functions

All tracking functions are in `src/utils/analytics.ts`:

```typescript
// Core
initializeAnalytics(): void
trackPageView(path: string, title: string): void
trackEvent(eventName: string, params: Record<string, any>): void

// Authentication
trackSignup(method: string, stage: string, error?: string): void
trackSignin(method: string, stage: string, error?: string): void

// Chat
trackChatMessageSent(messageLength: number, sessionId: string): void
trackChatMessageReceived(responseLength: number, latencyMs: number, sessionId: string): void
trackChatMessageSource(source: string, messageLength: number): void
trackChatExampleClicked(exampleText: string): void
trackChatSuggestionClick(suggestionText: string, queryText: string, position: number): void
trackChatTitleClick(titleId: string, titleName: string, position: number): void

// Comps Navigator
trackCompsSearch(compTitles: string[], resultCount: number, processingTimeMs: number): void
trackCompsResultClick(titleId: string, titleName: string, matchScore: number, position: number): void
trackCompsExampleUsed(exampleName: string, compTitles: string[]): void

// Mandate Matcher
trackMandateSearchSubmitted(mandateText: string, resultCount: number, processingTimeMs: number): void
trackMandateExampleUsed(exampleText: string): void
trackMandateResultClick(titleId: string, titleName: string, matchScore: number, position: number): void

// Title Discovery
trackTitleSearch(query: string, resultCount: number, searchType: string): void
trackTitleCardClick(titleId: string, titleName: string, source: string, position: number): void
trackTitlesFilterApplied(filterType: string, filterValue: string | null): void
trackSearchZeroResults(query: string, searchType: string): void

// Session
trackSessionSearches(tool: string, searchCount: number): void

// Feature Usage
trackFeatureUsage(feature: string): void
```

---

## Testing

Enable debug logging:

```bash
# In .env.local
VITE_AUTH_DEBUG=true
```

Console will show `[Analytics]` prefixed logs for all events:
```
[Analytics] Event: chat_message_source { source: 'example', message_length: 45 }
[Analytics] Event: session_searches { tool: 'chat', search_count: 3 }
```

---

## GA4 Custom Dimensions

Consider registering these custom dimensions in GA4 for advanced analysis:

| Dimension | Scope | Description |
|-----------|-------|-------------|
| `message_source` | Event | Chat input source (typed/example/suggestion) |
| `session_search_count` | Session | Number of searches per session |
| `tool_type` | Event | Which tool was used (chat/comps/mandates/titles) |
| `match_score` | Event | AI match score for search results |

---

## Changelog

### 2025-12-19
- Added `chat_message_source` for input source tracking
- Added `chat_example_clicked` for example prompt tracking
- Added `comps_example_used` for example usage tracking
- Added `comps_result_click` for result card tracking
- Added `titles_filter_applied` for format filter tracking
- Added `session_searches` for session-level tracking across all search pages
- Enhanced `chat_suggestion_click` with query_text parameter

### Previous
- Initial GA4 implementation with 5 user funnels
- Core tracking for auth, chat, comps, titles, checkout
