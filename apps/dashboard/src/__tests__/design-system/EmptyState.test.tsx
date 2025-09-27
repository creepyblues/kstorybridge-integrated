import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { EmptyState } from '@/components/design-system/EmptyState';
import { Heart, Search, Inbox, FileX, Plus } from 'lucide-react';

describe('EmptyState Component', () => {
  describe('Basic Rendering', () => {
    it('should render with required props', () => {
      render(<EmptyState icon={Heart} title="No favorites found" />);

      expect(screen.getByText('No favorites found')).toBeInTheDocument();
      expect(screen.getByRole('status')).toBeInTheDocument();
    });

    it('should render as article with status role by default', () => {
      render(<EmptyState icon={Heart} title="Test title" />);

      const emptyState = screen.getByRole('status');
      expect(emptyState.tagName).toBe('ARTICLE');
      expect(emptyState).toHaveAttribute('role', 'status');
      expect(emptyState).toHaveAttribute('aria-live', 'polite');
    });

    it('should render icon with proper accessibility attributes', () => {
      render(<EmptyState icon={Heart} title="Test title" />);

      const icon = screen.getByRole('status').querySelector('svg');
      expect(icon).toBeInTheDocument();
      expect(icon).toHaveAttribute('aria-hidden', 'true');
    });
  });

  describe('Content Rendering', () => {
    it('should render title correctly', () => {
      render(<EmptyState icon={Search} title="No search results" />);

      const title = screen.getByRole('heading', { level: 3 });
      expect(title).toBeInTheDocument();
      expect(title).toHaveTextContent('No search results');
    });

    it('should render description when provided', () => {
      render(
        <EmptyState
          icon={Search}
          title="No results"
          description="Try different keywords or filters"
        />
      );

      expect(screen.getByText('Try different keywords or filters')).toBeInTheDocument();
    });

    it('should not render description when not provided', () => {
      render(<EmptyState icon={Search} title="No results" />);

      const descriptions = screen.queryAllByText(/Try different/);
      expect(descriptions).toHaveLength(0);
    });

    it('should render action when provided', () => {
      const ActionButton = <button>Add New Item</button>;

      render(
        <EmptyState
          icon={Inbox}
          title="All done!"
          action={ActionButton}
        />
      );

      expect(screen.getByText('Add New Item')).toBeInTheDocument();
    });

    it('should not render action when not provided', () => {
      render(<EmptyState icon={Inbox} title="All done!" />);

      const buttons = screen.queryAllByRole('button');
      expect(buttons).toHaveLength(0);
    });
  });

  describe('Size Variants', () => {
    it('should apply default size by default', () => {
      render(<EmptyState icon={Heart} title="Test" />);

      const title = screen.getByRole('heading');
      const icon = screen.getByRole('status').querySelector('svg');

      expect(title).toHaveClass('text-base', 'sm:text-lg');
      expect(icon).toHaveClass('h-8', 'w-8', 'sm:h-10', 'sm:w-10', 'lg:h-12', 'lg:w-12');
    });

    it('should apply small size correctly', () => {
      render(
        <EmptyState
          icon={Heart}
          title="Test"
          description="Test description"
          size="sm"
        />
      );

      const title = screen.getByRole('heading');
      const description = screen.getByText('Test description');
      const icon = screen.getByRole('status').querySelector('svg');

      expect(title).toHaveClass('text-sm', 'sm:text-base');
      expect(description).toHaveClass('text-xs', 'sm:text-sm');
      expect(icon).toHaveClass('h-6', 'w-6', 'sm:h-8', 'sm:w-8');
    });

    it('should apply large size correctly', () => {
      render(
        <EmptyState
          icon={Heart}
          title="Test"
          description="Test description"
          size="lg"
        />
      );

      const title = screen.getByRole('heading');
      const description = screen.getByText('Test description');
      const icon = screen.getByRole('status').querySelector('svg');

      expect(title).toHaveClass('text-lg', 'sm:text-xl');
      expect(description).toHaveClass('text-base', 'sm:text-lg');
      expect(icon).toHaveClass('h-10', 'w-10', 'sm:h-12', 'sm:w-12', 'lg:h-16', 'lg:w-16');
    });
  });

  describe('Icon Integration', () => {
    it('should render different icon types correctly', () => {
      const iconTests = [
        { icon: Heart, title: 'Favorites' },
        { icon: Search, title: 'Search' },
        { icon: Inbox, title: 'Inbox' },
        { icon: FileX, title: 'Files' },
        { icon: Plus, title: 'Add' },
      ];

      iconTests.forEach(({ icon, title }) => {
        const { unmount } = render(
          <EmptyState icon={icon} title={title} />
        );

        const container = screen.getByRole('status');
        const iconElement = container.querySelector('svg');

        expect(iconElement).toBeInTheDocument();
        expect(iconElement).toHaveAttribute('aria-hidden', 'true');
        expect(screen.getByText(title)).toBeInTheDocument();

        unmount();
      });
    });

    it('should apply consistent icon styling', () => {
      render(<EmptyState icon={Heart} title="Test" data-testid="empty-state" />);

      const icon = screen.getByRole('status').querySelector('svg');
      expect(icon).toHaveClass('text-midnight-ink-400', 'mx-auto');
    });
  });

  describe('Layout and Structure', () => {
    it('should use Surface component as container', () => {
      render(<EmptyState icon={Heart} title="Test" data-testid="empty-state" />);

      const container = screen.getByRole('status');
      // Surface component should apply these classes
      expect(container).toHaveClass('text-center');
    });

    it('should center align all content', () => {
      render(
        <EmptyState
          icon={Heart}
          title="Test"
          description="Test description"
          action={<button>Action</button>}
                  />
      );

      const container = screen.getByRole('status');
      expect(container).toHaveClass('text-center');
    });

    it('should maintain proper content hierarchy', () => {
      render(
        <EmptyState
          icon={Heart}
          title="Test Title"
          description="Test description"
          action={<button>Test Action</button>}
        />
      );

      const container = screen.getByRole('status');
      const children = Array.from(container.children);

      // Should have Stack as child containing icon, title, description, action
      expect(children).toHaveLength(1);
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA attributes', () => {
      render(<EmptyState icon={Heart} title="Test" data-testid="empty-state" />);

      const container = screen.getByRole('status');
      expect(container).toHaveAttribute('role', 'status');
      expect(container).toHaveAttribute('aria-live', 'polite');
    });

    it('should use semantic heading for title', () => {
      render(<EmptyState icon={Heart} title="No items found" />);

      const heading = screen.getByRole('heading', { level: 3 });
      expect(heading).toBeInTheDocument();
      expect(heading).toHaveTextContent('No items found');
    });

    it('should hide icon from screen readers', () => {
      render(<EmptyState icon={Heart} title="Test" data-testid="empty-state" />);

      const icon = screen.getByRole('status').querySelector('svg');
      expect(icon).toHaveAttribute('aria-hidden', 'true');
    });

    it('should be announced to screen readers via aria-live', () => {
      render(<EmptyState icon={Heart} title="Content loaded" />);

      const status = screen.getByRole('status');
      expect(status).toHaveAttribute('aria-live', 'polite');
    });
  });

  describe('Custom Styling', () => {
    it('should accept custom className', () => {
      render(
        <EmptyState
          icon={Heart}
          title="Test"
          className="custom-empty-class"
                  />
      );

      const container = screen.getByRole('status');
      expect(container).toHaveClass('custom-empty-class');
      expect(container).toHaveClass('text-center'); // Should preserve default classes
    });

    it('should merge custom className with default classes', () => {
      render(
        <EmptyState
          icon={Heart}
          title="Test"
          className="bg-red-50"
                  />
      );

      const container = screen.getByRole('status');
      expect(container).toHaveClass('bg-red-50', 'text-center');
    });
  });

  describe('Design System Compliance', () => {
    it('should use Surface component with proper variants', () => {
      render(<EmptyState icon={Heart} title="Test" data-testid="empty-state" />);

      const container = screen.getByRole('status');
      // Should be using Surface with card variant and lg padding
      expect(container.tagName).toBe('ARTICLE');
    });

    it('should use Stack for internal layout', () => {
      render(
        <EmptyState
          icon={Heart}
          title="Test"
          description="Description"
          action={<button>Action</button>}
        />
      );

      // Stack should handle internal spacing and alignment
      const container = screen.getByRole('status');
      expect(container).toBeInTheDocument();
    });

    it('should use consistent color scheme', () => {
      render(
        <EmptyState
          icon={Heart}
          title="Test Title"
          description="Test Description"
                  />
      );

      const icon = screen.getByRole('status').querySelector('svg');
      const title = screen.getByRole('heading');
      const description = screen.getByText('Test Description');

      expect(icon).toHaveClass('text-midnight-ink-400');
      expect(title).toHaveClass('text-midnight-ink');
      expect(description).toHaveClass('text-midnight-ink-600');
    });

    it('should provide consistent empty state pattern', () => {
      // Test that this component replaces manual empty state implementations
      render(<EmptyState icon={FileX} title="No files found" />);

      const container = screen.getByRole('status');
      const title = screen.getByRole('heading');

      // Should use standard structure instead of custom implementations
      expect(container).toBeInTheDocument();
      expect(title).toHaveClass('font-medium');
    });
  });

  describe('Real-world Usage Patterns', () => {
    it('should handle favorites empty state', () => {
      render(
        <EmptyState
          icon={Heart}
          title="No favorites found"
          description="Start browsing content to add favorites"
          action={<button>Browse Titles</button>}
        />
      );

      expect(screen.getByText('No favorites found')).toBeInTheDocument();
      expect(screen.getByText('Start browsing content to add favorites')).toBeInTheDocument();
      expect(screen.getByText('Browse Titles')).toBeInTheDocument();
    });

    it('should handle search results empty state', () => {
      render(
        <EmptyState
          icon={Search}
          title="No results found"
          description="Try adjusting your search criteria or filters"
          size="lg"
        />
      );

      expect(screen.getByText('No results found')).toBeInTheDocument();
      expect(screen.getByText('Try adjusting your search criteria or filters')).toBeInTheDocument();
    });

    it('should handle completed tasks empty state', () => {
      render(
        <EmptyState
          icon={Inbox}
          title="All caught up!"
          description="No new notifications or tasks"
          size="sm"
        />
      );

      expect(screen.getByText('All caught up!')).toBeInTheDocument();
      expect(screen.getByText('No new notifications or tasks')).toBeInTheDocument();
    });
  });

  describe('Component Composition', () => {
    it('should work with complex action elements', () => {
      const ComplexAction = (
        <div>
          <button>Primary Action</button>
          <button>Secondary Action</button>
        </div>
      );

      render(
        <EmptyState
          icon={Plus}
          title="Get started"
          description="Create your first item"
          action={ComplexAction}
        />
      );

      expect(screen.getByText('Primary Action')).toBeInTheDocument();
      expect(screen.getByText('Secondary Action')).toBeInTheDocument();
    });

    it('should maintain responsive behavior across sizes', () => {
      const { rerender } = render(
        <EmptyState icon={Heart} title="Test" size="sm" data-testid="empty-state" />
      );

      let icon = screen.getByRole('status').querySelector('svg');
      expect(icon).toHaveClass('h-6', 'w-6', 'sm:h-8', 'sm:w-8');

      rerender(
        <EmptyState icon={Heart} title="Test" size="lg" data-testid="empty-state" />
      );

      icon = screen.getByRole('status').querySelector('svg');
      expect(icon).toHaveClass('h-10', 'w-10', 'sm:h-12', 'sm:w-12', 'lg:h-16', 'lg:w-16');
    });
  });
});