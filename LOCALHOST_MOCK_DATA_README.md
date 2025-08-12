# Localhost Mock Data for KStoryBridge Development

This document explains how to use the extracted mock data for localhost development of the KStoryBridge platform.

## Files Generated

### 1. `localhost_mock_data_updated.json`
**Comprehensive mock data file with:**
- **User Profile**: Complete buyer profile for `sungho@dadble.com`
- **Featured Titles**: Top 6 featured titles with enhanced data
- **Regular Titles**: Top 6 general titles from the titles table
- **Enhanced Fields**: Ratings, view counts, descriptions, comps, and more

### 2. `localhost_mock_data.types.ts`
**TypeScript interfaces** for type-safe development with the mock data

### 3. `scripts/extract_mock_data.js`
**Extraction script** that pulls real data from Supabase and formats it for development

## Mock User Profile

### Sungho Lee (`sungho@dadble.com`)
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "email": "sungho@dadble.com",
  "full_name": "Sungho Lee",
  "tier": "pro",
  "company": "Dadble Inc.",
  "job_title": "Senior Product Manager",
  "bio": "Experienced product manager specializing in Korean content licensing and international media distribution. Passionate about bridging Korean creators with global audiences."
}
```

**Key Features:**
- ✅ **Pro Tier Access**: Can view all premium content
- ✅ **Realistic Profile**: Complete professional information
- ✅ **Active User**: Recent activity timestamps

## Featured Titles Collection

### 1. "Devil at the Crossroads" 
- **Genre**: LGBTQ+ Supernatural Comedy
- **Views**: 1M+ | **Rating**: 4.7/5 | **Chapters**: 16
- **Perfect For**: Comedy Series adaptation
- **Comps**: Little Demon, What We Do in the Shadows

### 2. "Sora's Eyes"
- **Genre**: LGBTQ+ Horror
- **Views**: 1M+ | **Rating**: 4.5/5 | **Chapters**: 68  
- **Perfect For**: Drama Series adaptation
- **Comps**: The Grudge, Train to Busan

### 3. "Werewolves Going Crazy Over Me"
- **Genre**: Supernatural Medical Drama
- **Views**: 2M+ | **Rating**: 4.8/5 | **Chapters**: 23
- **Perfect For**: Drama Series adaptation
- **Comps**: Vampire Diaries, Grey's Anatomy

### 4. "The Blood Moon"
- **Genre**: Vampire Romance
- **Views**: 1M+ | **Rating**: 4.6/5 | **Chapters**: 41
- **Status**: COMPLETED
- **Comps**: The Originals, True Blood

### 5. "The Fantastical After-School Writing Club"
- **Genre**: Romantic Comedy
- **Views**: 1M+ | **Rating**: 4.4/5 | **Chapters**: 19
- **Perfect For**: Drama Series adaptation
- **Comps**: The Pagemaster, Pride and Prejudice

### 6. "Like You've Never Been Hurt"
- **Genre**: College Romance Drama
- **Views**: 3.9M+ | **Rating**: 4.2/5 | **Chapters**: 47
- **Status**: COMPLETED
- **Comps**: Nevertheless, Romance is a Bonus Book

## Regular Titles Collection

Includes diverse Korean content from family comedies to extreme sports dramas, showcasing the platform's variety.

## Usage Instructions

### For Frontend Development

#### 1. **Import Mock Data**
```typescript
import mockData from './localhost_mock_data_updated.json';
import type { LocalhostMockData } from './localhost_mock_data.types';

const data: LocalhostMockData = mockData;
```

#### 2. **Mock Authentication**
```typescript
// Use the mock user for localhost auth bypass
const mockUser = mockData.user_buyers;

// For development, return mock user when auth is bypassed
if (isLocalhost && isDev) {
  return mockUser;
}
```

#### 3. **Mock API Responses**
```typescript
// Featured titles
const featuredTitles = mockData.featured_titles;

// Regular titles
const allTitles = mockData.titles;

// User-specific data
const userProfile = mockData.user_buyers;
```

### For Backend Development

#### 1. **Database Seeding**
Use the extracted data to seed your local database:

```sql
-- Insert mock user
INSERT INTO user_buyers (id, email, full_name, tier, company) 
VALUES ('550e8400-e29b-41d4-a716-446655440000', 'sungho@dadble.com', 'Sungho Lee', 'pro', 'Dadble Inc.');

-- Insert featured titles (use the JSON data)
-- Insert regular titles (use the JSON data)
```

#### 2. **API Endpoint Testing**
Test endpoints with realistic data:
- `/api/users/sungho@dadble.com` → Returns mock user
- `/api/featured` → Returns 6 featured titles
- `/api/titles` → Returns diverse title collection

### For Component Testing

#### 1. **Title Cards**
```typescript
// Test with various title types
const titles = mockData.titles;
titles.forEach(title => {
  // Test title card rendering
  renderTitleCard(title);
});
```

#### 2. **User Profile**
```typescript
// Test profile display
const user = mockData.user_buyers;
renderUserProfile(user);
```

#### 3. **Featured Content**
```typescript
// Test featured sections
const featured = mockData.featured_titles;
renderFeaturedCarousel(featured);
```

## Data Refresh

### Manual Update
```bash
# Re-extract fresh data from Supabase
node scripts/extract_mock_data.js
```

### Automatic Integration
The script can be integrated into development workflows:

```json
{
  "scripts": {
    "dev:refresh-data": "node scripts/extract_mock_data.js && npm run dev",
    "dev:with-fresh-data": "npm run dev:refresh-data"
  }
}
```

## Development Benefits

### ✅ **Realistic Data**
- Real titles from the production database
- Authentic Korean content metadata
- Proper genre classifications and ratings

### ✅ **Complete User Journey**
- Pro tier user with full access
- Realistic view counts and engagement metrics
- Diverse content types for testing

### ✅ **Enhanced Testing**
- Premium content features
- Rating and review systems
- Complex metadata fields (comps, keywords, etc.)

### ✅ **Performance Testing**
- Large view numbers (up to 3.9M)
- Multiple content formats
- Varied data completeness

## Environment Configuration

### Development Mode Detection
```typescript
const isLocalhost = window.location.hostname === 'localhost';
const isDev = import.meta.env.DEV;
const shouldUseMockData = isLocalhost && isDev;

if (shouldUseMockData) {
  // Use mock data from localhost_mock_data_updated.json
}
```

### Feature Flags
```typescript
const FEATURES = {
  USE_MOCK_AUTH: isLocalhost && isDev,
  USE_MOCK_TITLES: isLocalhost && isDev,
  BYPASS_PREMIUM_CHECKS: isLocalhost && isDev
};
```

## Data Completeness

The mock data includes:
- ✅ **User Authentication**: Complete buyer profile
- ✅ **Content Discovery**: Featured and regular titles
- ✅ **Premium Features**: Pro tier access, pitch documents
- ✅ **Engagement Metrics**: Views, likes, ratings
- ✅ **Content Metadata**: Genres, tags, descriptions, comps
- ✅ **Media Assets**: Cover images and external links

This comprehensive mock data enables full-featured localhost development and testing of the KStoryBridge platform.