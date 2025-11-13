# Design System - KStoryBridge

**Last Updated**: 2025-11-12

This document defines the visual design standards for all KStoryBridge applications.

## 🎨 Color Palette

### Primary Colors
- **Primary Text**: `text-black` - Labels, headings, field names
- **Secondary**: `midnight-ink` (#1e293b), `porcelain-blue` (#e2e8f0)
- **Accent**: `sunrise-coral` - CTAs and highlights
- **Neutrals**: `gray-50`, `gray-100`, `gray-200`, `gray-300`, `gray-500`, `gray-900`

### Status Colors
- **Success**: `green-*` classes
- **Error**: `red-*` classes
- **Info**: `blue-*` classes

### Link Styling
```jsx
<a className="text-black hover:text-gray-700">Link Text</a>
```

### 🚫 PROHIBITED COLORS

**NEVER USE YELLOW:**
- ❌ Any yellow backgrounds (`bg-yellow-*`, `hover:bg-yellow-*`)
- ❌ Yellow borders or text colors
- ❌ Yellow hex values (#FBBC05, #FCD34D, etc.)
- ✅ **Replace with**: `gray-500` (#6B7280) or brand colors

## 🔘 Button Design

### Standard Button (Default)
```jsx
<Button
  variant="outline"
  className="border-gray-300 hover:bg-gray-100"
>
  Button Text
</Button>
```

### Responsive Button
```jsx
<Button
  variant="outline"
  className="w-full sm:w-auto border-gray-300 hover:bg-gray-100"
>
  Button Text
</Button>
```

### Destructive Action Button
```jsx
<Button
  variant="outline"
  className="border-gray-300 hover:bg-gray-100 text-red-600"
>
  Sign Out
</Button>
```

### Button Requirements
- **Variant**: Always `variant="outline"`
- **Border**: Always `border-gray-300`
- **Hover**: Always `hover:bg-gray-100`
- **Text only**: No icons in buttons
- **No effects**: No shadows, gradients, glows, animations
- **Consistent spacing**: Use default Button padding

## 📦 Card/Container Design

### Standard Card (Mandatory Pattern)
```jsx
<Card className="bg-transparent border-gray-300 shadow-none rounded-2xl mb-6 sm:mb-8 lg:mb-12">
  <CardContent className="p-4 sm:p-6">
    {/* Content */}
  </CardContent>
</Card>
```

### Card Requirements (Strict)
- **Background**: `bg-transparent` - NO solid backgrounds
- **Border**: `border-gray-300` - Light gray only
- **Shadow**: `shadow-none` - NO shadows of any kind
- **Corners**: `rounded-2xl` - Large consistent radius
- **Spacing**: `mb-6 sm:mb-8 lg:mb-12` - Responsive margins
- **Padding**: `p-4 sm:p-6` - Responsive internal padding

### Design Reference
**See**: `/buyers/profile` page for visual reference implementation

### ✅ DO
- Use transparent backgrounds for all cards
- Use light gray borders for structure
- Keep design flat and minimal
- Follow Profile page design standard

### ❌ DON'T
- Use `bg-white` or solid background colors
- Add shadows (`shadow-sm`, `shadow-lg`, etc.)
- Use heavy or dark borders
- Create visual "weight" or depth effects

## 📄 Standard Page Structure

All pages in the Creator app MUST follow this consistent structure pattern.

### Page Container
```jsx
<MainLayout>
  <div className="max-w-7xl mx-auto">
    {/* Page content */}
  </div>
</MainLayout>
```

### Page Header
```jsx
<div className="mb-6 sm:mb-8">
  <h1 className="text-2xl sm:text-3xl font-bold text-black">Page Title</h1>
  <p className="text-gray-600 mt-2">Optional subtitle or description</p>
</div>
```

### Loading State
```jsx
{loading && (
  <div className="text-center py-12">
    <p className="text-gray-500">Loading...</p>
  </div>
)}
```

### Error State
```jsx
{error && (
  <div className="text-center py-12">
    <p className="text-red-500">{error}</p>
    <Button
      onClick={handleRetry}
      variant="outline"
      className="mt-4 border-gray-300 hover:bg-gray-100"
    >
      Retry
    </Button>
  </div>
)}
```

### Empty State
```jsx
{!loading && !error && items.length === 0 && (
  <div className="text-center py-12">
    <p className="text-gray-500">No items found...</p>
  </div>
)}
```

### Page Structure Requirements
- **Container**: `max-w-7xl mx-auto` - Wide container with centered content
- **Page Title**: `text-2xl sm:text-3xl font-bold text-black` - Responsive typography
- **Title Margin**: `mb-6 sm:mb-8` - Responsive spacing
- **Title Color**: `text-black` - Not `text-gray-900`
- **Loading State**: Simple text message, no spinners or cards
- **Error State**: Red text (`text-red-500`), standard borders (not `border-red-300`)
- **Error Cards**: Use `border-gray-300`, not colored borders
- **Empty State**: Simple centered gray text

### ✅ Complete Example
```jsx
export default function MyPage() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [items, setItems] = useState([])

  return (
    <MainLayout>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-black">My Page</h1>
          <p className="text-gray-600 mt-2">Page description</p>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="text-center py-12">
            <p className="text-gray-500">Loading...</p>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="text-center py-12">
            <p className="text-red-500">{error}</p>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && items.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">No items found</p>
          </div>
        )}

        {/* Content */}
        {!loading && !error && items.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Cards or content */}
          </div>
        )}
      </div>
    </MainLayout>
  )
}
```

### Design References
- **✅ Standard Pages**: `/titles`, `/home`, `/profile`, `/titles/add-title`, `/titles/:id/edit`
- **✅ Visual Reference**: All creator app pages follow this pattern

## 🔤 Typography

### Font Family
**Default**: SF Pro (automatically applied to all text)

```css
font-family: -apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Helvetica Neue", Arial, sans-serif;
```

### No Class Required
SF Pro is now the default font - no `font-sf-pro` class needed.

### Typography Standards
```jsx
// Headers
<h3 className="text-lg font-semibold text-gray-900">
  Header Text
</h3>

// Field Labels
<h5 className="font-semibold text-black mb-1 text-sm sm:text-base">
  Field Label
</h5>

// Body Text
<p className="text-gray-600 text-sm">
  Body text content
</p>
```

### Typography Requirements
- **Primary Labels**: `text-black` + `font-semibold`
- **Body Text**: `text-gray-600`
- **Consistent Sizing**: Use responsive text sizes
- **No Emojis**: Unless explicitly requested

## 🏷️ Badge Design

### Standard Badge Pattern
```tsx
// Custom color badge
<span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-red-500 text-white">
  BETA
</span>

// Using Badge component
<Badge className="bg-pro-purple text-white">Pro</Badge>
```

### Badge Requirements
- **Shape**: `rounded-full` (pill shape)
- **Padding**: `px-2.5 py-0.5` (10px horizontal, 2px vertical)
- **Font Size**: `text-xs` (12px)
- **Font Weight**: `font-semibold` (NOT font-bold)
- **Text Transform**: Normal case (NO uppercase)
- **Letter Spacing**: Normal (NO tracking-wider)

### ✅ CORRECT
```tsx
<span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-red-500 text-white">
  BETA
</span>
```

### ❌ INCORRECT
```tsx
<span className="px-1.5 py-0.5 text-[10px] font-bold rounded-full uppercase tracking-wider">
  BETA
</span>
```

### Color Preservation Rule
- **Always preserve brand-specific colors** when standardizing badges
- Only update sizing, shape, font weight, text transform
- Do NOT change background or text colors during updates

### Badge Component Location
`packages/ui/src/components/badge.tsx` (shared across monorepo)

## 📋 Form Standards

### Form Patterns
- Use React Hook Form + Zod validation
- Array fields: Comma-separated input with parsing
- Confirmation dialogs for destructive actions
- Field validation and error display

### Label Pattern
```jsx
<Label className="font-semibold text-black">
  Field Name
</Label>
```

## 🎯 Responsive Design

### Breakpoints (Tailwind defaults)
- `sm`: 640px
- `md`: 768px
- `lg`: 1024px
- `xl`: 1280px
- `2xl`: 1536px

### Responsive Pattern
```jsx
className="mb-6 sm:mb-8 lg:mb-12 text-sm sm:text-base"
```

## 🧩 Component Usage

### shadcn/ui Components
- All apps use identical shadcn/ui components
- Located in `src/components/ui/` (auto-generated)
- **DO NOT edit manually** - regenerate if changes needed

### Shared Components
- Card, Button, Badge, Label, Input, etc.
- Radix UI primitives for accessibility
- Consistent API across all apps

## 📦 Custom Components Library

### TitleCard Component
**Location**: `src/components/title/TitleCard.tsx`

Unified component for displaying title information across all pages.

#### Variants
```tsx
// Grid variant (default) - For Titles and Saved pages
<TitleCard title={title} variant="grid" />

// Compact variant - For Chat page and inline displays
<TitleCard title={title} variant="compact" />

// With remove functionality - For Saved page
<TitleCard
  title={title}
  variant="grid"
  onRemove={handleRemove}
  removing={isRemoving}
/>
```

#### Features
- Automatic data format normalization (handles both Title and ChatTitle formats)
- Responsive image display
- Consistent metadata badges (genre, format)
- Stats display (views, rating, pitch availability)
- Click-to-navigate built-in
- Optional remove button for favorites

#### Usage Guidelines
- **Always use TitleCard** instead of inline Card code for title displays
- Use `variant="grid"` for browse/list pages
- Use `variant="compact"` for inline recommendations or chat results
- Pass `onRemove` prop only when removal functionality is needed

### TitleMetadata Component
**Location**: `src/components/title/TitleMetadata.tsx`

Sub-component for displaying title metadata (badges + stats).

```tsx
<TitleMetadata title={title} compact={false} />
```

**Automatically handles**:
- Genre and format badges
- View count formatting (K/M notation)
- Rating display (1 decimal)
- Pitch availability indicator

### EmptyState Component
**Location**: `src/components/common/EmptyState.tsx`

Standardized empty state display.

```tsx
<EmptyState
  icon={Heart}
  title="No saved titles yet"
  description="Save titles to find them easily later"
  actionLabel="Browse Titles"
  onAction={() => navigate('/buyers/titles')}
/>
```

**Props**:
- `icon`: Lucide icon component
- `title`: Main message
- `description`: Optional supporting text
- `actionLabel` + `onAction`: Optional CTA button

### LoadingState Component
**Location**: `src/components/common/LoadingState.tsx`

Standardized loading indicator.

```tsx
<LoadingState message="Loading titles..." />
// or
<LoadingState /> // No message
```

**Props**:
- `message`: Optional loading text
- `className`: Optional custom spacing (default: `py-12`)

## 🔄 Component Modulization Benefits

### Consistency
- All title cards look identical across pages
- One update propagates everywhere
- Enforces design system standards

### Maintainability
- Single source of truth
- Easier to fix bugs
- Clear component hierarchy

### Developer Experience
- Less code duplication
- Simpler page components
- Self-documenting props

### Future Extensibility
- Easy to add new variants
- Can extend with new features
- Type-safe with TypeScript

## 🚀 Implementation Checklist

When creating new UI components:
- [ ] Use transparent card backgrounds
- [ ] Apply gray-300 borders only
- [ ] No shadows or depth effects
- [ ] Standard button styling (outline variant)
- [ ] SF Pro font (automatic - no class needed)
- [ ] Responsive spacing/sizing
- [ ] No yellow colors anywhere
- [ ] Badge standardization (if applicable)
- [ ] Follow Profile page visual standard

## 📖 Migration Guide

### Updating Non-Compliant Designs
1. Replace `bg-white` with `bg-transparent`
2. Replace `shadow-*` with `shadow-none`
3. Ensure `border-gray-300` for all borders
4. Add responsive margins: `mb-6 sm:mb-8 lg:mb-12`
5. Test against `/buyers/profile` page for consistency

### Badge Standardization
1. Update to `px-2.5 py-0.5 text-xs font-semibold rounded-full`
2. Preserve brand colors (background and text)
3. Remove uppercase and tracking-wider classes

## 🔗 Related Documentation

- **CLAUDE.md** - Core development guidelines
- **AUTH_DOCUMENTATION.md** - Authentication UI patterns
- **DATABASE_SCHEMA.md** - Data display standards
