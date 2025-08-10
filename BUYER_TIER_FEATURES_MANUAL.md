# KStoryBridge Buyer Tier Features Reference Manual

This comprehensive manual documents all features available to each buyer tier level in the KStoryBridge Dashboard application. Use this guide for understanding access levels, implementing new features, and managing premium content.

## 🎯 Overview

The KStoryBridge buyer tier system provides four distinct access levels, each with progressively enhanced features and content access.

### Tier Hierarchy
```
invited → basic → pro → suite
   ↑        ↑      ↑      ↑
 No Access  Core  Premium Complete
```

## 📊 Feature Matrix

### Core Platform Access

| Feature | Invited | Basic | Pro | Suite |
|---------|---------|--------|-----|-------|
| **Platform Access** | ❌ | ✅ | ✅ | ✅ |
| **Basic Authentication** | ❌ | ✅ | ✅ | ✅ |
| **Profile Management** | ❌ | ✅ | ✅ | ✅ |

### Content Discovery & Browsing

| Feature | Invited | Basic | Pro | Suite |
|---------|---------|--------|-----|-------|
| **Title Browsing** | ❌ | ✅ | ✅ | ✅ |
| **Basic Title Details** | ❌ | ✅ | ✅ | ✅ |
| **Search Functionality** | ❌ | ✅ | ✅ | ✅ |
| **Featured Content** | ❌ | ✅ | ✅ | ✅ |
| **Basic Filtering** | ❌ | ✅ | ✅ | ✅ |
| **Advanced Search Filters** | ❌ | ❌ | ✅ | ✅ |
| **Premium Content Fields** | ❌ | ❌ | ✅ | ✅ |

### Content Interaction

| Feature | Invited | Basic | Pro | Suite |
|---------|---------|--------|-----|-------|
| **View Title Details** | ❌ | ✅ | ✅ | ✅ |
| **Basic Favorites** | ❌ | ✅ | ✅ | ✅ |
| **Content Requests** | ❌ | ✅ | ✅ | ✅ |
| **Extended Favorites List** | ❌ | ❌ | ✅ | ✅ |
| **Pitch Document Requests** | ❌ | ❌ | ✅ | ✅ |

### Premium Content Access

| Content Field | Invited | Basic | Pro | Suite |
|---------------|---------|--------|-----|-------|
| **Title Name** | ❌ | ✅ | ✅ | ✅ |
| **Genre** | ❌ | ✅ | ✅ | ✅ |
| **Synopsis** | ❌ | ✅ | ✅ | ✅ |
| **Author Info** | ❌ | ✅ | ✅ | ✅ |
| **Format** | ❌ | ✅ | ✅ | ✅ |
| **Comps (Comparable Titles)** | ❌ | ❌ | ✅ | ✅ |
| **Perfect For** | ❌ | ❌ | ✅ | ✅ |
| **Rights Owner** | ❌ | ❌ | ✅ | ✅ |
| **Audience** | ❌ | ❌ | ✅ | ✅ |
| **Market Analysis** | ❌ | ❌ | ❌ | ✅ |
| **Financial Data** | ❌ | ❌ | ❌ | ✅ |

### Analytics & Insights

| Feature | Invited | Basic | Pro | Suite |
|---------|---------|--------|-----|-------|
| **Basic Dashboard** | ❌ | ✅ | ✅ | ✅ |
| **Content Stats** | ❌ | ✅ | ✅ | ✅ |
| **Enhanced Analytics** | ❌ | ❌ | ✅ | ✅ |
| **Market Trends** | ❌ | ❌ | ✅ | ✅ |
| **Complete Analytics Suite** | ❌ | ❌ | ❌ | ✅ |
| **Custom Reports** | ❌ | ❌ | ❌ | ✅ |

## 🔒 Detailed Feature Descriptions

### 📋 **Invited Tier** (`tier: 'invited'`)
**Status**: Pending activation  
**Access Level**: None

#### Features Available:
- ❌ **No Dashboard Access**: Users are redirected to `/invited` page
- ❌ **No Content Access**: Cannot view any title information
- ❌ **Profile View Only**: Can only view basic profile information
- ✅ **Account Activation**: Can complete registration process

#### UI Behavior:
- Redirected to invitation pending page
- Cannot access any dashboard functionality
- Shows account activation instructions

---

### 📊 **Basic Tier** (`tier: 'basic'`)
**Status**: Standard active member  
**Access Level**: Core platform features

#### Features Available:
- ✅ **Full Dashboard Access**: Complete dashboard functionality
- ✅ **Content Browsing**: View all public title information
- ✅ **Basic Search**: Text-based search across titles
- ✅ **Favorites Management**: Save and organize favorite titles
- ✅ **Profile Management**: Edit personal and company information
- ✅ **Content Requests**: Request access to specific titles

#### Content Fields Visible:
- ✅ **Title Name** (Korean & English)
- ✅ **Author Information**
- ✅ **Genre & Tags**
- ✅ **Synopsis & Description**
- ✅ **Content Format** (Webtoon, Novel, etc.)
- ✅ **Basic Metrics** (Views, Likes, Rating)
- ✅ **Publication Status**

#### UI Behavior:
- Full access to dashboard navigation
- Can view all basic title information
- Premium fields show blur overlay with upgrade prompt

---

### 🔥 **Pro Tier** (`tier: 'pro'`)
**Status**: Premium active member  
**Access Level**: Enhanced features + Premium content

#### Additional Features (vs Basic):
- ✅ **Advanced Search Filters**: Genre, format, status filtering
- ✅ **Premium Content Fields**: Access to business-critical information
- ✅ **Extended Favorites**: Unlimited favorites with organization
- ✅ **Priority Support**: Faster response times
- ✅ **Enhanced Analytics**: Detailed engagement metrics
- ✅ **Pitch Document Access**: Request detailed pitch documents

#### **Premium Content Fields Unlocked**:

##### 🎯 **Comps (Comparable Titles)**
- **What it shows**: Array of similar successful titles
- **Business Value**: Market positioning and competitive analysis
- **Display**: Individual badges for each comparable title
- **Location**: Titles page (column) and Title detail page

##### 🎪 **Perfect For**
- **What it shows**: Target market and ideal use cases
- **Business Value**: Understanding market fit and positioning opportunities  
- **Display**: Blue badge with descriptive text
- **Location**: Title detail page under content information

##### ⚖️ **Rights Owner**
- **What it shows**: Legal rights holder information
- **Business Value**: Critical for licensing and deal negotiations
- **Display**: Rose-colored badge with owner details
- **Location**: Title detail page in rights section

##### 👥 **Audience**
- **What it shows**: Target demographic information
- **Business Value**: Market sizing and targeting decisions
- **Display**: Orange badge with audience details
- **Location**: Titles page (column) and Title detail page

#### UI Behavior:
- Premium fields display clearly without blur
- Advanced search options available
- Enhanced dashboard widgets and analytics

---

### 🏆 **Suite Tier** (`tier: 'suite'`)
**Status**: Complete platform access  
**Access Level**: All features + Suite-exclusive content

#### Additional Features (vs Pro):
- ✅ **Complete Analytics Suite**: Advanced reporting and insights
- ✅ **API Access**: Programmatic data access
- ✅ **White-label Options**: Custom branding capabilities
- ✅ **Priority Processing**: Faster request handling
- ✅ **Dedicated Support**: Direct support channel
- ✅ **Custom Integrations**: Platform integration support

#### **Suite-Exclusive Content** (Planned):
- 📈 **Market Analysis Data**: Performance predictions and trends
- 💰 **Financial Information**: Revenue data and licensing fees
- 📊 **Advanced Analytics**: Predictive modeling and insights
- 🔄 **Custom Workflows**: Tailored business processes

#### UI Behavior:
- All pro features plus suite-exclusive content
- Advanced dashboard with custom widgets
- Priority indicators throughout the interface

---

## 💻 Technical Implementation

### Component Architecture

#### **TierGatedContent Component**
```tsx
<TierGatedContent requiredTier="pro">
  {/* Premium content here */}
</TierGatedContent>
```

**Parameters**:
- `requiredTier`: `'basic' | 'pro' | 'suite'`
- `premiumLabel`: Custom label for upgrade prompt
- `fallbackContent`: Alternative content for restricted users

#### **useTierAccess Hook**
```tsx
const { 
  tier, 
  loading, 
  hasMinimumTier, 
  canAccessPremiumContent,
  canAccessSuiteFeatures 
} = useTierAccess();
```

**Returns**:
- `tier`: Current user tier
- `hasMinimumTier(required)`: Boolean access check
- `canAccessPremiumContent`: Pro+ access
- `canAccessSuiteFeatures`: Suite access

### Database Integration

#### **User Tier Storage**
- **Table**: `user_buyers`
- **Field**: `tier` (enum: `'invited' | 'basic' | 'pro' | 'suite'`)
- **Query**: `SELECT tier FROM user_buyers WHERE user_id = $1`

#### **Access Control Logic**
```typescript
const tierHierarchy = {
  invited: 0,  // No access
  basic: 1,    // Core features
  pro: 2,      // Premium content
  suite: 3     // Complete access
};

const hasAccess = tierHierarchy[userTier] >= tierHierarchy[requiredTier];
```

### UI Implementation Locations

#### **Titles Page** (`/src/pages/Titles.tsx`)
- **Comps Column**: Pro+ required for comparable titles list
- **Audience Column**: Pro+ required for demographic information
- **Visual Indicators**: "PRO PLAN" badges on column headers

#### **Title Detail Page** (`/src/pages/TitleDetail.tsx`)
- **Perfect For Section**: Pro+ required for market positioning
- **Comps Section**: Pro+ required for comparable titles array
- **Rights Owner Section**: Pro+ required for legal information
- **Audience Section**: Pro+ required for demographic data

### Feature Gating Examples

#### **Basic Implementation**
```tsx
// Simple content gating
<TierGatedContent requiredTier="pro">
  <div>Premium content here</div>
</TierGatedContent>
```

#### **Advanced Implementation**
```tsx
// Conditional rendering with tier check
{hasMinimumTier('pro') ? (
  <div>Full feature implementation</div>
) : (
  <div>Limited feature with upgrade prompt</div>
)}
```

#### **Fallback Content**
```tsx
// Custom fallback for better UX
<TierGatedContent 
  requiredTier="pro"
  fallbackContent={<div>Sample data preview</div>}
>
  <div>Real premium data</div>
</TierGatedContent>
```

## 🧪 Testing Guidelines

### Tier Testing Checklist

#### **Invited Tier Testing**
- [ ] User redirected to `/invited` page
- [ ] Cannot access dashboard functionality
- [ ] Profile view shows basic information only
- [ ] Upgrade prompts visible throughout

#### **Basic Tier Testing**  
- [ ] Full dashboard access granted
- [ ] All public content fields visible
- [ ] Premium fields show blur/upgrade overlay
- [ ] Search and favorites work correctly

#### **Pro Tier Testing**
- [ ] All basic features functional
- [ ] Premium content fields visible: Comps, Perfect For, Rights Owner, Audience
- [ ] Advanced search filters available
- [ ] No blur overlay on premium content

#### **Suite Tier Testing**
- [ ] All pro features functional
- [ ] Suite-exclusive features accessible
- [ ] Priority indicators visible
- [ ] Advanced analytics available

### Test Data Setup

#### **Mock Users by Tier**
```sql
-- Create test users for each tier
INSERT INTO user_buyers (user_id, tier, full_name, email) VALUES
('invited-user-id', 'invited', 'Invited User', 'invited@test.com'),
('basic-user-id', 'basic', 'Basic User', 'basic@test.com'),
('pro-user-id', 'pro', 'Pro User', 'pro@test.com'),
('suite-user-id', 'suite', 'Suite User', 'suite@test.com');
```

#### **Test Content with Premium Fields**
```sql
-- Ensure test titles have premium field data
UPDATE titles SET 
  comps = ARRAY['Popular Title 1', 'Similar Story 2'],
  perfect_for = 'Streaming platforms and international distributors',
  rights_owner = 'Example Rights Holdings LLC',
  audience = 'Young adults 18-35, fantasy enthusiasts'
WHERE title_id = 'test-title-id';
```

## 🎯 Business Rules

### Upgrade Paths
- **Invited → Basic**: Manual approval process
- **Basic → Pro**: Self-service upgrade or admin approval
- **Pro → Suite**: Contact sales or admin approval
- **Downgrades**: Admin-only operation

### Content Access Rules
1. **Cumulative Access**: Higher tiers include all lower tier features
2. **Immediate Effect**: Tier changes take effect immediately
3. **Graceful Degradation**: Users see appropriate upgrade prompts
4. **Data Security**: Premium content never cached in browser for lower tiers

### UI/UX Guidelines
1. **Clear Labeling**: All premium features marked with tier requirements
2. **Consistent Styling**: Uniform upgrade prompts and gating visuals
3. **Performance**: Tier checks optimized to avoid UI lag
4. **Accessibility**: Tier restrictions don't break keyboard navigation

## 📈 Future Enhancements

### Planned Pro Features
- **Advanced Analytics Dashboard**: Engagement metrics and trends
- **Bulk Actions**: Export, favorite, and request multiple titles
- **Custom Alerts**: Notifications for new content matching criteria
- **API Rate Limiting**: Higher API call limits for pro users

### Planned Suite Features
- **White-label Dashboard**: Custom branding and domain
- **Advanced API Access**: Full database access with higher limits
- **Priority Queue**: Faster processing for all requests
- **Custom Integration**: Webhook support and SSO integration

### Creator-Side Tiers (Future)
Similar tier system planned for IP owners/creators with different feature sets:
- **Creator Basic**: Profile management and title submission
- **Creator Pro**: Analytics and promotional tools  
- **Creator Suite**: Advanced marketing and rights management

---

**Manual Version**: 1.0  
**Last Updated**: August 10, 2025  
**Coverage**: Dashboard application buyer tier features  
**Next Review**: When new features are added or tiers modified

This manual should be updated whenever new features are added, tier structures change, or access rules are modified. Always test tier-based functionality after any changes to ensure proper access control and user experience.