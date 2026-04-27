# KStoryBridge Brand Guide

**Last updated:** 2026-04-22
**Audience:** internal teams, external designers, contractors, partner producers/agencies
**Canonical code source:** [`packages/colors/colors.ts`](../../packages/colors/colors.ts)

KStoryBridge is the bridge between Korean story IP (webtoons, web novels) and global buyers (studios, streamers, production companies). The brand has to feel **trustworthy enough for a studio to sign a deal through us**, and **aspirational enough for a creator to hand us their life's work**. Every asset we ship has to hold that tension.

This guide is the single source for anyone making something that will carry the KStoryBridge name. For execution specs per format, see `specs/deck.md`, `specs/image.md`, `specs/video.md`, `specs/website.md`.

---

## 1. Brand at a glance

**What we are:** a curated marketplace and deal-support layer that matches proven Korean IP with global buyers, then walks the rights through to close.

**Voice in one line:** aspirational and concrete. Specific numbers. No jargon. Direct address.

**Visual signature:** flat, confident, minimal. Korean cultural warmth (sand, teal) meets Hollywood energy (coral). System typography. No decoration for decoration's sake.

**Hard guardrails (never break):**
- **Never yellow.** Anywhere. Replace with `gray-500` (#6B7280) or a brand color.
- **Cards on marketing surfaces are flat.** `bg-transparent border-gray-300 shadow-none rounded-2xl`. No shadows, no solid fills.
- **Audience color routes the artifact.** Teal for buyers, coral for creators. Mixing confuses the reader.
- **Container is always `max-w-7xl` (1280px) centered.** Never wider.
- **Body copy is `text-gray-600`. Headings are `text-black`.** Not `text-gray-900`.

---

## 2. Color system

All hex values below come from [`packages/colors/colors.ts`](../../packages/colors/colors.ts). If a doc contradicts that file, that file wins.

### 2.1 Core palette

| Token | Hex (DEFAULT) | Primary role |
| --- | --- | --- |
| `hanok-teal` | **#4C9C9B** | Buyer/producer primary. Trust, AI, technology. |
| `sunrise-coral` | **#FF6B6B** | Creator primary. Passion, creative energy. |
| `midnight-ink` | **#1C1C1C** | Hero headlines, deep text, high-contrast numbers. |
| `porcelain-blue` | **#C3E3E2** | Support/legal/deal accents. Soft backgrounds. |
| `warm-sand` | **#F5E9D7** | Korean cultural accent. Neutral warmth. |
| `snow-white` | **#FFFFFF** | Page background, card foreground. |
| `pro-purple` | **#AF52DE** | Dashboard Pro tier badge only. Do not use on marketing surfaces. |

### 2.2 Full scale

Each brand color has shades 50–900. Most surfaces only need DEFAULT + 50 (wash) + 600 (hover/press). Full scales live in the engineering design tokens doc (`/.claude/skills/kstorybridge-design/tokens.md`).

### 2.3 Audience routing

| Surface | Primary color | When |
| --- | --- | --- |
| Creator-facing (pitching to writers/studios) | `sunrise-coral` | Creator landing pages, creator onboarding, creator pitch decks, creator social |
| Buyer-facing (pitching to producers/studios) | `hanok-teal` | Buyer landing pages, buyer product, producer decks, buyer social |
| Dual-audience (homepage, About, company news) | Teal lead + coral accent | ~70/30 split. Coral appears on creator-focused sections only. |
| Rights / legal / deal content | `porcelain-blue` | Regardless of audience. Signals precision. |
| Korean cultural content | `warm-sand` | Regardless of audience. Signals heritage. |

**Why this matters:** creators and buyers have opposite emotional drivers. Creators buy on inspiration; buyers buy on confidence. Splitting the primary color lets us speak to both without one sounding watered-down.

### 2.4 Neutrals

Use stock Tailwind gray. Do not recolor.

| Class | Hex | Use |
| --- | --- | --- |
| `gray-50` | #F9FAFB | Lightest wash |
| `gray-100` | #F3F4F6 | Secondary button hover |
| `gray-200` | #E5E7EB | Subtle dividers |
| `gray-300` | #D1D5DB | **Standard card + button border** |
| `gray-500` | #6B7280 | **Replacement for any would-be yellow** |
| `gray-600` | #4B5563 | **Body text color** |
| `gray-700` | #374151 | Stronger body text |

### 2.5 Status colors (product only, not marketing)

`red-*` for error, `green-*` for success, `blue-*` for info. Tailwind defaults. Do not appear on marketing surfaces except in error states.

---

## 3. Typography

### 3.1 Font stack

```
-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text",
"Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif
```

**No webfont loaded.** SF Pro on Apple, Segoe UI on Windows, Roboto on Android. Intentional: we want speed, familiarity, and zero licensing friction for contractors.

For printed assets or sealed PDFs (decks exported for partners), embed **Inter** as the SF Pro substitute. Never use serif, display, or handwritten fonts — off-brand.

### 3.2 Scale

| Role | Size (px) | Weight | Color |
| --- | --- | --- | --- |
| Deck hero | 60–72 | Bold | `midnight-ink` |
| Landing hero | 30 / 36 / 48 (responsive) | Bold | `midnight-ink` or `black` |
| Section head | 24 / 30 | Bold | `black` |
| Subsection | 20 | Semibold | `black` |
| Card title | 18 | Semibold | `black` |
| Body | 16 | Regular | `gray-600` |
| Body small | 14 | Regular | `gray-600` |
| Caption / meta | 12 | Semibold | varies |
| BAN (big-ass number) | 36 / 48 | Bold | `text-{brand}-600` |

### 3.3 Casing rules

- **Title Case** for hero headlines and major section heads.
- **sentence case** for body copy and CTA buttons.
- **ALL CAPS** only for marketing-page trust badges (`50+ STUDIOS`, `20+ YEARS EXPERIENCE`, `YOUR TERMS`). Never in-app, never on buttons.

### 3.4 Length caps

- Hero headline: ≤ 18 words
- Section body: ≤ 25 words
- One-liner / caption: ≤ 12 words
- Slide hero: ≤ 12 words on screen (rest → speaker notes)
- Slide content: ≤ 25 words on screen

---

## 4. Logo and wordmark

- **Wordmark:** "KStoryBridge" set in the SF Pro bold. Single word, no space, capital K, capital S, capital B.
- **Lockup color:**
  - On white / light: `midnight-ink` (#1C1C1C).
  - On dark: `snow-white` (#FFFFFF).
  - On brand color (teal or coral): `snow-white`.
  - Never on yellow. Never on a photo without a dark overlay (at least 40% opacity black).
- **Clear space:** minimum padding around the wordmark equal to the cap-height of the "K".
- **Minimum size:** 120px wide on screen, 0.75in / 19mm in print.
- **Don't:** stretch, skew, recolor to anything other than ink/white, drop-shadow, outline, add a tagline lockup.

> Wordmark-only is the primary identity. There is no standalone icon mark yet — don't ship one until it's been approved centrally.

---

## 5. Voice and tone

### 5.1 Principles

- **Aspirational and concrete.** "Your story on HBO" beats "unlocking opportunities."
- **Specific numbers.** "50+ studios," "2M subscribers," "4 months not 2 weeks." Never "many," "lots," "tons."
- **Direct address.** "Your," "You." Never "Our users," "content creators."
- **Lead with the outcome.** What they get, not what we do.

### 5.2 Audience register

| Audience | Register | Example |
| --- | --- | --- |
| Creators | Empowerment, creative energy | "Your story deserves the global stage." |
| Buyers | Precision, velocity, trust | "Find your next hit with AI-powered comps in 10 seconds." |
| Dual | Balanced, outcome-first | "The bridge between Korean IP and global screens." |

### 5.3 Banned words

> revolutionize · disrupt · seamless · synergy · solution · ecosystem · leverage · unlock (as a verb for abstract nouns) · game-changer · next-generation · cutting-edge

If you find yourself reaching for one of these, you're describing us instead of what the reader gets.

### 5.4 Approved voice examples (from shipped copy)

- "Find your next hit with AI."
- "Your Korean story, on Hollywood screens."
- "Curated. Cleared. Closed."
- "50+ studios. 20+ years. Your terms."
- "Four months, not two weeks." *(time-to-close contrast)*
- "We don't sell leads. We close deals."

### 5.5 From-line for email

Always "KStoryBridge." Never "The KStoryBridge team," never "Hello from KStoryBridge." First line of the email is specific to the recipient — never "Hi there."

---

## 6. Layout principles

### 6.1 Spacing

Mobile-first, Tailwind defaults. `sm` 640, `md` 768, `lg` 1024, `xl` 1280.

| Purpose | Tailwind |
| --- | --- |
| Section vertical padding | `py-12 sm:py-16 lg:py-20` |
| Section horizontal padding | `px-4 sm:px-6 lg:px-8` |
| Container | `max-w-7xl mx-auto` |
| Card margin bottom | `mb-6 sm:mb-8 lg:mb-12` |
| Card internal padding | `p-4 sm:p-6` |
| Grid gap | `gap-4 sm:gap-6` |

### 6.2 Radius

| Element | Radius |
| --- | --- |
| Cards | `rounded-2xl` (1rem) |
| Primary CTAs (marketing) | `rounded-full` |
| Secondary buttons (in-product) | `rounded-md` |
| Badges | `rounded-full` |
| Icon boxes | `rounded-lg` |

### 6.3 Shadows

- **Marketing cards:** none. `shadow-none` is mandatory.
- **Primary hero CTA:** `shadow-lg` allowed, one per section.
- **In-product cards (dashboard):** `hover:shadow-xl` allowed.
- **Email templates:** none. Most clients strip them.

### 6.4 Card style by surface

There are two card styles. Use the right one.

**A. Marketing card (flat)** — landing pages, decks, social, emails:
```
bg-transparent border-gray-300 shadow-none rounded-2xl
```

**B. Product card (soft elevated)** — buyer dashboard, admin panels, in-app UI:
```
bg-white border-hanok-teal/20 rounded-2xl hover:shadow-xl transition-all duration-300
```

If you're building a marketing/external artifact, default to A. Only use B inside the authenticated product.

---

## 7. Motion

Use motion to reward attention, not decorate.

| Pattern | Use |
| --- | --- |
| `fade-in-up` | Hero subtitle entry |
| `scale-in` | CTA / badge land |
| `pulse-glow` | Attention-draw on a single primary CTA |

**Rules:**
- One animated element per viewport.
- Honor `prefers-reduced-motion: reduce`.
- No auto-playing videos as decoration.
- No infinite background loops.
- No page-level parallax.

---

## 8. Imagery

### 8.1 Hierarchy

1. **Real product screenshots** — highest priority. ~29 approved screenshots live in [`marketing/assets/producer/`](../assets/producer/) and [`marketing/assets/creator/`](../assets/creator/). Use these before generating anything new.
2. **Approved Korean title key visuals** — webtoon/novel cover art for featured content. Rights-cleared only.
3. **Minimal illustration** — avoid. If you must, flat line, two-color (one brand + one neutral).
4. **Stock photography** — avoid. If unavoidable, must feature real creators/buyers in context (not laptops-on-desks generic).

### 8.2 Prohibited

- AI-generated people (hands, faces). Telegraphs AI-slop, undermines trust.
- Generic "diversity" stock photo sets.
- Korean visual clichés (hanbok, palace photos, temple shots) unless editorially justified.
- Anything yellow.

### 8.3 Korean cultural references

**Good:** hanok architecture lines (the roofline inspires the logo's visual feel), warm-sand palette, subtle typographic hangul in secondary position.

**Avoid:** kimchi/food emoji, K-pop visual shorthand, taegeuk/flag graphics (political), overtly "exotic" framing.

---

## 9. Decision tree: which color do I use?

```
Is the artifact going to a creator? ........... sunrise-coral primary
Is the artifact going to a buyer? ............. hanok-teal primary
Is it the homepage / About / company news? .... teal lead, coral accent
Is it about a rights/legal/deal topic? ........ porcelain-blue accent
Is it a Korean heritage moment? ............... warm-sand accent
Is it an error state? ......................... red-* (product only)
Is it the dashboard Pro badge? ................ pro-purple
```

If you'd answer "both" (creator + buyer): pick the primary recipient. If truly dual, lead teal.

---

## 10. Verification checklist

Run through before delivering any on-brand artifact.

- [ ] **No yellow** anywhere.
- [ ] **Audience color** correct for recipient.
- [ ] **Casing:** Title Case on heads, sentence case on body/CTA, ALL CAPS only on trust badges.
- [ ] **Cards:** right variant (flat for marketing, elevated for product).
- [ ] **Container** `max-w-7xl mx-auto` with gutters.
- [ ] **Typography** SF Pro stack; `text-black` heads, `text-gray-600` body.
- [ ] **Copy** free of banned words. Numbers are specific.
- [ ] **Asset check:** artifact feels like the same product family as screenshots in `marketing/assets/`.
- [ ] **Accessibility:** text contrast ≥ 4.5:1 for body, ≥ 3:1 for large text. Motion honors reduced-motion.

---

## 11. Source files

| Purpose | File |
| --- | --- |
| Color hex values (canonical) | [`packages/colors/colors.ts`](../../packages/colors/colors.ts) |
| Runtime CSS variables | [`apps/website/src/index.css`](../../apps/website/src/index.css) |
| Internal design system rules | [`docs/active/DESIGN_SYSTEM.md`](../../docs/active/DESIGN_SYSTEM.md) |
| AI-agent design skill | [`.claude/skills/kstorybridge-design/`](../../.claude/skills/kstorybridge-design/) |
| Shipped reference decks | [`marketing/decks/`](../decks/) |
| Shipped screenshots | [`marketing/assets/`](../assets/) |
| Per-format execution specs | [`marketing/brand/specs/`](./specs/) |

---

## 12. Contact

Questions, exceptions, or requests for new components: open a PR against this file or message the founder. Do not invent new brand tokens without a PR — the moment we have two sources of truth, we have none.
