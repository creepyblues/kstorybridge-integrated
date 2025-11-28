import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Surface } from '@/components/design-system/Surface';

describe('Surface Component', () => {
  describe('Basic Rendering', () => {
    it('should render children correctly', () => {
      render(
        <Surface>
          <div>Test Content</div>
        </Surface>
      );

      expect(screen.getByText('Test Content')).toBeInTheDocument();
    });

    it('should render as section by default', () => {
      render(<Surface data-testid="surface">Content</Surface>);

      const surface = screen.getByTestId('surface');
      expect(surface.tagName).toBe('SECTION');
    });

    it('should render with custom HTML element when as prop is provided', () => {
      render(
        <Surface as="article" data-testid="surface">
          Content
        </Surface>
      );

      const surface = screen.getByTestId('surface');
      expect(surface.tagName).toBe('ARTICLE');
    });
  });

  describe('Variant Styling', () => {
    it('should apply card variant styles by default', () => {
      render(<Surface data-testid="surface">Content</Surface>);

      const surface = screen.getByTestId('surface');
      expect(surface).toHaveClass('bg-transparent', 'border', 'border-gray-300', 'shadow-none', 'rounded-2xl');
    });

    it('should apply elevated variant styles', () => {
      render(
        <Surface variant="elevated" data-testid="surface">
          Content
        </Surface>
      );

      const surface = screen.getByTestId('surface');
      expect(surface).toHaveClass('bg-white', 'border-gray-200', 'shadow-sm', 'rounded-2xl');
    });

    it('should apply flat variant styles', () => {
      render(
        <Surface variant="flat" data-testid="surface">
          Content
        </Surface>
      );

      const surface = screen.getByTestId('surface');
      expect(surface).toHaveClass('bg-gray-50', 'rounded-lg');
    });

    it('should apply transparent variant styles', () => {
      render(
        <Surface variant="transparent" data-testid="surface">
          Content
        </Surface>
      );

      const surface = screen.getByTestId('surface');
      expect(surface).toHaveClass('bg-transparent');
    });

    it('should apply outlined variant styles', () => {
      render(
        <Surface variant="outlined" data-testid="surface">
          Content
        </Surface>
      );

      const surface = screen.getByTestId('surface');
      expect(surface).toHaveClass('border', 'border-gray-300', 'rounded-xl');
    });
  });

  describe('Padding Variants', () => {
    it('should apply medium padding by default', () => {
      render(<Surface data-testid="surface">Content</Surface>);

      const surface = screen.getByTestId('surface');
      expect(surface).toHaveClass('p-10', 'sm:p-10');
    });

    it('should apply no padding when padding is none', () => {
      render(
        <Surface padding="none" data-testid="surface">
          Content
        </Surface>
      );

      const surface = screen.getByTestId('surface');
      expect(surface).toHaveClass('p-0');
    });

    it('should apply small padding', () => {
      render(
        <Surface padding="sm" data-testid="surface">
          Content
        </Surface>
      );

      const surface = screen.getByTestId('surface');
      expect(surface).toHaveClass('p-6');
    });

    it('should apply large padding', () => {
      render(
        <Surface padding="lg" data-testid="surface">
          Content
        </Surface>
      );

      const surface = screen.getByTestId('surface');
      expect(surface).toHaveClass('p-12', 'sm:p-20');
    });

    it('should apply extra large padding', () => {
      render(
        <Surface padding="xl" data-testid="surface">
          Content
        </Surface>
      );

      const surface = screen.getByTestId('surface');
      expect(surface).toHaveClass('p-6', 'sm:p-12', 'lg:p-12');
    });
  });

  describe('Spacing Variants', () => {
    it('should apply medium spacing by default', () => {
      render(<Surface data-testid="surface">Content</Surface>);

      const surface = screen.getByTestId('surface');
      expect(surface).toHaveClass('mb-6', 'sm:mb-8', 'lg:mb-12');
    });

    it('should apply no spacing when spacing is none', () => {
      render(
        <Surface spacing="none" data-testid="surface">
          Content
        </Surface>
      );

      const surface = screen.getByTestId('surface');
      expect(surface.className).not.toMatch(/mb-/);
    });

    it('should apply small spacing', () => {
      render(
        <Surface spacing="sm" data-testid="surface">
          Content
        </Surface>
      );

      const surface = screen.getByTestId('surface');
      expect(surface).toHaveClass('mb-4');
    });

    it('should apply large spacing', () => {
      render(
        <Surface spacing="lg" data-testid="surface">
          Content
        </Surface>
      );

      const surface = screen.getByTestId('surface');
      expect(surface).toHaveClass('mb-8', 'sm:mb-12', 'lg:mb-16');
    });

    it('should apply extra large spacing', () => {
      render(
        <Surface spacing="xl" data-testid="surface">
          Content
        </Surface>
      );

      const surface = screen.getByTestId('surface');
      expect(surface).toHaveClass('mb-12', 'sm:mb-16', 'lg:mb-20');
    });
  });

  describe('Custom className', () => {
    it('should merge custom className with variant classes', () => {
      render(
        <Surface className="custom-class" data-testid="surface">
          Content
        </Surface>
      );

      const surface = screen.getByTestId('surface');
      expect(surface).toHaveClass('custom-class');
      expect(surface).toHaveClass('bg-transparent', 'border', 'border-gray-300'); // Default variant classes
    });
  });

  describe('Accessibility', () => {
    it('should pass through HTML attributes', () => {
      render(
        <Surface
          data-testid="surface"
          aria-label="Test surface"
          role="banner"
        >
          Content
        </Surface>
      );

      const surface = screen.getByTestId('surface');
      expect(surface).toHaveAttribute('aria-label', 'Test surface');
      expect(surface).toHaveAttribute('role', 'banner');
    });

    it('should support semantic HTML elements', () => {
      const semanticElements = ['main', 'header', 'footer', 'nav', 'aside', 'article'] as const;

      semanticElements.forEach((element) => {
        const { unmount } = render(
          <Surface as={element} data-testid={`surface-${element}`}>
            Content
          </Surface>
        );

        const surface = screen.getByTestId(`surface-${element}`);
        expect(surface.tagName).toBe(element.toUpperCase());

        unmount();
      });
    });
  });

  describe('Design System Compliance', () => {
    it('should use consistent border radius from design tokens', () => {
      render(<Surface data-testid="surface">Content</Surface>);

      const surface = screen.getByTestId('surface');
      expect(surface).toHaveClass('rounded-2xl'); // Design token consistent radius
    });

    it('should use consistent gray color scale', () => {
      render(<Surface data-testid="surface">Content</Surface>);

      const surface = screen.getByTestId('surface');
      expect(surface).toHaveClass('border-gray-300'); // Consistent gray scale
    });

    it('should not use legacy shadow styles', () => {
      render(<Surface data-testid="surface">Content</Surface>);

      const surface = screen.getByTestId('surface');
      expect(surface).toHaveClass('shadow-none'); // No legacy shadows
    });

    it('should use transparent background for default variant', () => {
      render(<Surface data-testid="surface">Content</Surface>);

      const surface = screen.getByTestId('surface');
      expect(surface).toHaveClass('bg-transparent'); // Consistent with design system
    });
  });
});