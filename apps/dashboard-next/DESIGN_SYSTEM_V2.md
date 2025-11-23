# Design System V2 - Hanok Teal & Sunrise Coral

**Last Updated**: 2025-11-23
**Status**: Active Design System

This document defines the comprehensive design system for Dashboard Next, ensuring consistency across all pages without requiring page-by-page customization.

---

## 🎨 Color Palette

### Primary Colors
```css
--hanok-teal: #4C9C9B        /* Primary brand color */
--sunrise-coral: #E63946     /* Secondary accent color */
--pro-purple: #AF52DE        /* Pro tier indicator */
```

### Neutral Colors
```css
--gray-50: #F9FAFB          /* Lightest background */
--gray-100: #F3F4F6         /* Light background */
--gray-200: #E5E7EB         /* Borders, dividers */
--gray-300: #D1D5DB         /* Default borders */
--gray-400: #9CA3AF         /* Muted icons */
--gray-500: #6B7280         /* Secondary text */
--gray-600: #4B5563         /* Body text */
--gray-700: #374151         /* Dark text */
--gray-900: #111827         /* Headings */
--white: #FFFFFF            /* Pure white */
--black: #000000            /* Pure black */
```

### Semantic Colors
```css
--success: #10B981          /* Green for success states */
--error: #EF4444            /* Red for errors */
--warning: #F59E0B          /* Orange for warnings */
--info: #3B82F6             /* Blue for info */
```

### Color Usage Rules
- ✅ **Primary Actions**: `bg-hanok-teal text-white`
- ✅ **Secondary Actions**: `border-hanok-teal/30 text-hanok-teal hover:bg-hanok-teal/10`
- ✅ **Accent Elements**: `text-sunrise-coral` or `bg-sunrise-coral`
- ✅ **Cards**: `bg-white border-hanok-teal/20`
- ✅ **Backgrounds**: `bg-gray-50` for page backgrounds
- ❌ **NEVER use**: Yellow colors (except for star ratings)

---

## 📐 Spacing System

### Standard Spacing Scale
```css
0.5 = 2px   (gap-0.5, p-0.5)
1   = 4px   (gap-1, p-1)
2   = 8px   (gap-2, p-2)
3   = 12px  (gap-3, p-3)
4   = 16px  (gap-4, p-4)
5   = 20px  (gap-5, p-5)
6   = 24px  (gap-6, p-6)
8   = 32px  (gap-8, p-8)
12  = 48px  (gap-12, p-12)
```

### Layout Spacing
- **Page container**: `max-w-7xl mx-auto p-6`
- **Section margins**: `mb-8` (32px)
- **Card padding**: `p-5` or `p-6` (20-24px)
- **Tight spacing**: `gap-2` or `gap-3` (8-12px)
- **Comfortable spacing**: `gap-6` (24px)

---

## 🔤 Typography

### Font Family
```css
font-family: SF Pro Display, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif
```

### Text Sizes
```
text-xs     → 12px  (labels, metadata)
text-sm     → 14px  (body text, descriptions)
text-base   → 16px  (default body)
text-lg     → 18px  (subheadings)
text-xl     → 20px  (section titles)
text-2xl    → 24px  (page titles)
text-3xl    → 30px  (hero headings)
text-4xl    → 36px  (large headings)
```

### Font Weights
```
font-normal    → 400 (body text)
font-medium    → 500 (labels, emphasis)
font-semibold  → 600 (subheadings)
font-bold      → 700 (headings, CTAs)
```

### Text Colors
- **Headings**: `text-gray-900`
- **Body**: `text-gray-600` or `text-gray-700`
- **Muted**: `text-gray-500`
- **Primary**: `text-hanok-teal`
- **Accent**: `text-sunrise-coral`

---

## 🧱 Component Patterns

### 1. Cards

**Standard Card**:
```tsx
<Card className="bg-white border-hanok-teal/20 hover:shadow-xl transition-all duration-300">
  <CardContent className="p-5">
    {/* Content */}
  </CardContent>
</Card>
```

**Info Card** (with subtle background):
```tsx
<Card className="bg-hanok-teal/5 border-hanok-teal/20">
  <CardContent className="p-8">
    {/* Content */}
  </CardContent>
</Card>
```

**Interactive Card** (with hover effects):
```tsx
<Card className="group overflow-hidden border-hanok-teal/20 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 bg-white cursor-pointer">
  {/* Content */}
</Card>
```

### 2. Buttons

**Primary Button**:
```tsx
<Button className="bg-hanok-teal hover:bg-hanok-teal/90 text-white">
  Action
</Button>
```

**Secondary Button**:
```tsx
<Button variant="outline" className="border-hanok-teal/30 text-hanok-teal hover:bg-hanok-teal/10">
  Action
</Button>
```

**Full-width Button**:
```tsx
<Button className="w-full h-12 bg-hanok-teal hover:bg-hanok-teal/90 text-white text-lg font-semibold shadow-lg">
  Submit
</Button>
```

### 3. Input Fields

**Standard Input**:
```tsx
<Input
  className="h-12 border-hanok-teal/30 focus:border-hanok-teal focus:ring-hanok-teal"
  placeholder="Enter text..."
/>
```

**Search Input**:
```tsx
<div className="relative">
  <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
  <Input
    type="text"
    placeholder="Search..."
    className="pl-12 h-14 border-hanok-teal/30 focus:border-hanok-teal focus:ring-hanok-teal"
  />
</div>
```

### 4. Badges & Pills

**Genre Badge**:
```tsx
<span className="px-2.5 py-1 bg-hanok-teal/10 text-hanok-teal text-xs rounded-full font-medium">
  Romance
</span>
```

**Status Badge**:
```tsx
<span className="px-3 py-1 bg-sunrise-coral text-white rounded-full text-xs font-bold">
  Trending
</span>
```

**Pill Navigation** (category filters):
```tsx
{/* Active */}
<button className="px-6 py-3 rounded-full bg-hanok-teal text-white font-medium text-sm whitespace-nowrap transition-all hover:bg-hanok-teal/90 shadow-sm">
  All Titles <span className="ml-1.5">(400)</span>
</button>

{/* Inactive */}
<button className="px-6 py-3 rounded-full bg-white border-2 border-gray-300 text-gray-700 font-medium text-sm whitespace-nowrap transition-all hover:border-hanok-teal hover:bg-hanok-teal/5">
  Romance <span className="ml-1.5 text-gray-500">(142)</span>
</button>
```

### 5. Section Headers

**Standard Header**:
```tsx
<div className="flex items-center gap-3 mb-6">
  <div className="bg-hanok-teal/10 rounded-xl p-3">
    <TrendingUp className="h-6 w-6 text-hanok-teal" />
  </div>
  <div>
    <h2 className="text-2xl font-bold text-gray-900">Section Title</h2>
    <p className="text-gray-600">Section description</p>
  </div>
</div>
```

**Compact Header**:
```tsx
<div className="flex items-center gap-2 mb-4">
  <div className="bg-hanok-teal/10 rounded-full p-2">
    <Clock className="h-4 w-4 text-hanok-teal" />
  </div>
  <div>
    <h2 className="text-sm font-bold text-gray-900">Section Title</h2>
    <p className="text-xs text-gray-500">Description</p>
  </div>
</div>
```

### 6. Icon Containers

**Large Icon Container**:
```tsx
<div className="bg-hanok-teal p-3 rounded-2xl">
  <Compass className="h-8 w-8 text-white" />
</div>
```

**Medium Icon Container**:
```tsx
<div className="bg-hanok-teal/10 rounded-xl p-3">
  <Icon className="h-6 w-6 text-hanok-teal" />
</div>
```

**Small Icon Container**:
```tsx
<div className="bg-hanok-teal/10 rounded-full p-2">
  <Icon className="h-4 w-4 text-hanok-teal" />
</div>
```

### 7. Stats/Metrics Display

**Stat with Progress Bar**:
```tsx
<div>
  <div className="text-3xl font-bold text-hanok-teal mb-1">42</div>
  <div className="text-sm text-gray-600 mb-3">Titles Viewed</div>
  <div className="h-2 bg-hanok-teal/20 rounded-full overflow-hidden">
    <div className="h-full bg-hanok-teal rounded-full" style={{ width: '65%' }}></div>
  </div>
  <div className="text-xs text-gray-500 mt-1">65% of weekly goal</div>
</div>
```

**Inline Stat**:
```tsx
<div className="flex items-center gap-1.5 text-sm text-gray-600">
  <BookOpen className="h-4 w-4 text-hanok-teal" />
  <span>1.8M views</span>
</div>
```

### 8. Title Cards (Grid)

**Standard Title Card**:
```tsx
<Card className="overflow-hidden border-hanok-teal/20 hover:shadow-xl transition-all duration-300 group bg-white">
  {/* Image */}
  <div className="relative h-48 overflow-hidden">
    <img
      src={imageUrl}
      alt={title}
      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
    />
    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
    <div className="absolute bottom-3 left-3 right-3">
      {/* Badges on image */}
    </div>
  </div>

  {/* Content */}
  <CardContent className="p-5">
    <h3 className="font-bold text-lg text-gray-900 mb-2 line-clamp-1">{title}</h3>

    {/* Genre badges */}
    <div className="flex gap-2 mb-3">
      {genres.map(g => (
        <span key={g} className="px-2 py-0.5 bg-hanok-teal/10 text-hanok-teal text-xs rounded-full">
          {g}
        </span>
      ))}
    </div>

    {/* Description */}
    <p className="text-sm text-gray-600 mb-4 line-clamp-2">{description}</p>

    {/* Stats */}
    <div className="flex items-center justify-between mb-4 pb-4 border-b border-gray-100">
      <div className="flex items-center gap-1.5 text-sm text-gray-600">
        <BookOpen className="h-4 w-4 text-hanok-teal" />
        {views}
      </div>
      <button className="text-sunrise-coral hover:text-red-600">
        <Heart className="h-5 w-5" />
      </button>
    </div>

    {/* Action button */}
    <Button className="w-full bg-hanok-teal hover:bg-hanok-teal/90 text-white shadow-md">
      View Details
    </Button>
  </CardContent>
</Card>
```

---

## 🎭 Animation & Transitions

### Standard Transitions
```css
transition-all duration-300    /* Default for most interactions */
transition-all duration-200    /* Quick feedback (buttons, hovers) */
transition-transform duration-500  /* Image zoom effects */
```

### Hover Effects
```css
hover:shadow-xl               /* Card elevation on hover */
hover:-translate-y-2          /* Lift effect on cards */
hover:scale-105               /* Image zoom (within overflow-hidden) */
hover:bg-hanok-teal/90        /* Button darken */
```

### Loading States
```tsx
<div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
```

---

## 📱 Responsive Design

### Breakpoints
```
sm: 640px   (tablet portrait)
md: 768px   (tablet landscape)
lg: 1024px  (desktop)
xl: 1280px  (large desktop)
2xl: 1536px (extra large)
```

### Grid Patterns
```tsx
{/* Mobile-first grid */}
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
  {/* Cards */}
</div>

{/* Flexible columns */}
<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
  {/* Items */}
</div>
```

### Responsive Spacing
```tsx
className="p-4 sm:p-6 lg:p-8"     /* Padding scales up */
className="mb-6 sm:mb-8 lg:mb-12" /* Margin scales up */
className="text-2xl lg:text-4xl"  /* Text size scales up */
```

---

## 🏗️ Layout Structure

### Page Container
```tsx
<BuyerLayout>
  <div className="max-w-7xl mx-auto p-6 space-y-8">
    {/* Page content */}
  </div>
</BuyerLayout>
```

### Two-Column Layout (with Sidebar)
```tsx
<div className="flex gap-8 max-w-7xl mx-auto">
  {/* Main Content */}
  <div className="flex-1 min-w-0">
    {/* Content */}
  </div>

  {/* Sidebar */}
  <aside className="hidden lg:block w-64 flex-shrink-0">
    <div className="sticky top-20">
      {/* Sidebar content */}
    </div>
  </aside>
</div>
```

### Section Spacing
```tsx
<div className="space-y-8">
  {/* Each section naturally gets 32px spacing */}
  <section>{/* Section 1 */}</section>
  <section>{/* Section 2 */}</section>
  <section>{/* Section 3 */}</section>
</div>
```

---

## ✅ Usage Guidelines

### Do's
- ✅ Use `hanok-teal` for primary actions and branding
- ✅ Use `sunrise-coral` sparingly for accents and CTAs
- ✅ Maintain 20-24px card padding (`p-5` or `p-6`)
- ✅ Use `border-hanok-teal/20` for card borders
- ✅ Apply hover effects consistently (shadow, translate, scale)
- ✅ Use `text-gray-900` for headings, `text-gray-600` for body
- ✅ Keep rounded corners consistent (`rounded-2xl` for cards, `rounded-full` for badges)

### Don'ts
- ❌ Don't use yellow colors (except star ratings)
- ❌ Don't mix border styles (always use `border-hanok-teal/20` or `border-gray-300`)
- ❌ Don't use inconsistent spacing (stick to 4px increments)
- ❌ Don't create custom colors outside the palette
- ❌ Don't forget hover states on interactive elements
- ❌ Don't use `bg-transparent` on cards (use `bg-white` or `bg-hanok-teal/5`)

---

## 🎯 Quick Reference

### Common Class Combinations

**Primary Card**:
```
bg-white border-hanok-teal/20 hover:shadow-xl transition-all duration-300
```

**Primary Button**:
```
bg-hanok-teal hover:bg-hanok-teal/90 text-white
```

**Secondary Button**:
```
variant="outline" border-hanok-teal/30 text-hanok-teal hover:bg-hanok-teal/10
```

**Input Field**:
```
h-12 border-hanok-teal/30 focus:border-hanok-teal focus:ring-hanok-teal
```

**Section Header Icon**:
```
bg-hanok-teal/10 rounded-xl p-3
```

**Badge**:
```
px-2.5 py-1 bg-hanok-teal/10 text-hanok-teal text-xs rounded-full font-medium
```

---

## 📦 Reusable Components to Create

Based on this design system, consider creating these reusable components:

1. **`<SectionHeader />`** - Standardized section headers with icons
2. **`<TitleCard />`** - Grid card component for titles
3. **`<StatWidget />`** - Metric display with progress bar
4. **`<CategoryPills />`** - Horizontal scrollable category filters
5. **`<IconContainer />`** - Consistent icon backgrounds (S/M/L sizes)
6. **`<SearchInput />`** - Standardized search field with icon

---

**End of Design System V2**
