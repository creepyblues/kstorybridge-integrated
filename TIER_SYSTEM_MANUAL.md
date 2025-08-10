# KStoryBridge User Tier System Manual

This manual documents the comprehensive user tier system for KStoryBridge, which manages buyer access levels and permissions across the platform.

## 🎯 Overview

The KStoryBridge tier system provides four distinct access levels for buyer accounts, ranging from initial invitation status to premium suite-level access. This system enables progressive feature unlocking and premium offerings through the `user_buyers` table.

## 📊 Tier Structure

### Tier Levels

| Tier | Status | Description | Access Level |
|------|--------|-------------|--------------|
| **invited** | Pending | User has been invited but not yet activated | Limited/None |
| **basic** | Active | Standard access with core features | Standard |
| **pro** | Active | Enhanced access with premium features | Premium |
| **suite** | Active | Full platform access with all features | Complete |

## 🏗️ Database Schema

### User_Buyers Table Structure

```sql
-- User tier field in user_buyers table
CREATE TYPE user_tier AS ENUM ('invited', 'basic', 'pro', 'suite');

ALTER TABLE user_buyers ADD COLUMN tier user_tier DEFAULT 'invited';
ALTER TABLE user_buyers ADD COLUMN invitation_status TEXT DEFAULT 'invited';

-- Index for efficient tier filtering
CREATE INDEX idx_user_buyers_tier ON user_buyers(tier);
```

### Current Table Structure
```sql
CREATE TABLE user_buyers (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  requested BOOLEAN DEFAULT NULL,
  tier user_tier DEFAULT 'invited',
  invitation_status TEXT DEFAULT 'invited'
);
```

### TypeScript Types

```typescript
// Database enum type
type UserTier = "invited" | "basic" | "pro" | "suite";

// User_buyers table interface
interface UserBuyer {
  id: string;
  user_id: string;
  created_at: string;
  requested: boolean | null;
  tier: UserTier | null;
  invitation_status: string | null;
}
```

## 🔄 Tier Progression

### Migration from Legacy System

The tier system is new addition to the `user_buyers` table:

| Initial State | New Tier | Migration Rule |
|---------------|----------|----------------|
| Existing records | `"basic"` | All existing users upgraded to basic |
| New invitations | `"invited"` | New users start as invited |
| Manual upgrades | `"pro"` or `"suite"` | Admin-managed upgrades |

### Upgrade Paths

```
invited → basic → pro → suite
   ↑        ↑      ↑      ↑
Invitation  Admin  Admin  Admin
Required   Upgrade Upgrade Upgrade
```

## 💡 Feature Access by Tier

### Invited Tier
- **Status**: Pending activation
- **Access**: Minimal (login only)
- **Features**: 
  - Profile view
  - Basic dashboard
  - Account activation process
- **Limitations**: Cannot access content or premium features

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

### User Tier Service

```typescript
// Service to get user tier information
export const userTierService = {
  // Get tier for current user
  async getCurrentUserTier(userId: string): Promise<UserTier | null> {
    const { data, error } = await supabase
      .from('user_buyers')
      .select('tier')
      .eq('user_id', userId)
      .single();
    
    if (error) return null;
    return data.tier;
  },
  
  // Update user tier (admin only)
  async updateUserTier(userId: string, newTier: UserTier): Promise<boolean> {
    const { error } = await supabase
      .from('user_buyers')
      .update({ tier: newTier })
      .eq('user_id', userId);
    
    return !error;
  },
  
  // Check if user exists in user_buyers
  async getBuyerProfile(userId: string) {
    const { data, error } = await supabase
      .from('user_buyers')
      .select('*')
      .eq('user_id', userId)
      .single();
    
    return { data, error };
  }
};
```

### React Hook for Tier Management

```typescript
export const useTierAccess = () => {
  const { user } = useAuth();
  const [tier, setTier] = useState<UserTier | null>(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    if (user?.id) {
      userTierService.getCurrentUserTier(user.id).then(userTier => {
        setTier(userTier);
        setLoading(false);
      });
    }
  }, [user?.id]);
  
  return {
    tier,
    loading,
    isInvited: tier === 'invited',
    isBasic: tier === 'basic',
    isPro: tier === 'pro',
    isSuite: tier === 'suite',
    hasMinimumTier: (required: UserTier) => hasMinimumTier(tier, required),
    canAccessPremium: canAccessPremiumContent(tier),
    canAccessSuite: canAccessSuiteFeatures(tier)
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
  ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM user_buyers WHERE tier IS NOT NULL), 2) as percentage
FROM user_buyers 
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
  DATE_TRUNC('month', created_at) as month,
  tier,
  COUNT(*) as new_users
FROM user_buyers
WHERE tier IN ('basic', 'pro', 'suite')
GROUP BY month, tier
ORDER BY month DESC, tier;

-- Tier progression over time
SELECT 
  u.id,
  u.user_id, 
  u.tier,
  u.created_at as joined_date,
  auth.email
FROM user_buyers u
JOIN auth.users auth ON u.user_id = auth.id
ORDER BY u.created_at DESC;
```

## 🚀 Implementation Checklist

### Database Migration
- [x] Create `user_tier` enum type
- [x] Add `tier` column to user_buyers table  
- [x] Add `invitation_status` column for tracking
- [x] Set default values for existing users
- [x] Create indexes for performance

### TypeScript Updates
- [x] Update user_buyers table types
- [x] Add tier enum to constants
- [x] Keep profiles table unchanged

### UI Components  
- [ ] Create tier display in user profile
- [ ] Implement tier-based styling
- [ ] Create tier badge component
- [ ] Update dashboard to show tier status

### Service Layer
- [ ] Implement userTierService
- [ ] Add tier checking utilities
- [ ] Create tier access hooks
- [ ] Add tier-based feature restrictions

### Admin Tools
- [ ] Add tier management interface
- [ ] Create tier upgrade workflows
- [ ] Implement tier analytics dashboard

## 🔧 Administrative Operations

### Manual Tier Updates

```sql
-- Upgrade user to pro tier
UPDATE user_buyers 
SET tier = 'pro', invitation_status = 'accepted'
WHERE user_id = 'user-uuid';

-- Bulk upgrade recent users to basic
UPDATE user_buyers 
SET tier = 'basic', invitation_status = 'accepted'
WHERE tier = 'invited' 
AND created_at > '2024-01-01';

-- Find users ready for upgrade
SELECT ub.id, ub.user_id, ub.tier, au.email, ub.created_at
FROM user_buyers ub
JOIN auth.users au ON ub.user_id = au.id
WHERE ub.tier = 'invited'
ORDER BY ub.created_at ASC;
```

### Tier Management Procedures

```sql
-- Function to safely upgrade tier
CREATE OR REPLACE FUNCTION upgrade_user_tier(
  target_user_id UUID,
  new_tier user_tier
) RETURNS BOOLEAN AS $$
DECLARE
  current_tier user_tier;
BEGIN
  SELECT tier INTO current_tier FROM user_buyers WHERE user_id = target_user_id;
  
  -- Ensure upgrade is valid (no downgrades without explicit permission)
  IF current_tier IS NULL OR 
     (current_tier = 'invited' AND new_tier IN ('basic', 'pro', 'suite')) OR
     (current_tier = 'basic' AND new_tier IN ('pro', 'suite')) OR
     (current_tier = 'pro' AND new_tier = 'suite') THEN
    
    UPDATE user_buyers 
    SET tier = new_tier, invitation_status = 'accepted'
    WHERE user_id = target_user_id;
    
    RETURN TRUE;
  END IF;
  
  RETURN FALSE;
END;
$$ LANGUAGE plpgsql;

-- Function to create new buyer with tier
CREATE OR REPLACE FUNCTION create_buyer_with_tier(
  target_user_id UUID,
  initial_tier user_tier DEFAULT 'invited'
) RETURNS BOOLEAN AS $$
BEGIN
  INSERT INTO user_buyers (user_id, tier, invitation_status)
  VALUES (target_user_id, initial_tier, 
    CASE WHEN initial_tier = 'invited' THEN 'invited' ELSE 'accepted' END)
  ON CONFLICT (user_id) DO NOTHING;
  
  RETURN TRUE;
EXCEPTION
  WHEN OTHERS THEN
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql;
```

## 📋 Code Integration Examples

### Profile Component Updates

```tsx
// Update existing Profile.tsx to show tier from user_buyers
const Profile = () => {
  const { user } = useAuth();
  const [buyerProfile, setBuyerProfile] = useState<UserBuyer | null>(null);
  
  useEffect(() => {
    const fetchBuyerProfile = async () => {
      if (!user?.id) return;
      
      const { data, error } = await supabase
        .from('user_buyers')
        .select('*')
        .eq('user_id', user.id)
        .single();
      
      if (!error) {
        setBuyerProfile(data);
      }
    };
    
    fetchBuyerProfile();
  }, [user?.id]);
  
  return (
    <div>
      {/* Other profile info */}
      
      {buyerProfile?.tier && (
        <div className="space-y-2">
          <Label>Membership Tier</Label>
          <TierBadge tier={buyerProfile.tier} />
        </div>
      )}
    </div>
  );
};
```

### Feature Gating Example

```tsx
const PremiumFeature = () => {
  const { tier, loading } = useTierAccess();
  
  if (loading) return <div>Loading...</div>;
  
  if (!hasMinimumTier(tier, 'pro')) {
    return (
      <div className="p-4 border rounded-lg bg-gray-50">
        <h3>Premium Feature</h3>
        <p>Upgrade to Pro to access this feature.</p>
        <Button>Upgrade Now</Button>
      </div>
    );
  }
  
  return <div>Premium feature content here</div>;
};
```

## 🛠️ Troubleshooting

### Common Issues

1. **Migration fails with constraint violations**
   - Solution: Check if user_id references exist in auth.users table

2. **User tier not showing**  
   - Solution: Verify user exists in user_buyers table with valid tier value

3. **TypeScript errors with tier field**
   - Solution: Ensure user_buyers types are updated with tier field

4. **Tier-based features not working**
   - Solution: Check tier comparison logic and enum values

### Debug Queries

```sql
-- Check tier distribution in user_buyers
SELECT tier, COUNT(*) FROM user_buyers GROUP BY tier;

-- Find users without tier
SELECT * FROM user_buyers WHERE tier IS NULL;

-- Verify user_tier enum values
SELECT unnest(enum_range(NULL::user_tier));

-- Check specific user's tier
SELECT ub.*, au.email 
FROM user_buyers ub 
JOIN auth.users au ON ub.user_id = au.id 
WHERE au.email = 'user@example.com';
```

### Profile Component Debug

```typescript
// Add to Profile component for debugging
useEffect(() => {
  console.log('Current user:', user);
  console.log('Buyer profile:', buyerProfile);
  console.log('User tier:', buyerProfile?.tier);
}, [user, buyerProfile]);
```

## 📝 Future Enhancements

### Planned Features
1. **Automatic Tier Progression**: Based on usage metrics and engagement
2. **Tier-based Pricing**: Integration with payment systems
3. **Custom Tier Creation**: Admin-configurable tier types
4. **Tier Expiration**: Time-limited premium access
5. **Tier Benefits Tracking**: Analytics on feature usage by tier

### API Extensions
1. **Tier Management API**: Programmatic tier updates via user_buyers table
2. **Tier Analytics API**: Usage and conversion metrics  
3. **Tier Validation API**: Real-time access checking
4. **Tier Notification API**: Upgrade/downgrade notifications

### Database Optimizations
1. **Composite Indexes**: On (user_id, tier) for faster lookups
2. **Materialized Views**: For tier analytics and reporting
3. **Triggers**: Automatic tier change logging
4. **RLS Policies**: Row-level security for tier access

---

**Migration Completed**: August 10, 2025  
**System Status**: Active in production  
**Table**: `user_buyers` (not profiles)  
**Documentation Version**: 2.0

The tier system is now correctly implemented in the `user_buyers` table, providing a robust foundation for managing buyer access levels and premium features across the KStoryBridge platform. All buyers have clear progression paths through the tier system based on their records in the user_buyers table.