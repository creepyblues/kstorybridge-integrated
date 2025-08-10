# Comps Field Array Migration Guide

This guide documents the migration of the `comps` field in the `titles` table from `string` to `text[]` (array) type and the corresponding code changes across both dashboard and admin apps.

## 🎯 Overview

The `comps` (comparable titles) field has been upgraded from a single string to an array of strings to better support multiple comparable titles for each content entry.

### Before (String)
```sql
comps: string | null
-- Example: "Title A, Title B, Title C"
```

### After (Array)
```sql
comps: text[] | null
-- Example: ["Title A", "Title B", "Title C"]
```

## 📊 Database Changes

### Migration File
- **Dashboard**: `/apps/dashboard/supabase/migrations/20250810000000-convert-comps-to-array.sql`
- **Admin**: `/apps/admin/supabase/migrations/20250810000000-convert-comps-to-array.sql`

### What the Migration Does
1. **Adds temporary column** `comps_array text[]`
2. **Converts existing data**:
   - `NULL` values remain `NULL`
   - Empty strings become `NULL`
   - Comma-separated strings become arrays: `"A, B, C"` → `["A", "B", "C"]`
   - Single values become single-item arrays: `"Title"` → `["Title"]`
3. **Removes old column** and renames new one
4. **Adds GIN index** for array search performance
5. **Preserves all existing data** with proper conversion

### To Apply Migration
```bash
# Dashboard
cd apps/dashboard
supabase db reset

# Admin  
cd apps/admin
supabase db reset

# Or use the helper script
node scripts/apply-comps-array-migration.js
```

## 🔧 TypeScript Type Changes

### Dashboard App
**File**: `/apps/dashboard/src/integrations/supabase/types.ts`
```typescript
// Before
comps: string | null

// After  
comps: string[] | null
```

### Admin App  
**File**: `/apps/admin/src/integrations/supabase/types.ts`
```typescript
// Before
comps: string | null

// After
comps: string[] | null
```

## 🎨 UI Component Changes

### New StringArrayInput Component
Created reusable component for managing string arrays:

**Dashboard**: `/apps/dashboard/src/components/ui/string-array-input.tsx`
**Admin**: `/apps/admin/src/components/ui/string-array-input.tsx`

**Features**:
- ✅ Add/remove individual items
- ✅ Comma-separated input support
- ✅ Duplicate prevention
- ✅ Visual badges for each item
- ✅ Keyboard shortcuts (Enter to add)
- ✅ Professional styling

### Form Updates

#### Dashboard AddTitle Form
**File**: `/apps/dashboard/src/pages/AddTitle.tsx`
```tsx
// Before
<Input
  value={formData.comps || ""}
  onChange={(e) => handleInputChange("comps", e.target.value)}
  placeholder="Similar successful titles"
/>

// After
<StringArrayInput
  label="Comparable Titles"
  placeholder="Add similar successful titles"
  value={formData.comps}
  onChange={(value) => handleInputChange("comps", value)}
/>
```

#### Admin AddTitle Form
**File**: `/apps/admin/src/pages/AdminAddTitle.tsx`
```tsx
// Before
<Textarea
  value={formData.comps || ""}
  onChange={(e) => handleInputChange("comps", e.target.value)}
  placeholder="Similar titles or comparable content"
/>

// After  
<StringArrayInput
  label=""
  placeholder="Add comparable titles"
  value={formData.comps}
  onChange={(value) => handleInputChange("comps", value)}
/>
```

### Display Component Updates

#### Dashboard TitleDetail
**File**: `/apps/dashboard/src/pages/TitleDetail.tsx`
```tsx
// Before
{title.comps ? (
  <div className="inline-block bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium">
    {title.comps}
  </div>
) : (...)}

// After
{title.comps && title.comps.length > 0 ? (
  <div className="space-y-1">
    {title.comps.map((comp, index) => (
      <div key={index} className="inline-block bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium mr-1 mb-1">
        {comp}
      </div>
    ))}
  </div>
) : (...)}
```

#### Admin TitleDetail
**File**: `/apps/admin/src/pages/AdminTitleDetail.tsx`
```tsx
// Before
<p className="text-gray-600 text-sm">{title.comps || 'Not specified'}</p>

// After
{title.comps && title.comps.length > 0 ? (
  <div className="flex flex-wrap gap-1">
    {title.comps.map((comp, index) => (
      <span key={index} className="bg-gray-100 text-gray-800 px-2 py-1 rounded text-xs">
        {comp}
      </span>
    ))}
  </div>
) : (
  <p className="text-gray-600 text-sm">Not specified</p>
)}
```

## 🔍 Search & Query Updates

### Service Layer Changes
Updated search queries to use array contains (`cs`) instead of text search (`ilike`):

**Dashboard**: `/apps/dashboard/src/services/titlesService.ts`
**Admin**: `/apps/admin/src/services/titlesService.ts`

```typescript
// Before
queryBuilder = queryBuilder.or(`...comps.ilike.%${query}%...`);

// After  
queryBuilder = queryBuilder.or(`...comps.cs.{${query}}...`);
```

### Scraper Service Updates
**File**: `/apps/admin/src/services/scraperService.ts`

```typescript
// Before
export interface ScrapedTitleData {
  comps?: string;
}

// After
export interface ScrapedTitleData {
  comps?: string[];
}

// Mock data updated
comps: data.comps || ['Similar Title 1', 'Similar Title 2']
```

## 🧪 Testing Checklist

### Database Migration
- [ ] Migration runs successfully without errors
- [ ] Existing string data converted to arrays correctly
- [ ] NULL values preserved
- [ ] Empty strings converted to NULL
- [ ] GIN index created successfully

### Dashboard App (`http://localhost:8080`)
- [ ] AddTitle form shows StringArrayInput component
- [ ] Can add multiple comparable titles
- [ ] Can remove individual titles
- [ ] Comma-separated input works
- [ ] Form submission saves array correctly
- [ ] TitleDetail displays multiple comps as badges
- [ ] Search functionality works with array data

### Admin App (`http://localhost:8082`)
- [ ] AdminAddTitle form shows StringArrayInput component
- [ ] Can add/remove comparable titles
- [ ] Form submission works correctly
- [ ] AdminTitleDetail shows comps as tags
- [ ] Scraper integration works with arrays
- [ ] Search functionality works

### Cross-App Compatibility
- [ ] Data created in dashboard displays in admin
- [ ] Data created in admin displays in dashboard  
- [ ] Search works consistently across both apps
- [ ] Array data preserved during updates

## 🚀 Deployment Steps

1. **Run Database Migration**
   ```bash
   # Apply migration on production database
   supabase db push
   ```

2. **Deploy Updated Code**
   ```bash
   # Deploy dashboard app
   npm run build:dashboard
   
   # Deploy admin app  
   npm run build:admin
   ```

3. **Verify Migration**
   - Check existing titles display correctly
   - Test form functionality
   - Verify search performance

## 🎯 Benefits

### For Users
- ✅ **Better Data Entry**: Visual interface for multiple titles
- ✅ **Cleaner Display**: Individual badges instead of comma text
- ✅ **Improved Search**: Better array-based search functionality
- ✅ **Duplicate Prevention**: UI prevents duplicate entries

### For Developers  
- ✅ **Type Safety**: Proper TypeScript array types
- ✅ **Better Queries**: Efficient array-based database queries
- ✅ **Reusable Component**: StringArrayInput for other fields
- ✅ **Data Integrity**: Structured data instead of free text

### For Database
- ✅ **Performance**: GIN index for fast array searches
- ✅ **Data Quality**: Structured array data vs comma strings
- ✅ **Query Flexibility**: Array operations and filtering
- ✅ **Backward Compatibility**: All existing data preserved

## 🔧 Troubleshooting

### Migration Issues
- **Problem**: Migration fails with foreign key constraints
- **Solution**: Check if titles are referenced by other tables

### UI Issues  
- **Problem**: StringArrayInput not displaying correctly
- **Solution**: Verify Badge component is available in shadcn/ui

### Search Issues
- **Problem**: Array search not working
- **Solution**: Verify GIN index was created and query uses `cs` operator

### Type Issues
- **Problem**: TypeScript errors with comps field
- **Solution**: Regenerate types from Supabase or update manually

## 📝 Next Steps

1. Consider applying similar array migration to other comma-separated fields (tags already uses arrays)
2. Add validation for maximum number of comparable titles
3. Implement autocomplete for comparable titles based on existing data
4. Add export/import functionality for bulk title management

---

**Migration completed successfully! 🎉**

The `comps` field is now a proper array type with improved UI and better database performance.