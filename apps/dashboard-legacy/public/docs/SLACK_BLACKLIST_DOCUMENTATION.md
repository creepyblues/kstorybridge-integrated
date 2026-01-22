# Slack Notification Blacklist System

## Overview

The KStoryBridge monorepo implements a comprehensive blacklist system to filter out specific email addresses and domains from all Slack notifications. This prevents internal team members and testing accounts from generating excessive notifications during development and normal operations.

## ✅ Implementation Status

### ✅ Blacklisted Emails
All Slack notifications are filtered to exclude these specific email addresses:
- `sungho@kstorybridge.com` - Added as requested
- `kevin@sandstoneartists.com` - Added as requested
- `creepyblues@gmail.com` - Existing blacklisted account

### ✅ Blacklisted Domains
All emails from these domains are automatically filtered:
- `dadble.com` - Company domain
- `kstorybridge.com` - Product domain

## Implementation Details

### Centralized Blacklist Configuration

The blacklist is implemented consistently across all applications using identical constants:

```typescript
// Email addresses and domains to exclude from Slack notifications
const EXCLUDED_EMAILS = [
  'kevin@sandstoneartists.com',
  'sungho@kstorybridge.com',
  'creepyblues@gmail.com'
];

const EXCLUDED_DOMAINS = [
  'dadble.com',
  'kstorybridge.com'
];
```

### Filtering Logic

```typescript
const shouldExcludeEmail = (email: string): boolean => {
  if (!email) return false;

  const emailLower = email.toLowerCase();

  // Check exact email matches
  if (EXCLUDED_EMAILS.some(excluded => excluded.toLowerCase() === emailLower)) {
    console.log(`🚫 Skipping Slack notification for excluded email: ${email}`);
    return true;
  }

  // Check domain matches
  const domain = emailLower.split('@')[1];
  if (domain && EXCLUDED_DOMAINS.includes(domain)) {
    console.log(`🚫 Skipping Slack notification for excluded domain: ${domain}`);
    return true;
  }

  return false;
};
```

## ✅ Updated Files

All Slack notification implementations have been updated to use the centralized blacklist system:

### Primary Slack Utilities
- ✅ `apps/dashboard/src/utils/slack.ts` - Main dashboard Slack notifications
- ✅ `apps/website/src/utils/slack.ts` - Main website Slack notifications
- ✅ `apps/website/src/utils/slackNotifications.ts` - Signup failure notifications

### Session Tracking
- ✅ `apps/dashboard/src/utils/sessionBehaviorTracking.ts` - Dashboard session tracking
- ✅ `apps/website/src/utils/sessionBehaviorTracking.ts` - Website session tracking
- ✅ `apps/website/src/utils/sessionTracking.ts` - Session start notifications

### Integration Points
All these files now use the centralized `sendSlackNotification` function which includes blacklist filtering:

```typescript
import { sendSlackNotification } from './slack';

// All calls automatically include blacklist filtering
await sendSlackNotification({
  event: 'Event Name',
  userType: 'buyer' | 'creator',
  fullName: 'User Name',
  email: 'user@example.com', // Will be filtered if blacklisted
  additionalInfo: { ... }
});
```

## Notification Types Covered

The blacklist system filters ALL Slack notifications including:

### Authentication Events
- ✅ User signups (buyer/creator)
- ✅ User sign-ins
- ✅ OAuth callbacks
- ✅ Signup failures

### User Activity
- ✅ Session starts
- ✅ Session ends (inactivity/navigation/close)
- ✅ Page visits and behavior tracking

### Business Events
- ✅ Pitch document requests
- ✅ User feedback submissions
- ✅ Premium feature access

### System Events
- ✅ Error notifications
- ✅ Testing notifications

## Adding New Blacklisted Accounts

### For Individual Emails
Update the `EXCLUDED_EMAILS` array in both:
1. `apps/dashboard/src/utils/slack.ts`
2. `apps/website/src/utils/slack.ts`
3. `apps/website/src/utils/slackNotifications.ts`

```typescript
const EXCLUDED_EMAILS = [
  'kevin@sandstoneartists.com',
  'sungho@kstorybridge.com',
  'creepyblues@gmail.com',
  'new-email@example.com' // Add new email here
];
```

### For Entire Domains
Update the `EXCLUDED_DOMAINS` array in the same files:

```typescript
const EXCLUDED_DOMAINS = [
  'dadble.com',
  'kstorybridge.com',
  'new-domain.com' // Add new domain here
];
```

## ⚠️ Critical Implementation Notes

### 1. Consistency Requirement
All three blacklist configurations MUST be kept in sync:
- `apps/dashboard/src/utils/slack.ts`
- `apps/website/src/utils/slack.ts`
- `apps/website/src/utils/slackNotifications.ts`

### 2. New Slack Implementations
Any new Slack notification code MUST:
- Use the centralized `sendSlackNotification` function
- Import from the appropriate `./slack.ts` file
- Never bypass the blacklist filtering

### 3. Direct API Calls Prohibited
❌ **DO NOT** make direct calls to:
- Slack webhook URLs
- Supabase proxy endpoints
- Any notification service

✅ **ALWAYS USE** the centralized utilities:
```typescript
import { sendSlackNotification } from './slack';
```

## Testing & Verification

### Console Logging
When an email is filtered, you'll see console logs:
```
🚫 Skipping Slack notification for excluded email: sungho@kstorybridge.com
🚫 Skipping Slack notification for excluded domain: dadble.com
```

### Test Notifications
Use the test functions available in both apps:
```javascript
// In browser console
window.testSlackNotification();
```

### Verification Checklist
- [ ] Test with blacklisted email addresses
- [ ] Test with blacklisted domains
- [ ] Verify no notifications sent for filtered accounts
- [ ] Confirm normal notifications still work for non-blacklisted accounts

## Maintenance

### Regular Reviews
- Monthly review of blacklisted accounts
- Remove accounts no longer needing filtering
- Add new team members or test accounts as needed

### Documentation Updates
- Update this file when adding/removing blacklisted accounts
- Document any changes to the filtering logic
- Maintain consistency across all applications

---

## Quick Reference

**Current Blacklisted Emails:**
- `sungho@kstorybridge.com`
- `kevin@sandstoneartists.com`
- `creepyblues@gmail.com`

**Current Blacklisted Domains:**
- `dadble.com`
- `kstorybridge.com`

**Files to Update When Adding Blacklist Entries:**
1. `apps/dashboard/src/utils/slack.ts`
2. `apps/website/src/utils/slack.ts`
3. `apps/website/src/utils/slackNotifications.ts`

This blacklist system ensures that internal team activities don't clutter Slack channels while maintaining full notification coverage for actual user activities.