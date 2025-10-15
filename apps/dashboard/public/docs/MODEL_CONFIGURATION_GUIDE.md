# Model Configuration Guide

**Purpose**: Track OpenAI model configurations for chatbot testing and migration
**Last Updated**: 2025-10-13
**Maintained By**: Engineering Team

---

## Overview

This guide documents the API differences between OpenAI models used in the KStoryBridge chatbot, enabling smooth model switching and testing.

### Quick Reference

| Model | Status | Temperature | Token Parameter | Max Tokens | Use Case |
|-------|--------|-------------|-----------------|------------|----------|
| **GPT-4o-mini** | ✅ Tested | Configurable (0.85) | `max_tokens` | 1000 | Cost-effective, balanced |
| **GPT-4o** | ⚠️ Untested | Configurable (0.85) | `max_tokens` | 1000 | High quality, expensive |
| **GPT-5-mini** | ✅ Current | **Locked at 1.0** | `max_completion_tokens` | 1000 | Latest model, higher creativity |

---

## Model Comparison Matrix

### GPT-4o-mini

**API Configuration**:
```typescript
{
  model: 'gpt-4o-mini',
  max_tokens: 1000,           // ✅ Supported
  temperature: 0.85,          // ✅ Configurable
  stream: true
}
```

**Characteristics**:
- ✅ **Temperature Control**: Fully configurable (0.0 - 2.0)
- ✅ **Token Parameter**: Uses `max_tokens`
- ✅ **Cost**: Most economical option
- ✅ **Personality Tests**: 85%+ pass rate at temp 0.85
- ⚠️ **Creativity**: Lower than GPT-5 models

**When to Use**:
- Cost-conscious deployment
- Stable personality required
- Fine-tuned temperature needed

---

### GPT-4o

**API Configuration**:
```typescript
{
  model: 'gpt-4o',
  max_tokens: 1000,           // ✅ Supported
  temperature: 0.85,          // ✅ Configurable
  stream: true
}
```

**Characteristics**:
- ✅ **Temperature Control**: Fully configurable (0.0 - 2.0)
- ✅ **Token Parameter**: Uses `max_tokens`
- ✅ **Quality**: Highest reasoning capability
- ⚠️ **Cost**: Most expensive option (~10x GPT-4o-mini)
- ❓ **Personality Tests**: Not yet tested

**When to Use**:
- Maximum quality required
- Complex reasoning tasks
- Budget allows premium pricing

---

### GPT-5-mini (CURRENT)

**API Configuration**:
```typescript
{
  model: 'gpt-5-mini',
  max_completion_tokens: 1000, // ⚠️ Different parameter name
  // temperature: OMITTED       // 🚫 Cannot configure, locked at 1.0
  stream: true
}
```

**Characteristics**:
- 🚫 **Temperature Control**: Locked at 1.0 (default only)
- ⚠️ **Token Parameter**: Uses `max_completion_tokens` (not `max_tokens`)
- ✅ **Latest Model**: Most recent release
- ⚠️ **Creativity**: Higher due to temp 1.0 (may increase hallucination risk)
- ❓ **Personality Tests**: Pending verification
- ✅ **Cost**: Competitive with GPT-4o-mini

**Known Issues**:
1. ❌ **Error if `temperature` set**: `"Unsupported parameter: 'temperature' does not support 0.85 with this model. Only the default (1) value is supported."`
2. ❌ **Error if `max_tokens` used**: `"Unsupported parameter: 'max_tokens' is not supported with this model. Use 'max_completion_tokens' instead."`

**Workaround**: Use conditional logic (see Implementation Guide below)

**When to Use**:
- Testing latest model capabilities
- Higher creativity acceptable
- Willing to trade temperature control for model novelty

---

## API Parameter Differences

### Parameter Comparison Table

| Parameter | GPT-4o-mini | GPT-4o | GPT-5-mini | Notes |
|-----------|-------------|--------|------------|-------|
| `max_tokens` | ✅ Supported | ✅ Supported | 🚫 **Not supported** | Legacy parameter |
| `max_completion_tokens` | ⚠️ Optional | ⚠️ Optional | ✅ **Required** | New parameter |
| `temperature` | ✅ 0.0 - 2.0 | ✅ 0.0 - 2.0 | 🚫 **Locked at 1.0** | Cannot configure |
| `top_p` | ✅ Supported | ✅ Supported | ❓ Unknown | Not tested |
| `frequency_penalty` | ✅ Supported | ✅ Supported | ❓ Unknown | Not tested |
| `presence_penalty` | ✅ Supported | ✅ Supported | ❓ Unknown | Not tested |

### Backward Compatibility Notes

- **GPT-4 models** accept both `max_tokens` and `max_completion_tokens`
- **GPT-5 models** only accept `max_completion_tokens`
- When migrating to GPT-5, **must update token parameter name**

---

## Implementation Guide

### Current Architecture (chat-orchestrator/index.ts)

**Location**: `/apps/dashboard/supabase/functions/chat-orchestrator/index.ts` (Lines 190-220)

**Conditional Configuration Pattern**:
```typescript
// Model selection (Line 190)
const selectedModel = model || 'gpt-5-mini';

// Build request body dynamically (Lines 202-286)
const requestBody: any = {
  model: selectedModel,
  stream: true,
  messages: [
    {
      role: 'system',
      content: `You are Jinu, a Hollywood showrunner...`
    },
    {
      role: 'user',
      content: masterPrompt
    }
  ]
};

// Apply model-specific parameter configuration
if (selectedModel.startsWith('gpt-5')) {
  // GPT-5 models: Use max_completion_tokens, temperature locked at 1.0 (default)
  requestBody.max_completion_tokens = 1000;
  console.log('🔧 Using GPT-5 config: max_completion_tokens=1000, temp=1.0 (default)');
} else {
  // GPT-4 and earlier: Use max_tokens, temperature configurable
  requestBody.max_tokens = 1000;
  requestBody.temperature = 0.85;
  console.log('🔧 Using GPT-4 config: max_tokens=1000, temp=0.85');
}

const response = await fetch('https://api.openai.com/v1/chat/completions', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${openaiApiKey}`
  },
  body: JSON.stringify(requestBody)
});
```

**Benefits of This Pattern**:
- ✅ **Model-agnostic**: Automatically adjusts configuration based on model name
- ✅ **Easy switching**: Change one line (Line 190) to test different models
- ✅ **No breaking changes**: Each model gets its correct parameters
- ✅ **Future-proof**: Add new model families with additional conditionals
- ✅ **Debuggable**: Console logs show which config is active

---

## Model Selection Decision Tree

```
┌─────────────────────────────────────────┐
│ What's your priority?                   │
└─────────────────┬───────────────────────┘
                  │
    ┌─────────────┼─────────────┐
    │             │             │
┌───▼────┐    ┌───▼────┐    ┌──▼──────┐
│  Cost  │    │Quality │    │Testing  │
└───┬────┘    └───┬────┘    └──┬──────┘
    │             │             │
┌───▼──────────┐  │  ┌──────────▼────────────┐
│GPT-4o-mini   │  │  │GPT-5-mini             │
│              │  │  │                       │
│✅ $0.15/1M   │  │  │✅ Latest model        │
│✅ Temp 0.85  │  │  │⚠️ Temp locked at 1.0 │
│✅ Proven     │  │  │❓ Unproven            │
└──────────────┘  │  └───────────────────────┘
                  │
         ┌────────▼────────┐
         │GPT-4o           │
         │                 │
         │✅ Best quality  │
         │⚠️ $5.00/1M     │
         │❓ Untested      │
         └─────────────────┘
```

**Recommendations**:

1. **Production (Current)**: GPT-5-mini
   - Latest model, competitive pricing
   - Accept temp 1.0 trade-off
   - Monitor hallucination rate

2. **If hallucination issues arise**: Switch to GPT-4o-mini
   - Change Line 190: `const selectedModel = model || 'gpt-4o-mini';`
   - Redeploy edge function
   - Lower temperature (0.85) reduces creativity but improves accuracy

3. **For premium tier**: Consider GPT-4o
   - Highest quality responses
   - Justify with premium pricing
   - Test extensively before deployment

---

## Known Issues & Workarounds

### Issue 1: GPT-5 Temperature Restriction

**Problem**: Cannot configure temperature for GPT-5 models
```json
{
  "error": "Unsupported parameter: 'temperature' does not support 0.85 with this model. Only the default (1) value is supported."
}
```

**Root Cause**: OpenAI locked GPT-5 temperature parameter

**Workaround**:
- ✅ **Implemented**: Conditional logic omits temperature for GPT-5 models
- Temperature defaults to 1.0 automatically
- No explicit parameter needed

**Impact Assessment**:
- ⚠️ **Higher creativity**: May produce more varied responses
- ⚠️ **Hallucination risk**: Monitor for false title recommendations
- ⚠️ **Personality drift**: Responses may be less consistent
- ✅ **Mitigation**: Strong system prompt + anti-hallucination validation layer

---

### Issue 2: GPT-5 Token Parameter Change

**Problem**: `max_tokens` parameter rejected
```json
{
  "error": "Unsupported parameter: 'max_tokens' is not supported with this model. Use 'max_completion_tokens' instead."
}
```

**Root Cause**: OpenAI renamed parameter for GPT-5

**Workaround**:
- ✅ **Implemented**: Conditional logic uses correct parameter per model
- GPT-4: `max_tokens`
- GPT-5: `max_completion_tokens`

**Status**: ✅ Resolved

---

## Testing Checklist

Use this checklist when testing a new model:

### Pre-Deployment Testing

- [ ] **Code Update**: Change model in `chat-orchestrator/index.ts` Line 190
- [ ] **Build Check**: Run `npm run build` (verify no TypeScript errors)
- [ ] **Lint Check**: Run `npm run lint` (verify code quality)
- [ ] **Edge Function Deploy**: `npx supabase functions deploy chat-orchestrator`

### Functional Testing

- [ ] **Browser Test**: http://localhost:8081/buyers/chat
  - [ ] Query: "Tell me about The Dilettante"
  - [ ] Verify: Response loads without API errors
  - [ ] Verify: Story craft focus (character/arc/theme mentions)
  - [ ] Verify: No business discussion without user signal

### Automated Testing

- [ ] **Personality Test Suite**:
  ```bash
  SUPABASE_AUTH_TOKEN="token" node test-story-craft-personality.js
  ```
  - [ ] Test 1: Story craft focus (≥3:1 ratio vs business)
  - [ ] Test 2: Business layer reactive to signals
  - [ ] Test 3: Real industry examples (no fictional history)
  - [ ] Test 4: Casual enthusiastic tone
  - [ ] Test 5: Story development questions
  - [ ] Test 6: Context awareness
  - [ ] **Target**: 85%+ pass rate (5/6 or 6/6 tests)

- [ ] **Phase 1-2 Test Suite**:
  ```bash
  SUPABASE_AUTH_TOKEN="token" node test-chatbot-improvements.js
  ```
  - [ ] Vector search (10 results, >0.8 similarity)
  - [ ] Anti-hallucination validation
  - [ ] Fuzzy title matching (80% threshold)
  - [ ] Intent classification (5 types)
  - [ ] Context weighting
  - [ ] Fallback keyword search

### Regression Testing

- [ ] **Edge Function Logs**: Check for errors at https://supabase.com/dashboard/project/dlrnrgcoguxlkkcitlpd/functions
- [ ] **Hallucination Rate**: Count "⚠️ Validation" warnings in logs
- [ ] **Response Times**: Verify <4 seconds average
- [ ] **Zero-Results Rate**: Target <2%

### Production Monitoring (First 24 Hours)

- [ ] **User Feedback**: Monitor for quality complaints
- [ ] **Error Rate**: Check Supabase logs for API errors
- [ ] **Hallucination Reports**: Track false recommendations
- [ ] **Response Quality**: Sample 10-20 conversations manually

---

## Migration Procedures

### Switching Between Models

**Scenario 1: Emergency Rollback (GPT-5 → GPT-4o-mini)**

If GPT-5 produces excessive hallucinations or quality issues:

1. **Code Change**:
   ```typescript
   // Line 190 in chat-orchestrator/index.ts
   const selectedModel = model || 'gpt-4o-mini'; // Changed from 'gpt-5-mini'
   ```

2. **Deploy**:
   ```bash
   cd /apps/dashboard
   npx supabase functions deploy chat-orchestrator
   ```

3. **Verify**:
   - Browser test: Confirm responses work
   - Check logs: Verify GPT-4 config active (`🔧 Using GPT-4 config: max_tokens=1000, temp=0.85`)

**Rollback Time**: ~2 minutes

---

**Scenario 2: Upgrade to Premium Model (GPT-4o-mini → GPT-4o)**

For premium tier or quality improvement:

1. **Code Change**:
   ```typescript
   // Line 190 in chat-orchestrator/index.ts
   const selectedModel = model || 'gpt-4o'; // Changed from 'gpt-4o-mini' or 'gpt-5-mini'
   ```

2. **Cost Assessment**:
   - GPT-4o-mini: $0.150 / 1M input tokens
   - GPT-4o: $5.00 / 1M input tokens
   - **Cost increase**: ~33x more expensive

3. **Deploy & Test**:
   ```bash
   npx supabase functions deploy chat-orchestrator
   # Run full test suite
   SUPABASE_AUTH_TOKEN="token" node test-story-craft-personality.js
   ```

4. **Monitor**:
   - Response quality improvement vs cost trade-off
   - User feedback on response depth

---

**Scenario 3: Test New Model (Experimental)**

To test a new OpenAI model (e.g., GPT-5, GPT-6-mini):

1. **Research API changes**:
   - Check OpenAI documentation for parameter changes
   - Test in OpenAI playground first

2. **Update conditional logic**:
   ```typescript
   if (selectedModel.startsWith('gpt-6')) {
     // Add GPT-6 specific configuration
     requestBody.max_completion_tokens = 1000;
     // Add other model-specific parameters
   } else if (selectedModel.startsWith('gpt-5')) {
     // Existing GPT-5 config
   } else {
     // Existing GPT-4 config
   }
   ```

3. **Test incrementally**:
   - Deploy to staging environment
   - Run automated test suites
   - Manual quality assessment
   - Gradual rollout to production

4. **Document findings**:
   - Update this guide with new model comparison
   - Add to testing checklist
   - Update decision tree

---

## Cost Comparison

| Model | Input Cost (per 1M tokens) | Output Cost (per 1M tokens) | Relative Cost |
|-------|---------------------------|----------------------------|---------------|
| **GPT-4o-mini** | $0.150 | $0.600 | 1x (baseline) |
| **GPT-4o** | $5.00 | $15.00 | ~33x more expensive |
| **GPT-5-mini** | ~$0.150 (estimated) | ~$0.600 (estimated) | ~1x |

**Average Query Cost** (assuming 1000 input tokens, 500 output tokens):
- GPT-4o-mini: $0.00045
- GPT-4o: $0.0125 (~28x more)
- GPT-5-mini: ~$0.00045

**Monthly Cost Estimation** (10,000 queries):
- GPT-4o-mini: $4.50/month
- GPT-4o: $125/month
- GPT-5-mini: ~$4.50/month

---

## Configuration History

### v2.2 (Current) - 2025-10-13
- **Model**: GPT-5-mini
- **Temperature**: 1.0 (locked, not configurable)
- **Token Param**: `max_completion_tokens: 1000`
- **Status**: Deployed, testing in progress
- **Change Reason**: Testing latest model capabilities
- **Known Trade-offs**: Higher creativity, potential hallucination risk

### v2.1 - 2024-12-XX
- **Model**: GPT-4o-mini
- **Temperature**: 0.85
- **Token Param**: `max_tokens: 1000`
- **Status**: Deprecated
- **Test Results**: 85%+ personality test pass rate
- **Notes**: Stable baseline configuration

### v2.0 - 2024-11-XX
- **Model**: GPT-4o-mini
- **Temperature**: 0.7
- **Token Param**: `max_tokens: 1000`
- **Status**: Deprecated
- **Notes**: Initial production configuration

---

## Quick Commands Reference

```bash
# Deploy edge function
npx supabase functions deploy chat-orchestrator

# Build check
npm run build

# Lint check
npm run lint

# Run personality tests
SUPABASE_AUTH_TOKEN="token" node test-story-craft-personality.js

# Run Phase 1-2 tests
SUPABASE_AUTH_TOKEN="token" node test-chatbot-improvements.js

# Get auth token (for testing)
node get-auth-token.js

# Check edge function logs
# Visit: https://supabase.com/dashboard/project/dlrnrgcoguxlkkcitlpd/functions
```

---

## Support & Troubleshooting

### Edge Function Logs
https://supabase.com/dashboard/project/dlrnrgcoguxlkkcitlpd/functions

### Common Issues

**Issue**: API returns 400 error
- **Check**: Parameter compatibility with selected model
- **Solution**: Verify conditional logic applies correct parameters

**Issue**: Response quality degraded
- **Check**: Temperature setting and model selection
- **Solution**: Consider rolling back to previous model

**Issue**: High hallucination rate
- **Check**: Edge function logs for "⚠️ Validation" warnings
- **Solution**: Reduce temperature (if model allows) or switch to GPT-4o-mini

---

## Document Maintenance

**Update Frequency**: After each model change or major configuration update

**Owner**: Engineering Team

**Review Schedule**: Quarterly or when testing new models

**Version Control**: Track changes in git commits

**Last Review**: 2025-10-13

---

## Related Documentation

- **[AI_CHATBOT_DOCUMENTATION.md](./AI_CHATBOT_DOCUMENTATION.md)** - System architecture and implementation details
- **[TESTING_GUIDE.md](./TESTING_GUIDE.md)** - Chatbot testing procedures
- **[CHATBOT_TEST_RESULTS.md](./CHATBOT_TEST_RESULTS.md)** - Phase 1 & 2 test results
- **Edge Function Code**: `/apps/dashboard/supabase/functions/chat-orchestrator/index.ts`
- **Test Suite**: `/apps/dashboard/test-story-craft-personality.js`
