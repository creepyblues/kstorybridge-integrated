# Comps Navigator - Testing Guide

**Last Updated**: 2025-11-20
**Status**: Ready for Testing
**Version**: 1.0 MVP

---

## Testing Overview

This guide provides comprehensive testing procedures for the Comps Navigator feature. Follow these steps to validate functionality, performance, and user experience.

---

## Pre-Testing Checklist

### ✅ Environment Setup

**Development** (http://localhost:8082):
- [ ] Dev server running
- [ ] Signed in as buyer account
- [ ] Browser console open (F12)
- [ ] Network tab monitoring

**Staging** (dashboard-staging.kstorybridge.com):
- [ ] Deployed to staging
- [ ] Edge function deployed
- [ ] Database migration applied
- [ ] Test buyer account created

**Production** (dashboard.kstorybridge.com):
- [ ] Final deployment after staging tests pass
- [ ] Monitor logs in real-time
- [ ] Have rollback plan ready

### ✅ Dependencies Verified

- [ ] Edge function `comp-navigator` deployed
- [ ] Database tables created (`comp_searches`, `comp_title_cache`)
- [ ] RLS policies active
- [ ] OpenAI API key configured
- [ ] Supabase service role key configured

---

## Test Suite 1: Basic Functionality

### Test 1.1: Page Load

**Steps**:
1. Navigate to `/buyers/comps-navigator`
2. Observe page load

**Expected**:
- ✅ Page loads without errors
- ✅ "Comps Navigator" header visible
- ✅ Comp input fields displayed
- ✅ Example searches shown
- ✅ Sidebar visible (recent/bookmarked searches)

**Pass Criteria**: All elements render correctly

---

### Test 1.2: Single Comp Search

**Steps**:
1. Enter "Squid Game" in first comp field
2. Click "Add" button
3. Verify comp chip appears
4. Click "Find Matches" button

**Expected**:
- ✅ "Squid Game" chip displays
- ✅ Loading indicator shows
- ✅ Phase 1 message: "Finding semantic matches..."
- ✅ Phase 2 message: "Re-ranking with AI..."
- ✅ Results appear in 5-6 seconds
- ✅ 10-15 title cards displayed
- ✅ Match scores visible (0-100%)
- ✅ Search info shows (time, cost)

**Pass Criteria**: Search completes successfully with results

---

### Test 1.3: Multiple Comp Search

**Steps**:
1. Clear previous search
2. Add "Squid Game"
3. Add "Parasite"
4. Add "Black Mirror"
5. Click "Find Matches"

**Expected**:
- ✅ All 3 chips display
- ✅ "Add" button disabled after 3 comps
- ✅ Search executes successfully
- ✅ Results reflect combination of all 3 comps

**Pass Criteria**: Multi-comp search works correctly

---

### Test 1.4: Refinement Text

**Steps**:
1. Clear search
2. Add "Squid Game" + "Parasite"
3. Add refinement: "more comedic tone, female lead"
4. Click "Find Matches"

**Expected**:
- ✅ Refinement text accepted (max 500 chars)
- ✅ Character counter updates
- ✅ Search incorporates refinement
- ✅ Results differ from search without refinement

**Pass Criteria**: Refinement affects search results

---

### Test 1.5: View Match Details

**Steps**:
1. Complete a search
2. Click any title card
3. Observe modal

**Expected**:
- ✅ Modal opens with full details
- ✅ Overall match score displayed
- ✅ Synopsis visible
- ✅ Full explanation shown
- ✅ Individual comp alignments with scores
- ✅ Reasons listed for each comp
- ✅ "View Full Title Details" button works
- ✅ "Close" button works

**Pass Criteria**: Modal displays correctly with all information

---

## Test Suite 2: Save & Bookmark Functionality

### Test 2.1: Auto-Save Search

**Steps**:
1. Execute a search
2. Check sidebar "Recent Searches"

**Expected**:
- ✅ Search appears in sidebar
- ✅ Shows comp titles
- ✅ Shows refinement text (if any)
- ✅ Shows result count
- ✅ Shows avg match score

**Pass Criteria**: Search auto-saved to history

---

### Test 2.2: Bookmark Search

**Steps**:
1. Find search in "Recent Searches"
2. Click ⭐ star icon
3. Enter name: "Test Bookmark"
4. Confirm

**Expected**:
- ✅ Prompt appears for name
- ✅ Search moves to "Bookmarked Searches"
- ✅ Star icon filled
- ✅ Custom name displayed

**Pass Criteria**: Bookmark created successfully

---

### Test 2.3: Load Saved Search

**Steps**:
1. Click on a bookmarked search
2. Observe form

**Expected**:
- ✅ Comp fields populate with saved comps
- ✅ Refinement text restored (if any)
- ✅ Cached results display (if available)
- ✅ Can run search again with same params

**Pass Criteria**: Saved search loads correctly

---

### Test 2.4: Delete Search

**Steps**:
1. Hover over any search in sidebar
2. Click 🗑️ trash icon
3. Confirm deletion

**Expected**:
- ✅ Trash icon appears on hover
- ✅ Search removed from list
- ✅ Database record deleted
- ✅ Toast confirmation shown

**Pass Criteria**: Search deleted successfully

---

## Test Suite 3: Edge Cases & Error Handling

### Test 3.1: No Comps Entered

**Steps**:
1. Click "Find Matches" with no comps

**Expected**:
- ✅ Error toast: "No Comps Selected"
- ✅ Search does not execute
- ✅ User prompted to add comps

**Pass Criteria**: Validation prevents empty search

---

### Test 3.2: Duplicate Comps

**Steps**:
1. Add "Squid Game"
2. Try to add "Squid Game" again

**Expected**:
- ✅ Duplicate not added
- ✅ Input field clears
- ✅ No error shown (silent handling)

**Pass Criteria**: Duplicates prevented gracefully

---

### Test 3.3: Max Comps Exceeded

**Steps**:
1. Add 3 comps
2. Observe UI

**Expected**:
- ✅ "Add" button disabled
- ✅ Input field disabled or hidden
- ✅ Message: "Maximum 3 comps selected"

**Pass Criteria**: Cannot add more than 3 comps

---

### Test 3.4: Refinement Character Limit

**Steps**:
1. Type 500+ characters in refinement field

**Expected**:
- ✅ Text stops at 500 characters
- ✅ Character counter shows "0 characters remaining"
- ✅ Counter turns red when near limit

**Pass Criteria**: Character limit enforced

---

### Test 3.5: No Results Found

**Steps**:
1. Enter very obscure or mismatched comps
2. Execute search

**Expected**:
- ✅ Search completes without error
- ✅ Empty state shown
- ✅ Message: "No matches found" or similar
- ✅ Suggestion to try different comps

**Pass Criteria**: No results handled gracefully

---

### Test 3.6: Network Timeout

**Steps**:
1. Throttle network to "Slow 3G" (Chrome DevTools)
2. Execute search
3. Wait for timeout

**Expected**:
- ✅ Loading indicator shows
- ✅ Timeout after ~10 seconds
- ✅ Error toast displayed
- ✅ User can retry

**Pass Criteria**: Timeout handled without crash

---

### Test 3.7: Unauthenticated User

**Steps**:
1. Sign out
2. Try to access `/buyers/comps-navigator`

**Expected**:
- ✅ Redirected to sign in page
- ✅ After sign in, returns to comps navigator

**Pass Criteria**: Protected route works correctly

---

## Test Suite 4: Performance & Quality

### Test 4.1: Response Time

**Test 20 searches, record times**:

**Target**: <8 seconds (P95), ~5-6 seconds (average)

**Comps to Test**:
1. Squid Game
2. Squid Game + Parasite
3. Squid Game + Parasite + Black Mirror
4. Stranger Things + Dark
5. Money Heist + Breaking Bad
6. Game of Thrones + Vikings
7. Black Mirror (single)
8. Parasite + Joker
9. Succession + Ozark
10. The Handmaid's Tale + Black Mirror

**Record**:
- Phase 1 time
- Phase 2 time
- Total time
- Result count

**Pass Criteria**: 90%+ of searches complete in <8 seconds

---

### Test 4.2: Match Quality

**Manual Evaluation**:

For each of 10 test searches, review top 5 results:
- Rate each as: Excellent (2) / Good (1) / Poor (0)
- Calculate average score

**Target**: Average ≥ 1.5 (75% good/excellent matches)

**Example Evaluation**:
```
Search: Squid Game + Parasite + Black Mirror

Result 1 (Sweet Home):
- Match Score: 87%
- Manual Rating: Excellent (2)
- Notes: Strong alignment on survival themes, class commentary

Result 2 (Hellbound):
- Match Score: 82%
- Manual Rating: Good (1)
- Notes: Matches dark tone, but less comedic

... continue for top 5 ...

Average: (2+1+2+1+1)/5 = 1.4 (Good)
```

**Pass Criteria**: Overall average ≥ 1.5 across all test searches

---

### Test 4.3: Cost Tracking

**Verify cost calculations**:

1. Execute 10 searches
2. Check search info for each
3. Calculate total cost

**Expected**:
- Cost per search: $0.015-0.020
- Total for 10 searches: $0.15-0.20

**Verify in Database**:
```sql
SELECT COUNT(*) as total_searches
FROM comp_searches
WHERE created_at > NOW() - INTERVAL '1 hour';

-- Expected: 10
-- Estimated cost: 10 × $0.015 = $0.15
```

**Pass Criteria**: Cost tracking accurate within 10%

---

### Test 4.4: Cache Hit Rate

**Repeat searches with same comps**:

1. Search "Squid Game" (first time)
2. Note: "Cache miss" in edge function logs
3. Search "Squid Game" again (same session)
4. Note: "Cache hit" in logs

**Expected**:
- First search: Generates embedding
- Second search: Uses cached embedding
- Cache hit reduces Phase 1 time by ~20%

**Pass Criteria**: Caching works for repeated comps

---

## Test Suite 5: Database & RLS

### Test 5.1: RLS Policies

**Test user isolation**:

1. Sign in as User A
2. Create bookmarked search
3. Sign out
4. Sign in as User B
5. Check sidebar

**Expected**:
- ✅ User B sees NO searches from User A
- ✅ User B can only see their own searches
- ✅ Database enforces row-level security

**Pass Criteria**: RLS policies prevent data leakage

---

### Test 5.2: Database Writes

**Verify all fields saved**:

1. Execute search with:
   - 3 comps
   - Refinement text
   - 12 results
   - Avg match score: 78.5%

2. Check database:
```sql
SELECT *
FROM comp_searches
ORDER BY created_at DESC
LIMIT 1;
```

**Expected**:
- `comp_titles`: ["Squid Game", "Parasite", "Black Mirror"]
- `refinement_text`: "more comedic, female lead"
- `result_count`: 12
- `avg_match_score`: 78.5
- `search_results`: Full JSON array of results
- `is_bookmarked`: false
- `user_email`: test@example.com

**Pass Criteria**: All fields populated correctly

---

## Test Suite 6: UI/UX

### Test 6.1: Responsive Design

**Test on multiple screen sizes**:

- [ ] Desktop (1920×1080)
- [ ] Laptop (1366×768)
- [ ] Tablet (768×1024)
- [ ] Mobile (375×667)

**Expected**:
- ✅ Layout adapts gracefully
- ✅ No horizontal scrolling
- ✅ All buttons accessible
- ✅ Sidebar collapses on mobile
- ✅ Cards stack vertically on mobile

**Pass Criteria**: Usable on all screen sizes

---

### Test 6.2: Loading States

**Verify all loading indicators**:

- [ ] Page load spinner
- [ ] Search button shows "Searching..."
- [ ] Phase 1 message appears
- [ ] Phase 2 message appears
- [ ] Results grid shows loading skeleton
- [ ] Sidebar shows loading when fetching

**Pass Criteria**: User always knows what's happening

---

### Test 6.3: Empty States

**Test all empty states**:

- [ ] No searches yet (new user)
- [ ] No bookmarked searches
- [ ] No results from search
- [ ] Deleted all searches

**Expected**:
- ✅ Clear messaging
- ✅ Helpful suggestions
- ✅ No confusing blank screens

**Pass Criteria**: All empty states handled gracefully

---

## Test Suite 7: Integration Testing

### Test 7.1: End-to-End Flow

**Complete user journey**:

1. New user signs in
2. Navigates to Comps Navigator
3. Sees example searches
4. Clicks example: "Squid Game + Parasite + Black Mirror"
5. Adds refinement: "female lead"
6. Clicks "Find Matches"
7. Reviews results
8. Clicks top result
9. Views match details
10. Clicks "View Full Title Details"
11. Returns to comps navigator
12. Bookmarks the search
13. Runs another search
14. Loads bookmarked search
15. Signs out

**Expected**:
- ✅ Every step works smoothly
- ✅ No errors or confusion
- ✅ Data persists correctly
- ✅ Navigation works as expected

**Pass Criteria**: Complete flow works end-to-end

---

### Test 7.2: Edge Function Logs

**Monitor Supabase logs during search**:

**Expected Log Sequence**:
```
[COMPS] Search started { comp_titles: [...], has_refinement: true, user_email: ... }
[COMPS] Cache hit for "Squid Game"
[COMPS] Cache miss for "Parasite", generating embedding
[COMPS] Phase 1 complete { candidates_found: 30, duration_ms: 2134 }
[COMPS] Phase 2 complete { results_count: 15, duration_ms: 2876 }
[COMPS] Search complete { total_duration_ms: 5234, cost_estimate: 0.015, results_count: 15 }
```

**Pass Criteria**: Logs show expected flow without errors

---

## Regression Testing

### Before Each Release

Run this abbreviated test suite:

1. **Smoke Tests** (5 min):
   - [ ] Load page
   - [ ] Execute 1 search
   - [ ] View detail modal
   - [ ] Bookmark search

2. **Critical Path** (10 min):
   - [ ] Single comp search
   - [ ] Multi comp search
   - [ ] Search with refinement
   - [ ] Load saved search

3. **Error Handling** (5 min):
   - [ ] No comps validation
   - [ ] Network timeout
   - [ ] No results

**Total Time**: ~20 minutes

**Pass Criteria**: All tests pass, no regressions

---

## Performance Benchmarks

### Baseline Metrics (Established from testing)

| Metric | Target | Current |
|--------|--------|---------|
| Page Load Time | <2s | TBD |
| Search Response (P95) | <8s | TBD |
| Search Response (Avg) | 5-6s | TBD |
| Match Quality | >75% | TBD |
| Cache Hit Rate | >60% | TBD |
| Cost per Search | <$0.02 | ~$0.015 |
| Error Rate | <5% | TBD |

**Update after initial testing**

---

## Bug Reporting Template

When reporting issues, use this format:

```markdown
## Bug Report

**Title**: [Brief description]

**Severity**: Critical / High / Medium / Low

**Environment**: Dev / Staging / Production

**Steps to Reproduce**:
1. Step 1
2. Step 2
3. Step 3

**Expected Behavior**:
[What should happen]

**Actual Behavior**:
[What actually happens]

**Screenshots**:
[If applicable]

**Browser Console Logs**:
```
[Paste relevant errors]
```

**Edge Function Logs**:
```
[From Supabase dashboard]
```

**Additional Context**:
[Any other relevant information]
```

---

## Test Sign-Off

### Test Completion Checklist

Before marking as "READY FOR PRODUCTION":

- [ ] All basic functionality tests passed
- [ ] All save/bookmark tests passed
- [ ] All edge case tests passed
- [ ] Performance targets met
- [ ] Match quality validated
- [ ] Database/RLS verified
- [ ] UI/UX reviewed
- [ ] Integration tests passed
- [ ] Regression tests passed
- [ ] Edge function logs reviewed
- [ ] User documentation complete
- [ ] Analytics dashboard functional

**Signed Off By**: _______________
**Date**: _______________
**Notes**: _______________

---

## Continuous Monitoring (Post-Launch)

### Week 1 Monitoring

**Daily Checks**:
- [ ] Error rate in Supabase logs
- [ ] Average response times
- [ ] User adoption (unique users)
- [ ] Search volume
- [ ] Cost tracking

**Alert Thresholds**:
- Error rate >10%: Investigate immediately
- Response time P95 >10s: Performance issue
- Cost >$50/day: Usage spike or cost leak
- Zero searches for 24h: Feature hidden?

### Monthly Review

- [ ] Review analytics dashboard
- [ ] Check match quality feedback
- [ ] Review bookmark rate
- [ ] Analyze top comps used
- [ ] Review cost efficiency
- [ ] Plan improvements

---

**End of Testing Guide**

**Status**: ✅ Ready for Testing
**Version**: 1.0
**Last Updated**: 2025-11-20
