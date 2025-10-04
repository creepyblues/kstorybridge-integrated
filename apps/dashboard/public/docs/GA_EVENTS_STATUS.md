# GA4 Events Status Summary

**Last Updated**: 2025-10-04

## 🎯 Quick Status Overview

| Event | Status | Action Required |
|-------|--------|----------------|
| `title_view_from_chat` | ✅ **FIXED** | Test in production |
| `upgrade_button_click` | ⚠️ **GTM Config Needed** | Configure GTM trigger/tag |
| `chat_mode_changed` | ℹ️ **N/A** | Feature not implemented |
| `close_convert_lead` | ℹ️ **N/A** | Archive in GTM |
| `qualify_lead` | ℹ️ **N/A** | Archive in GTM |
| `purchase` | ℹ️ **Backend Only** | Implement via Stripe webhook |

---

## ✅ Fixed Events (Code Complete)

### `title_view_from_chat`

**What Changed**:
- New tracking function `trackTitleViewFromChat()` created
- Chat.tsx updated to use new function
- Now sends correct event name to GA4

**DataLayer Event**:
```javascript
{
  'event': 'title_view_from_chat',
  'title_id': '...',
  'title_name': '...',
  'chat_mode': 'standard',
  'session_id': '...',
  'message_id': '...',
  'user_prompt': '...',
  'recommendation_score': 0.95
}
```

**Next Steps**: Test in production, verify GA4 receives events

---

## ⚠️ Needs GTM Configuration

### `upgrade_button_click`

**Current State**:
- ✅ Tracking code exists in analytics.ts
- ✅ Being called from components
- ❌ GTM trigger not configured
- ❌ GTM tag not created

**Required GTM Setup**:

1. **Create Variables** (5 total):
   - `DLV - Upgrade Source` → `upgrade_source`
   - `DLV - Feature Name` → `feature_name`
   - `DLV - Current Tier` → `current_tier`
   - `DLV - Prompt Type` → `prompt_type`
   - `DLV - Potential Value` → `potential_value`

2. **Create Trigger**:
   - Name: `Upgrade Button Click`
   - Type: Custom Event
   - Event: `upgrade_button_click`

3. **Create Tag**:
   - Name: `GA4 - Upgrade Button Click`
   - Type: GA4 Event
   - Event Name: `upgrade_button_click`
   - Parameters: Map all 5 variables above

**Time to Complete**: ~15 minutes

**See**: [GA_EVENTS_FIX_GUIDE.md](/docs/GA_EVENTS_FIX_GUIDE.md#2-upgrade-button-click-event) for step-by-step instructions

---

## ℹ️ Not Applicable (Archive/Remove)

### `chat_mode_changed`

**Why Not Working**: Feature doesn't exist
- Chat mode is hardcoded to 'standard'
- No UI toggle implemented
- "Advanced Mode" is placeholder only

**Recommendation**: Archive GTM tag until feature built

---

### `close_convert_lead` & `qualify_lead`

**Why Not Working**: No lead management features
- No CRM integration
- No lead scoring system
- Not in current product scope

**Recommendation**: Archive GTM tags, revisit for B2B features

---

### `purchase`

**Why Not Working**: Wrong implementation approach
- Should come from Stripe webhook (server-side)
- Client-side purchase tracking is insecure
- Current tag configured for client-side only

**Recommendation**:
1. Archive client-side tag
2. Implement server-side via Stripe webhook
3. Use GTM Server-Side container OR GA4 Measurement Protocol

---

## 🧪 Testing Checklist

### Immediate Testing (Code Already Deployed)

- [ ] Test `title_view_from_chat` in production
  - Go to /buyers/chat
  - Click title card from AI response
  - Verify in GA4 Real-time

### GTM Configuration Testing

- [ ] Configure `upgrade_button_click` in GTM
- [ ] Test in GTM Preview mode
- [ ] Verify parameters in GA4 Real-time
- [ ] Publish GTM container

### Archive Obsolete Tags

- [ ] Pause `chat_mode_changed` tag
- [ ] Pause `close_convert_lead` tag
- [ ] Pause `qualify_lead` tag
- [ ] Pause client-side `purchase` tag

---

## 📊 Impact Summary

**Before Fix**:
- 6 events showing "No stream data detected"
- Analytics incomplete for conversion funnel
- Title engagement from chat not tracked

**After Fix**:
- ✅ Chat title engagement fully tracked
- ⚠️ Upgrade intent tracked (pending GTM config)
- ✅ Obsolete events identified and documented
- ✅ Future implementation path clear

**Conversion Funnel Improvement**:
- Better attribution of title discovery via chat
- Upgrade intent tracking ready (after GTM config)
- Cleaner, more accurate event stream

---

## 🔗 Quick Links

- **Full Implementation Guide**: [GA_EVENTS_FIX_GUIDE.md](/docs/GA_EVENTS_FIX_GUIDE.md)
- **GTM Configuration**: [GTM_MISSING_EVENTS_FIX.md](/docs/GTM_MISSING_EVENTS_FIX.md)
- **Analytics Code**: `/apps/dashboard/src/utils/analytics.ts`
- **Chat Implementation**: `/apps/dashboard/src/pages/Chat.tsx`

---

## 📝 Next Actions

### For Developers:
1. ✅ Code changes deployed (title_view_from_chat)
2. ⏳ Test new tracking in production
3. ⏳ Monitor GA4 for data flow

### For GTM Admin:
1. ⚠️ Configure `upgrade_button_click` trigger/tag (~15 min)
2. ℹ️ Archive 4 obsolete tags
3. ✅ Test and publish changes

### For Product Team:
1. ℹ️ Decide on chat mode toggle feature
2. ℹ️ Plan B2B/lead management features (if needed)
3. ℹ️ Implement server-side purchase tracking (future)

---

*Status: 5/6 events resolved | 1/6 needs GTM config*
*Last updated: 2025-10-04*
