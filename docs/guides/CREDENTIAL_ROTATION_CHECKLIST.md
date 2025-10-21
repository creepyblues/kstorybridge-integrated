# 🔐 CREDENTIAL ROTATION CHECKLIST

**Date Created**: 2025-10-04
**Reason**: Environment files were committed to git (now removed)
**Status**: ⏳ IN PROGRESS

## 📋 CRITICAL: Rotate ALL Credentials

Because `.env.development`, `.env.production`, `.env.staging`, and `.env.testing` were committed to the git repository, **ALL credentials in these files must be rotated immediately**.

---

## 🔴 PHASE 1: Identify Exposed Credentials

### Supabase Credentials
- [ ] `SUPABASE_URL` - No rotation needed (public URL)
- [ ] `SUPABASE_ANON_KEY` - No rotation needed (public key)
- [ ] `SUPABASE_SERVICE_ROLE_KEY` - **ROTATE** (CRITICAL)
  - Location: Supabase Dashboard → Project Settings → API
  - Impact: Full database access bypass

### Stripe Credentials
- [ ] `STRIPE_PUBLISHABLE_KEY` - No rotation needed (public key)
- [ ] `STRIPE_SECRET_KEY` - **ROTATE** (CRITICAL)
  - Location: Stripe Dashboard → Developers → API Keys
  - Impact: Full payment processing access
- [ ] `STRIPE_WEBHOOK_SECRET` - **ROTATE** (HIGH)
  - Location: Stripe Dashboard → Developers → Webhooks
  - Impact: Webhook verification bypass

### OpenAI Credentials
- [ ] `OPENAI_API_KEY` - **ROTATE** (HIGH)
  - Location: OpenAI Platform → API Keys
  - Impact: AI usage & billing

### OAuth Credentials (if exposed)
- [ ] Google OAuth Client Secret - **CHECK & ROTATE if exposed**
  - Location: Google Cloud Console → Credentials
  - Impact: OAuth flow compromise

### Analytics & Monitoring
- [ ] `VITE_GA_MEASUREMENT_ID` - No rotation needed (public ID)
- [ ] Any Sentry DSN - No rotation needed (public DSN)

---

## 🔄 PHASE 2: Rotation Steps

### 1. Supabase Service Role Key
```bash
# 1. Go to: https://supabase.com/dashboard/project/dlrnrgcoguxlkkcitlpd/settings/api
# 2. Click "Reset service_role secret"
# 3. Copy new key
# 4. Update in Vercel:
#    - Dashboard: https://vercel.com/[team]/[project]/settings/environment-variables
#    - Add/Update: SUPABASE_SERVICE_ROLE_KEY = [new-key]
# 5. Update local .env.local (NOT in git)
# 6. Redeploy all apps
```

**Test After**: Verify edge functions work (chat-orchestrator, create-buyer-profile, etc.)

### 2. Stripe Secret Key
```bash
# 1. Go to: https://dashboard.stripe.com/apikeys
# 2. Roll the restricted key OR create new one
# 3. Update in:
#    - Vercel environment variables
#    - Supabase edge function secrets (via CLI)
# 4. Update webhook secret:
#    - Go to: https://dashboard.stripe.com/webhooks
#    - Get signing secret for production endpoint
#    - Update STRIPE_WEBHOOK_SECRET in Vercel
```

**Test After**:
- [ ] Test checkout: Create test subscription
- [ ] Test webhook: Verify tier update on subscription.created
- [ ] Test cancellation: Cancel test subscription

### 3. OpenAI API Key
```bash
# 1. Go to: https://platform.openai.com/api-keys
# 2. Revoke old key
# 3. Create new key
# 4. Update in:
#    - Vercel environment variables (VITE_OPENAI_API_KEY)
#    - Supabase edge function secrets (OPENAI_API_KEY)
```

**Test After**:
- [ ] Test chatbot: Send message to /buyers/chat
- [ ] Verify streaming works
- [ ] Check vector search embedding generation

### 4. OAuth Secrets (if needed)
```bash
# Google OAuth
# 1. Go to: https://console.cloud.google.com/apis/credentials
# 2. Edit OAuth 2.0 Client
# 3. Reset client secret
# 4. Update in Supabase:
#    - Dashboard → Authentication → Providers → Google
#    - Update Client Secret
```

**Test After**:
- [ ] Test Google signup (buyer)
- [ ] Test Google signup (creator)
- [ ] Test Google signin

---

## ✅ PHASE 3: Verification

### Environment Variables Checklist

**Vercel Dashboard Environment Variables** (should contain):
```bash
# Production
SUPABASE_URL=https://dlrnrgcoguxlkkcitlpd.supabase.co
SUPABASE_ANON_KEY=[public-anon-key]
SUPABASE_SERVICE_ROLE_KEY=[NEW-rotated-key]
STRIPE_PUBLISHABLE_KEY=[public-stripe-key]
STRIPE_SECRET_KEY=[NEW-rotated-key]
STRIPE_WEBHOOK_SECRET=[NEW-rotated-webhook-secret]
OPENAI_API_KEY=[NEW-rotated-key]
VITE_GA_MEASUREMENT_ID=[GA-measurement-id]
```

**Supabase Edge Function Secrets** (via CLI):
```bash
# Check current secrets
npx supabase secrets list

# Set new secrets
npx supabase secrets set STRIPE_SECRET_KEY=[new-key]
npx supabase secrets set STRIPE_WEBHOOK_SECRET=[new-secret]
npx supabase secrets set OPENAI_API_KEY=[new-key]
```

### Integration Tests
- [ ] **Auth Flow**: Signup → Email verification → Profile creation
- [ ] **OAuth Flow**: Google signup → Profile completion → Dashboard
- [ ] **Tier System**: Subscribe to Pro → Verify tier update → Access premium content
- [ ] **Chatbot**: Send query → Get AI response → Verify recommendations
- [ ] **Webhook**: Stripe event → Database update → Tier sync
- [ ] **Error Handling**: Invalid credentials → Proper error message

---

## 🚀 PHASE 4: Deployment

### Pre-Deployment Checklist
- [ ] All credentials rotated
- [ ] Vercel environment variables updated
- [ ] Supabase edge function secrets updated
- [ ] Local .env.local updated (NOT in git)
- [ ] Integration tests passed
- [ ] Git status clean (no .env files)

### Deployment Steps
```bash
# 1. Verify no env files in staging
git status
# Should NOT show any .env.* files except .env.example

# 2. Redeploy dashboard
vercel --prod

# 3. Redeploy edge functions (if changed)
cd apps/dashboard/supabase
npx supabase functions deploy

# 4. Monitor logs
# - Vercel: https://vercel.com/[team]/[project]/logs
# - Supabase: https://supabase.com/dashboard/project/dlrnrgcoguxlkkcitlpd/logs
```

### Post-Deployment Verification
- [ ] Production auth works (signup/signin)
- [ ] Production OAuth works (Google)
- [ ] Production payments work (Stripe)
- [ ] Production chatbot works (OpenAI)
- [ ] No credential errors in logs
- [ ] Monitor for 24 hours

---

## 📝 COMPLETION CHECKLIST

- [ ] **Phase 1**: All exposed credentials identified
- [ ] **Phase 2**: All credentials rotated
- [ ] **Phase 3**: All environment variables verified
- [ ] **Phase 4**: Production deployment successful
- [ ] **Monitoring**: 24-hour stability check complete
- [ ] **Documentation**: Update SECURITY_FIX_SUMMARY.md with completion date

---

## 🔒 PREVENTION: Never Again!

### New Team Member Onboarding
1. **NEVER** commit .env files (except .env.example)
2. Use Vercel dashboard for production secrets
3. Use Supabase CLI for edge function secrets
4. Use local .env.local for development (gitignored)

### Git Hooks (Future Enhancement)
Consider adding pre-commit hook:
```bash
#!/bin/sh
# .git/hooks/pre-commit
if git diff --cached --name-only | grep -qE "\.env(\.|$)"; then
    echo "❌ ERROR: .env file detected in commit"
    echo "Please remove .env files and use .env.example instead"
    exit 1
fi
```

### Regular Security Audits
- [ ] Quarterly: Review .gitignore patterns
- [ ] Monthly: Rotate development credentials
- [ ] Weekly: Check Vercel/Supabase logs for credential issues

---

**STATUS TRACKER**

| Task | Status | Date Completed | Notes |
|------|--------|----------------|-------|
| Identify exposed credentials | ⏳ In Progress | - | - |
| Rotate Supabase service role | ⏳ Pending | - | - |
| Rotate Stripe secret | ⏳ Pending | - | - |
| Rotate OpenAI API key | ⏳ Pending | - | - |
| Update Vercel env vars | ⏳ Pending | - | - |
| Update Supabase secrets | ⏳ Pending | - | - |
| Test all integrations | ⏳ Pending | - | - |
| Deploy to production | ⏳ Pending | - | - |
| 24-hour monitoring | ⏳ Pending | - | - |

**Last Updated**: 2025-10-04
