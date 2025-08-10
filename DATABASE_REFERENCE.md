# KStoryBridge Database Reference Manual

This comprehensive reference documents the complete database structure used across all three applications (website, dashboard, admin) in the KStoryBridge monorepo.

## 🏗️ Architecture Overview

### Database Provider
- **Backend**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth with `auth.users` table
- **Row Level Security**: Enabled on most tables
- **Shared Instance**: Single Supabase project (`dlrnrgcoguxlkkcitlpd`) shared across all apps

### Application Database Usage
| Application | Primary Tables | Purpose |
|-------------|----------------|---------|
| **Website** | `user_buyers`, `user_ipowners`, `titles`, `featured` | Authentication, signup, content discovery |
| **Dashboard** | `user_buyers`, `user_ipowners`, `titles`, `user_favorites`, `request`, `profiles` | User management, content browsing, favorites |
| **Admin** | `admin`, `titles`, `profiles`, `user_buyers`, `user_ipowners` | Administrative management |

## 📊 Complete Table Schema

### Core User Tables

#### 1. `auth.users` (Supabase Built-in)
```sql
-- Supabase managed authentication table
-- Contains: id (UUID), email, encrypted_password, email_confirmed_at, etc.
-- Primary key: id (UUID)
-- References: Used by all user_* tables via foreign keys
```

#### 2. `user_buyers` - Buyer User Profiles
```sql
CREATE TABLE public.user_buyers (
  id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  user_id UUID NOT NULL, -- Duplicate reference for compatibility
  email TEXT NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  buyer_company TEXT,
  buyer_role buyer_role NOT NULL,
  linkedin_url TEXT,
  plan TEXT, -- Added later for subscription plans
  tier user_tier DEFAULT 'invited', -- New tier system
  invitation_status TEXT DEFAULT 'invited', -- Legacy status tracking
  requested BOOLEAN DEFAULT NULL, -- Request status
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Indexes:**
- `idx_user_buyers_tier` on `tier`
- `idx_user_buyers_user_id` on `user_id`

**Usage:**
- **Website**: User signup and authentication for buyers
- **Dashboard**: Profile management, tier-based feature access
- **Admin**: User management and tier administration

#### 3. `user_ipowners` - IP Owner/Creator Profiles  
```sql
CREATE TABLE public.user_ipowners (
  id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  user_id UUID NOT NULL, -- Duplicate reference for compatibility  
  email TEXT NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  pen_name_or_studio TEXT NOT NULL,
  ip_owner_role ip_owner_role NOT NULL,
  ip_owner_company TEXT,
  website_url TEXT,
  invitation_status TEXT DEFAULT 'invited',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Usage:**
- **Website**: User signup and authentication for creators/IP owners
- **Dashboard**: Creator profile management
- **Admin**: Creator user management

#### 4. `profiles` - Unified User Profile (Dashboard/Admin)
```sql
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY,
  account_type account_type NOT NULL, -- 'buyer' | 'ip_owner'
  email TEXT NOT NULL,
  full_name TEXT NOT NULL,
  -- Buyer specific fields
  buyer_company TEXT,
  buyer_role buyer_role,
  linkedin_url TEXT,
  -- IP Owner specific fields  
  ip_owner_company TEXT,
  ip_owner_role ip_owner_role,
  pen_name TEXT,
  website_url TEXT,
  -- Status tracking
  invitation_status TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Usage:**
- **Dashboard**: Alternative unified profile approach (not currently used in favor of separate user_buyers/user_ipowners)
- **Admin**: Profile viewing and management

#### 5. `admin` - Admin User Management
```sql
CREATE TABLE public.admin (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Usage:**
- **Admin**: Administrative access control and user management

### Content Tables

#### 6. `titles` - Content/IP Titles
```sql
CREATE TABLE public.titles (
  title_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID NOT NULL, -- References auth.users(id)
  
  -- Core title information
  title_name_kr TEXT NOT NULL,
  title_name_en TEXT,
  author TEXT,
  story_author TEXT,
  art_author TEXT,
  writer TEXT,
  illustrator TEXT,
  
  -- Content details
  content_format content_format, -- enum: webtoon, web_novel, book, etc.
  genre TEXT[], -- Array of genre strings
  tags TEXT[], -- Array of tag strings
  audience TEXT,
  tone TEXT,
  
  -- Description fields
  tagline TEXT,
  description TEXT,
  synopsis TEXT,
  perfect_for TEXT,
  pitch TEXT,
  note TEXT,
  
  -- Comparable titles (upgraded to array)
  comps TEXT[], -- Array of comparable title names
  
  -- Publishing details
  chapters INTEGER,
  completed BOOLEAN,
  rights TEXT,
  rights_owner TEXT,
  
  -- Engagement metrics
  views INTEGER DEFAULT 0,
  likes INTEGER DEFAULT 0,
  rating NUMERIC,
  rating_count INTEGER DEFAULT 0,
  
  -- Media
  title_image TEXT, -- URL to image
  title_url TEXT, -- External URL
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Indexes:**
- `idx_titles_creator_id` on `creator_id`
- `idx_titles_content_format` on `content_format`
- GIN index on `genre` array
- GIN index on `tags` array  
- GIN index on `comps` array

**Usage:**
- **Website**: Content discovery and featured titles
- **Dashboard**: Content browsing, search, and favorites
- **Admin**: Content management and administration

#### 7. `featured` - Featured Content Management
```sql
CREATE TABLE public.featured (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title_id UUID NOT NULL REFERENCES titles(title_id) ON DELETE CASCADE,
  note TEXT, -- Admin notes about why featured
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Usage:**
- **Website**: Homepage featured content display
- **Admin**: Featured content management

### User Interaction Tables

#### 8. `user_favorites` - User Favorite Titles
```sql
CREATE TABLE public.user_favorites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title_id UUID NOT NULL REFERENCES titles(title_id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, title_id)
);
```

**Usage:**
- **Dashboard**: Personal favorites management for buyers
- **Admin**: User engagement analytics

#### 9. `request` - Content Requests/Inquiries
```sql
CREATE TABLE public.request (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title_id UUID NOT NULL REFERENCES titles(title_id) ON DELETE CASCADE,
  type TEXT NOT NULL, -- Type of request (pitch, inquiry, etc.)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Usage:**
- **Dashboard**: Request tracking and management
- **Admin**: Request analytics and management

## 🔧 Database Enums

### 1. `account_type`
```sql
CREATE TYPE account_type AS ENUM ('ip_owner', 'buyer');
```

### 2. `buyer_role`  
```sql
CREATE TYPE buyer_role AS ENUM (
  'producer', 
  'executive', 
  'agent', 
  'content_scout', 
  'other'
);
```

### 3. `ip_owner_role`
```sql
CREATE TYPE ip_owner_role AS ENUM ('author', 'agent');
```

### 4. `content_format`
```sql
CREATE TYPE content_format AS ENUM (
  'webtoon',
  'web_novel', 
  'book',
  'script',
  'game',
  'animation',
  'other'
);
```

### 5. `user_tier` (New)
```sql
CREATE TYPE user_tier AS ENUM ('invited', 'basic', 'pro', 'suite');
```

## 🔗 Table Relationships

### Primary Relationships
```
auth.users (1) ──→ (1) user_buyers
auth.users (1) ──→ (1) user_ipowners  
auth.users (1) ──→ (1) profiles
auth.users (1) ──→ (N) user_favorites
auth.users (1) ──→ (N) request
auth.users (1) ──→ (N) titles (via creator_id)

titles (1) ──→ (N) user_favorites
titles (1) ──→ (N) request  
titles (1) ──→ (N) featured
```

### Foreign Key Details
| Table | Column | References | Cascade |
|-------|--------|------------|---------|
| `user_buyers` | `id` | `auth.users(id)` | DELETE CASCADE |
| `user_ipowners` | `id` | `auth.users(id)` | DELETE CASCADE |
| `user_favorites` | `user_id` | `auth.users(id)` | DELETE CASCADE |
| `user_favorites` | `title_id` | `titles(title_id)` | DELETE CASCADE |
| `request` | `user_id` | `auth.users(id)` | DELETE CASCADE |
| `request` | `title_id` | `titles(title_id)` | DELETE CASCADE |
| `featured` | `title_id` | `titles(title_id)` | DELETE CASCADE |

## 📱 App-Specific Usage Patterns

### Website App
**Primary Focus**: Authentication and Content Discovery
- **Signup Flow**: Creates records in `user_buyers` or `user_ipowners`
- **Content Display**: Reads from `titles` and `featured` tables
- **Authentication**: Uses Supabase auth with profile creation

### Dashboard App  
**Primary Focus**: User Management and Content Interaction
- **Profile Management**: Uses `user_buyers` and `user_ipowners` tables directly
- **Content Browsing**: Full `titles` table access with search and filtering
- **Favorites**: Manages `user_favorites` relationships
- **Requests**: Handles `request` table for user inquiries
- **Tier System**: Implements tier-based features via `user_buyers.tier`

### Admin App
**Primary Focus**: Administrative Control
- **User Management**: Access to all user tables for administration  
- **Content Management**: Full `titles` CRUD operations
- **Featured Content**: Manages `featured` table
- **Analytics**: Cross-table reporting and user insights
- **Admin Access**: Uses `admin` table for access control

## 🛡️ Security & Access Control

### Row Level Security (RLS) Policies
Most tables have RLS enabled with policies like:
- Users can only access their own profile data
- Users can only manage their own favorites and requests
- Public read access to titles and featured content
- Admin-only access for admin table operations

### Common Access Patterns
```sql
-- User accessing their own buyer profile
SELECT * FROM user_buyers WHERE id = auth.uid();

-- User accessing their favorites  
SELECT * FROM user_favorites WHERE user_id = auth.uid();

-- Public title browsing
SELECT * FROM titles WHERE title_id = $1;

-- Admin user management
SELECT * FROM user_buyers; -- (admin-only policy)
```

## 🔍 Query Patterns

### User Authentication & Profile
```sql
-- Get user's buyer profile
SELECT * FROM user_buyers WHERE user_id = $user_id;

-- Get user's tier for feature access
SELECT tier FROM user_buyers WHERE user_id = $user_id;

-- Check if user is admin
SELECT active FROM admin WHERE email = $email;
```

### Content Operations  
```sql
-- Search titles with array contains
SELECT * FROM titles 
WHERE tags && ARRAY[$tag] 
   OR genre && ARRAY[$genre]
   OR comps && ARRAY[$search_term];

-- Get featured titles
SELECT t.*, f.note 
FROM titles t 
JOIN featured f ON t.title_id = f.title_id
ORDER BY f.created_at DESC;

-- User's favorite titles
SELECT t.* 
FROM titles t
JOIN user_favorites uf ON t.title_id = uf.title_id  
WHERE uf.user_id = $user_id;
```

### Analytics & Reporting
```sql
-- User tier distribution
SELECT tier, COUNT(*) 
FROM user_buyers 
GROUP BY tier;

-- Popular content by engagement
SELECT title_name_kr, views, likes, rating
FROM titles 
ORDER BY (views + likes * 10 + COALESCE(rating * rating_count, 0)) DESC;

-- Recent user signups by type
SELECT 
  'buyer' as type, COUNT(*) as count
FROM user_buyers 
WHERE created_at > NOW() - INTERVAL '30 days'
UNION
SELECT 
  'ip_owner' as type, COUNT(*) as count  
FROM user_ipowners
WHERE created_at > NOW() - INTERVAL '30 days';
```

## 📝 Migration Management

### Migration File Locations
- **Website**: `/apps/website/supabase/migrations/`
- **Dashboard**: `/apps/dashboard/supabase/migrations/`  
- **Admin**: `/apps/admin/supabase/migrations/`

### Recent Major Migrations
1. **User Tables Creation** (`20250720101424`): Created `user_buyers` and `user_ipowners`
2. **Plan Addition** (`20250804180205`): Added `plan` field to `user_buyers`
3. **Tier System** (`20250810120000`): Added `tier` and updated `invitation_status` in `user_buyers`
4. **Comps Array Migration** (`20250810000000`): Converted `comps` from string to array in `titles`

### Schema Synchronization
- **Type Generation**: Each app has auto-generated TypeScript types in `src/integrations/supabase/types.ts`
- **Shared Schema**: All apps share the same Supabase project and schema
- **Migration Strategy**: Changes should be applied to all relevant apps to maintain consistency

## 🚨 Important Notes

### Development Guidelines
1. **Always use the correct table**: `user_buyers` for buyers, `user_ipowners` for creators
2. **Field naming consistency**: Use `user_id` for foreign key references to `auth.users(id)`
3. **Tier system**: Only applies to `user_buyers` table, not IP owners
4. **Array fields**: Use PostgreSQL array syntax and GIN indexes for `genre`, `tags`, `comps`
5. **Enum usage**: Always use defined enums for consistency

### Common Pitfalls
1. **Table confusion**: Don't mix `profiles` table with `user_buyers`/`user_ipowners` 
2. **Foreign key fields**: Use `user_id` not `id` when referencing auth users
3. **Tier access**: Only buyers have tiers, don't try to access tier for IP owners
4. **Array queries**: Use array operators (`&&`, `@>`, `<@`) for array field searches

---

**Document Version**: 1.0  
**Last Updated**: August 10, 2025  
**Scope**: All three applications (website, dashboard, admin)  
**Database**: Supabase PostgreSQL (`dlrnrgcoguxlkkcitlpd`)

This reference should be updated whenever significant schema changes are made to maintain accuracy for future development work.