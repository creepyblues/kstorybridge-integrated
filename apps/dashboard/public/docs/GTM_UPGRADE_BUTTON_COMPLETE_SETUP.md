# Complete GTM Setup Guide: upgrade_button_click Event

**Last Updated**: 2025-10-04
**Estimated Time**: 15 minutes
**Skill Level**: Beginner-friendly

---

## 📊 Current State Analysis

### ✅ What's Already Configured

Based on your screenshots:

1. **Tag exists**: "Upgrade Button Click"
   - Type: Google Analytics: GA4 Event
   - Event Name: `upgrade_button_click`
   - Measurement ID: G-DWL6MV0MC2

2. **Trigger exists**: `upgrade_button_click`
   - Type: Custom Event
   - Fires on: All Custom Events

3. **Some parameters configured**:
   - `feature_name` → `{{feature_name}}`
   - `current_tier` → `{{current_tier}}`

### ❌ What's Missing (Why It's Not Working)

**3 Missing Event Parameters**:
1. `upgrade_source` - Where the upgrade button was clicked from
2. `prompt_type` - Type of upgrade prompt (modal, inline, banner, popup)
3. `potential_value` - Conversion value for revenue tracking

**Result**: Tag fires but sends incomplete data → GA4 doesn't show meaningful analytics

---

## 🎯 What We're Going to Fix

By the end of this guide, your `upgrade_button_click` event will send:

```javascript
{
  'event': 'upgrade_button_click',
  'upgrade_source': 'premium_popup',      // ✅ NEW
  'feature_name': 'Contact Creator',
  'current_tier': 'basic',
  'prompt_type': 'popup',                 // ✅ NEW
  'potential_value': 29,                  // ✅ NEW
  'funnel_step': 'upgrade_clicked',
  'funnel_name': 'pro_conversion'
}
```

This gives you:
- Better conversion funnel tracking
- Revenue attribution
- Source analysis (which prompts convert best)

---

## 📋 Step-by-Step Guide

### Step 1: Create Missing Data Layer Variables

We need to create 3 Data Layer Variables that don't exist yet.

#### 1.1 Create "DLV - Upgrade Source" Variable

1. **Go to Variables section**:
   - Click **Variables** in left sidebar
   - Scroll to "User-Defined Variables" section
   - Click **New** button

2. **Configure the variable**:
   ```
   Variable Configuration
   ┌─────────────────────────────────────┐
   │ Variable Type:                      │
   │ ○ Data Layer Variable              │  ← Select this
   └─────────────────────────────────────┘

   Variable Configuration
   ┌─────────────────────────────────────┐
   │ Data Layer Variable Name:           │
   │ upgrade_source                      │  ← Type exactly this
   └─────────────────────────────────────┘

   Data Layer Version: Version 2 (default)
   ```

3. **Name the variable**:
   - Top of page, click "Untitled Variable"
   - Enter: `DLV - Upgrade Source`
   - Click **Save**

#### 1.2 Create "DLV - Prompt Type" Variable

1. Click **New** again in User-Defined Variables

2. **Configure**:
   ```
   Variable Type: Data Layer Variable

   Data Layer Variable Name: prompt_type
   ```

3. **Name it**: `DLV - Prompt Type`

4. Click **Save**

#### 1.3 Create "DLV - Potential Value" Variable

1. Click **New** one more time

2. **Configure**:
   ```
   Variable Type: Data Layer Variable

   Data Layer Variable Name: potential_value
   ```

3. **Name it**: `DLV - Potential Value`

4. Click **Save**

✅ **Checkpoint**: You should now have these 5 variables in User-Defined Variables:
- DLV - Upgrade Source
- DLV - Feature Name (already exists)
- DLV - Current Tier (already exists)
- DLV - Prompt Type
- DLV - Potential Value

---

### Step 2: Add Missing Parameters to Tag

Now we'll edit the existing "Upgrade Button Click" tag to include all 5 parameters.

#### 2.1 Open the Tag for Editing

1. **Go to Tags section**:
   - Click **Tags** in left sidebar
   - Find "Upgrade Button Click" tag
   - Click on it to open

2. **Edit Event Parameters**:
   - Scroll to "Event Parameters" section
   - You should see:
     ```
     feature_name → {{feature_name}}
     current_tier → {{current_tier}}
     ```

#### 2.2 Add the 3 Missing Parameters

**Important**: The order doesn't matter, but use exact spelling.

1. **Add upgrade_source parameter**:
   - Click **+ Add Parameter** (or **+ Add Row**)
   - Parameter name: `upgrade_source` (lowercase, underscore)
   - Value: Click the box → Select `DLV - Upgrade Source` from dropdown
   - Should show: `{{DLV - Upgrade Source}}`

2. **Add prompt_type parameter**:
   - Click **+ Add Parameter** again
   - Parameter name: `prompt_type` (lowercase, underscore)
   - Value: Select `DLV - Prompt Type`
   - Should show: `{{DLV - Prompt Type}}`

3. **Add potential_value parameter**:
   - Click **+ Add Parameter** again
   - Parameter name: `potential_value` (lowercase, underscore)
   - Value: Select `DLV - Potential Value`
   - Should show: `{{DLV - Potential Value}}`

#### 2.3 Final Event Parameters Should Look Like This:

```
Event Parameters
┌─────────────────────────────────────────────────┐
│ Parameter              Value                    │
├─────────────────────────────────────────────────┤
│ feature_name          {{DLV - Feature Name}}    │
│ current_tier          {{DLV - Current Tier}}    │
│ upgrade_source        {{DLV - Upgrade Source}}  │  ← NEW
│ prompt_type           {{DLV - Prompt Type}}     │  ← NEW
│ potential_value       {{DLV - Potential Value}} │  ← NEW
└─────────────────────────────────────────────────┘
```

4. **Save the tag**:
   - Click **Save** button (top right)

✅ **Checkpoint**: Tag now has all 5 event parameters configured.

---

### Step 3: Test Configuration (BEFORE Publishing)

**CRITICAL**: Always test in Preview mode before publishing!

#### 3.1 Enter Preview Mode

1. **Start Preview**:
   - Click **Preview** button (top right in GTM)
   - A new window opens with "Tag Assistant"
   - Enter your dashboard URL: `https://dashboard.kstorybridge.com`
   - Click **Connect**

2. **Dashboard opens in Tag Assistant mode**:
   - You'll see an orange banner at bottom: "Tag Assistant Connected"
   - GTM debugger panel appears

#### 3.2 Trigger the Event

1. **Navigate to a page with upgrade button**:
   - Go to `/buyers/titles`
   - Or any page with "Upgrade to Pro" button

2. **Click the upgrade button**:
   - Click any "Upgrade to Pro" or premium feature button
   - GTM debugger should update

#### 3.3 Verify in GTM Preview

1. **Check the debugger panel**:
   - Look for `upgrade_button_click` event in the event list
   - Click on it

2. **Verify the tag fired**:
   - Under "Tags Fired", you should see:
     - ✅ "Upgrade Button Click" tag (green checkmark)

3. **Check the dataLayer**:
   - Click on the `upgrade_button_click` event
   - Click "Data Layer" tab
   - Scroll down, you should see:
     ```javascript
     upgrade_button_click event {
       event: "upgrade_button_click",
       upgrade_source: "premium_popup",  // or other source
       feature_name: "Contact Creator",   // or other feature
       current_tier: "basic",             // or user's tier
       prompt_type: "popup",              // or other type
       potential_value: 29,               // or 0
       timestamp: "2025-10-04T...",
       app_section: "dashboard"
     }
     ```

4. **Verify tag parameters**:
   - Click "Tags" tab
   - Click "Upgrade Button Click" tag
   - Check "Event Parameters" - all 5 should have values (not `undefined`)

#### 3.4 Verify in Browser Console

1. **Open Developer Tools**:
   - Press `F12` or `Cmd+Option+I` (Mac)
   - Go to **Console** tab

2. **Check for tracking log**:
   - You should see:
     ```
     ⬆️ UPGRADE CLICK: Contact Creator from premium_popup (Tier: basic)
     ```

3. **Inspect dataLayer manually**:
   ```javascript
   // Type this in console:
   dataLayer

   // Find the upgrade_button_click event object
   // Verify all parameters are present
   ```

#### 3.5 Verify in GA4 Real-time (Optional)

1. **Open GA4**:
   - Go to [Google Analytics](https://analytics.google.com)
   - Select your property

2. **Check Real-time report**:
   - Reports → Real-time
   - Look for `upgrade_button_click` event
   - May take 30-60 seconds to appear

3. **Verify parameters**:
   - Click on the event
   - Check that all 5 parameters show up

✅ **Checkpoint**: If all verifications pass, you're ready to publish!

---

### Step 4: Publish Your Changes

#### 4.1 Exit Preview Mode

1. Click **Exit Preview** in Tag Assistant
2. Close the debugger window
3. Return to GTM container

#### 4.2 Submit & Publish

1. **Click Submit** (top right in GTM):
   - Orange button that says "Submit"

2. **Version Configuration**:
   ```
   Version Name:
   Fix upgrade_button_click event - Add missing parameters

   Version Description:
   Added 3 missing event parameters to upgrade_button_click tag:
   - upgrade_source (tracks button location)
   - prompt_type (tracks prompt UI type)
   - potential_value (tracks conversion value)

   Created 3 new Data Layer Variables:
   - DLV - Upgrade Source
   - DLV - Prompt Type
   - DLV - Potential Value

   This fix enables complete conversion funnel tracking for Pro tier upgrades.
   ```

3. **Click Publish**:
   - Blue "Publish" button (top right)

4. **Confirmation**:
   - You'll see "Version published successfully"
   - Note the version number (e.g., "Version 42")

✅ **Done!** Changes are now live in production.

---

## 🧪 Post-Publish Verification

### Test in Production (Within 1 Hour)

1. **Visit your dashboard** (without Preview mode):
   - Go to `https://dashboard.kstorybridge.com`
   - Click an "Upgrade to Pro" button

2. **Check browser console**:
   - Should see: `⬆️ UPGRADE CLICK: ...`

3. **Wait 5-10 minutes, check GA4**:
   - Reports → Real-time
   - Look for `upgrade_button_click` event
   - Click event → Verify all 5 parameters present

4. **Check GA4 within 24 hours**:
   - Reports → Engagement → Events
   - Find `upgrade_button_click`
   - Check parameter values are populating correctly

---

## ❌ Troubleshooting

### Problem: Tag fires but parameters are `undefined`

**Symptoms**:
- Tag shows as "fired" in GTM Preview
- But parameter values are `undefined` or blank

**Solution**:
1. **Check variable names** (most common issue):
   - Variables → User-Defined Variables
   - Open each DLV variable
   - Verify "Data Layer Variable Name" is EXACTLY:
     - `upgrade_source` (not `upgradeSource`, not `Upgrade_Source`)
     - `prompt_type` (not `promptType`, not `Prompt_Type`)
     - `potential_value` (not `potentialValue`, not `Potential_Value`)

2. **Check variable is selected in tag**:
   - Tags → Upgrade Button Click
   - Event Parameters section
   - Each parameter should show `{{DLV - Variable Name}}`
   - NOT `{{undefined}}` or `{{variable_name}}`

3. **Check dataLayer is being pushed**:
   - Open browser console
   - Type: `dataLayer.filter(e => e.event === 'upgrade_button_click')`
   - Verify the event object has all properties

### Problem: Tag doesn't fire at all

**Symptoms**:
- GTM Preview shows event in timeline
- But tag shows "Not Fired"

**Solution**:
1. **Check trigger configuration**:
   - Triggers → `upgrade_button_click`
   - Event name should be EXACTLY: `upgrade_button_click`
   - "This trigger fires on": All Custom Events

2. **Check tag has trigger assigned**:
   - Tags → Upgrade Button Click
   - Scroll to "Triggering" section
   - Should show: `upgrade_button_click` (orange icon)

3. **Check for trigger exceptions**:
   - Make sure no "Exception" triggers are blocking it

### Problem: Event doesn't appear in GA4

**Symptoms**:
- Tag fires in GTM
- Parameters look correct
- But nothing in GA4 Real-time

**Solution**:
1. **Wait longer**: GA4 can take 30-90 seconds (sometimes longer)

2. **Check Measurement ID**:
   - Tags → Upgrade Button Click
   - Verify Measurement ID: `G-DWL6MV0MC2`
   - Should match your GA4 property

3. **Check GA4 property**:
   - Make sure you're looking at correct property
   - Admin → Data Streams → Check stream URL matches dashboard URL

4. **Check data retention**:
   - GA4 → Admin → Data Settings → Data Retention
   - Should be set to collect event data

### Problem: Parameters have wrong values

**Symptoms**:
- Event fires correctly
- But `potential_value` shows `0` when should be `29`
- Or `upgrade_source` is wrong

**Solution**:
- This is a **code issue**, not GTM issue
- The tracking code sends the wrong values
- Check the component calling `trackUpgradeButtonClick()`
- Verify parameters passed to function are correct

### Problem: Changes don't appear after publishing

**Symptoms**:
- Published successfully
- But old configuration still running

**Solution**:
1. **Hard refresh browser**:
   - Windows: `Ctrl + Shift + R`
   - Mac: `Cmd + Shift + R`

2. **Clear GTM cache**:
   - Wait 5-10 minutes for CDN to update
   - GTM changes can take a few minutes to propagate

3. **Verify version**:
   - GTM → Versions
   - Check "Latest Published" version matches what you just published

---

## ✅ Final Verification Checklist

Copy this checklist and verify each item:

### GTM Configuration
- [ ] 5 Data Layer Variables exist in GTM:
  - [ ] DLV - Upgrade Source
  - [ ] DLV - Feature Name
  - [ ] DLV - Current Tier
  - [ ] DLV - Prompt Type
  - [ ] DLV - Potential Value

- [ ] "Upgrade Button Click" tag has 5 event parameters:
  - [ ] `upgrade_source` → `{{DLV - Upgrade Source}}`
  - [ ] `feature_name` → `{{DLV - Feature Name}}`
  - [ ] `current_tier` → `{{DLV - Current Tier}}`
  - [ ] `prompt_type` → `{{DLV - Prompt Type}}`
  - [ ] `potential_value` → `{{DLV - Potential Value}}`

- [ ] Trigger "upgrade_button_click" exists and fires on event: `upgrade_button_click`

### Testing
- [ ] Tested in GTM Preview mode
- [ ] Tag fires successfully
- [ ] All 5 parameters have values (not undefined)
- [ ] Console shows tracking log: `⬆️ UPGRADE CLICK: ...`

### Publishing
- [ ] Changes submitted with descriptive version name
- [ ] Changes published successfully
- [ ] Version number noted: ___________

### Production Verification
- [ ] Event appears in GA4 Real-time (within 10 minutes)
- [ ] All 5 parameters show in GA4 event details
- [ ] Parameter values are correct (not undefined)

---

## 📊 Expected Results in GA4

### Event Name
`upgrade_button_click`

### Event Parameters You'll See

| Parameter | Example Value | What It Tracks |
|-----------|---------------|----------------|
| `upgrade_source` | `premium_popup` | Where button was clicked |
| `feature_name` | `Contact Creator` | Which premium feature prompted upgrade |
| `current_tier` | `basic` | User's current subscription tier |
| `prompt_type` | `popup` | Type of upgrade UI shown |
| `potential_value` | `29` | Conversion value (for revenue tracking) |
| `funnel_step` | `upgrade_clicked` | Stage in conversion funnel |
| `funnel_name` | `pro_conversion` | Which funnel this belongs to |

### Use Cases in GA4

1. **Conversion Funnel**:
   - Reports → Explore → Funnel Exploration
   - Track: Page view → Premium feature click → Upgrade button click → Conversion

2. **Source Analysis**:
   - Which upgrade prompts convert best?
   - Reports → Engagement → Events → `upgrade_button_click`
   - Add secondary dimension: `upgrade_source`

3. **Revenue Attribution**:
   - E-commerce → Overview
   - Filter by event: `upgrade_button_click`
   - See `potential_value` totals

4. **Feature Demand**:
   - Which features drive most upgrade clicks?
   - Reports → Engagement → Events
   - Add secondary dimension: `feature_name`

---

## 🔗 Related Resources

- **Code Implementation**: See `/apps/dashboard/src/utils/analytics.ts` line 273-297
- **Full Fix Guide**: See `GA_EVENTS_FIX_GUIDE.md`
- **Event Status**: See `GA_EVENTS_STATUS.md`
- **GTM Documentation**: [Google Tag Manager Help](https://support.google.com/tagmanager)
- **GA4 Documentation**: [Google Analytics 4 Help](https://support.google.com/analytics)

---

## 📝 Notes

### Why These Parameters Matter

- **`upgrade_source`**: Tells you which CTA works best (popup vs inline vs banner)
- **`prompt_type`**: UI/UX optimization - which prompt style converts
- **`potential_value`**: Revenue forecasting and ROI calculation
- **`feature_name`**: Product insight - which features users want most
- **`current_tier`**: Segmentation - analyze by user tier

### Data Privacy

All parameters are behavioral (not PII):
- No email addresses
- No names
- No payment info
- Just tier levels and interaction data

Safe for GDPR/CCPA compliance.

### Custom Dimensions (Optional)

For advanced reporting, you can create Custom Dimensions in GA4:
1. GA4 → Admin → Custom Definitions
2. Create dimension for each parameter
3. Enables more powerful reports and segments

---

## ✅ Summary

**What You Did**:
1. Created 3 new Data Layer Variables
2. Added 3 missing event parameters to tag
3. Tested in Preview mode
4. Published changes

**What You Get**:
- Complete conversion tracking for upgrade buttons
- Revenue attribution data
- Source/feature analysis
- Better funnel optimization insights

**Time Invested**: ~15 minutes
**Value**: Complete visibility into Pro tier conversion funnel

---

*Last updated: 2025-10-04*
*Created by: Claude Code*
*Difficulty: ⭐⭐☆☆☆ (Beginner-Friendly)*
