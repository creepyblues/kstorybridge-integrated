# Spec — Website

Landing pages, microsites, marketing pages on kstorybridge.com, preview pages, partner co-branded sections. Full brand rules in [`../BRAND_GUIDE.md`](../BRAND_GUIDE.md). For in-product (authenticated dashboard) UI, see `docs/active/DESIGN_SYSTEM.md`.

---

## Scope

| Surface | Color lead | Example |
| --- | --- | --- |
| Homepage | Teal lead + coral accents | `/` |
| Buyer / producer landing | `hanok-teal` | `/buyers`, `/producers` |
| Creator landing | `sunrise-coral` | `/creators` |
| About / company | Teal lead | `/about` |
| Pricing | `hanok-teal` | `/pricing` |
| Auth redirects / stubs | Teal lead | `/signup`, `/signin` |
| Preview (dev-only) | Per audience | `/*-preview` |

---

## Page architecture

Every landing page follows the canonical **7-section structure** (matches shipped `BuyersPagePreview.tsx` + `CreatorsPagePreview.tsx`):

1. **Hero** — headline + subline + primary CTA. Audience color.
2. **Priority #1 showcase (30% focus)** — the one feature that sells this audience. Studio logo wall for creators; AI chatbot demo for buyers; etc.
3. **Three pillars / guarantees** — three-card grid, equal weight.
4. **Deep dive (25–30% focus)** — one theme in depth (rights verification, cultural translation, expert curation).
5. **Before / After comparison** — two columns, red-50 vs green-50.
6. **3-step process** — step badge cards. Badges are `hanok-teal` regardless of page audience (convention).
7. **Final CTA + trust signals** — primary CTA, ✓ trust bullets, optional newsletter.

**Don't invent new section types without a PR.** Cohesion across pages is the whole game.

---

## Layout

### Container + gutters

```html
<section class="py-12 sm:py-16 lg:py-20">
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    <!-- content -->
  </div>
</section>
```

- Max width: `max-w-7xl` (1280 px).
- Gutters: `px-4 sm:px-6 lg:px-8`.
- Section vertical: `py-12 sm:py-16 lg:py-20`.

### Grid

```html
<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
```

- Mobile: 1 col.
- Tablet: 2 col.
- Desktop: 3 col (pillars) or 4 col (logo walls).
- Gap: `gap-4 sm:gap-6`.

### Breakpoints (Tailwind defaults)

| Name | Width |
| --- | --- |
| `sm` | 640 px |
| `md` | 768 px |
| `lg` | 1024 px |
| `xl` | 1280 px |
| `2xl` | 1536 px |

**Always mobile-first.** Start with the smallest-viewport layout and layer up.

---

## Component library

### Hero

```tsx
<section className="py-20 lg:py-28 bg-gradient-to-b from-white to-porcelain-blue-50">
  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
    <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-midnight-ink mb-6">
      Find your next hit with AI.
    </h1>
    <p className="text-lg sm:text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
      Hollywood's AI-powered Korean IP discovery engine. 50+ studios already inside.
    </p>
    <Button className="bg-hanok-teal hover:bg-hanok-teal-600 text-white rounded-full px-8 py-4 text-lg shadow-lg">
      Get started
    </Button>
  </div>
</section>
```

### Marketing card (flat)

Always use this on marketing pages. Never `bg-white`, never shadow.

```tsx
<Card className="bg-transparent border-gray-300 shadow-none rounded-2xl">
  <CardContent className="p-4 sm:p-6">
    {/* content */}
  </CardContent>
</Card>
```

### Primary CTA (marketing)

```tsx
<Button className="bg-hanok-teal hover:bg-hanok-teal-600 text-white rounded-full px-8 py-4 text-lg font-semibold shadow-lg">
  Find titles
</Button>
```

Swap `hanok-teal` for `sunrise-coral` on creator pages. `rounded-full` is non-negotiable on marketing CTAs.

### Secondary button

```tsx
<Button variant="outline" className="border-gray-300 hover:bg-gray-100 text-black rounded-md">
  Learn more
</Button>
```

### Icon box (in pillars / features)

```tsx
<div className="w-12 h-12 bg-hanok-teal/10 rounded-lg flex items-center justify-center">
  <Sparkles className="h-6 w-6 text-hanok-teal" />
</div>
```

### Step badge

Numbered 1-2-3 in the 3-step process section. Always teal regardless of page audience.

```tsx
<div className="w-16 h-16 bg-hanok-teal text-white rounded-2xl shadow-lg flex items-center justify-center text-2xl font-bold">
  1
</div>
```

### Trust badge (marketing-only ALL CAPS)

```tsx
<span className="inline-block px-3 py-1 bg-porcelain-blue-100 text-porcelain-blue-700 text-xs font-semibold uppercase tracking-wider rounded-full">
  50+ STUDIOS
</span>
```

### Before/After comparison

```tsx
<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
  <Card className="bg-red-50 border-gray-300 shadow-none rounded-2xl">
    <CardContent className="p-6">
      <span className="text-xs font-semibold text-red-600 uppercase">Traditional</span>
      <h3 className="text-xl font-bold text-black mt-2">4 months of cold outreach</h3>
      {/* bullets */}
    </CardContent>
  </Card>
  <Card className="bg-green-50 border-gray-300 shadow-none rounded-2xl">
    <CardContent className="p-6">
      <span className="text-xs font-semibold text-green-600 uppercase">With KStoryBridge</span>
      <h3 className="text-xl font-bold text-black mt-2">5 weeks to signed deal</h3>
      {/* bullets */}
    </CardContent>
  </Card>
</div>
```

### Universal header

Use the existing `UniversalHeader` component. Never rebuild.

- Height: 64 px desktop, 56 px mobile.
- Background: `bg-white/80 backdrop-blur-md`, sticky.
- Logo left (wordmark, 28 px tall).
- Nav center on desktop, hamburger on mobile.
- CTA right — primary, audience-color on landing pages.

### Footer

Use the existing `Footer` component. Contains:
- Wordmark + 1-line company description
- 3 column link groups (Product · Company · Legal)
- Email capture
- Social icons (LinkedIn, X)
- © year, privacy, terms

---

## Typography on web

| Role | Tailwind |
| --- | --- |
| Hero | `text-4xl sm:text-5xl lg:text-6xl font-bold text-midnight-ink` |
| Section head | `text-2xl sm:text-3xl font-bold text-black` |
| Subsection | `text-xl font-semibold text-black` |
| Card title | `text-lg font-semibold text-black` |
| Lead | `text-lg sm:text-xl text-gray-600` |
| Body | `text-base text-gray-600` |
| Caption | `text-sm text-gray-500` |

---

## Backgrounds and gradients

| Pattern | Class | Use |
| --- | --- | --- |
| Default page | solid `bg-white` | Most pages |
| Soft page | `bg-gradient-to-b from-white to-porcelain-blue-50` | Homepage, airy landing pages |
| Warm band | `bg-gradient-to-b from-warm-sand-50 to-white` | Korean cultural / heritage sections |
| Support section | `bg-porcelain-blue-50` | Rights / legal / deal blocks |
| Dark CTA band | `bg-midnight-ink` | High-contrast closing CTA |

**Never:** full-page gradients, animated gradients, mesh gradients, photo-as-background-with-text-on-top.

---

## Imagery on web

- **Heroes:** real product screenshots (preferred) or rights-cleared key visuals. Drop in at `rounded-xl` with no custom border.
- **Studio logo wall:** monochrome, sized consistently, horizontally scrolling on mobile. Source from [Supabase `/images/` bucket](https://app.supabase.com/project/dlrnrgcoguxlkkcitlpd) with fallback chain (`.png → .jpg → .svg → .webp → text`).
- **Illustrations:** avoid. If necessary, flat line, two-color (brand + gray), never gradient.
- **Icons:** `lucide-react` only. 24 px standard. Never mix icon libraries.

---

## Responsive rules

- **Test breakpoints:** 375 (iPhone SE), 768 (tablet), 1024 (laptop), 1440 (desktop).
- **Text sizes scale:** `text-2xl sm:text-3xl lg:text-4xl` pattern everywhere.
- **Spacing scales:** `mb-6 sm:mb-8 lg:mb-12`.
- **Grids collapse:** 3-col desktop → 2-col tablet → 1-col mobile.
- **Touch targets:** ≥ 44 px tall on mobile (buttons, nav items).
- **Horizontal scroll:** only on intentional elements (logo walls, category pills). Never on page body.

---

## Performance budget

| Metric | Target |
| --- | --- |
| Largest Contentful Paint | ≤ 2.5 s on 4G |
| First Input Delay | ≤ 100 ms |
| Cumulative Layout Shift | ≤ 0.1 |
| Page weight | ≤ 1.5 MB (excluding video) |
| Image weight | ≤ 400 KB per image |
| Font loading | zero webfonts (system stack) |

**Image format:** AVIF preferred, WebP fallback, JPG/PNG for older clients. All hero images lazy-loaded except the above-the-fold one.

---

## Accessibility

- **Contrast:** body text ≥ 4.5:1, large text ≥ 3:1. Teal on white passes large, fails body — use `text-hanok-teal-600` or darker for body.
- **Keyboard nav:** every interactive element reachable via Tab. Focus rings visible (`focus:ring-2 focus:ring-hanok-teal`).
- **Alt text:** every `<img>` has descriptive alt. Decorative images use `alt=""`.
- **Headings:** strict hierarchy. One `h1` per page. No skipping levels.
- **Forms:** every input labeled. Errors announced via `aria-live`.
- **Motion:** honor `prefers-reduced-motion: reduce`. No auto-playing video with sound.
- **Skip link:** every page has a "Skip to content" link for keyboard users.

---

## SEO + metadata

Every page ships with:

- `<title>` — ≤ 60 chars, format: `{page} · KStoryBridge`.
- `<meta name="description">` — ≤ 160 chars, first-person outcome-led.
- OG image — 1200 × 630, one headline, matches brand image spec.
- `og:title` + `og:description` — can differ from SEO title/desc if social-tuned.
- Canonical URL.
- `hreflang` for EN/KO variants once localized content ships.

---

## Preview page system (internal)

Dev-only preview routes live at `/{page-name}-preview` and are gated behind `import.meta.env.DEV`. See [`apps/website/PREVIEW_PAGES.md`](../../../apps/website/PREVIEW_PAGES.md) for the full system.

**Rules:**
- Preview routes never ship to production.
- Yellow "PREVIEW MODE" banner at the top (exception to the no-yellow rule — explicitly for dev-only surface).
- Link from preview to production for side-by-side comparison.

---

## Voice on web

Headlines on the web are the most visible surface in the brand. They travel to social, decks, press. Follow the bank in the design skill's `voice.md` or the i18n files at `apps/website/src/i18n/locales/en/`. Don't freestyle new taglines — PR them first.

---

## Pre-flight checklist

- [ ] 7-section structure followed (or deliberately documented exception)
- [ ] Audience primary color correct (teal vs coral)
- [ ] `max-w-7xl mx-auto` container, correct gutters
- [ ] Flat marketing cards only (`bg-transparent border-gray-300 shadow-none`)
- [ ] Primary CTA `rounded-full`, audience color, one per section
- [ ] Responsive tested at 375 / 768 / 1024 / 1440
- [ ] LCP ≤ 2.5 s, no webfonts loaded, images lazy-loaded
- [ ] Alt text on every image, keyboard nav works, contrast passes
- [ ] OG image + meta description set
- [ ] No yellow, no mesh gradients, no stock business photography
- [ ] Headlines match the approved voice bank
