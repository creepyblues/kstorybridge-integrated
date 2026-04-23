# Spec — Video Assets

Short-form social (Reels, Shorts, TikTok), explainers, product demos, sizzle reels, event loops, investor update videos. Full brand rules in [`../BRAND_GUIDE.md`](../BRAND_GUIDE.md).

---

## Formats and use cases

| Use case | Aspect | Runtime | Destination |
| --- | --- | --- | --- |
| Vertical short | 9:16 | 15–60 s | Reels, Shorts, TikTok, LinkedIn mobile |
| Social landscape | 16:9 | 30–90 s | LinkedIn, X, YouTube, website hero loop |
| Square social | 1:1 | 15–60 s | Instagram feed, cross-platform safe |
| Explainer / demo | 16:9 | 60–180 s | Website, email, YouTube |
| Sizzle reel (investor, partner) | 16:9 | 60–120 s | Decks, partner meetings, fundraising |
| Event loop (silent) | 16:9 | 20–30 s, loop | Trade-show screens, office displays |
| Product walkthrough | 16:9 | 2–5 min | Onboarding, support, sales |

**Technical specs:**
- Resolution: **1080p minimum**, 4K for flagship assets.
- Frame rate: **30 fps** standard, 60 fps if motion graphics demand it. No 24 fps unless shot on camera.
- Codec: **H.264** (universal), HEVC/H.265 acceptable for web.
- Container: **MP4**.
- Bitrate: 10–15 Mbps for 1080p social, 25+ Mbps for flagship.
- Audio: AAC, stereo, 48 kHz, -14 LUFS normalized (social-platform standard).

---

## Runtime discipline

Most watch-time is earned in the first 3 seconds. Structure every video as:

| Beat | Time | Purpose |
| --- | --- | --- |
| Hook | 0–3 s | One specific promise or question. Character/logo can appear but is not the hook. |
| Payoff / demo | 3–?? s | Deliver on the hook. Product footage, stat, proof. |
| CTA | final 3–5 s | One action. URL or short verb ("kstorybridge.com"). |

If the video is longer than 30 s, insert a mid-roll re-hook — a second surprise, a new stat, or a pattern interrupt — every 15 s.

---

## Safe zones

Platforms crop aggressively. Respect these zones.

### 9:16 (vertical)

- **UI-safe zone:** center 60% vertically (from ~16% to ~76% of frame height). Captions + UI chrome eat top and bottom.
- **Text-safe zone:** center 70% horizontally.
- **Logo placement:** top-left, 5% inset — avoids TikTok/IG profile bubble (bottom-right) and caption overlays.

### 16:9

- **Title-safe zone:** inner 90%.
- **Action-safe:** inner 95%.
- **Captions:** bottom 15% — don't put brand type there; it'll fight subtitles.

### 1:1

- **Safe zone:** inner 85%.
- Assume the top 12% gets covered by the username on IG.

---

## Motion system

Match the brand's calm discipline — minimal, purposeful, never decorative.

### Type animation

- **Entrance:** fade + 20 px rise (200 ms, ease-out). Never bounce, never flip.
- **Exit:** fade only (150 ms).
- **Emphasis:** scale from 100% → 104% over 400 ms, ease-in-out. One element at a time.
- **Typing / typewriter:** allowed for hero hooks. Monospace or SF Pro; cursor blinks 2× then continues.

### Lower thirds

- Left-aligned, 8% from left edge, 12% from bottom.
- Brand-color bar (2 px, audience color) on top of name line.
- Name in SF Pro bold 36pt white; title in SF Pro regular 22pt `gray-200`.
- Slides in from the left (200 ms), holds ≥ 3 s, slides out or cross-fades.

### Transitions

- **Between shots:** hard cuts. Cross-dissolves only for emotional beats (founder interview, closing).
- **Between sections:** 200 ms fade-through-white or fade-through-black.
- **Never:** slides, wipes, page-peels, cube transitions, zoom transitions.

### Camera movement (on-product captures)

- **Smooth zooms / pans:** OK at subtle speeds (< 5% of frame per second).
- **Screen recordings:** steady, no cursor flicker. Highlight rings on click use `hanok-teal` 80% opacity, 400 ms pulse.
- **Speed ramps:** OK for product capture (e.g. 2× during navigation, 1× during key moments). Don't ramp text moments.

### Motion to avoid

- Parallax scrolling backgrounds
- Infinite spinners as "loading" stingers
- Hand-drawn / whiteboard animations
- 3D rotating logos
- Glitch effects
- Shake / earthquake on "dramatic" cuts

---

## Typography in video

- **Stack:** SF Pro Display (falls back to Inter for non-Apple export pipelines).
- **Never** Comic Sans, Lobster, Pacifico, or any other display font.

| Role | Size (1080p canvas) | Weight | Color |
| --- | --- | --- | --- |
| Full-screen title | 96–140 px | Bold | `midnight-ink` or white |
| Lower third name | 36 px | Bold | white |
| Lower third title | 22 px | Regular | `gray-200` |
| Stat BAN | 180–240 px | Bold | brand color |
| Caption / subtitle | 42 px | Semibold | white with 2 px black shadow or `rgba(0,0,0,0.6)` pill |
| End card CTA | 56 px | Bold | white on brand color |

**Always caption every video.** Accessibility + 85% of social viewing is silent.

- Burned-in captions for vertical social (platform subtitle rendering is inconsistent).
- Separate `.srt` for horizontal content on YouTube/LinkedIn.
- Caption style: white text, ≥ 40 px, with semi-opaque black pill behind each line. Never yellow captions.

---

## Color grading

- **Untreated footage:** preferred. Don't apply Instagram filters.
- **Correction pass:** neutral white balance, skin tones warm but natural, highlights held under 100 IRE.
- **Brand-color integration:** introduce teal/coral through props, UI on screens, lower-third bars, and graphics — not through grade tint.
- **Forbidden:** teal-orange grade (cliché cinematic look), heavy film-grain overlays, chromatic aberration.

---

## Audio

- **Music:** instrumental only. No vocal tracks on explainers (fights narration). Licensed from Artlist, Musicbed, or similar. Never uncleared.
- **Tone:** understated, modern, non-epic. Avoid "corporate uplift" tracks.
- **Ducking:** music sits at -20 to -24 LUFS under narration (which lives at -14 to -16 LUFS).
- **Voiceover:** one voice per video. Mic close, no room reverb, de-essed, compressed 3:1.
- **End stinger:** max 1 s, single piano / synth chord on brand-color logo reveal. No sound-effect library stings.

---

## End card

Every public-facing video ends with a 2–3 s card:

```
┌──────────────────────────────────────┐
│                                      │
│   KStoryBridge                        │  ← wordmark, 80px, black or white
│                                      │
│   Find your next hit with AI.         │  ← tagline, 32px semibold
│                                      │
│   kstorybridge.com                    │  ← URL, 40px bold, brand color
│                                      │
└──────────────────────────────────────┘
```

- Background: `snow-white` or `midnight-ink`.
- One URL. One sentence. No QR codes on video unless it's an event loop.

---

## Thumbnail

Every horizontal video needs a custom thumbnail.

- 1280 × 720
- One face (if there is one) — eye contact, not laughing.
- One 3–5 word headline, 120px bold, matching the brand-guide image rules.
- Wordmark bottom-right.
- No arrows, no red circles, no shocked faces, no MrBeast-style clickbait decoration.

---

## File delivery

**Filename:** `KSB-{usecase}-{aspect}-{YYMMDD}.mp4`

Examples:
- `KSB-reel-creator-9x16-260422.mp4`
- `KSB-explainer-buyer-16x9-260422.mp4`
- `KSB-sizzle-16x9-260422.mp4`

**Bundle for each social launch:**
- 9:16 master (1080 × 1920, H.264, with burned captions)
- 16:9 master (1920 × 1080, H.264, with SRT)
- 1:1 crop (1080 × 1080, H.264)
- Thumbnail PNG
- Caption file (SRT) + transcript (TXT)

---

## Accessibility

- **Captions:** always. Burned in for vertical, SRT for horizontal.
- **Flash / strobe:** nothing over 3 flashes per second.
- **Motion:** for web-embedded autoplay loops, respect `prefers-reduced-motion` — ship a static poster image as the default for users who've set that preference.
- **Color contrast:** captions ≥ 4.5:1 against content behind them. Use the black pill behind white text if the footage varies.

---

## Pre-flight checklist

- [ ] Correct aspect + runtime for destination platform
- [ ] Hook delivered in first 3 s
- [ ] One clear CTA at the end
- [ ] Safe zones respected (UI-safe 60% center for vertical)
- [ ] Captions: burned for vertical, SRT for horizontal
- [ ] Audio: music ducks under VO, -14 LUFS normalized
- [ ] End card: wordmark + one URL
- [ ] Custom thumbnail delivered
- [ ] No yellow, no glitch effects, no 3D logo spins
- [ ] Filename matches convention
- [ ] Static poster image shipped for autoplay contexts
