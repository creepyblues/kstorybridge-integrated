# GTM Configuration Fix for Missing Event Tags

## Problem Summary

The tracking implementation is working correctly - events like `tier_upgrade_intent` are successfully being pushed to the dataLayer. However, GTM shows "20 tags did not fire" because the GTM triggers are not configured to respond to our custom events.

## Root Cause Analysis

✅ **Code Implementation**: WORKING - Events are being sent to dataLayer correctly
❌ **GTM Configuration**: MISSING - No triggers/tags configured for custom events

## Required GTM Configuration

### Phase 1: Create Custom Event Triggers

#### 1. Tier Upgrade Intent Trigger
**Trigger Name**: `Tier Upgrade Intent`
**Trigger Type**: Custom Event
**Event name**: `tier_upgrade_intent`
**This trigger fires on**: All Custom Events

#### 2. Tier Downgrade Intent Trigger
**Trigger Name**: `Tier Downgrade Intent`
**Trigger Type**: Custom Event
**Event name**: `tier_downgrade_intent`
**This trigger fires on**: All Custom Events

#### 3. Premium Feature Access Trigger
**Trigger Name**: `Premium Feature Access`
**Trigger Type**: Custom Event
**Event name**: `premium_feature_access`
**This trigger fires on**: All Custom Events

#### 4. Premium Popup Interaction Trigger
**Trigger Name**: `Premium Popup Interaction`
**Trigger Type**: Custom Event
**Event name**: `premium_popup_interaction`
**This trigger fires on**: All Custom Events

#### 5. Enhanced Search Trigger
**Trigger Name**: `Enhanced Search - Titles Page`
**Trigger Type**: Custom Event
**Event name**: `search_enhanced`
**This trigger fires on**: Some Custom Events
**Fire this trigger when**: `search_context` equals `titles_page`

### Phase 2: Create GTM Variables

#### Required Data Layer Variables

1. **Target Tier Variable**
   - **Variable Name**: `DLV - Target Tier`
   - **Variable Type**: Data Layer Variable
   - **Data Layer Variable Name**: `target_tier`

2. **Current Tier Variable**
   - **Variable Name**: `DLV - Current Tier`
   - **Variable Type**: Data Layer Variable
   - **Data Layer Variable Name**: `current_tier`

3. **Conversion Value Variable**
   - **Variable Name**: `DLV - Conversion Value`
   - **Variable Type**: Data Layer Variable
   - **Data Layer Variable Name**: `conversion_value`

4. **Feature Action Variable**
   - **Variable Name**: `DLV - Feature Action`
   - **Variable Type**: Data Layer Variable
   - **Data Layer Variable Name**: `feature_action`

5. **Upgrade Source Variable**
   - **Variable Name**: `DLV - Upgrade Source`
   - **Variable Type**: Data Layer Variable
   - **Data Layer Variable Name**: `upgrade_source`

6. **Search Context Variable**
   - **Variable Name**: `DLV - Search Context`
   - **Variable Type**: Data Layer Variable
   - **Data Layer Variable Name**: `search_context`

7. **Title ID Variable**
   - **Variable Name**: `DLV - Title ID`
   - **Variable Type**: Data Layer Variable
   - **Data Layer Variable Name**: `title_id`

8. **Popup Action Variable**
   - **Variable Name**: `DLV - Popup Action`
   - **Variable Type**: Data Layer Variable
   - **Data Layer Variable Name**: `popup_action`

### Phase 3: Create GA4 Event Tags

#### 1. Tier Upgrade Event Tag
**Tag Name**: `GA4 - Tier Upgrade Intent`
**Tag Type**: Google Analytics: GA4 Event
**Configuration Tag**: [Your GA4 Configuration Tag]
**Event Name**: `tier_upgrade_intent`
**Event Parameters**:
- `target_tier`: `{{DLV - Target Tier}}`
- `current_tier`: `{{DLV - Current Tier}}`
- `upgrade_source`: `{{DLV - Upgrade Source}}`
- `conversion_value`: `{{DLV - Conversion Value}}`
- `conversion_category`: `tier_upgrade`

**Triggering**: `Tier Upgrade Intent`

#### 2. Tier Downgrade Event Tag
**Tag Name**: `GA4 - Tier Downgrade Intent`
**Tag Type**: Google Analytics: GA4 Event
**Configuration Tag**: [Your GA4 Configuration Tag]
**Event Name**: `tier_downgrade_intent`
**Event Parameters**:
- `target_tier`: `{{DLV - Target Tier}}`
- `current_tier`: `{{DLV - Current Tier}}`
- `downgrade_reason`: `{{DLV - Downgrade Reason}}`
- `conversion_category`: `tier_downgrade`

**Triggering**: `Tier Downgrade Intent`

#### 3. Premium Feature Access Tag
**Tag Name**: `GA4 - Premium Feature Access`
**Tag Type**: Google Analytics: GA4 Event
**Configuration Tag**: [Your GA4 Configuration Tag]
**Event Name**: `premium_feature_access`
**Event Parameters**:
- `feature_action`: `{{DLV - Feature Action}}`
- `title_id`: `{{DLV - Title ID}}`
- `user_tier`: `{{DLV - Current Tier}}`
- `conversion_intent`: `{{DLV - Conversion Intent}}`

**Triggering**: `Premium Feature Access`

#### 4. Premium Popup Interaction Tag
**Tag Name**: `GA4 - Premium Popup Interaction`
**Tag Type**: Google Analytics: GA4 Event
**Configuration Tag**: [Your GA4 Configuration Tag]
**Event Name**: `premium_popup_interaction`
**Event Parameters**:
- `popup_action`: `{{DLV - Popup Action}}`
- `feature_name`: `{{DLV - Feature Name}}`
- `user_tier`: `{{DLV - Current Tier}}`
- `conversion_intent`: `{{DLV - Conversion Intent}}`

**Triggering**: `Premium Popup Interaction`

#### 5. Enhanced Search - Titles Page Tag
**Tag Name**: `GA4 - Enhanced Search (Titles Page)`
**Tag Type**: Google Analytics: GA4 Event
**Configuration Tag**: [Your GA4 Configuration Tag]
**Event Name**: `search_enhanced`
**Event Parameters**:
- `search_term`: `{{DLV - Search Term}}`
- `search_context`: `{{DLV - Search Context}}`
- `search_results`: `{{DLV - Search Results}}`
- `user_type`: `{{DLV - User Type}}`

**Triggering**: `Enhanced Search - Titles Page`

### Phase 4: Additional Data Layer Variables Needed

Add these additional variables for complete event tracking:

9. **Conversion Intent Variable**
   - **Variable Name**: `DLV - Conversion Intent`
   - **Variable Type**: Data Layer Variable
   - **Data Layer Variable Name**: `conversion_intent`

10. **Feature Name Variable**
    - **Variable Name**: `DLV - Feature Name`
    - **Variable Type**: Data Layer Variable
    - **Data Layer Variable Name**: `feature_name`

11. **Downgrade Reason Variable**
    - **Variable Name**: `DLV - Downgrade Reason`
    - **Variable Type**: Data Layer Variable
    - **Data Layer Variable Name**: `downgrade_reason`

12. **Search Term Variable**
    - **Variable Name**: `DLV - Search Term`
    - **Variable Type**: Data Layer Variable
    - **Data Layer Variable Name**: `search_term`

13. **Search Results Variable**
    - **Variable Name**: `DLV - Search Results`
    - **Variable Type**: Data Layer Variable
    - **Data Layer Variable Name**: `search_results`

14. **User Type Variable**
    - **Variable Name**: `DLV - User Type`
    - **Variable Type**: Data Layer Variable
    - **Data Layer Variable Name**: `user_type`

## Implementation Steps

### Step 1: Access GTM Container
1. Go to [Google Tag Manager](https://tagmanager.google.com)
2. Select container: `GTM-PZBC4XQT`

### Step 2: Create Variables (15 minutes)
1. Go to **Variables** → **New**
2. Create all 14 Data Layer Variables listed above
3. Save each variable

### Step 3: Create Triggers (10 minutes)
1. Go to **Triggers** → **New**
2. Create all 5 Custom Event Triggers listed above
3. Save each trigger

### Step 4: Create Tags (20 minutes)
1. Go to **Tags** → **New**
2. Create all 5 GA4 Event Tags listed above
3. Configure event parameters using the variables
4. Assign the appropriate triggers
5. Save each tag

### Step 5: Test Configuration (15 minutes)
1. Click **Preview** in GTM
2. Navigate to dashboard and perform actions:
   - Click "Upgrade to Pro" buttons
   - Click "Downgrade Plan" button
   - Click "View Sample" / "Upgrade Plan" in pitch popup
   - Search on /buyers/titles page
   - Click title cards in chat
3. Verify tags fire in GTM Preview mode
4. Check GA4 Real-time reports for events

### Step 6: Publish Changes
1. Click **Submit** in GTM
2. Add version name: "Fix Missing Event Tags"
3. Add description: "Added triggers and tags for tier_upgrade_intent, premium_feature_access, and other missing events"
4. Click **Publish**

## Expected Results After Configuration

✅ **GTM Preview**: All custom events should show tags firing
✅ **GA4 Real-time**: Events should appear with all parameters
✅ **Conversion Tracking**: Tier upgrades tracked with monetary values
✅ **Enhanced Analytics**: Detailed event data for analysis

## Troubleshooting

### If Tags Still Don't Fire:
1. **Check trigger conditions** - Ensure event names match exactly
2. **Verify variable names** - DataLayer variable names must match our code
3. **Test dataLayer** - Use browser console: `console.log(dataLayer)`
4. **Check GA4 configuration** - Ensure GA4 config tag is set up correctly

### If Events Don't Appear in GA4:
1. **Wait 15-30 minutes** - Real-time can have delays
2. **Check GA4 measurement ID** - Ensure it matches GTM configuration
3. **Verify enhanced measurement** - Some events may need custom dimensions

## Data Layer Events Being Sent

Our code implementation sends these events with full parameter data:

```javascript
// Example: tier_upgrade_intent event
{
  'event': 'tier_upgrade_intent',
  'target_tier': 'pro',
  'current_tier': 'basic',
  'upgrade_source': 'premium_popup',
  'conversion_category': 'tier_upgrade',
  'conversion_value': 250,
  'app_section': 'dashboard',
  'timestamp': '2025-01-28T...'
}
```

The tracking implementation is complete and working - this GTM configuration will connect it to GA4 properly.