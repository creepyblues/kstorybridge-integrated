# Dashboard V2 App - CLAUDE.md

**Last Updated**: 2025-11-03
**Status**: ✅ Active Development
**Production URL**: dashboard-v2.kstorybridge.com (staging)

---

## 📋 Overview

Dashboard V2 is the **buyer-focused application** for KStoryBridge, providing AI-powered title discovery, tier-gated premium content, and subscription management.

### Key Features

- 🤖 **AI Chatbot** - Contextual title recommendations (Phases 1-4 complete)
- 🎯 **Tier System** - Basic, Pro, Suite subscription tiers
- 💳 **Stripe Integration** - Subscription payment processing
- 📚 **Title Discovery** - Browse and search Korean IPs
- 💾 **Saved Titles** - Bookmark titles for later
- 👤 **Profile Management** - Buyer account settings

---

## 🏗️ Auth Isolation Architecture (NEW - 2025-11-03)

> **CRITICAL**: This app implements the **Minimal Auth Provider Pattern** to completely isolate authentication from business logic features.

### Why Auth Isolation?

**Problem**: Auth kept breaking after changes to non-auth features (tier system, chat, titles).

**Solution**: Complete separation between auth (session management) and business logic (tier, billing, features).

### Provider Hierarchy

```
<AuthProvider>                          ← Auth state ONLY
  <BrowserRouter>
    <Routes>
      {/* Public Routes - NO TierProvider */}
      <Route path="/signin" />          ← Auth pages load instantly
      <Route path="/signup" />
      <Route path="/auth/callback" />
      <Route path="/signup/complete" />

      {/* Protected Routes - TierProvider per route */}
      <Route path="/buyers/*">
        <TierProvider>                  ← Business logic, lazy-loaded
          <ProtectedRoute>
            {children}
          </ProtectedRoute>
        </TierProvider>
      </Route>
    </Routes>
  </BrowserRouter>
</AuthProvider>
```

### Critical Rules

**✅ DO**:
- Keep auth simple (session management only)
- Use sessionStorage for OAuth (NEVER URL parameters)
- Add timeout protection (10 seconds max)
- Fail fast with clear error messages

**❌ DON'T**:
- Import business logic into auth modules
- Use URL parameters in OAuth callback URLs
- Let auth hang indefinitely (add timeouts)
- Wrap public routes with TierProvider

### Documentation

- **[AUTH_ISOLATION_GUIDE.md](AUTH_ISOLATION_GUIDE.md)** - Complete implementation guide, rules, and troubleshooting
- **[Root AUTH_DOCUMENTATION.md](../../docs/active/AUTH_DOCUMENTATION.md)** - General auth system reference

---

## 🚀 Quick Start

### Development

```bash
# From root
npm run dev:dashboard

# From apps/dashboard-v2
npm run dev

# Runs on http://localhost:8081
```

### Environment Variables

```bash
# .env.local (never commit)
VITE_SUPABASE_URL=https://dlrnrgcoguxlkkcitlpd.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...
VITE_AUTH_DEBUG=true  # Enable auth logging
```

### Build & Deploy

```bash
npm run build           # Production build
npm run build:dev       # Development build
npm run preview         # Preview production build
npm run lint            # ESLint check
```

---

## 📁 Project Structure

```
apps/dashboard-v2/
├── src/
│   ├── lib/
│   │   ├── auth.ts                   # 🚨 AUTH ISOLATION BOUNDARY
│   │   └── supabase.ts
│   ├── hooks/
│   │   └── useAuth.tsx               # 🚨 AUTH ISOLATION BOUNDARY
│   ├── contexts/
│   │   ├── TierContext.tsx           # Business logic (not auth)
│   │   └── DataCacheContext.tsx
│   ├── pages/
│   │   ├── auth/                     # 🚨 AUTH ISOLATION BOUNDARY
│   │   │   ├── SignIn.tsx
│   │   │   ├── SignUp.tsx
│   │   │   ├── AuthCallback.tsx
│   │   │   └── CompleteProfile.tsx
│   │   ├── buyers/                   # Protected routes
│   │   │   ├── Chat.tsx
│   │   │   ├── Titles.tsx
│   │   │   ├── TitleDetail.tsx
│   │   │   ├── Saved.tsx
│   │   │   ├── Profile.tsx
│   │   │   ├── Plan.tsx
│   │   │   └── Checkout.tsx
│   │   └── admin/
│   │       └── AdminTitles.tsx
│   ├── components/
│   │   ├── ui/                       # shadcn/ui components
│   │   ├── ProtectedRoute.tsx
│   │   └── Layout.tsx
│   └── App.tsx                       # Provider setup
├── supabase/
│   └── functions/
│       └── chat-orchestrator/        # AI chatbot edge function
├── AUTH_ISOLATION_GUIDE.md           # 🚨 READ THIS FIRST
├── CLAUDE.md                         # This file
└── package.json
```

---

## 🔐 Authentication

### Account Types

- **buyer** - Media buyers with tier system (basic/pro/suite)

### Auth Flow

1. **Email Signup** (`/signup`):
   - Buyer company email required (no consumer emails)
   - Creates user in Supabase Auth
   - Creates profile via `create-buyer-profile` edge function
   - Sets default tier: 'basic'

2. **Email Signin** (`/signin`):
   - Standard email/password auth
   - Redirects to `/buyers/chat`

3. **OAuth (Google)** (`/auth/callback`):
   - Stores flow context in sessionStorage (NEVER URL params)
   - Exchanges code for session
   - Checks profile existence
   - Redirects to CompleteProfile if new user

### Critical Auth Files

- `src/lib/auth.ts` - Auth service functions
- `src/hooks/useAuth.tsx` - AuthProvider and hook
- `src/pages/auth/AuthCallback.tsx` - OAuth callback handler
- `src/pages/auth/CompleteProfile.tsx` - OAuth profile completion

**See**: [AUTH_ISOLATION_GUIDE.md](AUTH_ISOLATION_GUIDE.md) for complete details

---

## 🎯 Tier System

### Tier Hierarchy

```typescript
{
  invited: 0,  // No access
  basic: 1,    // Free tier (default)
  pro: 2,      // $99/month
  suite: 3     // $299/month
}
```

### Usage

```typescript
import { useTierAccess } from '@/contexts/TierContext';

function MyComponent() {
  const { tier, hasAccess, loading, error } = useTierAccess();

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message={error} />;

  if (!hasAccess('pro')) {
    return <UpgradePrompt requiredTier="pro" />;
  }

  return <PremiumContent />;
}
```

### Fail-Safe Behavior

- **Default tier**: 'basic' (on errors or missing profile)
- **Timeout**: 10 seconds max
- **Error handling**: Logs error, continues with 'basic' tier
- **Never blocks app**: Tier failures don't affect auth or navigation

---

## 🤖 AI Chatbot (Phases 1-4 Complete)

### Status

- ✅ Phase 1: Vector search optimization
- ✅ Phase 2: Prompt engineering
- ✅ Phase 3: Pitch analytics integration
- ✅ Phase 4: Contextual response generation

### Implementation

- **Edge Function**: `supabase/functions/chat-orchestrator/index.ts`
- **Frontend**: `src/pages/buyers/Chat.tsx`
- **Vector Database**: `title_vectors` table (1536-dim embeddings)
- **Context**: Pitch analytics from `title_content_analysis` table

### Performance

- **Response time**: 3-5 seconds average
- **Token efficiency**: 50% reduction on follow-up questions
- **Hallucination rate**: <5%
- **Repetition rate**: 0% (Phase 4 improvement)

**See**: [Root docs/features/chatbot/OVERVIEW.md](../../docs/features/chatbot/OVERVIEW.md)

---

## 💳 Stripe Integration

### Subscription Plans

```typescript
const STRIPE_PRODUCTS = {
  pro: 'price_1XXXXX',   // $99/month
  suite: 'price_1XXXXX'  // $299/month
};
```

### Checkout Flow

1. User clicks "Upgrade" → `/buyers/plan`
2. Selects plan → `/buyers/checkout`
3. Stripe Checkout session created
4. Payment success → `/buyers/checkout/success`
5. Webhook updates `user_buyers.tier`

### Testing

- Use Stripe test mode in development
- Test card: `4242 4242 4242 4242`
- CVC: Any 3 digits
- Expiry: Any future date

---

## 📊 Database Schema

### Core Tables

**user_buyers**:
- `id` (uuid, pk) - Links to auth.users
- `email` (text, unique) - Query by this, NOT user_id
- `full_name` (text)
- `buyer_company` (text)
- `buyer_role` (text)
- `tier` (text) - 'basic' | 'invited' | 'pro' | 'suite'
- `stripe_customer_id` (text)

**titles**:
- `title_id` (uuid, pk)
- `title_name_en`, `title_name_kr`
- `synopsis`, `genre`, `content_format`
- `verified` (boolean) - Premium content marker
- Vector embeddings (1536-dim)

**saved_titles**:
- `user_id` (uuid) - Links to user_buyers
- `title_id` (uuid) - Links to titles
- `created_at` (timestamp)

### Query Patterns

```typescript
// ✅ CORRECT - Query by email
const { data } = await supabase
  .from('user_buyers')
  .select('*')
  .eq('email', user.email?.toLowerCase())
  .maybeSingle();

// ❌ WRONG - Don't query by user_id field
// (user_id field doesn't exist in user tables)
```

---

## 🎨 Design System

### Colors

- **Primary**: Black (`text-black`)
- **Neutrals**: `gray-50`, `gray-100`, `gray-200`, `gray-300`
- **Status**: `red-*` (error), `green-*` (success), `blue-*` (info)
- **Links**: `text-black hover:text-gray-700`
- ❌ **Never**: Yellow colors

### Standard Components

```tsx
// Card
<Card className="bg-transparent border-gray-300 shadow-none rounded-2xl">
  <CardContent className="p-4 sm:p-6">
    {children}
  </CardContent>
</Card>

// Button
<Button variant="outline" className="border-gray-300 hover:bg-gray-100">
  Click Me
</Button>

// Badge
<span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-red-500 text-white">
  PRO
</span>
```

**See**: [Root docs/active/DESIGN_SYSTEM.md](../../docs/active/DESIGN_SYSTEM.md)

---

## 🧪 Testing

### Manual Auth Testing

```bash
# Test all auth flows
npm run dev

# Open http://localhost:8081
```

**Checklist**:
- [ ] Email signup (buyer) → completes successfully
- [ ] Email signin → redirects to /buyers/chat
- [ ] Google OAuth signup → completes without timeout
- [ ] Google OAuth signin → completes without timeout
- [ ] OAuth callback has NO URL parameters
- [ ] SessionStorage cleared after auth
- [ ] Timeout protection works (10 seconds)
- [ ] Error messages are user-friendly

### Tier System Testing

- [ ] Tier loads on protected routes
- [ ] Tier failures default to 'basic'
- [ ] Tier errors don't block navigation
- [ ] Premium content shows upgrade prompt for 'basic' tier

### Chatbot Testing

- [ ] Chat responds within 5 seconds
- [ ] Follow-up questions work correctly
- [ ] No hallucinated title recommendations
- [ ] Pitch analytics show when available

---

## 🚨 Common Issues

### Issue: Auth keeps breaking after feature changes

**Solution**: Review [AUTH_ISOLATION_GUIDE.md](AUTH_ISOLATION_GUIDE.md)
- Check auth modules don't import business logic
- Verify public routes don't load TierProvider
- Ensure timeout protection is active

### Issue: OAuth callback timeout

**Diagnosis**: Check network tab for callback URL parameters (should be NONE)

**Solution**:
- Verify `auth.ts:143` has no URL parameters
- Check sessionStorage is used instead
- Ensure 15-second timeout hasn't expired

### Issue: Tier system blocking app

**Diagnosis**: Check `[TierProvider]` logs in console

**Solution**:
- Verify TierProvider has timeout protection
- Check fail-safe defaults to 'basic' tier
- Ensure TierProvider only wraps protected routes (not public)

---

## 📚 Related Documentation

### Root Documentation
- **[CLAUDE.md](../../CLAUDE.md)** - Monorepo overview
- **[AUTH_DOCUMENTATION.md](../../docs/active/AUTH_DOCUMENTATION.md)** - Complete auth reference
- **[DATABASE_SCHEMA.md](../../docs/active/DATABASE_SCHEMA.md)** - Database schema
- **[DESIGN_SYSTEM.md](../../docs/active/DESIGN_SYSTEM.md)** - UI/UX standards
- **[CACHE_POLICY.md](../../docs/active/CACHE_POLICY.md)** - Session-based caching

### App-Specific
- **[AUTH_ISOLATION_GUIDE.md](AUTH_ISOLATION_GUIDE.md)** - Auth isolation pattern (READ THIS FIRST)
- **[Chatbot Overview](../../docs/features/chatbot/OVERVIEW.md)** - AI chatbot system

### ADRs
- **[docs/adr/AUTH_ISOLATION_PATTERN.md](../../docs/adr/AUTH_ISOLATION_PATTERN.md)** - Architectural decision record

---

## 🔧 Development Workflow

### Adding New Features

1. **Plan**: Review auth isolation rules
2. **Develop**: Keep business logic separate from auth
3. **Test**: Verify auth still works
4. **Deploy**: Check staging before production

### Modifying Auth

1. **Review**: Read [AUTH_ISOLATION_GUIDE.md](AUTH_ISOLATION_GUIDE.md) first
2. **Test**: Run all auth flows manually
3. **Document**: Update this file and guide
4. **Deploy**: Test in staging extensively

### Debugging Auth Issues

1. Enable auth logging: `VITE_AUTH_DEBUG=true`
2. Check console for `[Auth*]` messages
3. Review network tab for OAuth callback
4. Check sessionStorage contents
5. Verify timeout protection is working

---

## 📞 Support

### Questions?

- Review relevant documentation first
- Check troubleshooting sections
- Review git history for recent auth changes

### Reporting Issues

Include:
- Browser console logs
- Network tab screenshot (for OAuth)
- SessionStorage contents
- Steps to reproduce
- Expected vs actual behavior

---

**Last Updated**: 2025-11-03 by Claude Code - Auth Isolation Pattern Implementation
