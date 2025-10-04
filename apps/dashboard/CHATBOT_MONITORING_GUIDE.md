# Chatbot Monitoring Guide

**Last Updated**: 2025-10-04
**Status**: Active Monitoring
**Purpose**: Track performance and quality of Phase 1 & 2 chatbot improvements

---

## Executive Summary

This guide provides monitoring procedures, metrics to track, and alerting thresholds for the AI chatbot system after deploying Phase 1 & 2 improvements.

**Key Monitoring Areas:**
1. Edge Function Performance
2. Search Quality & Coverage
3. Anti-Hallucination Effectiveness
4. User Engagement Metrics
5. Error Rates & System Health

---

## 1. Edge Function Logs Monitoring

### Access Logs
**URL**: https://supabase.com/dashboard/project/dlrnrgcoguxlkkcitlpd/functions
1. Navigate to Supabase Dashboard → Functions
2. Click on `chat-orchestrator` function
3. View real-time logs tab

### Critical Log Patterns to Monitor

#### ✅ Healthy Patterns

**Vector Search Success:**
```
🔍 Vector Search Configuration: { matchCount: 10, matchThreshold: 0.7 }
✅ Vector Search Results: { resultCount: 8-10, topScores: [ "0.8+", ... ] }
```
**Target**: resultCount ≥ 8, topScores > 0.75

**Intent Classification:**
```
🎯 Query Intent Classified: { intent: "discovery|comparison|information|recommendation|follow-up" }
```
**Target**: Intent detected for 100% of queries

**Title Recommendations:**
```
✅ Recommendations saved successfully: 10
📋 Saving title recommendations { count: 10, titles: [...] }
```
**Target**: 10 recommendations per query

**Response Persistence:**
```
💾 Saving response to database { searchResultsCount: 10, responseLength: 1500-2500 }
```
**Target**: Response length 1500-2500 chars

#### ⚠️ Warning Patterns (Expected Occasionally)

**Hallucination Detection:**
```
⚠️ Title hallucinations detected: { count: X, hallucinated: [...] }
🚨 Hallucinations replaced in response: [...]
```
**Target**: <5% of responses
**Action if >10%**: Review AI prompt tuning

**Fallback Search Trigger:**
```
⚠️ Vector search returned no results, trying fallback keyword search...
✅ Fallback keyword search successful: X results
```
**Target**: <5% of queries
**Action if >15%**: Review vector embedding quality

#### 🚨 Error Patterns (Require Immediate Action)

**Search Failures:**
```
❌ Vector search failed: [error message]
❌ Fallback keyword search failed: [error message]
```
**Action**: Check database connectivity, verify embeddings exist

**API Failures:**
```
❌ OpenAI API error: [error message]
```
**Action**: Verify API key, check OpenAI status, review rate limits

**Database Errors:**
```
❌ Failed to save response: [error message]
❌ Failed to save recommendations: [error message]
```
**Action**: Check database connection, verify RLS policies

---

## 2. Performance Metrics

### Response Time Monitoring

**Target Benchmarks:**
- **Total Response Time**: 2-4 seconds (P95: <5 seconds)
- **Vector Search**: <1 second
- **AI Generation**: 1-3 seconds
- **Database Save**: <500ms

**Monitoring Method:**
Look for `🔧 DEBUG: OpenAI API response` logs with timing data

**Alert Thresholds:**
- ⚠️ Warning: P95 > 5 seconds (investigate)
- 🚨 Critical: P95 > 10 seconds (immediate action)

### Search Quality Metrics

**Vector Search Coverage:**
- **Baseline**: 5 results per query
- **Current**: 10 results per query
- **Target**: resultCount ≥ 8 for 90% of queries

**Search Relevance:**
- **Similarity Scores**: Target >0.75 for top 3 results
- **Top Score**: Target >0.8 for #1 result

**Monitoring Method:**
```
✅ Vector Search Results: { resultCount: X, topScores: [ "0.XXX", ... ] }
```

### Fallback Search Rate

**Target**: <5% of queries trigger fallback
**Alert**: >15% indicates vector search quality issues

**Calculation:**
```
Fallback Rate = (Queries with "fallback keyword search" log) / (Total queries) × 100%
```

---

## 3. Quality Assurance Metrics

### Anti-Hallucination Rate

**Target**: <5% of responses contain hallucinations
**Acceptable**: 5-10% (monitor closely)
**Action Required**: >10% (review AI prompts)

**Monitoring Method:**
```
⚠️ Title hallucinations detected: { count: X, hallucinated: [...] }
```

**Calculation:**
```
Hallucination Rate = (Responses with hallucination warnings) / (Total responses) × 100%
```

**Weekly Review:**
1. Count total hallucination warnings
2. Review most common hallucinated titles
3. Check if patterns indicate prompt issues or data gaps

### Intent Classification Accuracy

**Target**: 100% of queries classified
**Monitoring Method**: Verify all queries have `🎯 Query Intent Classified` log

**Intent Distribution (Expected):**
- Discovery: 30-40%
- Comparison: 10-15%
- Information: 20-30%
- Recommendation: 20-30%
- Follow-up: 10-20%

**Alert**: If one intent dominates >60%, review classification logic

### Title Recommendation Coverage

**Target**: 10 titles recommended per query
**Acceptable**: 8-10 titles
**Action Required**: <5 titles frequently

**Monitoring Method:**
```
📋 Saving title recommendations { count: X, titles: [...] }
```

---

## 4. User Engagement Metrics

### Chat Session Metrics

**Track via Database:**
```sql
-- Daily active users
SELECT COUNT(DISTINCT user_id)
FROM chat_sessions
WHERE created_at >= NOW() - INTERVAL '1 day';

-- Average messages per session
SELECT AVG(message_count)
FROM (
  SELECT session_id, COUNT(*) as message_count
  FROM chat_messages
  GROUP BY session_id
) subquery;

-- Session duration (approx via message timestamps)
SELECT session_id,
  MAX(created_at) - MIN(created_at) as duration
FROM chat_messages
GROUP BY session_id;
```

**Target Metrics:**
- **Daily Active Users**: Track trend (aim for growth)
- **Messages per Session**: 3-5 (healthy engagement)
- **Session Duration**: 2-5 minutes average

### Saved Title Interactions

**Track Conversions:**
```sql
-- Titles recommended vs saved
SELECT COUNT(DISTINCT title_id) as recommended_titles
FROM chat_recommendations
WHERE created_at >= NOW() - INTERVAL '1 day';

-- Compare with favorites (titles actually saved)
SELECT COUNT(*) as saved_after_recommendation
FROM user_favorites uf
JOIN chat_recommendations cr ON uf.title_id = cr.title_id
WHERE cr.created_at >= NOW() - INTERVAL '1 day'
AND uf.created_at > cr.created_at;
```

**Target**: 15-25% of recommended titles get saved

### "No Results" Rate

**Target**: <2% of queries (down from 15% baseline)
**Monitoring**: Track queries with no recommendations saved

---

## 5. Error Monitoring & Alerting

### Critical Errors (Immediate Action)

1. **Database Connection Failures**
   - **Pattern**: Multiple `❌ Failed to save` errors
   - **Action**: Check Supabase status, verify RLS policies

2. **OpenAI API Failures**
   - **Pattern**: `❌ OpenAI API error`
   - **Action**: Verify API key, check rate limits, review OpenAI status

3. **Edge Function Crashes**
   - **Pattern**: No logs for >5 minutes during active hours
   - **Action**: Check Supabase edge function status, review deployment

### Warning-Level Issues (Monitor & Plan Fix)

1. **High Hallucination Rate**
   - **Threshold**: >10% of responses
   - **Action**: Review AI prompt engineering, add more validation rules

2. **High Fallback Search Rate**
   - **Threshold**: >15% of queries
   - **Action**: Review vector embedding quality, retrain if needed

3. **Slow Response Times**
   - **Threshold**: P95 > 5 seconds
   - **Action**: Investigate bottlenecks, consider caching

---

## 6. Weekly Review Checklist

### Performance Review (Every Monday)
- [ ] Calculate average response time (target: <4 seconds)
- [ ] Review P95 response time (target: <5 seconds)
- [ ] Check vector search coverage (target: ≥8 results, 90% of queries)
- [ ] Verify fallback search rate (target: <5%)

### Quality Review (Every Wednesday)
- [ ] Calculate hallucination rate (target: <5%)
- [ ] Review most common hallucinated titles
- [ ] Check intent classification distribution
- [ ] Verify 10 recommendations per query (target: 90% of queries)

### Engagement Review (Every Friday)
- [ ] Track daily active users (trend analysis)
- [ ] Calculate messages per session (target: 3-5)
- [ ] Review title recommendation → save conversion (target: 15-25%)
- [ ] Analyze "no results" rate (target: <2%)

### Error Review (Daily)
- [ ] Check for critical errors in edge function logs
- [ ] Review any API failures or database issues
- [ ] Verify edge function uptime (target: 99.9%)

---

## 7. Alerting Setup Recommendations

### Supabase Alerts (if available)
1. **Edge Function Errors**: Alert if >10 errors in 1 hour
2. **Response Time**: Alert if P95 > 10 seconds
3. **Database Failures**: Alert on any save errors

### Manual Monitoring Schedule
- **Daily**: Quick log scan (5 minutes)
  - Any 🚨 critical errors?
  - Response times normal?
  - Hallucination rate acceptable?

- **Weekly**: Detailed review (30 minutes)
  - Run performance metrics queries
  - Review quality metrics
  - Analyze user engagement trends

---

## 8. Escalation Procedures

### Issue Severity Levels

**🚨 P0 - Critical (Immediate Action)**
- Edge function completely down
- Database save failures (>90% failure rate)
- OpenAI API completely unavailable
- **Response Time**: <1 hour
- **Action**: Roll back deployment, investigate root cause

**⚠️ P1 - High (Action within 24 hours)**
- Hallucination rate >20%
- Response time P95 >10 seconds
- Fallback search rate >30%
- **Response Time**: <24 hours
- **Action**: Investigate and implement fix

**📝 P2 - Medium (Action within 1 week)**
- Hallucination rate 10-20%
- Response time P95 5-10 seconds
- Fallback search rate 15-30%
- **Response Time**: <1 week
- **Action**: Plan improvement, test, deploy

**ℹ️ P3 - Low (Monitor & Plan)**
- Minor quality degradation
- Engagement metrics trending down
- **Response Time**: <1 month
- **Action**: Include in next improvement cycle

---

## 9. Success Metrics Summary

### Baseline (Before Improvements)
| Metric | Value |
|--------|-------|
| Search Results | 5 max |
| Hallucination Rate | 20-30% |
| Title Link Success | ~60% |
| No Results Rate | ~15% |
| Intent Awareness | None |
| Context Memory | Generic |

### Current Targets (After Phase 1 & 2)
| Metric | Target | Acceptable | Action Required |
|--------|--------|------------|-----------------|
| Search Results | 10 (100%) | 8-10 (80%) | <5 (50%) |
| Hallucination Rate | <5% | 5-10% | >10% |
| Response Time (P95) | <4s | 4-5s | >5s |
| Fallback Search Rate | <5% | 5-15% | >15% |
| No Results Rate | <2% | 2-5% | >5% |
| Intent Classification | 100% | 95-100% | <95% |
| Recommendations/Query | 10 | 8-10 | <8 |

---

## 10. Dashboard Queries (for Metrics)

### Daily Performance Summary
```sql
-- Daily chatbot usage
SELECT
  DATE(created_at) as date,
  COUNT(DISTINCT session_id) as total_sessions,
  COUNT(*) as total_messages,
  COUNT(*) / COUNT(DISTINCT session_id)::float as avg_messages_per_session
FROM chat_messages
WHERE created_at >= NOW() - INTERVAL '7 days'
GROUP BY DATE(created_at)
ORDER BY date DESC;
```

### Recommendation Quality
```sql
-- Titles recommended in last 7 days
SELECT
  COUNT(DISTINCT message_id) as recommendation_events,
  COUNT(DISTINCT title_id) as unique_titles_recommended,
  AVG(array_length(titles, 1)) as avg_titles_per_recommendation
FROM chat_recommendations
WHERE created_at >= NOW() - INTERVAL '7 days';
```

### User Engagement Funnel
```sql
-- Chat → Recommendation → Save funnel
WITH chat_users AS (
  SELECT DISTINCT user_id
  FROM chat_sessions
  WHERE created_at >= NOW() - INTERVAL '7 days'
),
recommended_users AS (
  SELECT DISTINCT user_id
  FROM chat_recommendations
  WHERE created_at >= NOW() - INTERVAL '7 days'
),
saved_users AS (
  SELECT DISTINCT user_id
  FROM user_favorites
  WHERE created_at >= NOW() - INTERVAL '7 days'
)
SELECT
  (SELECT COUNT(*) FROM chat_users) as chat_users,
  (SELECT COUNT(*) FROM recommended_users) as got_recommendations,
  (SELECT COUNT(*) FROM saved_users) as saved_titles,
  (SELECT COUNT(*) FROM saved_users)::float / (SELECT COUNT(*) FROM chat_users) * 100 as conversion_rate_pct;
```

---

## 11. Next Steps & Improvement Planning

### Monitor for 2 Weeks (2025-10-04 to 2025-10-18)
1. Gather baseline metrics post-deployment
2. Identify any unexpected issues
3. Collect user feedback
4. Analyze actual vs expected performance

### Decision Points (After 2 Weeks)
- **If all metrics green**: Plan Phase 3 (Advanced Features)
- **If quality issues**: Tune existing improvements
- **If performance issues**: Optimize infrastructure

### Phase 3 Planning Triggers
- ✅ Hallucination rate <5% sustained
- ✅ Response time P95 <4 seconds
- ✅ No critical errors for 2 weeks
- ✅ Positive user feedback trend

---

## Contact & Escalation

**For Issues:**
1. Check this monitoring guide first
2. Review edge function logs (link above)
3. Check CHATBOT_TEST_RESULTS.md for expected behavior
4. Review TESTING_GUIDE.md for troubleshooting

**Key Resources:**
- Edge Function Logs: https://supabase.com/dashboard/project/dlrnrgcoguxlkkcitlpd/functions
- Test Results: `/apps/dashboard/CHATBOT_TEST_RESULTS.md`
- Testing Guide: `/apps/dashboard/TESTING_GUIDE.md`
- Architecture Docs: `/apps/dashboard/public/docs/AI_CHATBOT_DOCUMENTATION.md`

---

**Last Review Date**: ___________
**Next Review Date**: ___________
**Reviewed By**: ___________
**Status**: ☐ All Green ☐ Needs Attention ☐ Action Required
