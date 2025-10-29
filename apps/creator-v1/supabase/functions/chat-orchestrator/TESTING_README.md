# Chat Orchestrator Testing Guide

Quick reference for running tests during chatbot sample dialogue implementation.

---

## 🚀 Quick Start

### **1. Run Unit Tests**
```bash
cd apps/dashboard/supabase/functions/chat-orchestrator
deno test --allow-env --allow-net chat-orchestrator.test.ts
```

**Expected**: All 10+ tests pass
**Time**: ~2 seconds

---

### **2. Run Integration Tests**

**Setup** (first time only):
```bash
# Get auth token
cd apps/dashboard
node get-auth-token.js

# Copy the token, then export:
export SUPABASE_URL="https://dlrnrgcoguxlkkcitlpd.supabase.co"
export TEST_USER_AUTH_TOKEN="<token-from-above>"
```

**Run tests**:
```bash
cd supabase/functions/chat-orchestrator
deno test --allow-env --allow-net integration.test.ts
```

**Expected**: All 11 tests pass
**Time**: ~30-60 seconds (calls real edge function)

---

## 📋 Test Coverage

### **Unit Tests** (chat-orchestrator.test.ts)
✅ Feature flags default to false
✅ Intent classification (5 types)
✅ Anti-hallucination validation
✅ Conversation history weighting
✅ Fresh conversation detection
✅ Suggestion generation
✅ Duplicate filtering
✅ Response analysis

### **Integration Tests** (integration.test.ts)
✅ Information queries (Tell me about X)
✅ Discovery queries (romantic webtoon)
✅ Comparison queries (compare X vs Y)
✅ Follow-up queries (context maintained)
✅ No results handling (no hallucinations)
✅ Streaming functionality
✅ Suggestion generation
✅ Anti-hallucination enforcement
✅ Business trigger detection
✅ Feature flags OFF verification
✅ Performance (<6s response time)

---

## ⚠️ Before Deploying

**CRITICAL**: All tests must pass before deploying any phase.

```bash
# Run both test suites
cd apps/dashboard/supabase/functions/chat-orchestrator

echo "Running unit tests..."
deno test --allow-env --allow-net chat-orchestrator.test.ts

echo "Running integration tests..."
deno test --allow-env --allow-net integration.test.ts
```

**If any test fails**:
1. DO NOT deploy
2. Fix the failing test
3. Re-run all tests
4. Only deploy when 100% pass

---

## 🐛 Troubleshooting

### Integration tests fail with "No authorization header"
**Solution**: Set `TEST_USER_AUTH_TOKEN` environment variable
```bash
export TEST_USER_AUTH_TOKEN="$(node apps/dashboard/get-auth-token.js)"
```

### Integration tests timeout
**Solution**: Check Supabase edge function is deployed and healthy
```bash
npx supabase functions list
# Verify chat-orchestrator shows as deployed
```

### Unit tests fail on CI/CD
**Solution**: Ensure Deno is installed
```bash
curl -fsSL https://deno.land/install.sh | sh
```

---

## 📊 Monitoring Test Health

After deployment, verify tests still pass:

```bash
# Daily health check
./run-all-tests.sh

# Expected output:
# ✅ Unit tests: 10/10 passed
# ✅ Integration tests: 11/11 passed
# ✅ All systems operational
```

---

## 🔗 Related Documentation

- **Feature Flags**: `FEATURE_FLAGS_GUIDE.md`
- **Sample Dialogues**: `/apps/dashboard/public/docs/CHATBOT_SAMPLE_DIALOGUES.md`
- **Test Results**: `/apps/dashboard/CHATBOT_TEST_RESULTS.md`
- **Testing Guide**: `/apps/dashboard/TESTING_GUIDE.md`

---

**Quick Commands**:
```bash
# Unit tests
deno test chat-orchestrator.test.ts --allow-env --allow-net

# Integration tests
export TEST_USER_AUTH_TOKEN="$(node ../../get-auth-token.js)"
deno test integration.test.ts --allow-env --allow-net

# All tests
./run-all-tests.sh  # (create this script if needed)
```
