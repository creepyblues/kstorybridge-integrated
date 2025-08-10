# KStoryBridge User Tier System Manual

This manual documents the comprehensive user tier system for KStoryBridge, which manages buyer access levels and permissions across the platform.

## 🎯 Overview

The KStoryBridge tier system provides four distinct access levels for buyer accounts, ranging from initial invitation status to premium suite-level access. This system enables progressive feature unlocking and premium offerings.

## 📊 Tier Structure

### Tier Levels

| Tier | Status | Description | Access Level |
|------|--------|-------------|--------------|
| **invited** | Pending | User has been invited but not yet activated | Limited/None |
| **basic** | Active | Standard access with core features | Standard |
| **pro** | Active | Enhanced access with premium features | Premium |
| **suite** | Active | Full platform access with all features | Complete |

## 🏗️ Database Schema

### Profiles Table Structure

```sql
-- User tier field in profiles table
CREATE TYPE user_tier AS ENUM ('invited', 'basic', 'pro', 'suite');

ALTER TABLE profiles ADD COLUMN tier user_tier;

-- Index for efficient tier filtering
CREATE INDEX idx_profiles_tier ON profiles(tier);
```

### TypeScript Types

```typescript
// Database enum type
type UserTier = "invited" | "basic" | "pro" | "suite";

// Profile interface
interface Profile {
  id: string;
  email: string;
  full_name: string;
  account_type: "buyer" | "ip_owner";
  tier: UserTier | null;
  // ... other fields
}
```

## 🔄 Tier Progression

### Migration from Legacy System

The tier system replaced the previous `invitation_status` field:

| Legacy Status | New Tier | Migration Rule |
|--------------|----------|----------------|
| `"invited"` | `"invited"` | Direct mapping |
| `"accepted"` | `"basic"` | Upgraded to basic tier |
| `null` | `null` | Preserved as null |

### Upgrade Paths

```
invited → basic → pro → suite
   ↑        ↑      ↑      ↑
Invitation  Manual  Manual  Manual
Required   Upgrade  Upgrade Upgrade
```

## 💡 Feature Access by Tier

### Invited Tier
- **Status**: Pending activation
- **Access**: Minimal (login only)
- **Features**: 
  - Profile view
  - Basic dashboard
  - Account activation process
- **Limitations**: Cannot access premium content or features

### Basic Tier  
- **Status**: Active standard member
- **Access**: Core platform features
- **Features**:
  - Content browsing
  - Basic search
  - Title details
  - Basic favorites
  - Standard profile management
- **Limitations**: No advanced features or premium content

### Pro Tier
- **Status**: Active premium member  
- **Access**: Enhanced features
- **Features**:
  - All basic features
  - Advanced search filters
  - Priority support
  - Extended favorites
  - Advanced analytics
  - Premium content access
- **Limitations**: Some suite-exclusive features restricted

### Suite Tier
- **Status**: Active premium member with full access
- **Access**: Complete platform access
- **Features**:
  - All pro features
  - Complete analytics suite
  - API access
  - White-label options
  - Priority processing
  - Dedicated support
  - Custom integrations

## 🎨 UI Implementation

### Tier Display Styling

```tsx
const getTierStyling = (tier: string) => {
  switch (tier) {
    case 'suite':
      return "bg-purple-100 text-purple-800 border border-purple-200";
    case 'pro':
      return "bg-blue-100 text-blue-800 border border-blue-200";
    case 'basic':
      return "bg-green-100 text-green-800 border border-green-200";
    case 'invited':
    default:
      return "bg-slate-100 text-slate-800 border border-slate-200";
  }
};
```

### Tier Badge Component

```tsx
interface TierBadgeProps {
  tier: UserTier;
  size?: 'sm' | 'md' | 'lg';
}

const TierBadge = ({ tier, size = 'md' }: TierBadgeProps) => (
  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getTierStyling(tier)}`}>
    {tier === 'suite' ? 'Suite' : tier.charAt(0).toUpperCase() + tier.slice(1)}
  </span>
);
```

## 🔒 Permission Management

### Tier Checking Functions

```typescript
// Check if user has minimum tier access
export const hasMinimumTier = (userTier: UserTier | null, requiredTier: UserTier): boolean => {
  if (!userTier) return false;
  
  const tierHierarchy: Record<UserTier, number> = {
    invited: 0,
    basic: 1, 
    pro: 2,
    suite: 3
  };
  
  return tierHierarchy[userTier] >= tierHierarchy[requiredTier];
};

// Feature access helpers
export const canAccessPremiumContent = (tier: UserTier | null) => 
  hasMinimumTier(tier, 'pro');

export const canAccessSuiteFeatures = (tier: UserTier | null) => 
  hasMinimumTier(tier, 'suite');
```

### React Hook for Tier Management

```typescript
export const useTierAccess = () => {
  const { profile } = useAuth();
  
  return {
    tier: profile?.tier || null,
    isInvited: profile?.tier === 'invited',
    isBasic: profile?.tier === 'basic',
    isPro: profile?.tier === 'pro',
    isSuite: profile?.tier === 'suite',
    hasMinimumTier: (required: UserTier) => hasMinimumTier(profile?.tier, required),
    canAccessPremium: canAccessPremiumContent(profile?.tier),
    canAccessSuite: canAccessSuiteFeatures(profile?.tier)
  };
};
```

## 📈 Analytics & Reporting

### Tier Distribution Queries

```sql
-- Count users by tier
SELECT 
  tier,
  COUNT(*) as user_count,
  ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM profiles WHERE tier IS NOT NULL), 2) as percentage
FROM profiles 
WHERE tier IS NOT NULL
GROUP BY tier
ORDER BY 
  CASE tier
    WHEN 'suite' THEN 4
    WHEN 'pro' THEN 3  
    WHEN 'basic' THEN 2
    WHEN 'invited' THEN 1
  END DESC;

-- Monthly tier upgrades
SELECT 
  DATE_TRUNC('month', updated_at) as month,
  tier,
  COUNT(*) as upgrades
FROM profiles
WHERE tier IN ('pro', 'suite')
GROUP BY month, tier
ORDER BY month DESC, tier;
```

## 🚀 Implementation Checklist

### Database Migration
- [x] Create `user_tier` enum type
- [x] Add `tier` column to profiles table  
- [x] Migrate existing `invitation_status` data
- [x] Drop old `invitation_status` column
- [x] Create index on tier column

### TypeScript Updates
- [x] Update database types
- [x] Add tier enum to constants
- [x] Update profile interfaces

### UI Components  
- [x] Update profile display to show tier
- [x] Implement tier-based styling
- [x] Create tier badge component

### Feature Gating
- [ ] Implement tier checking utilities
- [ ] Add tier-based feature restrictions
- [ ] Create tier access hooks

### Admin Tools
- [ ] Add tier management interface
- [ ] Create tier upgrade workflows
- [ ] Implement tier analytics dashboard

## 🔧 Administrative Operations

### Manual Tier Updates

```sql
-- Upgrade user to pro tier
UPDATE profiles 
SET tier = 'pro', updated_at = NOW()
WHERE email = 'user@example.com';

-- Bulk upgrade from basic to pro
UPDATE profiles 
SET tier = 'pro', updated_at = NOW()
WHERE tier = 'basic' 
AND created_at < '2024-01-01';

-- Reset user to invited status
UPDATE profiles 
SET tier = 'invited', updated_at = NOW()
WHERE id = 'user-uuid';
```

### Tier Management Procedures

```sql
-- Function to safely upgrade tier
CREATE OR REPLACE FUNCTION upgrade_user_tier(
  user_id UUID,
  new_tier user_tier
) RETURNS BOOLEAN AS $$
DECLARE
  current_tier user_tier;
BEGIN
  SELECT tier INTO current_tier FROM profiles WHERE id = user_id;
  
  -- Ensure upgrade is valid (no downgrades without explicit permission)
  IF current_tier IS NULL OR 
     (current_tier = 'invited' AND new_tier IN ('basic', 'pro', 'suite')) OR
     (current_tier = 'basic' AND new_tier IN ('pro', 'suite')) OR
     (current_tier = 'pro' AND new_tier = 'suite') THEN
    
    UPDATE profiles 
    SET tier = new_tier, updated_at = NOW()
    WHERE id = user_id;
    
    RETURN TRUE;
  END IF;
  
  RETURN FALSE;
END;
$$ LANGUAGE plpgsql;
```

## 📋 Testing Guidelines

### Unit Tests

```typescript
describe('Tier System', () => {
  test('hasMinimumTier correctly identifies access levels', () => {
    expect(hasMinimumTier('suite', 'basic')).toBe(true);
    expect(hasMinimumTier('basic', 'pro')).toBe(false);
    expect(hasMinimumTier(null, 'basic')).toBe(false);
  });
  
  test('tier badge displays correct styling', () => {
    expect(getTierStyling('suite')).toContain('purple');
    expect(getTierStyling('pro')).toContain('blue');
    expect(getTierStyling('basic')).toContain('green');
  });
});
```

### Integration Tests

```typescript
describe('Profile Tier Display', () => {
  test('displays tier badge for each tier type', async () => {
    const tiers = ['invited', 'basic', 'pro', 'suite'];
    
    for (const tier of tiers) {
      const profile = createMockProfile({ tier });
      render(<ProfileComponent profile={profile} />);
      
      expect(screen.getByText(tier.charAt(0).toUpperCase() + tier.slice(1))).toBeInTheDocument();
    }
  });
});
```

## 🛠️ Troubleshooting

### Common Issues

1. **Migration fails with constraint violations**
   - Solution: Check for foreign key references and handle gracefully

2. **TypeScript errors after tier field update**  
   - Solution: Regenerate types from Supabase or update manually

3. **UI not displaying tier correctly**
   - Solution: Verify profile data structure and tier field mapping

4. **Tier-based features not working**
   - Solution: Check tier comparison logic and enum values

### Debug Queries

```sql
-- Check tier distribution
SELECT tier, COUNT(*) FROM profiles GROUP BY tier;

-- Find users with null tiers
SELECT id, email, tier FROM profiles WHERE tier IS NULL;

-- Verify tier enum values
SELECT unnest(enum_range(NULL::user_tier));
```

## 📝 Future Enhancements

### Planned Features
1. **Automatic Tier Progression**: Based on usage metrics and engagement
2. **Tier-based Pricing**: Integration with payment systems
3. **Custom Tier Creation**: Admin-configurable tier types
4. **Tier Expiration**: Time-limited premium access
5. **Tier Benefits Tracking**: Analytics on feature usage by tier

### API Extensions
1. **Tier Management API**: Programmatic tier updates
2. **Tier Analytics API**: Usage and conversion metrics  
3. **Tier Validation API**: Real-time access checking
4. **Tier Notification API**: Upgrade/downgrade notifications

---

**Migration Completed**: August 10, 2025  
**System Status**: Active in production  
**Documentation Version**: 1.0

The tier system provides a robust foundation for managing user access levels and premium features across the KStoryBridge platform. All buyers now have clear progression paths and feature access based on their tier level.