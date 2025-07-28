# KStoryBridge Color Palette

This package contains the official color palette for KStoryBridge applications, ensuring consistent branding across the website and dashboard.

## Brand Colors

| Color Name         | HEX       | Role                    | Usage                                                                                                              |
| ------------------ | --------- | ----------------------- | ------------------------------------------------------------------------------------------------------------------ |
| **Hanok Teal**     | `#4C9C9B` | Primary                 | Pulled from the main teal in the logo — modern yet rooted, reflects Korean tradition (hanok roof shape) and trust. |
| **Midnight Ink**   | `#1C1C1C` | Primary Text            | Deep charcoal black from the logo text — clean, bold, and trustworthy.                                             |
| **Snow White**     | `#FFFFFF` | Background/Base         | Clean and neutral, ensuring clarity and breathing room for storytelling.                                           |
| **Porcelain Blue** | `#C3E3E2` | Accent                  | A lighter tone of teal for UI highlights, background tints, hover states.                                          |
| **Sunrise Coral**  | `#FF6B6B` | Accent / Call-to-Action | Adds a vibrant, energetic pop for creativity and emotional pull — ideal for buttons or story highlights.           |
| **Warm Sand**      | `#F5E9D7` | Supporting Background   | Neutral warm tone to reflect friendliness and accessibility without stealing focus.                                |

## Usage in Applications

### Tailwind CSS Classes

After importing the color configuration, you can use these brand colors in Tailwind:

```html
<!-- Brand colors with full range -->
<div class="bg-hanok-teal-500 text-snow-white">Primary button</div>
<div class="bg-sunrise-coral hover:bg-sunrise-coral-600">Call to action</div>
<div class="text-midnight-ink bg-warm-sand-100">Neutral section</div>
<div class="border-porcelain-blue-300">Subtle accent border</div>

<!-- Semantic aliases for easier usage -->
<div class="bg-brand-primary text-brand-background">Primary content</div>
<div class="bg-brand-cta hover:bg-brand-cta-600">Call to action</div>
<div class="text-brand-text bg-brand-neutral">Neutral content</div>
```

### CSS Custom Properties

All colors are also available as CSS custom properties:

```css
.custom-component {
  background-color: hsl(var(--hanok-teal));
  color: hsl(var(--snow-white));
  border: 1px solid hsl(var(--porcelain-blue-300));
}

.cta-button {
  background-color: hsl(var(--sunrise-coral));
  transition: background-color 0.2s;
}

.cta-button:hover {
  background-color: hsl(var(--sunrise-coral-600));
}
```

### TypeScript/JavaScript Import

```typescript
import { kstoryColors, semanticColors } from '@kstorybridge/colors';

// Access specific colors
const primaryColor = kstoryColors['hanok-teal'].DEFAULT; // '#4C9C9B'
const ctaColor = semanticColors.cta.DEFAULT; // '#FF6B6B'

// Use in styled components or other CSS-in-JS
const StyledButton = styled.button`
  background-color: ${kstoryColors['hanok-teal'][500]};
  color: ${kstoryColors['snow-white'].DEFAULT};
`;
```

## Color Scales

Each brand color (except Snow White) includes a full scale from 50-900:
- **50-100**: Very light tints for backgrounds
- **200-300**: Light shades for subtle accents
- **400-500**: Main brand color and slightly darker
- **600-700**: Medium shades for hover states
- **800-900**: Dark shades for text or strong accents

## Semantic Mappings

For easier usage, semantic aliases are available:
- `brand-primary`: Hanok Teal
- `brand-text`: Midnight Ink  
- `brand-background`: Snow White
- `brand-accent`: Porcelain Blue
- `brand-cta`: Sunrise Coral
- `brand-neutral`: Warm Sand

## Implementation

The color system is already integrated into both applications:
1. **Tailwind Configuration**: Colors are automatically available as Tailwind classes
2. **CSS Custom Properties**: Available as HSL values in CSS
3. **TypeScript**: Type-safe access to all color values

## Best Practices

1. **Primary Actions**: Use Hanok Teal for primary buttons, links, and key UI elements
2. **Call-to-Actions**: Use Sunrise Coral for important actions like "Sign up", "Get started"
3. **Text**: Use Midnight Ink for primary text, with lighter shades for secondary text
4. **Backgrounds**: Use Snow White as main background, Warm Sand for subtle sections
5. **Accents**: Use Porcelain Blue for highlights, borders, and subtle UI elements
6. **Hover States**: Use darker shades (600-700) of the same color for hover effects