# Dashboard App - Authentication Architecture

**Last Updated**: 2025-11-15
**Status**: Active - Post Creator App Separation

---

## 🎯 Critical Architectural Decision (2025-11-04)

### Dashboard App = BUYERS ONLY

**Key Principle**: The dashboard app now **exclusively handles buyer authentication**. Creator authentication has been moved to the creator app (`creator.kstorybridge.com`).

**Implication**:
- ✅ **All users on dashboard are buyers** - No need to check `account_type` metadata
- ✅ **All OAuth flows default to buyer** - No account type selection needed
- ✅ **All profile creation is buyer-only** - Simplified logic
- ✅ **All redirects go to `/buyers/*` routes** - No conditional routing

---

## Code Simplification Opportunities

### ❌ BEFORE (Multi-Account Type Logic - DEPRECATED)

```typescript
// OLD PATTERN - NO LONGER NEEDED
const accountType = user?.user_metadata?.account_type || 'buyer';

if (accountType === 'buyer') {
  navigate('/buyers/chat');
} else if (accountType === 'creator') {
  navigate('/creators/home');
}
```

### ✅ AFTER (Buyer-Only Logic - SIMPLIFIED)

```typescript
// NEW PATTERN - DASHBOARD IS BUYER-ONLY
// No account type checking needed
navigate('/buyers/chat');
```

---

## Authentication Flow Architecture

### 1. Email/Password Signup

```
User visits /signup/buyer
  ↓
Fills form (email, password, company, role)
  ↓
signupService.signupWithEmail()
  ↓
Edge function creates user_buyers record
  ↓
tier = 'basic' (always)
  ↓
Redirect to /buyers/chat
```

**Key Points**:
- ✅ No account_type selection UI needed
- ✅ Always creates `user_buyers` record
- ✅ Always sets `tier = 'basic'`
- ✅ Always redirects to `/buyers/chat`

---

### 2. OAuth Signup (First-Time Users)

```
User clicks "Sign in with Google" on /signup/buyer OR /signin
  ↓
OAuth redirect to Google
  ↓
Return to /auth/callback
  ↓
Check if user_buyers record exists
  ├─ EXISTS → Redirect to /buyers/chat ✅
  └─ NOT EXISTS → Redirect to /signup/buyer for profile completion
       ↓
       User completes profile (company, role)
       ↓
       Edge function creates user_buyers record
       ↓
       Redirect to /buyers/chat ✅
```

**Key Points**:
- ✅ OAuth callback ONLY checks `user_buyers` table (not creators)
- ✅ Profile completion ONLY creates buyer records
- ✅ No account_type in sessionStorage needed (always buyer)
- ✅ No URL parameters in OAuth callback (per CLAUDE.md rules)

---

### 3. Email/Password Signin

```
User visits /signin
  ↓
Enters email + password
  ↓
Supabase authenticates
  ↓
Redirect to /buyers/chat ✅
```

**Key Points**:
- ✅ No account type checking
- ✅ No profile lookup needed (auth success = buyer)
- ✅ Direct redirect to buyer dashboard

---

### 4. OAuth Signin (Existing Users)

```
User clicks "Sign in with Google" on /signin
  ↓
OAuth redirect to Google
  ↓
Return to /auth/callback
  ↓
Check if user_buyers record exists
  ├─ EXISTS → Redirect to /buyers/chat ✅
  └─ NOT EXISTS → Redirect to /signup/buyer for profile completion
```

**Key Points**:
- ✅ Same as OAuth signup flow
- ✅ Profile check against `user_buyers` ONLY

---

## Critical Code Locations

### Files That Should Be Buyer-Only

**1. SigninForm.tsx**
```typescript
// CURRENT (Line 101-102)
sessionStorage.setItem('oauth_account_type', accountType); // ❌ REMOVE - not needed
sessionStorage.setItem('oauth_flow', 'signin');

// SIMPLIFIED
sessionStorage.setItem('oauth_flow', 'signin'); // ✅ Only store flow
```

**2. AuthCallbackSimple.tsx**
```typescript
// CURRENT (Line 107-112)
const finalAccountType: AccountType = 'buyer'; // ✅ CORRECT - hardcoded to buyer

// This is already correct! All dashboard users are buyers.
```

**3. SignupFormContainer.tsx**
```typescript
// CURRENT - Has both buyer and creator logic
// SHOULD BE - Buyer-only logic

// Remove all creator-specific code:
- CreatorFormData types
- Creator validation logic
- Creator profile creation
- Creator redirect logic
```

**4. useAuth.tsx**
```typescript
// CURRENT - Checks account_type metadata
const accountType = user?.user_metadata?.account_type;

// SIMPLIFIED - Dashboard = buyer always
// No need to check metadata, just assume buyer
```

---

## Database Schema - Buyer-Only

### Tables Used by Dashboard

**`auth.users`** (Supabase managed)
- `id` - User UUID
- `email` - Email address
- `email_confirmed_at` - Verification timestamp
- `user_metadata` - Optional metadata (not required for account type)

**`user_buyers`** (Application managed)
- `id` - Matches `auth.users.id`
- `email` - Lowercase email
- `full_name` - User's name
- `buyer_company` - Company name (required)
- `buyer_role` - Role (required: Producer, Executive, Agent, Content Scout, Other)
- `linkedin_url` - Optional LinkedIn URL
- `tier` - Subscription tier (basic | pro | suite)
- `requested` - Admin approval flag (default: false)
- `created_at` - Timestamp

**Tables NOT Used**:
- ❌ `user_creators` - Used by creator app only
- ❌ Any creator-related tables

---

## Environment URLs

### Development
- **Local**: http://localhost:8082
- **Buyers only** - no creator routes

### Staging
- **URL**: https://dashboard-v2.kstorybridge.com
- **OAuth Callback**: `https://dashboard-v2.kstorybridge.com/auth/callback`
- **Buyers only** - no creator routes

### Production
- **URL**: https://dashboard.kstorybridge.com
- **OAuth Callback**: `https://dashboard.kstorybridge.com/auth/callback`
- **Buyers only** - no creator routes

---

## OAuth Configuration

### Supabase Auth Settings

**Google OAuth**:
- Redirect URLs:
  - `http://localhost:8082/auth/callback` (local)
  - `https://dashboard-v2.kstorybridge.com/auth/callback` (staging)
  - `https://dashboard.kstorybridge.com/auth/callback` (production)
- **NO URL parameters** in callback URLs (per CLAUDE.md)

**LinkedIn OAuth**:
- Same callback URLs as Google
- **NO URL parameters** in callback URLs

---

## Session Management

### SessionStorage Usage

**OAuth Flow Tracking**:
```typescript
// BEFORE (Multi-account)
sessionStorage.setItem('oauth_account_type', 'buyer'); // ❌ NOT NEEDED
sessionStorage.setItem('oauth_flow', 'signin');

// AFTER (Buyer-only)
sessionStorage.setItem('oauth_flow', 'signin'); // ✅ Only track flow
```

**OAuth Profile Completion**:
```typescript
// Used during OAuth profile completion
sessionStorage.setItem('oauth_signup_complete', 'true');
sessionStorage.setItem('oauth_user_id', user.id);
sessionStorage.setItem('oauth_user_email', user.email);

// Clear after completion
sessionStorage.removeItem('oauth_signup_complete');
sessionStorage.removeItem('oauth_user_id');
sessionStorage.removeItem('oauth_user_email');
```

---

## Metadata Usage

### ❌ DEPRECATED: account_type Metadata

**OLD APPROACH** (When dashboard handled both buyers and creators):
```typescript
// Check user metadata to determine account type
const accountType = user?.user_metadata?.account_type;

if (accountType === 'buyer') {
  // Buyer logic
} else if (accountType === 'creator') {
  // Creator logic
}
```

**NEW APPROACH** (Dashboard = buyers only):
```typescript
// No metadata check needed
// All dashboard users are buyers
navigate('/buyers/chat');
```

**Why we can remove this**:
1. ✅ Dashboard app ONLY serves buyers (architecture decision)
2. ✅ Creators use separate creator app (`creator.kstorybridge.com`)
3. ✅ No overlap - creators never access dashboard URLs
4. ✅ Simplified codebase - less conditional logic

---

## Redirect Logic

### ✅ SIMPLIFIED - All Redirects Go to Buyer Routes

**After Signup**:
```typescript
navigate('/buyers/chat'); // Always
```

**After Signin**:
```typescript
navigate('/buyers/chat'); // Always
```

**After OAuth Callback**:
```typescript
// If profile exists
navigate('/buyers/chat'); // Always

// If no profile
navigate('/signup/buyer'); // Complete buyer profile
```

**After Password Reset**:
```typescript
navigate('/signin'); // Back to signin
```

---

## Security Considerations

### RLS Policies

**`user_buyers` table**:
- ✅ Users can only read/update their OWN buyer record
- ✅ Service role (edge functions) can bypass RLS for creation
- ✅ No cross-account access possible

**Edge Functions**:
- ✅ Use service role key (bypasses RLS)
- ✅ Only create buyer records (not creators)
- ✅ Validate all inputs before database insertion

---

## Code Cleanup Opportunities

### Files with Dead Creator Code

**1. SignupFormContainer.tsx** (Lines 241-317)
- ❌ Creator OAuth completion logic
- ❌ Creator profile creation
- **Action**: Remove all creator-specific code

**2. validation.ts**
- ❌ Creator field validation functions
- **Action**: Remove creator validation logic

**3. types.ts**
- ❌ `CreatorFormData` type
- ❌ `AccountType = 'buyer' | 'creator'` union
- **Action**: Simplify to buyer-only types

**4. useAuth.tsx**
- ❌ Account type detection logic
- **Action**: Remove metadata checks, assume buyer

---

## Testing Simplifications

### Before (Multi-Account)
```typescript
// Test buyer signup
test('buyer signup creates user_buyers record', ...)

// Test creator signup
test('creator signup creates user_creators record', ...) // ❌ NOT NEEDED

// Test account type detection
test('detects account type from metadata', ...) // ❌ NOT NEEDED
```

### After (Buyer-Only)
```typescript
// Test buyer signup
test('signup creates user_buyers record', ...) // ✅ Only test buyers

// No creator tests needed
// No account type detection tests needed
```

---

## Documentation Updates Needed

### Files to Update

1. ✅ **CLAUDE.md** - Already mentions "dashboard only handles BUYER auth"
2. ✅ **AUTH_DOCUMENTATION.md** - Should clarify buyer-only architecture
3. ✅ **AUTH_TESTING_GUIDE.md** - Remove creator test cases
4. ⏳ **Code comments** - Remove references to multi-account logic
5. ⏳ **Edge functions** - Update comments to reflect buyer-only

---

## Summary

### Key Takeaways

1. **Dashboard = Buyers Only**
   - No account type checking needed
   - No conditional routing based on account type
   - All users on dashboard are buyers by definition

2. **Simplified Authentication**
   - OAuth flows always create buyer profiles
   - No `account_type` metadata required
   - Direct redirects to `/buyers/chat`

3. **Code Cleanup Needed**
   - Remove creator-specific logic
   - Remove account type conditionals
   - Remove sessionStorage `oauth_account_type`

4. **Security Unchanged**
   - RLS policies still protect data
   - Edge functions still validate inputs
   - OAuth flows still secure

---

## Migration Path

### Phase 1: Immediate (Already Done)
- ✅ Creator app deployed separately
- ✅ Dashboard hardcodes `account_type = 'buyer'` in callbacks

### Phase 2: Code Cleanup (Next Sprint)
- ⏳ Remove creator logic from SignupFormContainer
- ⏳ Remove account type checks from useAuth
- ⏳ Simplify sessionStorage usage
- ⏳ Remove creator types from TypeScript

### Phase 3: Testing (After Cleanup)
- ⏳ Update test suites to buyer-only
- ⏳ Remove creator test cases
- ⏳ Verify OAuth flows work correctly

---

**End of Document**

For creator authentication architecture, see: `apps/creator/CLAUDE.md`
