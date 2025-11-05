# @kstorybridge/design-system

Shared design system for KStoryBridge dashboard applications.

## Features

- **Design Primitives**: Surface and Stack components for consistent layouts
- **Essential Colors**: 6 brand colors with key shades (100, 300, 500, 700, 900)
- **Design Tokens**: Centralized spacing, typography, shadows, and transitions
- **TypeScript**: Full type safety and autocompletion
- **Tailwind CSS**: Seamless integration with Tailwind

## Installation

```bash
npm install @kstorybridge/design-system
```

## Usage

### Import Styles

Add to your main CSS file:

```css
@import '@kstorybridge/design-system/styles';
```

### Import Components

```tsx
import { Surface, Stack } from '@kstorybridge/design-system';

function MyComponent() {
  return (
    <Surface variant="card" padding="md">
      <Stack gap="md">
        <h2>Title</h2>
        <p>Content</p>
      </Stack>
    </Surface>
  );
}
```

### Import Colors

```tsx
import { essentialColors, semanticColors } from '@kstorybridge/design-system';

// Use in Tailwind config
export default {
  theme: {
    extend: {
      colors: essentialColors,
    },
  },
};
```

### Import Tokens

```tsx
import { tokens } from '@kstorybridge/design-system';

// Use spacing tokens
const spacing = tokens.spacing.md; // '1rem'
```

## Components

### Surface

Foundational primitive that replaces `<div>` elements.

**Variants:**
- `card` (default): Transparent bg, gray-300 border, rounded-2xl
- `elevated`: White bg with shadow
- `flat`: Gray-50 background
- `transparent`: No styling
- `outlined`: Border only

**Props:**
- `as`: Semantic HTML element (default: `section`)
- `variant`: Style variant
- `padding`: Padding size (xs, sm, md, lg, xl)
- `spacing`: Bottom margin (xs, sm, md, lg, xl)

### Stack

Vertical layout primitive with consistent spacing.

**Props:**
- `gap`: Spacing between children (none, xs, sm, md, lg, xl)
- `align`: Horizontal alignment (start, center, end, stretch)
- `justify`: Vertical alignment (start, center, end, between)

## Colors

### Brand Colors

- `hanok-teal`: Primary brand color (#4C9C9B)
- `midnight-ink`: Text/dark color (#1C1C1C)
- `pro-purple`: Tier badge color (#AF52DE)
- `porcelain-blue`: Accent color (#C3E3E2)
- `sunrise-coral`: CTA color (#FF6B6B)
- `warm-sand`: Neutral color (#F5E9D7)

Each color has 5 shades: 100, 300, 500, 700, 900

### Semantic Colors

- `primary`: hanok-teal
- `text`: midnight-ink
- `accent`: porcelain-blue
- `cta`: sunrise-coral
- `neutral`: warm-sand
- `tier`: pro-purple

## Design Tokens

### Spacing

- `xs`: 8px
- `sm`: 12px
- `md`: 16px
- `lg`: 24px
- `xl`: 32px
- `2xl`: 48px
- `3xl`: 64px

### Border Radius

- `xs`: 4px
- `sm`: 8px
- `md`: 16px
- `lg`: 24px
- `xl`: 32px (standard for cards)
- `full`: Fully rounded

### Typography

- Font sizes: xs (12px) to 3xl (30px)
- Font weights: 400, 500, 600, 700
- Line heights: tight (1.25), normal (1.5), relaxed (1.75)

### Shadows

- `none`, `sm`, `md`, `lg`

### Transitions

- `fast`: 150ms
- `normal`: 200ms
- `slow`: 300ms

## Development

```bash
# Build package
npm run build

# Watch mode
npm run dev

# Lint
npm run lint
```

## License

Proprietary - KStoryBridge
