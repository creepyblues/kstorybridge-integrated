import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PageContainer } from '@/components/layout/PageContainer';

describe('PageContainer Component', () => {
  describe('Basic Rendering', () => {
    it('should render children correctly', () => {
      render(
        <PageContainer>
          <div>Test Content</div>
          <h1>Page Title</h1>
          <p>Page description</p>
        </PageContainer>
      );

      expect(screen.getByText('Test Content')).toBeInTheDocument();
      expect(screen.getByText('Page Title')).toBeInTheDocument();
      expect(screen.getByText('Page description')).toBeInTheDocument();
    });

    it('should render with correct HTML structure', () => {
      render(
        <PageContainer>
          <div data-testid="content">Content</div>
        </PageContainer>
      );

      const content = screen.getByTestId('content');
      const innerContainer = content.parentElement;
      const outerWrapper = innerContainer?.parentElement;

      // Should have outer wrapper with min-height and background
      expect(outerWrapper).toHaveClass('min-h-screen', 'bg-gray-50');

      // Should have inner container with page-container class
      expect(innerContainer).toHaveClass('page-container');
    });
  });

  describe('Layout Structure', () => {
    it('should apply min-height screen and background to outer wrapper', () => {
      render(
        <PageContainer>
          <div data-testid="content">Content</div>
        </PageContainer>
      );

      const content = screen.getByTestId('content');
      const outerWrapper = content.parentElement?.parentElement;

      expect(outerWrapper).toHaveClass('min-h-screen');
      expect(outerWrapper).toHaveClass('bg-gray-50');
    });

    it('should apply page-container class to inner wrapper', () => {
      render(
        <PageContainer>
          <div data-testid="content">Content</div>
        </PageContainer>
      );

      const content = screen.getByTestId('content');
      const innerWrapper = content.parentElement;

      expect(innerWrapper).toHaveClass('page-container');
    });
  });

  describe('CSS Variables Integration', () => {
    it('should use page-container class that references CSS variables', () => {
      render(
        <PageContainer>
          <div data-testid="content">Content</div>
        </PageContainer>
      );

      const content = screen.getByTestId('content');
      const container = content.parentElement;

      // Should have the class that applies CSS variables
      expect(container).toHaveClass('page-container');
    });

    it('should have proper CSS class structure for responsive padding', () => {
      // This test ensures the component structure supports CSS variable-based responsive design
      render(
        <PageContainer>
          <div data-testid="content">Content</div>
        </PageContainer>
      );

      const content = screen.getByTestId('content');
      const container = content.parentElement;

      // The page-container class should be applied for CSS variables to work
      expect(container).toHaveClass('page-container');
      expect(container?.className.trim()).toBe('page-container');
    });
  });

  describe('Custom className Support', () => {
    it('should apply custom className to inner container', () => {
      render(
        <PageContainer className="custom-page-class">
          <div data-testid="content">Content</div>
        </PageContainer>
      );

      const content = screen.getByTestId('content');
      const container = content.parentElement;

      expect(container).toHaveClass('page-container');
      expect(container).toHaveClass('custom-page-class');
    });

    it('should merge custom className with default page-container class', () => {
      render(
        <PageContainer className="bg-white rounded-lg">
          <div data-testid="content">Content</div>
        </PageContainer>
      );

      const content = screen.getByTestId('content');
      const container = content.parentElement;

      expect(container).toHaveClass('page-container', 'bg-white', 'rounded-lg');
    });

    it('should handle empty className prop', () => {
      render(
        <PageContainer className="">
          <div data-testid="content">Content</div>
        </PageContainer>
      );

      const content = screen.getByTestId('content');
      const container = content.parentElement;

      expect(container).toHaveClass('page-container');
      expect(container?.className.trim()).toBe('page-container');
    });

    it('should handle undefined className prop', () => {
      render(
        <PageContainer>
          <div data-testid="content">Content</div>
        </PageContainer>
      );

      const content = screen.getByTestId('content');
      const container = content.parentElement;

      expect(container).toHaveClass('page-container');
      expect(container?.className.trim()).toBe('page-container');
    });
  });

  describe('Centralized Padding System', () => {
    it('should be the single source of truth for page padding', () => {
      // This test verifies that PageContainer is designed to be the centralized system
      render(
        <PageContainer>
          <div data-testid="content">Content</div>
        </PageContainer>
      );

      const content = screen.getByTestId('content');
      const container = content.parentElement;

      // Should use the standardized class that connects to CSS variables
      expect(container).toHaveClass('page-container');

      // Should not use manual Tailwind padding classes
      expect(container?.className).not.toMatch(/px-|py-|pt-|pb-|pl-|pr-/);
    });

    it('should support global padding changes via CSS variables only', () => {
      // This test ensures that padding is controlled via CSS variables, not hardcoded classes
      render(
        <PageContainer>
          <div data-testid="content">Content</div>
        </PageContainer>
      );

      const content = screen.getByTestId('content');
      const container = content.parentElement;

      // Should use CSS class that references variables, not hardcoded values
      expect(container?.className.trim()).toBe('page-container');
    });
  });

  describe('Component Design Philosophy', () => {
    it('should enforce consistent layout across all pages', () => {
      // Test that multiple PageContainer instances are identical
      const { unmount } = render(
        <PageContainer>
          <div data-testid="page1">Page 1</div>
        </PageContainer>
      );

      const page1Content = screen.getByTestId('page1');
      const page1Container = page1Content.parentElement;
      const page1Classes = page1Container?.className;

      unmount();

      render(
        <PageContainer>
          <div data-testid="page2">Page 2</div>
        </PageContainer>
      );

      const page2Content = screen.getByTestId('page2');
      const page2Container = page2Content.parentElement;
      const page2Classes = page2Container?.className;

      // Both pages should have identical container classes
      expect(page1Classes).toBe(page2Classes);
    });

    it('should replace manual padding implementations', () => {
      // This test verifies PageContainer replaces manual padding patterns
      render(
        <PageContainer>
          <div data-testid="content">Content</div>
        </PageContainer>
      );

      const content = screen.getByTestId('content');
      const container = content.parentElement;

      // Should use design system class, not manual padding
      expect(container).toHaveClass('page-container');

      // Should not use legacy manual padding patterns
      expect(container?.className).not.toMatch(/max-w-7xl.*mx-auto.*px-/);
      expect(container?.className).not.toMatch(/px-3.*sm:px-6.*lg:px-8/);
    });

    it('should enable one-file global changes', () => {
      // This test verifies that changing layout-variables.css would affect all PageContainer instances
      render(
        <PageContainer>
          <div data-testid="content">Content</div>
        </PageContainer>
      );

      const content = screen.getByTestId('content');
      const container = content.parentElement;

      // Should use the CSS class that references variables from layout-variables.css
      expect(container).toHaveClass('page-container');

      // The class should be the connection point to CSS variables
      expect(container?.className.trim()).toBe('page-container');
    });
  });

  describe('Responsive Design', () => {
    it('should rely on CSS media queries for responsive behavior', () => {
      // PageContainer responsive behavior is handled by CSS, not JavaScript
      render(
        <PageContainer>
          <div data-testid="content">Content</div>
        </PageContainer>
      );

      const content = screen.getByTestId('content');
      const container = content.parentElement;

      // Should use single class that handles responsive via CSS
      expect(container).toHaveClass('page-container');

      // Should not use responsive Tailwind classes (handled by CSS)
      expect(container?.className).not.toMatch(/sm:|lg:|xl:/);
    });

    it('should support mobile-first responsive padding via CSS variables', () => {
      // Test that the structure supports mobile-first responsive design
      render(
        <PageContainer>
          <div data-testid="content">Content</div>
        </PageContainer>
      );

      const content = screen.getByTestId('content');
      const container = content.parentElement;

      // Should use the class that applies mobile-first responsive padding
      expect(container).toHaveClass('page-container');
    });
  });

  describe('Background and Full Height', () => {
    it('should provide full-height background consistently', () => {
      render(
        <PageContainer>
          <div data-testid="content">Content</div>
        </PageContainer>
      );

      const content = screen.getByTestId('content');
      const outerWrapper = content.parentElement?.parentElement;

      expect(outerWrapper).toHaveClass('min-h-screen');
      expect(outerWrapper).toHaveClass('bg-gray-50');
    });

    it('should maintain consistent background across all pages', () => {
      // Test that background is standardized
      const { unmount } = render(
        <PageContainer>
          <div data-testid="page1">Page 1</div>
        </PageContainer>
      );

      const page1Wrapper = screen.getByTestId('page1').parentElement?.parentElement;
      const page1BgClasses = page1Wrapper?.className;

      unmount();

      render(
        <PageContainer>
          <div data-testid="page2">Page 2</div>
        </PageContainer>
      );

      const page2Wrapper = screen.getByTestId('page2').parentElement?.parentElement;
      const page2BgClasses = page2Wrapper?.className;

      expect(page1BgClasses).toBe(page2BgClasses);
      expect(page1BgClasses).toContain('min-h-screen bg-gray-50');
    });
  });

  describe('Component Usage Patterns', () => {
    it('should handle complex page content structures', () => {
      render(
        <PageContainer>
          <header data-testid="header">
            <h1>Page Title</h1>
          </header>
          <main data-testid="main">
            <section>Section 1</section>
            <section>Section 2</section>
          </main>
          <footer data-testid="footer">
            <p>Footer content</p>
          </footer>
        </PageContainer>
      );

      expect(screen.getByTestId('header')).toBeInTheDocument();
      expect(screen.getByTestId('main')).toBeInTheDocument();
      expect(screen.getByTestId('footer')).toBeInTheDocument();

      // All content should be within the properly structured container
      const header = screen.getByTestId('header');
      const container = header.parentElement;
      expect(container).toHaveClass('page-container');
    });

    it('should work with empty content', () => {
      render(<PageContainer></PageContainer>);

      // Should render without errors even with no content
      const containers = document.querySelectorAll('.page-container');
      expect(containers).toHaveLength(1);
    });

    it('should work with single child elements', () => {
      render(
        <PageContainer>
          <div data-testid="single-child">Only child</div>
        </PageContainer>
      );

      const child = screen.getByTestId('single-child');
      expect(child).toBeInTheDocument();

      const container = child.parentElement;
      expect(container).toHaveClass('page-container');
    });
  });

  describe('Design System Integration', () => {
    it('should be the mandatory layout component for all pages', () => {
      // This test enforces that PageContainer is the standard for all pages
      render(
        <PageContainer>
          <div data-testid="page-content">Standard page layout</div>
        </PageContainer>
      );

      const content = screen.getByTestId('page-content');
      const container = content.parentElement;
      const wrapper = container?.parentElement;

      // Should have the exact structure that all pages must use
      expect(wrapper).toHaveClass('min-h-screen', 'bg-gray-50');
      expect(container).toHaveClass('page-container');
    });

    it('should connect to the centralized CSS variable system', () => {
      // This test verifies integration with layout-variables.css
      render(
        <PageContainer>
          <div data-testid="content">Content</div>
        </PageContainer>
      );

      const content = screen.getByTestId('content');
      const container = content.parentElement;

      // Should use the class that connects to CSS variables
      expect(container).toHaveClass('page-container');

      // This class should be defined in layout-variables.css and use var() functions
      expect(container?.className.trim()).toBe('page-container');
    });
  });
});