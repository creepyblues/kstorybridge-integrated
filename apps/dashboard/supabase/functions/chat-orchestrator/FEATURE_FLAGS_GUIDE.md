# Chat Orchestrator Feature Flags Guide

**Version**: Phase 1 - Foundation
**Last Updated**: 2025-10-14
**Purpose**: Safe deployment of chatbot sample dialogue improvements

---

## 📋 Overview

This guide documents the feature flag system for deploying chatbot improvements based on `CHATBOT_SAMPLE_DIALOGUES.md` with zero production risk.

### **Why Feature Flags?**

- ✅ **Zero Downtime**: Deploy code without changing behavior
- ✅ **Gradual Rollout**: Enable for 10% → 50% → 100% of users
- ✅ **Instant Rollback**: Revert to previous behavior in <5 minutes
- ✅ **A/B Testing**: Compare metrics between flag ON/OFF
- ✅ **Safe Experimentation**: Test in production without risk

---

## 🚩 Available Feature Flags

### **1. `ENABLE_NEW_PERSONALITY`** (Phase 2)
**Status**: 🟡 Ready to deploy (not yet active)
**Risk**: LOW (with flag)
**Controls**: System prompt conversational style

**What Changes:**
- More enthusiastic "story nerd" personality
- Natural language patterns ("Let me tell you why...")
- Preserves anti-hallucination enforcement
- Maintains all existing safeguards

**Files Modified:**
- `chat-orchestrator/index.ts` lines 209-258 (system prompt)

**Testing Checklist:**
- [ ] Unit tests pass (chat-orchestrator.test.ts)
- [ ] Integration tests pass (integration.test.ts)
- [ ] No hallucinations detected
- [ ] Response time < 4s
- [ ] User engagement improves by 10%+

**Rollback Impact**: Reverts to formal system prompt

---

### **2. `ENABLE_EXPLORATION_MODE`** (Phase 3)
**Status**: 🔴 Not ready (requires Phase 2 completion)
**Risk**: MEDIUM (changes UX flow)
**Controls**: Fresh conversation detection

**What Changes:**
- Asks 2-3 clarifying questions before recommending titles
- Only for broad queries ("show me titles", "korean webtoon")
- Specific queries still get immediate recommendations
- Improves recommendation quality by understanding preferences first

**Testing Checklist:**
- [ ] Broad queries trigger questions
- [ ] Specific queries still recommend immediately
- [ ] Follow-up queries maintain context
- [ ] User satisfaction scores improve
- [ ] Conversation length increases by 20%+

**Rollback Impact**: Reverts to immediate title recommendations

---

### **3. `ENABLE_CONDITIONAL_INFO`** (Phase 4)
**Status**: 🔴 Not ready (requires Phase 3 completion)
**Risk**: LOW (only affects information queries)
**Controls**: "Tell me about X" response structure

**What Changes:**
- Hides empty sections (no "Not specified" placeholders)
- Shows synopsis only if exists
- Shows genre/tone only if data available
- Cleaner, more professional responses

**Testing Checklist:**
- [ ] Empty sections hidden correctly
- [ ] Title detail link always appears
- [ ] No data loss
- [ ] User finds responses more readable

**Rollback Impact**: Reverts to showing all sections (including empty)

---

## 🚀 Deployment Strategy

### **Phase 1: Foundation** (Current - Week 1)
**Status**: ✅ Complete
**Changes**: Feature flags added, all OFF
**Risk**: ZERO
**Actions**:
```bash
# Deploy to Supabase (flags OFF by default)
cd apps/dashboard/supabase/functions/chat-orchestrator
npx supabase functions deploy chat-orchestrator

# Verify deployment
npx supabase functions list
```

**Verification**:
- [ ] Edge function deploys successfully
- [ ] All flags show as `false` in logs
- [ ] Production behavior unchanged
- [ ] No errors in edge function logs

---

### **Phase 2: System Prompt Enhancement** (Week 2)
**Prerequisites**: Phase 1 complete, all tests passing
**Flag**: `ENABLE_NEW_PERSONALITY`
**Risk**: LOW

**Deployment Steps**:

1. **Deploy Code** (flag OFF):
```bash
# Deploy edge function with new personality code but flag OFF
npx supabase functions deploy chat-orchestrator
```

2. **Enable for 10% of Users**:
```bash
# In Supabase Dashboard > Edge Functions > Secrets
# Set: ENABLE_NEW_PERSONALITY = true
# (Apply to 10% traffic using edge function routing - TBD)
```

3. **Monitor Metrics** (24 hours):
   - Error rate < 5%
   - Hallucination rate < 5%
   - Response time < 4s
   - User engagement improved

4. **Scale to 50%** (if metrics good):
   - Enable for 50% of users
   - Monitor for 48 hours

5. **Full Rollout** (if metrics still good):
   - Enable for 100% of users
   - Monitor for 1 week

**Success Criteria**:
- Zero increase in error rate
- No hallucinations detected
- Response time stable or improved
- User engagement +10% or better

---

### **Phase 3: Exploration Mode** (Week 3)
**Prerequisites**: Phase 2 deployed and stable
**Flag**: `ENABLE_EXPLORATION_MODE`
**Risk**: MEDIUM

**Deployment Steps**:
Same as Phase 2, but more cautious:
- Start with 5% of users
- Monitor conversation length, satisfaction
- Scale slower: 5% → 10% → 25% → 50% → 100%

**Success Criteria**:
- Conversation length increases by 20%+
- User satisfaction improves
- No increase in abandonment rate
- Title click-through rate improves

---

### **Phase 4: Conditional Info** (Week 4)
**Prerequisites**: Phase 3 deployed and stable
**Flag**: `ENABLE_CONDITIONAL_INFO`
**Risk**: LOW

**Deployment Steps**:
Standard rollout:
- Deploy with flag OFF
- Enable for 10% → 50% → 100%
- Monitor for data quality improvements

---

## 🔄 Rollback Procedures

### **Immediate Rollback** (<5 minutes)
**When to Use**: Error rate spikes, hallucinations detected, critical bug

**Steps**:
1. **Open Supabase Dashboard**
2. **Navigate to**: Project > Edge Functions > `chat-orchestrator` > Secrets
3. **Set Flag to `false`**:
   ```
   ENABLE_NEW_PERSONALITY = false
   ENABLE_EXPLORATION_MODE = false
   ENABLE_CONDITIONAL_INFO = false
   ```
4. **Save** (changes apply instantly)
5. **Verify**: Check edge function logs for flag status

**Expected Impact**:
- Behavior reverts to previous version immediately
- No code redeployment needed
- No downtime
- All existing conversations continue

---

### **Partial Rollback** (Per-Feature)
**When to Use**: One feature causes issues, others are fine

**Example**: Rollback exploration mode but keep new personality:
```
ENABLE_NEW_PERSONALITY = true   ← Keep this
ENABLE_EXPLORATION_MODE = false ← Rollback this
ENABLE_CONDITIONAL_INFO = true  ← Keep this
```

**Expected Impact**:
- Only specified feature reverts
- Other improvements remain active
- Gradual troubleshooting possible

---

### **Full Redeployment** (Last Resort)
**When to Use**: Flag rollback doesn't resolve issue

**Steps**:
```bash
# Checkout previous version
git checkout <previous-commit-hash>

# Redeploy edge function
cd apps/dashboard/supabase/functions/chat-orchestrator
npx supabase functions deploy chat-orchestrator

# Verify
npx supabase functions list
```

**Expected Impact**:
- Complete revert to previous codebase
- All feature flag code removed
- Requires code redeployment (~2-3 minutes)

---

## 📊 Monitoring & Alerts

### **Key Metrics to Track**

**System Health (Critical)**:
```
Error Rate:         < 5%   ← Alert if exceeds
Hallucination Rate: < 5%   ← Alert if exceeds
Response Time:      < 4s   ← Alert if exceeds (p95)
Zero Results Rate:  < 2%   ← Monitor trend
```

**User Engagement (Improvement Goals)**:
```
Conversation Length:     +20% improvement
Title Click-Through:     +15% improvement
Suggested Query Clicks:  +25% improvement
User Satisfaction:       +10% improvement
```

### **Monitoring Dashboard**

**Supabase Logs**:
- URL: `https://supabase.com/dashboard/project/dlrnrgcoguxlkkcitlpd/functions`
- Filter: `chat-orchestrator`
- Check for: Errors, performance, hallucination warnings

**Custom Metrics** (if available):
- Google Analytics: `/buyers/chat` engagement
- Database: `chat_sessions` table analytics
- Feedback: `chatbot_feedback` table sentiment

### **Alert Conditions (Trigger Rollback)**

```bash
# Automatic alerts (set up in Supabase or monitoring tool):

# Critical: Immediate rollback
- Error rate > 10% for 5 minutes
- Hallucination warnings > 5 per hour
- Response time p95 > 8 seconds

# Warning: Investigate within 1 hour
- Error rate > 5% for 15 minutes
- Response time p95 > 6 seconds
- Zero results rate > 5%

# Monitor: Review in 24 hours
- User engagement not improving
- Conversation length decreasing
- Increased abandonment rate
```

---

## 🧪 Testing Instructions

### **Unit Tests**
```bash
# Run from edge function directory
cd apps/dashboard/supabase/functions/chat-orchestrator
deno test --allow-env --allow-net chat-orchestrator.test.ts

# Expected: All 10+ tests pass
# Tests verify: Feature flags, intent classification, anti-hallucination,
#               conversation weighting, suggestion generation
```

### **Integration Tests**
```bash
# Setup environment variables
export SUPABASE_URL="https://dlrnrgcoguxlkkcitlpd.supabase.co"
export TEST_USER_AUTH_TOKEN="<get-from-get-auth-token.js>"

# Run integration tests
deno test --allow-env --allow-net integration.test.ts

# Expected: All 11 tests pass
# Tests verify: End-to-end scenarios, no breaking changes
```

### **Manual Testing Checklist**
```bash
# Test each scenario manually in staging/production:

1. Information Query:
   Input:  "Tell me about First Love"
   Expect: Structured response + title detail link

2. Discovery Query:
   Input:  "romantic webtoon"
   Expect: Title recommendations from database

3. Comparison Query:
   Input:  "compare First Love and The Dilettante"
   Expect: Structured comparison

4. Follow-up Query:
   Input:  "tell me more" (after previous query)
   Expect: Contextual continuation

5. No Results:
   Input:  "xyzabc123nonexistent"
   Expect: Helpful clarification, no hallucinations

6. Business Trigger:
   Input:  "where would this work on Netflix?"
   Expect: Market discussion with real examples

7. Streaming:
   Input:  Any query
   Expect: Characters appear progressively

8. Suggestions:
   Input:  Any query
   Expect: 3-5 clickable follow-up suggestions

9. Anti-Hallucination:
   Input:  Any query
   Expect: Only database titles mentioned

10. Feature Flags OFF:
    Verify: All flags show as 'false' in logs
    Expect: Production behavior unchanged
```

---

## 🛠️ Troubleshooting

### **Problem: Feature flag not taking effect**

**Symptoms**: Behavior unchanged after setting flag to `true`

**Solutions**:
1. Verify flag is set in Supabase Dashboard > Edge Functions > Secrets
2. Check edge function logs for "Feature Flags Initialized" message
3. Redeploy edge function: `npx supabase functions deploy chat-orchestrator`
4. Clear any caching layers (if applicable)

---

### **Problem: Increased error rate after enabling flag**

**Symptoms**: Edge function errors spike in logs

**Solutions**:
1. **Immediate**: Set flag to `false` (rollback)
2. **Check logs**: Identify specific error messages
3. **Verify tests**: Run unit + integration tests locally
4. **Contact team**: Report issue with logs and error details
5. **Fix**: Address root cause before re-enabling

---

### **Problem: Hallucinations detected**

**Symptoms**: AI mentions titles not in database

**Solutions**:
1. **Immediate**: Set flag to `false` (rollback)
2. **Verify**: Anti-hallucination validator is working
3. **Check**: System prompt preserves anti-hallucination rules
4. **Test**: Run integration test scenario 8 (anti-hallucination)
5. **Fix**: Strengthen anti-hallucination enforcement in new code

---

### **Problem: Performance degradation**

**Symptoms**: Response times increase

**Solutions**:
1. **Monitor**: Check if vector search is still fast
2. **Verify**: OpenAI API response times normal
3. **Review**: New code doesn't add expensive operations
4. **Optimize**: Reduce prompt size if needed
5. **Rollback**: If performance critical, set flag to `false`

---

## 📞 Support & Escalation

### **Team Contacts**
- **Primary**: [Your Name/Email]
- **Backup**: [Backup Contact]
- **Emergency**: [On-call Contact]

### **Escalation Path**
1. **Minor Issue** (< 5% error rate): Monitor for 1 hour, document
2. **Moderate Issue** (5-10% error rate): Investigate within 30 min, consider rollback
3. **Critical Issue** (> 10% error rate): Immediate rollback, notify team

### **Resources**
- **Documentation**: `/apps/dashboard/public/docs/CHATBOT_SAMPLE_DIALOGUES.md`
- **Edge Function Logs**: `https://supabase.com/dashboard/project/dlrnrgcoguxlkkcitlpd/functions`
- **Test Results**: `CHATBOT_TEST_RESULTS.md`
- **Architecture**: `AI_CHATBOT_DOCUMENTATION.md`

---

## ✅ Pre-Deployment Checklist

Before enabling any feature flag:

### **Code Review**
- [ ] All unit tests pass
- [ ] All integration tests pass
- [ ] Code reviewed by at least one other developer
- [ ] Documentation updated
- [ ] No console.log left in production code (use proper logging)

### **Staging Validation**
- [ ] Deployed to staging environment
- [ ] Manual testing complete (all 10 scenarios)
- [ ] Performance benchmarks meet requirements
- [ ] No errors in staging logs
- [ ] Feature flag toggle verified working

### **Production Readiness**
- [ ] Rollback procedure documented and tested
- [ ] Monitoring alerts configured
- [ ] Team notified of deployment schedule
- [ ] On-call engineer available during rollout
- [ ] Communication plan ready (if issues occur)

### **Metrics Baseline**
- [ ] Current error rate documented
- [ ] Current response time documented
- [ ] Current user engagement metrics recorded
- [ ] Comparison dashboard ready

---

## 📈 Success Metrics Dashboard

Track these metrics before/after enabling each flag:

```
| Metric                    | Baseline | Target | Actual | Status |
|---------------------------|----------|--------|--------|--------|
| Error Rate                | 2%       | < 5%   | ___%   | ___    |
| Hallucination Rate        | 3%       | < 5%   | ___%   | ___    |
| Response Time (p95)       | 3.5s     | < 4s   | ___s   | ___    |
| Conversation Length       | 4 msgs   | +20%   | ___    | ___    |
| Title Click-Through       | 15%      | +15%   | ___%   | ___    |
| Suggestion Click Rate     | 8%       | +25%   | ___%   | ___    |
| User Satisfaction (NPS)   | 42       | +10pts | ___    | ___    |
```

---

## 🎯 Next Steps

**Current Status**: Phase 1 Complete ✅

**Immediate Actions**:
1. ✅ Feature flags added to edge function
2. ✅ Unit tests created (10+ tests)
3. ✅ Integration tests created (11 scenarios)
4. ⏳ **NEXT**: Deploy to staging with all flags OFF
5. ⏳ **NEXT**: Run tests in staging environment
6. ⏳ **NEXT**: Verify production behavior unchanged

**Phase 2 Prerequisites** (before enabling `ENABLE_NEW_PERSONALITY`):
- [ ] All Phase 1 tests passing
- [ ] Staging deployment successful
- [ ] Production baseline metrics documented
- [ ] Team approval obtained
- [ ] Monitoring dashboard configured

---

**Document Version**: 1.0
**Last Updated**: 2025-10-14
**Maintained By**: Development Team
**Review Frequency**: After each phase deployment
