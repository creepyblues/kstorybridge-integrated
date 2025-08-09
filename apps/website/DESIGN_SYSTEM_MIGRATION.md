# Design System Migration Guide

This guide outlines how to systematically update all pages to use the new professional design system.

## Overview

The new design system provides:
- **Consistent Visual Language**: Professional, clean, elegant design
- **Better Component Architecture**: Reusable, well-tested components  
- **Improved Developer Experience**: Type-safe, documented components
- **Enhanced Accessibility**: Built-in ARIA support and keyboard navigation

## Step-by-Step Migration Process

### Phase 1: Layout Migration

**Before (Current Pattern):**
```jsx
// Old inconsistent layout
<div className="min-h-screen bg-gradient-to-b from-white to-porcelain-blue-50">
  <nav className="flex items-center justify-between px-6 py-4 max-w-7xl mx-auto">
    {/* Custom navigation */}
  </nav>
  <div className="max-w-7xl mx-auto px-6 py-16">
    {/* Page content */}
  </div>
  <Footer />
</div>
```

**After (New Design System):**
```jsx
import { LandingLayout, Container, Section } from '@/design-system';

// Professional, consistent layout
<LandingLayout title="Page Title" description="Page description">
  <Section spacing="xl">
    <Container>
      {/* Page content */}
    </Container>
  </Section>
</LandingLayout>
```

### Phase 2: Typography Migration

**Before:**
```jsx
<h1 className="text-5xl lg:text-6xl font-bold text-midnight-ink leading-tight">
  Title Text
</h1>
<p className="text-xl text-midnight-ink-600 leading-relaxed">
  Body text
</p>
```

**After:**
```jsx
import { Display, LeadText } from '@/design-system';

<Display color="primary">Title Text</Display>
<LeadText>Body text</LeadText>
```

### Phase 3: Component Migration

**Before:**
```jsx
import { Button } from '../components/ui/button';

<Button 
  className="bg-hanok-teal hover:bg-hanok-teal-600 text-white px-8 py-4 text-lg rounded-full font-medium"
  onClick={handleClick}
>
  Button Text
</Button>
```

**After:**
```jsx
import { Button } from '@/design-system';

<Button 
  variant="primary"
  size="lg"
  onClick={handleClick}
>
  Button Text
</Button>
```

## Component Mapping Guide

### Layout Components

| Old Pattern | New Component | Usage |
|-------------|---------------|--------|
| Custom nav + content + footer | `LandingLayout` | Landing/marketing pages |
| Custom layout | `ContentLayout` | Standard content pages |
| Centered forms | `CenteredLayout` | Auth/form pages |

### Typography Components

| Old Pattern | New Component | Usage |
|-------------|---------------|--------|
| `<h1 className="text-6xl...">` | `Display` | Page heroes |
| `<h2 className="text-4xl...">` | `Title` | Page titles |
| `<h2 className="text-3xl...">` | `SectionHeading` | Section headers |
| `<h3 className="text-xl...">` | `CardTitle` | Card headers |
| `<p className="text-lg...">` | `LeadText` | Lead paragraphs |
| `<p className="text-base...">` | `BodyText` | Body content |
| `<p className="text-sm...">` | `Caption` | Small text |

### Button Components

| Old Pattern | New Component | Usage |
|-------------|---------------|--------|
| Primary CTA buttons | `CTAButton` | Main call-to-actions |
| Primary actions | `Button variant="primary"` | Primary actions |
| Secondary actions | `Button variant="secondary"` | Secondary actions |
| Outlined buttons | `Button variant="outline"` | Alternative actions |
| Text-only buttons | `Button variant="ghost"` | Subtle actions |

### Layout Utilities

| Old Pattern | New Component | Usage |
|-------------|---------------|--------|
| `<div className="max-w-7xl mx-auto px-6">` | `Container` | Content width constraints |
| `<div className="py-16">` | `Section` | Page sections with spacing |
| `<div className="grid grid-cols-3 gap-6">` | `Grid` | Responsive grid layouts |
| `<div className="flex flex-col space-y-4">` | `Stack` | Vertical stacking |

## Pages to Migrate

### Priority 1 - Core Pages
1. ✅ **HomePage** - Example created (`HomePageNew.tsx`)
2. **CreatorsPage** - Landing page for creators
3. **BuyersPage** - Landing page for buyers
4. **AboutPage** - Company information

### Priority 2 - Auth Pages  
5. **SignupPage** - Main signup flow
6. **BuyerSignupPage** - Buyer-specific signup
7. **CreatorSignupPage** - Creator-specific signup
8. **SigninPage** - Login page

### Priority 3 - Secondary Pages
9. **PricingPage** - Pricing information
10. **NotFound** - 404 error page

## Implementation Steps

### For Each Page:

1. **Create New Version** (recommended approach)
   - Copy existing page to `PageNameNew.tsx`  
   - Implement using design system components
   - Test thoroughly
   - Replace original when ready

2. **Update Imports**
   ```jsx
   // Replace individual component imports with design system
   import { 
     LandingLayout, 
     Container, 
     Section, 
     Button, 
     Display, 
     BodyText 
   } from '@/design-system';
   ```

3. **Convert Layout Structure**
   - Replace custom layouts with `LandingLayout`, `ContentLayout`, or `CenteredLayout`
   - Use `Container` and `Section` for consistent spacing
   - Replace custom grids with `Grid` component

4. **Convert Typography**  
   - Replace heading tags with semantic typography components
   - Use consistent text color and size variants
   - Ensure proper heading hierarchy

5. **Convert Buttons**
   - Use appropriate button variants
   - Consolidate similar styles
   - Add proper loading and icon states

6. **Test Responsiveness**
   - Verify mobile/tablet/desktop layouts
   - Test keyboard navigation
   - Check accessibility with screen readers

## Benefits After Migration

### For Users:
- ✨ **Consistent Experience**: All pages look and feel professional
- 🚀 **Better Performance**: Optimized components and fewer style conflicts  
- ♿ **Improved Accessibility**: Built-in ARIA support and keyboard navigation
- 📱 **Better Mobile Experience**: Responsive design patterns

### For Developers:
- 🎯 **Faster Development**: Reusable components reduce implementation time
- 🐛 **Fewer Bugs**: Well-tested, type-safe components
- 📚 **Better Documentation**: Self-documenting component APIs
- 🎨 **Design Consistency**: Impossible to accidentally break visual consistency

## Quick Reference

### Import the Design System:
```jsx
import { 
  // Layouts
  LandingLayout, ContentLayout, CenteredLayout,
  Container, Section, Grid, Stack,
  
  // Typography  
  Display, Title, SectionHeading, CardTitle,
  BodyText, LeadText, Caption,
  
  // Components
  Button, CTAButton, Card
} from '@/design-system';
```

### Common Patterns:
```jsx
// Page wrapper
<LandingLayout title="Page Title">
  <Section spacing="xl">
    <Container>
      <Stack spacing="lg">
        <Display>Hero Title</Display>
        <LeadText>Hero description</LeadText>
        <Button variant="primary">Call to Action</Button>
      </Stack>
    </Container>
  </Section>
</LandingLayout>

// Content section
<Section spacing="lg" background="muted">
  <Container>
    <Grid cols={3} gap="lg">
      <Card variant="elevated">
        <CardTitle>Card Title</CardTitle>
        <BodyText>Card content</BodyText>
      </Card>
    </Grid>
  </Container>
</Section>
```

## Next Steps

1. **Start with HomePage** - Use `HomePageNew.tsx` as reference
2. **Migrate Priority 1 pages** - Core marketing pages first
3. **Test thoroughly** - Ensure visual and functional consistency
4. **Update routing** - Switch to new pages when ready
5. **Clean up** - Remove old components and unused styles