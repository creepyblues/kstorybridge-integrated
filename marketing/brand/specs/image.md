# Spec — Image Assets

Static images for social (LinkedIn, X, Instagram, Threads), OG/share cards, display ads, press kits, event signage, in-product promo banners. Full brand rules in [`../BRAND_GUIDE.md`](../BRAND_GUIDE.md).

---

## Formats and sizes

| Use case | Aspect | Dimensions (px) | Notes |
| --- | --- | --- | --- |
| LinkedIn / X feed post | 16:9 | 1920 × 1080 | Default choice for most announcements |
| Instagram / LinkedIn square | 1:1 | 1080 × 1080 | Grid-friendly, works on all feeds |
| Instagram / TikTok story cover | 9:16 | 1080 × 1920 | Vertical; crop-safe zone in center 80% |
| LinkedIn cover / X header | 3:1 | 1584 × 396 (LI), 1500 × 500 (X) | Face/logo in center; test crop on mobile |
| OG / Twitter share card | 1.91:1 | 1200 × 630 | One headline + wordmark, nothing else |
| Email hero | 2:1 | 1200 × 600 | Inline image, no text baked in (accessibility) |
| Display ad — leaderboard | 8:1 | 728 × 90 | Wordmark + one-line offer + CTA pill |
| Display ad — medium rectangle | 1.2:1 | 300 × 250 | Wordmark + stat + CTA pill |
| In-product banner | 16:3 | 1600 × 300 | Dismissable promo strip |
| Event signage (portrait) | 2:3 | 2400 × 3600 @ 300dpi | For retractable banners, 24×36in |

**File format:**
- **PNG** for flat compositions with type, logos, UI.
- **JPG (quality 85)** for photo-heavy images.
- **WebP** is fine for web but always ship a PNG/JPG fallback.
- **SVG** for the wordmark and icons only — never for compositions.

**Max file size:**
- Social posts: ≤ 8 MB (LinkedIn/IG limit).
- OG cards: ≤ 1 MB (faster unfurl).
- Email: ≤ 200 KB (deliverability).

---

## Composition rules

### Grid

Treat every frame as a 12-column grid with gutters. Anchor type and imagery to the grid — never freehand placement.

- **1:1 and 16:9:** 12-col grid, 64 px margins, 24 px gutters.
- **9:16:** 6-col grid, 48 px margins.
- **Safe zone:** keep critical content (headlines, logos, faces) within the inner 80% — phone crops, Instagram preview crops, OG text overlays all eat edges.

### Negative space

**At least 20% of the frame is empty.** Forces focus. If you're filling corner-to-corner, you're cheating. The KSB visual signature is calm, not loud.

### Type hierarchy

One image = one message. Max three type elements:

1. **Primary headline** — `text-6xl` equivalent (≈ 60 px on a 1080 canvas), bold, `midnight-ink`. ≤ 9 words.
2. **Supporting line (optional)** — 24 px, semibold, `gray-700`. ≤ 12 words.
3. **Accent line (optional)** — tiny label, 14 px, semibold, brand color. E.g. `FEATURED TITLE` or `50+ STUDIOS`.

**Never:**
- Stack three headlines.
- Use decorative display fonts.
- Wrap type across more than two lines.
- Put type on top of a busy image without a dark overlay (≥ 40% black).

### Color budget

Max **two brand colors per image.**

- Primary: audience color (teal or coral).
- Support: `porcelain-blue`, `warm-sand`, or `midnight-ink`.
- Grays are always free — don't count against the budget.

Example combos:
- ✅ Coral headline + warm-sand accent block + black body (creator announcement)
- ✅ Teal CTA + porcelain-blue wash + black numbers (buyer stat card)
- ❌ Teal + coral + porcelain-blue + sand (too many voices)

---

## Reusable image patterns

### A. Announcement card (1:1)

```
┌──────────────────────────────┐
│                              │
│   KStoryBridge               │  ← wordmark top-left, 24px
│                              │
│                              │
│   Your Korean story          │  ← headline, 56px bold
│   deserves the global        │
│   stage.                     │
│                              │
│   ───                        │  ← 40px coral divider
│                              │
│   kstorybridge.com           │  ← URL, 18px gray-500
│                              │
└──────────────────────────────┘
```

### B. Stat card (1:1 or 16:9)

```
┌──────────────────────────────────────┐
│                                      │
│   50+                                 │  ← BAN, 160px bold, teal-600
│                                      │
│   Hollywood studios                   │  ← caption, 28px semibold, black
│   hunting Korean IP right now.        │
│                                      │
│                                      │
│                       KStoryBridge    │
└──────────────────────────────────────┘
```

### C. Featured-title card (9:16 story, 1:1 feed)

Title key visual fills top 60%, optional dark gradient overlay at bottom, then:
- Title name (EN) — 32px bold, white
- Genre + format badge — 14px pill, coral or teal
- "Available on KStoryBridge" — 16px, gray-200

### D. Quote card (1:1)

```
┌──────────────────────────────┐
│                              │
│   "                          │  ← 96px coral quotation mark
│                              │
│   We closed in 5 weeks       │  ← quote, 36px semibold, black
│   what usually takes a       │
│   year."                     │
│                              │
│   — Head of Development,      │  ← attribution, 18px gray-600
│     [Studio]                  │
│                              │
│   KStoryBridge                │
└──────────────────────────────┘
```

### E. Side-by-side comparison (16:9)

Two columns, `red-50` left (Traditional), `green-50` right (KStoryBridge). One icon + one headline + 2-bullet summary each. Central vertical divider in `gray-200`.

---

## Screenshots as hero imagery

When showcasing the product, **real screenshots beat AI mockups every time.** The approved library lives in:

- [`marketing/assets/producer/`](../../assets/producer/) — ~15 buyer-side screenshots
- [`marketing/assets/creator/`](../../assets/creator/) — ~14 creator-side screenshots

**Handling screenshots:**
- Corner radius: `rounded-xl` (12 px) on the screenshot edge.
- Drop shadow (for marketing context only, not for product UI): `shadow-2xl` equivalent (0 25px 50px -12px rgba(0,0,0,0.25)).
- Optional browser chrome: simplified, gray-100 bar, three traffic-light dots, no URL bar content.
- Never add fake cursors, fake annotations, fake hover states.

---

## Imagery and subject matter

### Approved

- Real product UI (screenshots)
- Rights-cleared Korean title key visuals
- Minimal editorial photography of real team members (founder, collaborators) — warm natural light, uncluttered background
- Abstract geometric accents drawn from the hanok roofline (subtle, support-only)

### Prohibited

- AI-generated people / hands / faces
- Stock "business team" photography
- K-pop / idol imagery
- Food cliché photography (kimchi, ramen, BBQ)
- Cityscapes as decoration (Seoul skyline unless editorially relevant)
- Hand-drawn emoji stickers
- Anything yellow

---

## Accessibility

- **Text contrast:** body ≥ 4.5:1, large text ≥ 3:1. Test teal-on-white (#4C9C9B on #FFF) — passes large text but fails body. Use `hanok-teal-600` or darker for body text.
- **Alt text:** every image ships with alt text. "KStoryBridge announcement: [headline]" is the fallback.
- **OG cards:** never bake critical info into the image alone. Repeat the headline in the post text.

---

## Export and naming

Filename: `{purpose}-{audience}-{aspect}-{date}.png`

Examples:
- `announcement-creator-1x1-260422.png`
- `stat-producer-16x9-260422.png`
- `og-homepage-1.91x1-260422.png`

**Delivery bundle** for a single announcement:
- 1:1 (feed)
- 9:16 (story)
- 16:9 (LinkedIn/X)
- 1.91:1 (OG/share card)
- alt text + caption file as `.txt`

---

## Pre-flight checklist

- [ ] Correct aspect + dimensions for destination
- [ ] Within file-size cap for destination
- [ ] Max two brand colors; audience color primary
- [ ] ≥ 20% negative space
- [ ] Type within safe zone (inner 80%)
- [ ] Headline ≤ 9 words
- [ ] No yellow, no AI people, no stock business photography
- [ ] Contrast tested (body ≥ 4.5:1)
- [ ] Wordmark visible and not distorted
- [ ] Alt text written
- [ ] File named per convention
