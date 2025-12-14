# Typewriter Effect Component

**Created**: 2025-12-12
**Location**: Originally in `apps/dashboard/`
**Status**: Ready for cross-app use

A cinematic typewriter animation that displays text letter-by-letter like movie subtitles. Features natural timing variance, punctuation pauses, blinking cursor, and accessibility support.

---

## Quick Start

### 1. Copy Required Files

Copy these files to your target app:

```bash
# From dashboard to creator app
cp apps/dashboard/src/hooks/useTypewriter.ts apps/creator/src/hooks/
cp apps/dashboard/src/components/home/TypewriterText.tsx apps/creator/src/components/

# From dashboard to website app
cp apps/dashboard/src/hooks/useTypewriter.ts apps/website/src/hooks/
cp apps/dashboard/src/components/home/TypewriterText.tsx apps/website/src/components/
```

### 2. Add Tailwind Animation

Add to your app's `tailwind.config.ts`:

```typescript
// In theme.extend.keyframes:
'cursor-blink': {
  '0%, 100%': { opacity: '1' },
  '50%': { opacity: '0' },
},

// In theme.extend.animation:
'cursor-blink': 'cursor-blink 1s steps(2) infinite',
```

### 3. Use the Component

```tsx
import { TypewriterText } from '@/components/TypewriterText';

<TypewriterText
  storageKey="my-page-hero"
  lines={[
    { text: 'Welcome to our platform', className: 'text-4xl font-bold' },
    { text: 'Discover amazing content.', className: 'text-xl text-gray-600 mt-4', delay: 400 },
  ]}
/>
```

---

## Components

### TypewriterText

Multi-line animated text component with sequential animation and blinking cursor.

#### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `lines` | `TypewriterLine[]` | required | Array of text lines to animate |
| `storageKey` | `string` | `'typewriter-played'` | SessionStorage key for skip detection |
| `cursorClassName` | `string` | `'text-hanok-teal'` | Tailwind classes for cursor color |
| `onAllComplete` | `() => void` | - | Callback when all lines finish |
| `baseSpeed` | `number` | `50` | Milliseconds per character |
| `lineBreakPause` | `number` | `400` | Pause between lines (ms) |

#### TypewriterLine Interface

```typescript
interface TypewriterLine {
  text: string;           // The text to display
  className?: string;     // Tailwind classes for this line
  delay?: number;         // Custom delay before this line starts (ms)
}
```

#### Example: Hero Section

```tsx
<TypewriterText
  storageKey="home-hero-played"
  lines={[
    {
      text: 'Find Korean IP that fits your next show',
      className: 'text-3xl md:text-4xl lg:text-5xl font-bold text-black',
    },
    {
      text: ' in under 60 seconds.',
      className: 'text-3xl md:text-4xl lg:text-5xl font-bold text-hanok-teal',
      delay: 0, // Immediate continuation (same line visually)
    },
    {
      text: 'Tell us one show or brief, we\'ll pull matching Korean IP.',
      className: 'text-lg text-gray-600 block mt-4',
      delay: 400, // Pause before subtitle
    },
  ]}
  cursorClassName="text-hanok-teal"
/>
```

---

### useTypewriter Hook

Lower-level hook for custom implementations.

#### Options

```typescript
interface UseTypewriterOptions {
  text: string;                      // Text to animate
  speed?: number;                    // Base ms per character (default: 50)
  startDelay?: number;               // Delay before starting (default: 0)
  onComplete?: () => void;           // Callback when done
  skipAnimation?: boolean;           // Show full text immediately
  varianceRange?: [number, number];  // Random variance range (default: [-15, 30])
  punctuationPause?: number;         // Extra pause on punctuation (default: 200)
}
```

#### Return Value

```typescript
interface UseTypewriterReturn {
  displayedText: string;   // Current visible text
  isComplete: boolean;     // Animation finished
  isTyping: boolean;       // Currently animating
  reset: () => void;       // Restart animation
}
```

#### Example: Custom Implementation

```tsx
import { useTypewriter } from '@/hooks/useTypewriter';

function CustomTypewriter({ text }: { text: string }) {
  const { displayedText, isTyping } = useTypewriter({
    text,
    speed: 40,
    punctuationPause: 300,
  });

  return (
    <p>
      {displayedText}
      {isTyping && <span className="animate-cursor-blink">|</span>}
    </p>
  );
}
```

---

## Animation Timing

Default timing creates a "movie subtitle" feel:

| Parameter | Value | Effect |
|-----------|-------|--------|
| Base speed | 50ms | Natural reading pace |
| Variance | -15 to +30ms | Human-like irregularity |
| Punctuation pause | +200ms | Natural breath after `.` `,` `!` `?` |
| Line break pause | 400ms | Scene transition feel |
| Start delay | 200ms | Let page settle first |

### Adjusting Speed

```tsx
// Faster (urgent feel)
<TypewriterText baseSpeed={30} lineBreakPause={200} ... />

// Slower (dramatic feel)
<TypewriterText baseSpeed={80} lineBreakPause={600} ... />
```

---

## Session Behavior

The component uses `sessionStorage` to track if animation has played:

- **First visit**: Animation plays fully
- **Return navigation**: Animation skipped, full text shown immediately
- **New session**: Animation plays again (sessionStorage clears on browser close)

### Force Replay (Development)

```javascript
// In browser console
sessionStorage.removeItem('home-hero-played');
location.reload();
```

### Different Keys Per Page

```tsx
// Home page
<TypewriterText storageKey="home-hero" ... />

// About page
<TypewriterText storageKey="about-hero" ... />
```

---

## Accessibility

### Built-in Features

1. **Screen readers**: Full text in `aria-label`, cursor hidden with `aria-hidden`
2. **Reduced motion**: Automatically skips animation if `prefers-reduced-motion: reduce`
3. **Semantic HTML**: Uses `role="heading"` with `aria-level`

### Testing Reduced Motion

```css
/* In browser DevTools, enable "Reduce motion" in Rendering tab */
/* Or add to your CSS temporarily: */
* {
  animation-duration: 0.001ms !important;
}
```

---

## File Reference

### apps/dashboard/src/hooks/useTypewriter.ts

```typescript
import { useState, useEffect, useCallback, useRef } from 'react';

interface UseTypewriterOptions {
  text: string;
  speed?: number;
  startDelay?: number;
  onComplete?: () => void;
  skipAnimation?: boolean;
  varianceRange?: [number, number];
  punctuationPause?: number;
}

interface UseTypewriterReturn {
  displayedText: string;
  isComplete: boolean;
  isTyping: boolean;
  reset: () => void;
}

const PUNCTUATION_CHARS = new Set(['.', ',', '!', '?', ';', ':']);

function getRandomVariance(range: [number, number]): number {
  const [min, max] = range;
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function isPunctuation(char: string): boolean {
  return PUNCTUATION_CHARS.has(char);
}

export function useTypewriter({
  text,
  speed = 50,
  startDelay = 0,
  onComplete,
  skipAnimation = false,
  varianceRange = [-15, 30],
  punctuationPause = 200,
}: UseTypewriterOptions): UseTypewriterReturn {
  const [displayedText, setDisplayedText] = useState(skipAnimation ? text : '');
  const [isComplete, setIsComplete] = useState(skipAnimation);
  const [isTyping, setIsTyping] = useState(!skipAnimation);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const indexRef = useRef(0);

  const reset = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    indexRef.current = 0;
    setDisplayedText('');
    setIsComplete(false);
    setIsTyping(true);
  }, []);

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (skipAnimation || prefersReducedMotion) {
      setDisplayedText(text);
      setIsComplete(true);
      setIsTyping(false);
      return;
    }

    indexRef.current = 0;
    setDisplayedText('');
    setIsComplete(false);
    setIsTyping(true);

    const typeNextChar = () => {
      if (indexRef.current < text.length) {
        const char = text[indexRef.current];
        setDisplayedText(text.slice(0, indexRef.current + 1));

        let delay = speed + getRandomVariance(varianceRange);
        if (isPunctuation(char)) {
          delay += punctuationPause;
        }

        indexRef.current++;
        timeoutRef.current = setTimeout(typeNextChar, delay);
      } else {
        setIsTyping(false);
        setIsComplete(true);
        onComplete?.();
      }
    };

    timeoutRef.current = setTimeout(typeNextChar, startDelay);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [text, speed, startDelay, skipAnimation, varianceRange, punctuationPause, onComplete]);

  return { displayedText, isComplete, isTyping, reset };
}
```

### apps/dashboard/src/components/home/TypewriterText.tsx

```typescript
import { useState, useEffect, useMemo } from 'react';
import { cn } from '@/lib/utils';

interface TypewriterLine {
  text: string;
  className?: string;
  delay?: number;
}

interface TypewriterTextProps {
  lines: TypewriterLine[];
  cursorClassName?: string;
  storageKey?: string;
  onAllComplete?: () => void;
  baseSpeed?: number;
  lineBreakPause?: number;
}

const PUNCTUATION_CHARS = new Set(['.', ',', '!', '?', ';', ':']);

function getRandomVariance(): number {
  return Math.floor(Math.random() * 45) - 15;
}

function isPunctuation(char: string): boolean {
  return PUNCTUATION_CHARS.has(char);
}

export function TypewriterText({
  lines,
  cursorClassName = 'text-hanok-teal',
  storageKey = 'typewriter-played',
  onAllComplete,
  baseSpeed = 50,
  lineBreakPause = 400,
}: TypewriterTextProps) {
  const [currentLineIndex, setCurrentLineIndex] = useState(0);
  const [displayedTexts, setDisplayedTexts] = useState<string[]>(() =>
    lines.map(() => '')
  );
  const [isAllComplete, setIsAllComplete] = useState(false);
  const [shouldSkip, setShouldSkip] = useState(false);

  useEffect(() => {
    const hasPlayed = sessionStorage.getItem(storageKey);
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (hasPlayed || prefersReducedMotion) {
      setShouldSkip(true);
      setDisplayedTexts(lines.map(line => line.text));
      setCurrentLineIndex(lines.length);
      setIsAllComplete(true);
    }
  }, [storageKey, lines]);

  const fullText = useMemo(() =>
    lines.map(line => line.text).join(' '),
    [lines]
  );

  useEffect(() => {
    if (shouldSkip || currentLineIndex >= lines.length) return;

    const currentLine = lines[currentLineIndex];
    const lineDelay = currentLineIndex === 0 ? 200 : (currentLine.delay ?? lineBreakPause);
    let charIndex = 0;
    let timeoutId: NodeJS.Timeout;

    const typeNextChar = () => {
      if (charIndex < currentLine.text.length) {
        const char = currentLine.text[charIndex];

        setDisplayedTexts(prev => {
          const newTexts = [...prev];
          newTexts[currentLineIndex] = currentLine.text.slice(0, charIndex + 1);
          return newTexts;
        });

        let delay = baseSpeed + getRandomVariance();
        if (isPunctuation(char)) {
          delay += 200;
        }

        charIndex++;
        timeoutId = setTimeout(typeNextChar, delay);
      } else {
        if (currentLineIndex < lines.length - 1) {
          setCurrentLineIndex(prev => prev + 1);
        } else {
          setIsAllComplete(true);
          sessionStorage.setItem(storageKey, 'true');
          onAllComplete?.();
        }
      }
    };

    timeoutId = setTimeout(typeNextChar, lineDelay);

    return () => clearTimeout(timeoutId);
  }, [currentLineIndex, shouldSkip, lines, baseSpeed, lineBreakPause, storageKey, onAllComplete]);

  const isTyping = !isAllComplete && currentLineIndex < lines.length;

  return (
    <div
      role="heading"
      aria-level={1}
      aria-label={fullText}
    >
      {lines.map((line, index) => {
        const isCurrentLine = index === currentLineIndex;
        const showCursor = isTyping && isCurrentLine && !shouldSkip;
        const text = displayedTexts[index] || '';
        const isMainHeading = index < 2;

        return (
          <span key={index}>
            <span className={line.className}>
              {text}
              {showCursor && (
                <span
                  className={cn('animate-cursor-blink ml-0.5', cursorClassName)}
                  aria-hidden="true"
                >
                  |
                </span>
              )}
            </span>
            {isMainHeading && index === 0 && (
              <br className="hidden md:block" />
            )}
          </span>
        );
      })}
    </div>
  );
}
```

### Tailwind Config Addition

```typescript
// tailwind.config.ts
keyframes: {
  'cursor-blink': {
    '0%, 100%': { opacity: '1' },
    '50%': { opacity: '0' },
  },
},
animation: {
  'cursor-blink': 'cursor-blink 1s steps(2) infinite',
},
```

---

## Usage in Other Apps

### Creator App

```tsx
// apps/creator/src/pages/Home.tsx
import { TypewriterText } from '@/components/TypewriterText';

export default function CreatorHome() {
  return (
    <div className="text-center py-12">
      <TypewriterText
        storageKey="creator-home-hero"
        lines={[
          { text: 'Share your story with the world', className: 'text-4xl font-bold' },
          { text: 'Reach global audiences.', className: 'text-xl text-gray-600 mt-4', delay: 400 },
        ]}
        cursorClassName="text-purple-500"
      />
    </div>
  );
}
```

### Website App

```tsx
// apps/website/src/pages/Landing.tsx
import { TypewriterText } from '@/components/TypewriterText';

export default function Landing() {
  return (
    <section className="hero">
      <TypewriterText
        storageKey="landing-hero"
        lines={[
          { text: 'Korean Stories, Global Stage', className: 'text-5xl font-bold text-white' },
        ]}
        cursorClassName="text-white"
        baseSpeed={60}
      />
    </section>
  );
}
```

---

## Troubleshooting

### Animation Not Playing

1. Check sessionStorage: `sessionStorage.getItem('your-storage-key')`
2. Clear and refresh: `sessionStorage.removeItem('your-storage-key')`
3. Check `prefers-reduced-motion` setting in OS

### Cursor Not Blinking

1. Verify `animate-cursor-blink` class exists in Tailwind config
2. Check if Tailwind CSS is properly configured
3. Inspect element to see if animation is applied

### Text Wrapping Issues

Use `block` class for lines that should be on separate visual lines:

```tsx
{ text: 'Subtitle text', className: 'block mt-4 text-gray-600' }
```

---

## Dependencies

- React 18+
- Tailwind CSS with `tailwindcss-animate` plugin
- `cn()` utility from `@/lib/utils` (shadcn/ui pattern)

If `cn()` is not available, replace with:

```typescript
// Simple replacement
className={`animate-cursor-blink ml-0.5 ${cursorClassName}`}
```
