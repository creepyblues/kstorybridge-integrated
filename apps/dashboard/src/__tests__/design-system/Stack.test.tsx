import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Stack } from '@/components/design-system/Stack';

describe('Stack Component', () => {
  describe('Basic Rendering', () => {
    it('should render children correctly', () => {
      render(
        <Stack>
          <div>Item 1</div>
          <div>Item 2</div>
          <div>Item 3</div>
        </Stack>
      );

      expect(screen.getByText('Item 1')).toBeInTheDocument();
      expect(screen.getByText('Item 2')).toBeInTheDocument();
      expect(screen.getByText('Item 3')).toBeInTheDocument();
    });

    it('should render as div by default', () => {
      render(
        <Stack data-testid="stack">
          <div>Content</div>
        </Stack>
      );

      const stack = screen.getByTestId('stack');
      expect(stack.tagName).toBe('DIV');
    });

    it('should render with custom HTML element when as prop is provided', () => {
      render(
        <Stack as="section" data-testid="stack">
          <div>Content</div>
        </Stack>
      );

      const stack = screen.getByTestId('stack');
      expect(stack.tagName).toBe('SECTION');
    });
  });

  describe('Layout Structure', () => {
    it('should apply vertical flex layout by default', () => {
      render(
        <Stack data-testid="stack">
          <div>Item 1</div>
          <div>Item 2</div>
        </Stack>
      );

      const stack = screen.getByTestId('stack');
      expect(stack).toHaveClass('flex', 'flex-col');
    });

    it('should maintain vertical stacking order', () => {
      render(
        <Stack data-testid="stack">
          <div data-testid="item-1">First</div>
          <div data-testid="item-2">Second</div>
          <div data-testid="item-3">Third</div>
        </Stack>
      );

      const stack = screen.getByTestId('stack');
      const items = stack.children;

      expect(items[0]).toBe(screen.getByTestId('item-1'));
      expect(items[1]).toBe(screen.getByTestId('item-2'));
      expect(items[2]).toBe(screen.getByTestId('item-3'));
    });
  });

  describe('Gap Variants', () => {
    it('should apply medium gap by default', () => {
      render(
        <Stack data-testid="stack">
          <div>Item 1</div>
          <div>Item 2</div>
        </Stack>
      );

      const stack = screen.getByTestId('stack');
      expect(stack).toHaveClass('gap-6');
    });

    it('should apply no gap when gap is none', () => {
      render(
        <Stack gap="none" data-testid="stack">
          <div>Item 1</div>
          <div>Item 2</div>
        </Stack>
      );

      const stack = screen.getByTestId('stack');
      expect(stack).toHaveClass('gap-0');
    });

    it('should apply extra small gap', () => {
      render(
        <Stack gap="xs" data-testid="stack">
          <div>Item 1</div>
          <div>Item 2</div>
        </Stack>
      );

      const stack = screen.getByTestId('stack');
      expect(stack).toHaveClass('gap-2');
    });

    it('should apply small gap', () => {
      render(
        <Stack gap="sm" data-testid="stack">
          <div>Item 1</div>
          <div>Item 2</div>
        </Stack>
      );

      const stack = screen.getByTestId('stack');
      expect(stack).toHaveClass('gap-4');
    });

    it('should apply large gap', () => {
      render(
        <Stack gap="lg" data-testid="stack">
          <div>Item 1</div>
          <div>Item 2</div>
        </Stack>
      );

      const stack = screen.getByTestId('stack');
      expect(stack).toHaveClass('gap-8');
    });

    it('should apply extra large gap', () => {
      render(
        <Stack gap="xl" data-testid="stack">
          <div>Item 1</div>
          <div>Item 2</div>
        </Stack>
      );

      const stack = screen.getByTestId('stack');
      expect(stack).toHaveClass('gap-12');
    });
  });

  describe('Align Variants', () => {
    it('should apply stretch alignment by default', () => {
      render(
        <Stack data-testid="stack">
          <div>Item 1</div>
          <div>Item 2</div>
        </Stack>
      );

      const stack = screen.getByTestId('stack');
      expect(stack).toHaveClass('items-stretch');
    });

    it('should apply start alignment', () => {
      render(
        <Stack align="start" data-testid="stack">
          <div>Item 1</div>
          <div>Item 2</div>
        </Stack>
      );

      const stack = screen.getByTestId('stack');
      expect(stack).toHaveClass('items-start');
    });

    it('should apply center alignment', () => {
      render(
        <Stack align="center" data-testid="stack">
          <div>Item 1</div>
          <div>Item 2</div>
        </Stack>
      );

      const stack = screen.getByTestId('stack');
      expect(stack).toHaveClass('items-center');
    });

    it('should apply end alignment', () => {
      render(
        <Stack align="end" data-testid="stack">
          <div>Item 1</div>
          <div>Item 2</div>
        </Stack>
      );

      const stack = screen.getByTestId('stack');
      expect(stack).toHaveClass('items-end');
    });
  });

  describe('Justify Variants', () => {
    it('should apply start justification by default', () => {
      render(
        <Stack data-testid="stack">
          <div>Item 1</div>
          <div>Item 2</div>
        </Stack>
      );

      const stack = screen.getByTestId('stack');
      expect(stack).toHaveClass('justify-start');
    });

    it('should apply center justification', () => {
      render(
        <Stack justify="center" data-testid="stack">
          <div>Item 1</div>
          <div>Item 2</div>
        </Stack>
      );

      const stack = screen.getByTestId('stack');
      expect(stack).toHaveClass('justify-center');
    });

    it('should apply end justification', () => {
      render(
        <Stack justify="end" data-testid="stack">
          <div>Item 1</div>
          <div>Item 2</div>
        </Stack>
      );

      const stack = screen.getByTestId('stack');
      expect(stack).toHaveClass('justify-end');
    });

    it('should apply between justification', () => {
      render(
        <Stack justify="between" data-testid="stack">
          <div>Item 1</div>
          <div>Item 2</div>
        </Stack>
      );

      const stack = screen.getByTestId('stack');
      expect(stack).toHaveClass('justify-between');
    });
  });

  describe('Combined Properties', () => {
    it('should apply multiple properties correctly', () => {
      render(
        <Stack
          gap="lg"
          align="center"
          justify="between"
          data-testid="stack"
        >
          <div>Item 1</div>
          <div>Item 2</div>
        </Stack>
      );

      const stack = screen.getByTestId('stack');
      expect(stack).toHaveClass(
        'flex',
        'flex-col',
        'gap-8',
        'items-center',
        'justify-between'
      );
    });
  });

  describe('Custom className', () => {
    it('should merge custom className with variant classes', () => {
      render(
        <Stack className="custom-stack-class" data-testid="stack">
          <div>Item 1</div>
          <div>Item 2</div>
        </Stack>
      );

      const stack = screen.getByTestId('stack');
      expect(stack).toHaveClass('custom-stack-class');
      expect(stack).toHaveClass('flex', 'flex-col', 'gap-6'); // Default classes
    });
  });

  describe('Accessibility', () => {
    it('should pass through HTML attributes', () => {
      render(
        <Stack
          data-testid="stack"
          aria-label="Vertical stack"
          role="group"
        >
          <div>Item 1</div>
          <div>Item 2</div>
        </Stack>
      );

      const stack = screen.getByTestId('stack');
      expect(stack).toHaveAttribute('aria-label', 'Vertical stack');
      expect(stack).toHaveAttribute('role', 'group');
    });

    it('should support semantic HTML elements', () => {
      const semanticElements = ['section', 'article', 'nav', 'aside'] as const;

      semanticElements.forEach((element) => {
        const { unmount } = render(
          <Stack as={element} data-testid={`stack-${element}`}>
            <div>Content</div>
          </Stack>
        );

        const stack = screen.getByTestId(`stack-${element}`);
        expect(stack.tagName).toBe(element.toUpperCase());

        unmount();
      });
    });
  });

  describe('Design System Compliance', () => {
    it('should use consistent gap spacing scale', () => {
      const gapTests = [
        { gap: 'xs', expectedClass: 'gap-2' },
        { gap: 'sm', expectedClass: 'gap-4' },
        { gap: 'md', expectedClass: 'gap-6' },
        { gap: 'lg', expectedClass: 'gap-8' },
        { gap: 'xl', expectedClass: 'gap-12' },
      ] as const;

      gapTests.forEach(({ gap, expectedClass }) => {
        const { unmount } = render(
          <Stack gap={gap} data-testid={`stack-${gap}`}>
            <div>Item</div>
          </Stack>
        );

        const stack = screen.getByTestId(`stack-${gap}`);
        expect(stack).toHaveClass(expectedClass);

        unmount();
      });
    });

    it('should provide consistent vertical layout behavior', () => {
      render(
        <Stack data-testid="stack">
          <div>Item 1</div>
          <div>Item 2</div>
        </Stack>
      );

      const stack = screen.getByTestId('stack');
      expect(stack).toHaveClass('flex-col'); // Always vertical
    });

    it('should replace manual flexbox implementations', () => {
      // This test ensures Stack replaces manual flexbox patterns
      render(
        <Stack data-testid="stack">
          <div>Item 1</div>
          <div>Item 2</div>
        </Stack>
      );

      const stack = screen.getByTestId('stack');

      // Should use design system classes, not manual ones
      expect(stack).toHaveClass('flex', 'flex-col');

      // Should not need manual space-y-* classes since gap is used
      expect(stack.className).not.toMatch(/space-y-/);
    });
  });

  describe('Empty State', () => {
    it('should render without children', () => {
      render(<Stack data-testid="stack" />);

      const stack = screen.getByTestId('stack');
      expect(stack).toBeInTheDocument();
      expect(stack.children).toHaveLength(0);
    });

    it('should maintain structure with single child', () => {
      render(
        <Stack data-testid="stack">
          <div>Single item</div>
        </Stack>
      );

      const stack = screen.getByTestId('stack');
      expect(stack).toHaveClass('flex', 'flex-col');
      expect(stack.children).toHaveLength(1);
    });
  });
});