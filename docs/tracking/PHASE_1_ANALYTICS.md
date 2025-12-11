# Phase 1: Analytics & Tracking Infrastructure
## GA4 Event Tracking for Dashboard App

**Status**: ✅ **FULLY IMPLEMENTED** (All key user journeys tracked)
**GA4 Measurement ID**: `G-DWL6MV0MC2`
**Last Updated**: 2025-12-03

---

## 📊 Current Status

```
██████████ 100% Complete
```

### Implementation Summary
- [x] **GA4 Core Setup**: Initialized and tracking ✅
- [x] **Event Tracking Functions**: 20+ functions implemented ✅
- [x] **Event Coverage Expansion**: All key pages integrated ✅
- [x] **5 User Funnels Defined**: Authentication, Discovery, Chat, Comps, Checkout ✅

---

## 🎯 Funnel Architecture

### Funnel 1: Authentication
```
signup_form_viewed → signup_attempted → signup_completed
signin_form_viewed → signin_attempted → signin_completed
```

### Funnel 2: Title Discovery
```
page_view (titles) → title_search → title_detail_view → favorite_add
```

### Funnel 3: AI Chat (Jinu)
```
page_view (chat) → chat_message_sent → chat_message_received → chat_title_click
```

### Funnel 4: Comps Navigator
```
page_view (comps) → comps_search → comps_result_click
```

### Funnel 5: Checkout/Conversion
```
plan_page_view → checkout_started → checkout_completed → subscription_purchased
```

---

## 🔧 Configuration

### Environment Variables

**Development** (`.env.local`):
```bash
VITE_GA_MEASUREMENT_ID=G-DWL6MV0MC2
```

**Production** (Vercel Dashboard → Settings → Environment Variables):
```bash
VITE_GA_MEASUREMENT_ID=G-DWL6MV0MC2
```

### Initialization

GA4 is initialized in `src/main.tsx`:
```tsx
import { initializeAnalytics } from './utils/analytics';
initializeAnalytics();
```

---

## 📋 Available Tracking Functions

All functions are in `src/utils/analytics.ts` (~720 lines).

### Core Functions
| Function | Event Name | Purpose | Status |
|----------|------------|---------|--------|
| `initializeAnalytics()` | - | Loads gtag.js, configures GA4 | ✅ Active |
| `trackPageView()` | `page_view` | SPA route changes | ✅ Integrated |
| `trackFeatureUsage()` | `feature_usage` | Track feature adoption | ✅ Integrated |
| `trackConversion()` | (custom) | Generic conversions with value | ✅ Ready |

### Authentication Events (Funnel 1)
| Function | Event Name | Purpose | Status |
|----------|------------|---------|--------|
| `trackSignup()` | `signup` | Signup flow (form_viewed, attempted, completed, error) | ✅ Integrated |
| `trackSignin()` | `signin` | Signin flow (form_viewed, attempted, completed, error) | ✅ Integrated |

### Title Discovery Events (Funnel 2)
| Function | Event Name | Purpose | Status |
|----------|------------|---------|--------|
| `trackTitleSearch()` | `title_search` | Search queries with result count | ✅ Integrated |
| `trackTitleDetailView()` | `title_detail_view` | Title detail page views with source | ✅ Integrated |
| `trackFavorite()` | `favorite` | Add/remove favorites with source | ✅ Integrated |

### AI Chat Events (Funnel 3)
| Function | Event Name | Purpose | Status |
|----------|------------|---------|--------|
| `trackChatMessage()` | `chat_message` | Messages sent/received with timing | ✅ Integrated |
| `trackChatTitleClick()` | `chat_title_click` | Title clicks from chat results | ✅ Integrated |

### Comps Navigator Events (Funnel 4)
| Function | Event Name | Purpose | Status |
|----------|------------|---------|--------|
| `trackCompsSearch()` | `comps_search` | Comp searches with result count | ✅ Integrated |
| `trackCompsResultClick()` | `comps_result_click` | Result clicks with match score | ✅ Ready |

### Checkout Events (Funnel 5)
| Function | Event Name | Purpose | Status |
|----------|------------|---------|--------|
| `trackCheckout()` | `checkout` | Checkout flow (started, completed, cancelled, error) | ✅ Integrated |

### Legacy/Premium Events
| Function | Event Name | Purpose | Status |
|----------|------------|---------|--------|
| `trackOnboardingStep()` | `onboarding_step` | Track onboarding flow progress | ✅ Ready |
| `trackSavedTitle()` | `save_title` | Title save/favorite with source | ✅ Ready |
| `trackPitchView()` | `view_pitch` | Pitch deck views with duration | ✅ Ready |
| `trackContactCreatorClick()` | `contact_creator_click` | Creator contact conversion | ✅ Ready |
| `trackUpgradeButtonClick()` | `upgrade_button_click` | Upgrade CTA clicks | ✅ Integrated |
| `trackPremiumFeatureRequest()` | `premium_feature_request` | Premium feature requests | ✅ Integrated |
| `trackTierUpgrade()` | `tier_upgrade_intent` | Upgrade intent ($250 pro/$500 suite) | ✅ Integrated |
| `trackPremiumPopupInteraction()` | `premium_popup_interaction` | Premium popup actions | ✅ Integrated |

---

## 🔗 Integration Points

### Pages with Tracking ✅
| Page | Events Tracked |
|------|----------------|
| `SignUp.tsx` | `signup` (form_viewed, attempted, completed, error) |
| `SignIn.tsx` | `signin` (form_viewed, attempted, completed, error) |
| `Titles.tsx` | `page_view`, `feature_usage`, `title_search` |
| `TitleDetail.tsx` | `page_view`, `title_detail_view`, `favorite` |
| `Chat.tsx` | `page_view`, `feature_usage`, `chat_message`, `chat_title_click` |
| `CompsNavigator.tsx` | `page_view`, `feature_usage`, `comps_search` |
| `Plan.tsx` | `page_view`, `feature_usage`, `checkout` (started) |
| `Checkout.tsx` | `checkout` (error, cancelled) |
| `CheckoutSuccess.tsx` | `checkout` (completed), `subscription_purchased` |
| `PremiumFeaturePopup.tsx` | `premium_popup_interaction`, `tier_upgrade_intent` |
| `SecurePDFViewer.tsx` | `upgrade_button_click` |

---

## 🧪 Testing & Verification

### Development Mode
Console logs all events with `[Analytics]` prefix when `VITE_AUTH_DEBUG=true`:
```
[Analytics] GA4 initialized (G-DWL6...)
[Analytics] signup { action: 'form_viewed', method: 'email' }
[Analytics] title_search { query: 'romance', result_count: 15, search_type: 'vector' }
[Analytics] checkout { action: 'completed', tier: 'pro', value: 250 }
```

### Production Verification
1. Open GA4 Dashboard: https://analytics.google.com/
2. Navigate to **Reports → Realtime**
3. Perform actions in app
4. Verify events appear in realtime view

### Browser Console Check
```javascript
// Check if GA4 is loaded
console.log(window.gtag);  // Should be a function
console.log(window.dataLayer);  // Should be an array with events
```

---

## 📊 Key Metrics to Track

### User Acquisition
- Signup completion rate (signup_completed / signup_attempted)
- OAuth vs Email signup ratio
- Signup → First search time

### Engagement
- Average searches per session
- Chat messages per user
- Titles viewed per session
- Favorites added per user

### Conversion
- Plan page → Checkout started rate
- Checkout started → Completed rate
- Revenue per tier (Pro: $250, Suite: $500)

### Feature Adoption
- AI Chat usage rate
- Comps Navigator usage rate
- Vector search vs pagination ratio

---

## 📁 Key Files

| File | Purpose |
|------|---------|
| `src/utils/analytics.ts` | Core analytics utility (~720 lines) |
| `src/main.tsx` | GA4 initialization call |
| `.env.local` | GA4 measurement ID |
| `src/pages/auth/SignUp.tsx` | Signup tracking |
| `src/pages/auth/SignIn.tsx` | Signin tracking |
| `src/pages/buyers/Titles.tsx` | Title search tracking |
| `src/pages/buyers/TitleDetail.tsx` | Title detail + favorite tracking |
| `src/pages/buyers/Chat.tsx` | Chat message + title click tracking |
| `src/pages/buyers/CompsNavigator.tsx` | Comps search tracking |
| `src/pages/buyers/Plan.tsx` | Checkout started tracking |
| `src/pages/buyers/Checkout.tsx` | Checkout error/cancel tracking |
| `src/pages/buyers/CheckoutSuccess.tsx` | Checkout completed + conversion |

---

## 🚀 Next Steps

### GA4 Dashboard Setup
1. **Create custom funnels** in GA4 for each of the 5 funnels above
2. **Set up conversion events** for `signup_completed`, `checkout_completed`
3. **Configure automated reports** for product team
4. **Set up alerts** for significant drops in conversion rates

### Production Deployment
```bash
# Add to Vercel environment variables
VITE_GA_MEASUREMENT_ID=G-DWL6MV0MC2
```

### Future Enhancements
- [ ] Session recording integration (Hotjar/FullStory)
- [ ] A/B testing framework
- [ ] Custom dimensions for user segments
- [ ] Enhanced ecommerce tracking

---

## 🔗 Related Documentation

- [PRD 2.1](../PRD-2.1.md) - Product requirements
- [Phase 2: Onboarding](./PHASE_2_ONBOARDING.md)
- [Phase 3: Email](./PHASE_3_EMAIL.md)
- [Phase 4: Conversion](./PHASE_4_CONVERSION.md)

---

## 📝 Change Log

| Date | Change |
|------|--------|
| 2025-12-03 | ✅ Full tracking implementation across all key pages |
| 2025-12-03 | ✅ Added 15+ new tracking functions for 5 funnels |
| 2025-12-03 | ✅ Integrated tracking in auth, titles, chat, comps, checkout |
| 2025-12-03 | ✅ GA4 activated with measurement ID `G-DWL6MV0MC2` |
| 2025-12-03 | ✅ Added `initializeAnalytics()` call to `main.tsx` |
| 2025-11-04 | Initial analytics utility created with 10 tracking functions |

---

*Last updated: 2025-12-03*
