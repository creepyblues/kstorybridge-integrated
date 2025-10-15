# Preview Pages System

**Last Updated**: 2025-10-14
**Purpose**: Safe testing environment for page redesigns before production deployment

---

## Overview

The Preview Pages system allows designers and developers to create, test, and iterate on page redesigns without affecting production pages. Preview pages are completely separate routes that mirror the structure of production pages but include visual indicators to distinguish them from live content.

---

## Quick Start

### Creating a Preview Page

1. **Create Preview Component**
   ```bash
   # File location
   /apps/website/src/pages/[PageName]Preview.tsx

   # Example
   /apps/website/src/pages/BuyersPagePreview.tsx
   ```

2. **Add Preview Route**
   ```tsx
   // In App.tsx
   import BuyersPagePreview from './pages/BuyersPagePreview';

   <Route path="/buyers-preview" element={<BuyersPagePreview />} />
   ```

3. **Include Preview Banner**
   ```tsx
   {/* At top of preview page */}
   <div className="bg-yellow-50 border-b-2 border-yellow-400 py-3 px-4">
     <div className="max-w-7xl mx-auto flex items-center justify-between">
       <div className="flex items-center gap-3">
         <span className="px-3 py-1 bg-yellow-400 text-yellow-900 font-bold text-sm rounded">
           PREVIEW MODE
         </span>
         <span className="text-yellow-900 text-sm">
           This is a test page. <a href="/buyers" className="underline">View production page</a>
         </span>
       </div>
       <span className="text-yellow-700 text-xs">
         Created: 2025-10-13
       </span>
     </div>
   </div>
   ```

4. **Test Locally**
   ```bash
   npm run dev
   # Visit http://localhost:5173/[page-name]-preview
   ```

---

## Naming Conventions

### File Names
- **Pattern**: `[PageName]Preview.tsx`
- **Location**: `/apps/website/src/pages/`
- **Examples**:
  - `BuyersPagePreview.tsx`
  - `CreatorsPagePreview.tsx`
  - `HomePagePreview.tsx`
  - `PricingPagePreview.tsx`

### Route Paths
- **Pattern**: `/[page-name]-preview`
- **Examples**:
  - `/buyers-preview`
  - `/creators-preview`
  - `/home-preview`
  - `/pricing-preview`

### Component Names
- **Pattern**: `[PageName]Preview`
- **Examples**:
  - `BuyersPagePreview`
  - `CreatorsPagePreview`
  - `HomePagePreview`

---

## Preview Banner Component

### Standard Banner (Recommended)

```tsx
const PreviewBanner = ({
  productionPath,
  createdDate
}: {
  productionPath: string;
  createdDate: string;
}) => (
  <div className="bg-yellow-50 border-b-2 border-yellow-400 py-3 px-4 sticky top-0 z-50">
    <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
      <div className="flex items-center gap-3">
        <span className="px-3 py-1 bg-yellow-400 text-yellow-900 font-bold text-sm rounded">
          PREVIEW MODE
        </span>
        <span className="text-yellow-900 text-sm">
          This is a test page. <a href={productionPath} className="underline hover:text-yellow-700">View production page</a>
        </span>
      </div>
      <span className="text-yellow-700 text-xs">
        Preview created: {createdDate}
      </span>
    </div>
  </div>
);

// Usage
<PreviewBanner productionPath="/buyers" createdDate="2025-10-13" />
```

---

## Best Practices

### 1. Always Include Visual Indicators
- ✅ Prominent "PREVIEW MODE" banner
- ✅ Link to production page
- ✅ Different background color (subtle)
- ✅ Timestamp of preview creation

### 2. Keep Preview Separate
- ✅ Separate component file (`*Preview.tsx`)
- ✅ Separate route (`/*-preview`)
- ❌ Never modify production component for preview
- ❌ Never add preview logic to production code

### 3. Use Actual Components
- ✅ Import from existing components
- ✅ Follow design system standards
- ✅ Use real data structures
- ❌ Don't hardcode mockup styles
- ❌ Don't use dummy/fake data

### 4. Document Changes
- ✅ Add comments explaining redesign decisions
- ✅ Link to design documentation (if exists)
- ✅ Note differences from production
- ✅ Include TODO comments for pending items

---

## Testing Workflow

### 1. Development Phase
```bash
# Start dev server
npm run dev

# View preview
http://localhost:5173/[page-name]-preview

# Compare with production
http://localhost:5173/[page-name]
```

### 2. Stakeholder Demo
- Share preview link: `http://localhost:5173/[page-name]-preview`
- Walk through changes section by section
- Gather feedback and iterate
- Compare side-by-side with production

### 3. Final Review
- Test all CTAs and links
- Verify responsive behavior (mobile, tablet, desktop)
- Check accessibility (screen reader, keyboard navigation)
- Validate against design system standards
- Review analytics tracking (if applicable)

### 4. Deployment
Once approved:
1. Copy changes from `*Preview.tsx` to production component
2. Test production route locally
3. Create PR with clear before/after documentation
4. Deploy to production
5. Archive or delete preview page (optional)

---

## Example: BuyersPagePreview.tsx

### Current Preview Pages

| Page | Preview Route | Production Route | Status | Created |
|------|--------------|------------------|--------|---------|
| Buyers | `/buyers-preview` | `/buyers` | Active | 2025-10-13 |
| Creators | `/creators-preview` | `/creators` | Active | 2025-10-14 |

### Structure
```tsx
import { Link } from 'react-router-dom';
import UniversalHeader from '../components/UniversalHeader';
import { Button } from '@kstorybridge/ui';
import { Card, CardContent } from '../components/ui/card';
import FeaturedTitlesCarousel from '../components/FeaturedTitlesCarousel';
import Footer from '../components/Footer';

const BuyersPagePreview = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-porcelain-blue-50">
      {/* PREVIEW BANNER */}
      <div className="bg-yellow-50 border-b-2 border-yellow-400 py-3 px-4 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="px-3 py-1 bg-yellow-400 text-yellow-900 font-bold text-sm rounded">
              PREVIEW MODE
            </span>
            <span className="text-yellow-900 text-sm">
              Testing redesigned /buyers page. <Link to="/buyers" className="underline">View current page</Link>
            </span>
          </div>
          <span className="text-yellow-700 text-xs">Created: 2025-10-13</span>
        </div>
      </div>

      <UniversalHeader />

      <main className="flex-1">
        {/* HERO SECTION - Revised */}
        <section className="py-12 sm:py-16 lg:py-24">
          {/* Hero content */}
        </section>

        {/* AI ASSISTANT SHOWCASE - NEW */}
        <section className="py-12 sm:py-16 lg:py-20">
          {/* AI content */}
        </section>

        {/* Additional sections */}
      </main>

      <Footer />
    </div>
  );
};

export default BuyersPagePreview;
```

---

## Comparison View (Optional Advanced Feature)

For side-by-side comparison, you can create a split-screen view:

```tsx
const ComparisonView = () => {
  return (
    <div className="grid lg:grid-cols-2 gap-4">
      <div className="border-2 border-blue-500">
        <div className="bg-blue-100 p-2 text-center font-bold">
          PREVIEW (New Design)
        </div>
        <iframe src="/buyers-preview" className="w-full h-screen" />
      </div>
      <div className="border-2 border-gray-500">
        <div className="bg-gray-100 p-2 text-center font-bold">
          PRODUCTION (Current)
        </div>
        <iframe src="/buyers" className="w-full h-screen" />
      </div>
    </div>
  );
};
```

Access at: `/compare/buyers`

---

## Preview Page Architecture Reference

### BuyersPagePreview.tsx Structure

**Design Strategy**: AI-first messaging with verified rights chain and expert support
**Primary Color**: `hanok-teal` (#4C9C9B)
**Created**: 2025-10-13
**Target Audience**: Hollywood studios, streaming platforms, media buyers

**7-Section Layout:**

1. **Hero Section** - AI-first headline
   - H1: "Find Your Next Hit with AI Assistant"
   - Subheadline: 3-pillar value prop (AI + rights + expert)
   - CTA: "Try AI Assistant →" (hanok-teal)

2. **AI Assistant Showcase** (Priority #1 - 30% focus)
   - Icon: Bot (hanok-teal)
   - Features: 3 cards (Recommend cleared rights, Story craft intelligence, Deep details)
   - Visual demo: Chat interface mockup
   - CTA: "Chat with Jinu"

3. **Value Props Grid** - Three Pillars
   - AI-Powered Discovery (hanok-teal icon)
   - Verified Rights Chain (sunrise-coral icon)
   - Expert Deal Support (porcelain-blue icon)

4. **Rights Deep Dive** (Priority #2 - 25% focus)
   - Icon: Shield (sunrise-coral)
   - Visual: 4-step rights chain diagram
   - Before/After comparison (red-50 vs green-50 cards)
   - Trust signal: "100+ Verified Rights Holders"

5. **Streamlined Process** - 3 Steps
   - Step colors: hanok-teal (01), sunrise-coral (02), porcelain-blue (03)
   - Numbered badges with rounded-2xl styling

6. **Catalog Preview**
   - FeaturedTitlesCarousel component
   - CTA: "Join to View Full Catalog"

7. **Pricing + Final CTA**
   - 2-column grid: Free vs Pro
   - Pro: hanok-teal accent, "RECOMMENDED" badge
   - Final CTA gradient: hanok-teal/10 to porcelain-blue-100

---

### CreatorsPagePreview.tsx Structure

**Design Strategy**: Access-first messaging with Hollywood connections and pitch support
**Primary Color**: `sunrise-coral` (#E07856)
**Created**: 2025-10-14
**Target Audience**: Webtoon artists, web novel authors

**7-Section Layout:**

1. **Hero Section** - Aspirational messaging
   - H1: "Your Story Deserves the Global Stage" (sunrise-coral accent)
   - Subheadline: Direct pitch to Hollywood studios
   - CTA: "Join the Platform" (sunrise-coral)

2. **ACCESS Showcase** (Priority #1 - 30% focus)
   - Icon: Globe (sunrise-coral)
   - **Studio Logo Grid**: 7 logos + 1 stat card (8 items, 2-col mobile → 4-col desktop)
     - Logos from Supabase: `logo_netflix`, `logo_disney_studios`, `logo_sony_pictures`, etc.
     - Fallback chain: .png → .jpg → .svg → .webp → text
     - "50+" stat card integrated with same styling
   - 3 feature cards below logos

3. **Three Guarantees Grid**
   - ACCESS: Hollywood Connections (sunrise-coral)
   - EXPERT: Hollywood Veterans (hanok-teal)
   - EASY DEAL: Contract Protection (porcelain-blue-600)

4. **EXPERT Deep Dive** (Priority #2 - 30% focus)
   - Icon: Star (hanok-teal)
   - Challenge intro card with line break pattern
   - 3 process cards: Cultural Translation, Professional Pitch Decks, Veteran Guidance
   - Updated text: "Direct support from Hollywood producer with 20+ years"

5. **Before/After Comparison**
   - Subtitle: "The traditional route vs. the KStoryBridge path"
   - Traditional Route: 4 bullet points (red-50 card)
   - KStoryBridge: 5 bullet points (green-50 card)
   - **No trust signals section** (removed for cleaner design)

6. **Three Steps**
   - Step colors: **ALL hanok-teal** (01, 02, 03) - consistent branding
   - Step 1: "5-minute setup" (hanok-teal text)

7. **Final CTA + Newsletter**
   - CTA gradient: sunrise-coral/10 to hanok-teal/10
   - Primary button: sunrise-coral
   - Beehiiv newsletter embed

---

## Common Design Patterns

### Color Palette by Page

| Page | Primary Color | Secondary | Accent | Step Numbers |
|------|--------------|-----------|--------|--------------|
| Buyers | hanok-teal (#4C9C9B) | sunrise-coral | porcelain-blue-600 | Mixed (teal/coral/blue) |
| Creators | sunrise-coral (#E07856) | hanok-teal | porcelain-blue-600 | All hanok-teal |

### Card Styling Standard
```tsx
<Card className="bg-transparent border-gray-300 shadow-none rounded-2xl">
  <CardContent className="p-6">
    {/* Icon + Content */}
  </CardContent>
</Card>
```

### Icon Box Pattern
```tsx
<div className="flex-shrink-0 w-12 h-12 bg-{color}/10 rounded-lg flex items-center justify-center">
  <Icon className="h-6 w-6 text-{color}" />
</div>
```

### Logo Grid Pattern (Creators)
```tsx
{/* 7 studio logos */}
<div className="grid grid-cols-2 md:grid-cols-4 gap-6 lg:gap-8">
  {studios.map((studio) => (
    <div className="bg-white border border-gray-200 shadow-sm rounded-xl hover:shadow-md p-6">
      <img
        src={`${SUPABASE_URL}/storage/v1/object/public/images/${studio.logo}.png`}
        className="w-full h-auto object-contain max-h-16"
        onError={/* fallback chain */}
      />
    </div>
  ))}

  {/* Stat card integrated with same styling */}
  <div className="bg-white border border-gray-200 shadow-sm rounded-xl p-6">
    <div className="text-2xl sm:text-3xl font-bold text-{color} mb-1">50+</div>
    <p className="text-xs leading-tight">Hollywood studios</p>
  </div>
</div>
```

### Before/After Comparison Pattern
```tsx
<div className="grid md:grid-cols-2 gap-8">
  {/* Traditional */}
  <Card className="bg-red-50 border-red-200 shadow-none rounded-2xl">
    <h3 className="text-red-800">❌ Traditional Route</h3>
    {/* bullet points */}
  </Card>

  {/* KStoryBridge */}
  <Card className="bg-green-50 border-green-200 shadow-none rounded-2xl">
    <h3 className="text-green-800">✅ KStoryBridge</h3>
    {/* CheckCircle2 icons + bullet points */}
  </Card>
</div>
```

### Step Number Badges
```tsx
<div className="w-16 h-16 bg-{color} text-white rounded-2xl flex items-center justify-center text-xl font-bold mx-auto mb-6 shadow-lg">
  01
</div>
```

### Image Integration (Supabase Storage)
```tsx
// Pattern
src={`https://dlrnrgcoguxlkkcitlpd.supabase.co/storage/v1/object/public/images/${filename}.png`}

// Filename examples
- logo_netflix
- logo_disney_studios
- logo_sony_pictures
- logo_crunchyroll
- logo_amazon_studios
- logo_warner_bros
- logo_paramount

// Fallback chain in onError handler
.png → .jpg → .svg → .webp → text fallback
```

---

## Responsive Design Guidelines

### Grid Breakpoints
- **Logos**: `grid-cols-2 md:grid-cols-4` (mobile: 2-col, desktop: 4-col)
- **Features**: `lg:grid-cols-3` (mobile: 1-col, desktop: 3-col)
- **Steps**: `md:grid-cols-3` (mobile: 1-col, tablet+: 3-col)
- **Pricing**: `lg:grid-cols-2` (mobile: 1-col, desktop: 2-col)

### Typography Scale
```tsx
// Headings
h1: "text-3xl sm:text-4xl lg:text-5xl xl:text-6xl"
h2: "text-2xl sm:text-3xl lg:text-4xl xl:text-5xl"
h3: "text-xl"

// Body
p: "text-lg sm:text-xl" (subheadlines)
p: "text-base sm:text-lg" (body)
small: "text-sm" or "text-xs"
```

### Spacing
```tsx
// Section padding
py-12 sm:py-16 lg:py-20

// Section margin bottom
mb-8 sm:mb-12 lg:mb-16

// Card padding
p-6 (standard)
p-8 (pillar cards)
```

---

## Future Development Guidelines

### Adding New Preview Pages

1. **Choose Primary Color** based on audience:
   - Buyers → hanok-teal
   - Creators → sunrise-coral
   - General/Mixed → porcelain-blue

2. **Follow 7-Section Pattern**:
   - Hero with clear value prop
   - Priority #1 section (30% focus)
   - Three Pillars/Guarantees grid
   - Priority #2 section (25% focus)
   - Before/After or Social Proof
   - 3-Step Process
   - Final CTA + optional newsletter

3. **Maintain Consistency**:
   - Use standard Card components
   - Follow icon box pattern
   - Keep color palette limited (primary + 2 accents max)
   - Use lucide-react icons

4. **Test Responsive**:
   - Mobile (375px)
   - Tablet (768px)
   - Desktop (1024px+)

5. **Image Assets**:
   - Store in Supabase `/images/` bucket
   - Use descriptive filenames (logo_company_name)
   - Implement fallback chain
   - Max height: 64px for logos

---

## Environment Controls (Production Safety)

### Option 1: Environment Variable (Recommended)
```tsx
// In App.tsx
{import.meta.env.DEV && (
  <Route path="/buyers-preview" element={<BuyersPagePreview />} />
)}
```

### Option 2: Feature Flag
```tsx
// In .env.local
VITE_ENABLE_PREVIEW_PAGES=true

// In App.tsx
{import.meta.env.VITE_ENABLE_PREVIEW_PAGES === 'true' && (
  <Route path="/buyers-preview" element={<BuyersPagePreview />} />
)}
```

### Option 3: Build-Time Exclusion
```tsx
// In vite.config.ts
export default defineConfig({
  define: {
    'import.meta.env.PREVIEW_ENABLED': JSON.stringify(process.env.NODE_ENV === 'development')
  }
});
```

---

## Cleanup Checklist

When preview is no longer needed:

- [ ] Copy approved changes to production component
- [ ] Test production page thoroughly
- [ ] Deploy to production
- [ ] Delete `*Preview.tsx` file (or archive)
- [ ] Remove preview route from App.tsx
- [ ] Update this documentation table
- [ ] Close related GitHub issues/tickets

---

## Troubleshooting

### Preview Page Not Loading
- Check route is added to App.tsx
- Verify import path is correct
- Check for TypeScript errors
- Restart dev server

### Styles Look Different
- Ensure using same design system components
- Check Tailwind classes match production
- Verify no hardcoded styles
- Compare className patterns

### CTAs Not Working
- Check route paths match actual pages
- Verify Link components imported correctly
- Test in browser console for errors
- Check for event handler issues

---

## Related Documentation

- **Main CLAUDE.md**: [Root Documentation](../../CLAUDE.md)
- **Website CLAUDE.md**: [Website App Documentation](./CLAUDE.md)
- **Design System**: [DESIGN_SYSTEM.md](../../DESIGN_SYSTEM.md)
- **Buyers Page Overhaul**: [Dashboard Docs - BUYERS_PAGE_OVERHAUL.md](../../apps/dashboard/public/docs/BUYERS_PAGE_OVERHAUL.md)

---

## Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 1.0 | 2025-10-13 | Initial preview system documentation | Claude Code |

---

**Note**: Preview pages are development tools only. They should never be deployed to production without removing preview banners and merging changes into production components.
