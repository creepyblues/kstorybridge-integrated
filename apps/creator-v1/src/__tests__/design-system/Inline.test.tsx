import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Inline } from '@/components/design-system/Inline';

describe('Inline Component', () => {
  describe('Basic Rendering', () => {
    it('should render children correctly', () => {
      render(
        <Inline>
          <button>Button 1</button>
          <button>Button 2</button>
          <button>Button 3</button>
        </Inline>
      );

      expect(screen.getByText('Button 1')).toBeInTheDocument();
      expect(screen.getByText('Button 2')).toBeInTheDocument();
      expect(screen.getByText('Button 3')).toBeInTheDocument();
    });

    it('should render as div by default', () => {
      render(
        <Inline data-testid="inline">
          <span>Content</span>
        </Inline>
      );

      const inline = screen.getByTestId('inline');
      expect(inline.tagName).toBe('DIV');
    });

    it('should render with custom HTML element when as prop is provided', () => {
      render(
        <Inline as="nav" data-testid="inline">
          <span>Content</span>
        </Inline>
      );

      const inline = screen.getByTestId('inline');
      expect(inline.tagName).toBe('NAV');
    });
  });

  describe('Layout Structure', () => {
    it('should apply horizontal flex layout by default', () => {
      render(
        <Inline data-testid="inline">
          <span>Item 1</span>
          <span>Item 2</span>
        </Inline>
      );

      const inline = screen.getByTestId('inline');
      expect(inline).toHaveClass('flex');
      expect(inline).not.toHaveClass('flex-col'); // Should be horizontal, not vertical
    });

    it('should maintain horizontal ordering', () => {
      render(
        <Inline data-testid="inline">
          <span data-testid="item-1">First</span>
          <span data-testid="item-2">Second</span>
          <span data-testid="item-3">Third</span>
        </Inline>
      );

      const inline = screen.getByTestId('inline');
      const items = inline.children;

      expect(items[0]).toBe(screen.getByTestId('item-1'));
      expect(items[1]).toBe(screen.getByTestId('item-2'));
      expect(items[2]).toBe(screen.getByTestId('item-3'));
    });
  });

  describe('Gap Variants', () => {
    it('should apply medium gap by default', () => {
      render(
        <Inline data-testid="inline">
          <span>Item 1</span>
          <span>Item 2</span>
        </Inline>
      );

      const inline = screen.getByTestId('inline');
      expect(inline).toHaveClass('gap-6');
    });

    it('should apply no gap when gap is none', () => {
      render(
        <Inline gap="none" data-testid="inline">
          <span>Item 1</span>
          <span>Item 2</span>
        </Inline>
      );

      const inline = screen.getByTestId('inline');
      expect(inline).toHaveClass('gap-0');
    });

    it('should apply extra small gap', () => {
      render(
        <Inline gap="xs" data-testid="inline">
          <span>Item 1</span>
          <span>Item 2</span>
        </Inline>
      );

      const inline = screen.getByTestId('inline');
      expect(inline).toHaveClass('gap-2');
    });

    it('should apply small gap', () => {
      render(
        <Inline gap="sm" data-testid="inline">
          <span>Item 1</span>
          <span>Item 2</span>
        </Inline>
      );

      const inline = screen.getByTestId('inline');
      expect(inline).toHaveClass('gap-4');
    });

    it('should apply large gap', () => {
      render(
        <Inline gap="lg" data-testid="inline">
          <span>Item 1</span>
          <span>Item 2</span>
        </Inline>
      );

      const inline = screen.getByTestId('inline');
      expect(inline).toHaveClass('gap-8');
    });

    it('should apply extra large gap', () => {
      render(
        <Inline gap="xl" data-testid="inline">
          <span>Item 1</span>
          <span>Item 2</span>
        </Inline>
      );

      const inline = screen.getByTestId('inline');
      expect(inline).toHaveClass('gap-12');
    });
  });

  describe('Align Variants', () => {
    it('should apply center alignment by default', () => {
      render(
        <Inline data-testid="inline">
          <span>Item 1</span>
          <span>Item 2</span>
        </Inline>
      );

      const inline = screen.getByTestId('inline');
      expect(inline).toHaveClass('items-center');
    });

    it('should apply start alignment', () => {
      render(
        <Inline align="start" data-testid="inline">
          <span>Item 1</span>
          <span>Item 2</span>
        </Inline>
      );

      const inline = screen.getByTestId('inline');
      expect(inline).toHaveClass('items-start');
    });

    it('should apply end alignment', () => {
      render(
        <Inline align="end" data-testid="inline">
          <span>Item 1</span>
          <span>Item 2</span>
        </Inline>
      );

      const inline = screen.getByTestId('inline');
      expect(inline).toHaveClass('items-end');
    });

    it('should apply baseline alignment', () => {
      render(
        <Inline align="baseline" data-testid="inline">
          <span>Item 1</span>
          <span>Item 2</span>
        </Inline>
      );

      const inline = screen.getByTestId('inline');
      expect(inline).toHaveClass('items-baseline');
    });

    it('should apply stretch alignment', () => {
      render(
        <Inline align="stretch" data-testid="inline">
          <span>Item 1</span>
          <span>Item 2</span>
        </Inline>
      );

      const inline = screen.getByTestId('inline');
      expect(inline).toHaveClass('items-stretch');
    });
  });

  describe('Justify Variants', () => {
    it('should apply start justification by default', () => {
      render(
        <Inline data-testid="inline">
          <span>Item 1</span>
          <span>Item 2</span>
        </Inline>
      );

      const inline = screen.getByTestId('inline');
      expect(inline).toHaveClass('justify-start');
    });

    it('should apply center justification', () => {
      render(
        <Inline justify="center" data-testid="inline">
          <span>Item 1</span>
          <span>Item 2</span>
        </Inline>
      );

      const inline = screen.getByTestId('inline');
      expect(inline).toHaveClass('justify-center');
    });

    it('should apply end justification', () => {
      render(
        <Inline justify="end" data-testid="inline">
          <span>Item 1</span>
          <span>Item 2</span>
        </Inline>
      );

      const inline = screen.getByTestId('inline');
      expect(inline).toHaveClass('justify-end');
    });

    it('should apply between justification', () => {
      render(
        <Inline justify="between" data-testid="inline">
          <span>Item 1</span>
          <span>Item 2</span>
        </Inline>
      );

      const inline = screen.getByTestId('inline');
      expect(inline).toHaveClass('justify-between');
    });

    it('should apply around justification', () => {
      render(
        <Inline justify="around" data-testid="inline">
          <span>Item 1</span>
          <span>Item 2</span>
        </Inline>
      );

      const inline = screen.getByTestId('inline');
      expect(inline).toHaveClass('justify-around');
    });
  });

  describe('Wrap Variants', () => {
    it('should apply nowrap by default', () => {
      render(
        <Inline data-testid="inline">
          <span>Item 1</span>
          <span>Item 2</span>
        </Inline>
      );

      const inline = screen.getByTestId('inline');
      expect(inline).toHaveClass('flex-nowrap');
    });

    it('should apply wrap when specified', () => {
      render(
        <Inline wrap="wrap" data-testid="inline">
          <span>Item 1</span>
          <span>Item 2</span>
        </Inline>
      );

      const inline = screen.getByTestId('inline');
      expect(inline).toHaveClass('flex-wrap');
    });

    it('should apply reverse wrap when specified', () => {
      render(
        <Inline wrap="reverse" data-testid="inline">
          <span>Item 1</span>
          <span>Item 2</span>
        </Inline>
      );

      const inline = screen.getByTestId('inline');
      expect(inline).toHaveClass('flex-wrap-reverse');
    });
  });

  describe('Combined Properties', () => {
    it('should apply multiple properties correctly', () => {
      render(
        <Inline
          gap="lg"
          align="end"
          justify="between"
          wrap="wrap"
          data-testid="inline"
        >
          <span>Item 1</span>
          <span>Item 2</span>
        </Inline>
      );

      const inline = screen.getByTestId('inline');
      expect(inline).toHaveClass(
        'flex',
        'gap-8',
        'items-end',
        'justify-between',
        'flex-wrap'
      );
    });
  });

  describe('Custom className', () => {
    it('should merge custom className with variant classes', () => {
      render(
        <Inline className="custom-inline-class" data-testid="inline">
          <span>Item 1</span>
          <span>Item 2</span>
        </Inline>
      );

      const inline = screen.getByTestId('inline');
      expect(inline).toHaveClass('custom-inline-class');
      expect(inline).toHaveClass('flex', 'gap-6', 'items-center'); // Default classes
    });
  });

  describe('Accessibility', () => {
    it('should pass through HTML attributes', () => {
      render(
        <Inline
          data-testid="inline"
          aria-label="Action buttons"
          role="group"
        >
          <button>Action 1</button>
          <button>Action 2</button>
        </Inline>
      );

      const inline = screen.getByTestId('inline');
      expect(inline).toHaveAttribute('aria-label', 'Action buttons');
      expect(inline).toHaveAttribute('role', 'group');
    });

    it('should support semantic HTML elements', () => {
      const semanticElements = ['nav', 'header', 'footer', 'section'] as const;

      semanticElements.forEach((element) => {
        const { unmount } = render(
          <Inline as={element} data-testid={`inline-${element}`}>
            <span>Content</span>
          </Inline>
        );

        const inline = screen.getByTestId(`inline-${element}`);
        expect(inline.tagName).toBe(element.toUpperCase());

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
          <Inline gap={gap} data-testid={`inline-${gap}`}>
            <span>Item</span>
          </Inline>
        );

        const inline = screen.getByTestId(`inline-${gap}`);
        expect(inline).toHaveClass(expectedClass);

        unmount();
      });
    });

    it('should provide consistent horizontal layout behavior', () => {
      render(
        <Inline data-testid="inline">
          <span>Item 1</span>
          <span>Item 2</span>
        </Inline>
      );

      const inline = screen.getByTestId('inline');
      expect(inline).toHaveClass('flex'); // Always flexbox
      expect(inline).not.toHaveClass('flex-col'); // Never vertical
    });

    it('should replace manual flexbox implementations', () => {
      // This test ensures Inline replaces manual flexbox patterns
      render(
        <Inline data-testid="inline">
          <span>Item 1</span>
          <span>Item 2</span>
        </Inline>
      );

      const inline = screen.getByTestId('inline');

      // Should use design system classes, not manual ones
      expect(inline).toHaveClass('flex');

      // Should not need manual space-x-* classes since gap is used
      expect(inline.className).not.toMatch(/space-x-/);
    });

    it('should support responsive design with wrap variants', () => {
      render(
        <Inline wrap="wrap" data-testid="inline">
          <span>Item 1</span>
          <span>Item 2</span>
          <span>Item 3</span>
        </Inline>
      );

      const inline = screen.getByTestId('inline');
      expect(inline).toHaveClass('flex-wrap');
    });
  });

  describe('Empty State', () => {
    it('should render without children', () => {
      render(<Inline data-testid="inline" />);

      const inline = screen.getByTestId('inline');
      expect(inline).toBeInTheDocument();
      expect(inline.children).toHaveLength(0);
    });

    it('should maintain structure with single child', () => {
      render(
        <Inline data-testid="inline">
          <span>Single item</span>
        </Inline>
      );

      const inline = screen.getByTestId('inline');
      expect(inline).toHaveClass('flex');
      expect(inline.children).toHaveLength(1);
    });
  });

  describe('Button Groups and Action Bars', () => {
    it('should handle button group layouts effectively', () => {
      render(
        <Inline gap="sm" data-testid="button-group">
          <button>Save</button>
          <button>Cancel</button>
          <button>Delete</button>
        </Inline>
      );

      const buttonGroup = screen.getByTestId('button-group');
      expect(buttonGroup).toHaveClass('flex', 'gap-4', 'items-center');
      expect(buttonGroup.children).toHaveLength(3);
    });

    it('should support action bar layouts with mixed content', () => {
      render(
        <Inline justify="between" align="center" data-testid="action-bar">
          <h2>Page Title</h2>
          <div>
            <button>Action 1</button>
            <button>Action 2</button>
          </div>
        </Inline>
      );

      const actionBar = screen.getByTestId('action-bar');
      expect(actionBar).toHaveClass('justify-between', 'items-center');
    });
  });
});