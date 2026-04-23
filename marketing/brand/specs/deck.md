# Spec — Decks

Slide decks for sales pitches, investor updates, partner meetings, conference talks. Marp (markdown), Keynote, Google Slides, or claude.ai/design briefs. Full brand rules in [`../BRAND_GUIDE.md`](../BRAND_GUIDE.md).

---

## Use cases and format

| Deck type | Audience | Primary color | Length | Aspect |
| --- | --- | --- | --- | --- |
| Producer / buyer deck | Studios, streamers, production cos. | `hanok-teal` | 12–18 slides | 16:9 |
| Creator deck | Korean authors, agents | `sunrise-coral` | 10–14 slides | 16:9 |
| Introduction deck (neutral) | First-touch general audience | Teal lead + coral accents | 8–12 slides | 16:9 |
| Investor deck | VCs, strategic investors | `hanok-teal` | 12–15 slides | 16:9 |
| Conference talk | Public audience | Per audience | 20–40 slides | 16:9 |

**Aspect ratio:** 16:9 (1920×1080) unless the venue demands otherwise. Never 4:3. Square only for single-frame social slides re-exported from a full deck.

---

## Canvas

- **Slide size:** 1920 × 1080 px (or Marp's default 1280 × 720).
- **Safe zone:** keep type and critical elements ≥ 80 px (4%) from every edge.
- **Background:** `snow-white` (#FFFFFF) is default.
- **Pause slides / dividers:** `porcelain-blue-50` (#F1F9F9) background.
- **Hero cover:** either `snow-white` OR `midnight-ink` (#1C1C1C) with white type. Pick one per deck, don't mix.
- **Never:** full-bleed gradients, photo backgrounds behind type, patterned backgrounds.

---

## Typography scale (on-screen)

| Role | Size | Weight | Color |
| --- | --- | --- | --- |
| Hero cover title | 72 pt | Bold | `midnight-ink` or white |
| Content slide title | 48 pt | Bold | `black` |
| Section divider | 60 pt | Bold | brand color |
| Supporting line | 28 pt | Semibold | `gray-700` |
| Body text | 24 pt | Regular | `gray-600` |
| Caption / source | 16 pt | Regular | `gray-500` |
| BAN (big-ass number) | 120–180 pt | Bold | `text-{brand}-600` |

**Minimum body size:** 20 pt. Below that, audiences in the back row can't read it. If your content won't fit at 20 pt, it belongs in speaker notes.

---

## Word caps (on-screen only)

| Slide type | Cap |
| --- | --- |
| Hero cover | 12 words |
| Section divider | 6 words |
| Content slide | 25 words |
| BAN slide | 1 number + 6-word caption |
| Data slide | headline + 3-row summary; full table in appendix |

Everything cut goes into speaker notes (HTML comments in Marp, notes field in Keynote/Slides).

---

## Color rules

**One brand color per slide.** If the deck targets buyers, teal dominates throughout. If creators, coral. If mixed/neutral (introduction deck), lead teal and accent coral on 2–3 creator-focused slides — never switch mid-section.

**Accent discipline:**
- Max two brand colors per slide total (primary + one support).
- Support is always `porcelain-blue` or `warm-sand`, never the opposing brand color.
- Pure black (`#1C1C1C`) always counts as free — doesn't count against the two-color budget.

**Forbidden:**
- Yellow. Ever.
- Rainbow charts. Use brand-color + gray for comparison.
- More than two brand colors per slide.

---

## Standard slide templates

### 1. Hero cover

```
┌──────────────────────────────────────┐
│                                      │
│                                      │
│  KStoryBridge                        │  ← wordmark, 32pt, gray-500
│                                      │
│  Find your next hit                  │  ← title, 72pt bold, midnight-ink
│  with AI.                            │
│                                      │
│  Hollywood's AI-powered Korean IP    │  ← subtitle, 28pt semibold, gray-700
│  discovery engine.                   │
│                                      │
│                                      │
│                              Sungho  │  ← speaker, 16pt, gray-500 (bottom-right)
│                              Apr '26 │
└──────────────────────────────────────┘
```

### 2. Section divider

```
┌──────────────────────────────────────┐
│                                      │
│                                      │
│        01  The problem               │  ← 60pt bold, teal-600
│                                      │
│        Studios waste 4 months        │  ← 28pt, gray-700
│        finding the wrong IP.         │
│                                      │
│                                      │
└──────────────────────────────────────┘
```

### 3. BAN (big-ass number) slide

```
┌──────────────────────────────────────┐
│                                      │
│                                      │
│            50+                        │  ← 180pt bold, teal-600
│                                      │
│       Hollywood studios               │  ← 32pt semibold, black
│       currently hunting Korean IP.    │
│                                      │
│                                      │
└──────────────────────────────────────┘
```

Use BANs instead of tables whenever one number tells the story. Tables belong in the appendix.

### 4. Three-up (pillars)

Three equal columns, each with an icon box, 20pt title, 18pt supporting line. Grid gap 48px. No card borders or shadows — these are content tiles, not UI cards.

### 5. Comparison slide (before/after)

Two columns. Left: "Traditional" in `red-50` wash with `red-600` small accent text. Right: "With KStoryBridge" in `green-50` wash with `green-600` accent. Body type stays gray-700 on both sides.

### 6. Closing CTA

One line with the offer, one primary CTA button (coral for creators, teal for buyers), email address below in gray-500. No QR code unless the deck is being projected to a room.

---

## Speaker notes discipline

Everything the presenter will *say but not show* goes into notes. Rule of thumb: if you're reading the slide word-for-word, you're doing it wrong. Target density:

- Slide body: 3–6 lines of visible text.
- Speaker notes: 3–8 sentences of context, stat sources, transition cues.

---

## Imagery in decks

- Product screenshots from [`marketing/assets/`](../../assets/) are always on-brand. First choice.
- Korean title key visuals with rights-cleared status are second choice.
- Maps, geo-graphics, stylized data viz are last resort — only when the data demands it.
- Never: stock people-at-laptops, AI-generated faces, generic "globe" illustrations.

---

## Export

- **Marp:** `marp --pdf deck.md` → use `--theme` pointing to `marketing/decks/theme.css` if one exists.
- **Keynote/Slides:** export PDF with "Best" quality. File name: `KStoryBridge-{audience}-{YYMMDD}.pdf` (e.g. `KStoryBridge-producer-260422.pdf`).
- **Font embedding:** if exporting to PDF for external sharing, embed Inter as SF Pro substitute (not every machine has SF Pro).

---

## Reference decks in this repo

- [`marketing/decks/producer-deck.md`](../../decks/) — buyer flagship
- [`marketing/decks/creator-deck.md`](../../decks/) — creator flagship
- [`marketing/decks/introduction-deck.md`](../../decks/) — neutral first-touch

Open these before starting a new deck — match tone, density, and cadence.

---

## Pre-flight checklist

- [ ] 16:9 aspect, 1920×1080
- [ ] One primary brand color for the whole deck, matched to audience
- [ ] Every slide under its word cap (hero ≤ 12, content ≤ 25)
- [ ] Title Case on titles, sentence case everywhere else
- [ ] Body text ≥ 20pt
- [ ] Speaker notes written for every content slide
- [ ] No yellow, no rainbow charts, no stock people
- [ ] Closing slide has one specific CTA + email
- [ ] Exported PDF has embedded fonts
