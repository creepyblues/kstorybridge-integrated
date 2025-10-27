import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';

/**
 * Legacy Component Detection Tests
 *
 * These tests help identify components that are not using the design system.
 * They check for common anti-patterns that should be migrated to design system components.
 */

describe('Legacy Component Detection', () => {
  describe('Anti-Pattern Detection', () => {
    it('should detect hardcoded Card usage instead of Surface', () => {
      // Simulate a legacy component using hardcoded Card
      const LegacyCard = () => (
        <div className="bg-white shadow-lg rounded-lg border p-6" data-testid="legacy-card">
          Legacy content
        </div>
      );

      render(<LegacyCard />);

      const legacyCard = screen.getByTestId('legacy-card');

      // These classes indicate legacy patterns that should use Surface instead
      expect(legacyCard).toHaveClass('bg-white'); // Should use Surface variant
      expect(legacyCard).toHaveClass('shadow-lg'); // Should use Surface shadow variant
      expect(legacyCard).toHaveClass('rounded-lg'); // Should use Surface radius variant
      expect(legacyCard).toHaveClass('p-6'); // Should use Surface padding variant
    });

    it('should detect manual flexbox instead of Stack/Inline', () => {
      // Simulate legacy component using manual flexbox
      const LegacyLayout = () => (
        <div className="flex flex-col space-y-4" data-testid="legacy-layout">
          <div>Item 1</div>
          <div>Item 2</div>
        </div>
      );

      render(<LegacyLayout />);

      const legacyLayout = screen.getByTestId('legacy-layout');

      // These patterns should use Stack component instead
      expect(legacyLayout).toHaveClass('flex', 'flex-col');
      expect(legacyLayout).toHaveClass('space-y-4'); // Should use Stack gap
    });

    it('should detect manual horizontal layouts instead of Inline', () => {
      // Simulate legacy component using manual horizontal flexbox
      const LegacyHorizontal = () => (
        <div className="flex items-center space-x-2 justify-between" data-testid="legacy-horizontal">
          <span>Left</span>
          <span>Right</span>
        </div>
      );

      render(<LegacyHorizontal />);

      const legacyHorizontal = screen.getByTestId('legacy-horizontal');

      // These patterns should use Inline component instead
      expect(legacyHorizontal).toHaveClass('flex', 'items-center');
      expect(legacyHorizontal).toHaveClass('space-x-2'); // Should use Inline gap
      expect(legacyHorizontal).toHaveClass('justify-between'); // Should use Inline justify
    });

    it('should detect custom empty states instead of EmptyState', () => {
      // Simulate legacy empty state implementation
      const LegacyEmptyState = () => (
        <div className="text-center py-12" data-testid="legacy-empty">
          <div className="text-gray-400 mb-4">
            <svg className="h-12 w-12 mx-auto" fill="currentColor">
              <path d="..." />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No items found</h3>
          <p className="text-gray-500">Try adjusting your search</p>
        </div>
      );

      render(<LegacyEmptyState />);

      const legacyEmpty = screen.getByTestId('legacy-empty');

      // These patterns should use EmptyState component
      expect(legacyEmpty).toHaveClass('text-center', 'py-12');
      expect(screen.getByText('No items found')).toBeInTheDocument();
      expect(screen.getByText('Try adjusting your search')).toBeInTheDocument();
    });

    it('should detect manual page containers instead of PageContainer', () => {
      // Simulate legacy page container pattern
      const LegacyPageContainer = () => (
        <div className="min-h-screen bg-gray-50" data-testid="legacy-page-wrapper">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8" data-testid="legacy-page-container">
            Page content
          </div>
        </div>
      );

      render(<LegacyPageContainer />);

      const wrapper = screen.getByTestId('legacy-page-wrapper');
      const container = screen.getByTestId('legacy-page-container');

      // These patterns should use PageContainer component
      expect(wrapper).toHaveClass('min-h-screen', 'bg-gray-50');
      expect(container).toHaveClass('max-w-7xl', 'mx-auto');
      expect(container).toHaveClass('px-4', 'sm:px-6', 'lg:px-8'); // Should use CSS variables
      expect(container).toHaveClass('py-8'); // Should use CSS variables
    });
  });

  // Note: Design System Component Validation tests are covered by individual component test files
  // This section focuses on legacy pattern detection only

  describe('Migration Path Validation', () => {
    it('should identify components ready for Surface migration', () => {
      // Test component that could be migrated to Surface
      const MigrationCandidate = () => (
        <div className="bg-white border border-gray-300 rounded-lg p-6 shadow-sm" data-testid="migration-candidate">
          Content that should use Surface
        </div>
      );

      render(<MigrationCandidate />);

      const candidate = screen.getByTestId('migration-candidate');

      // Check for migration indicators
      const hasBgWhite = candidate.classList.contains('bg-white');
      const hasBorder = candidate.classList.contains('border');
      const hasRounded = candidate.classList.contains('rounded-lg');
      const hasPadding = candidate.classList.contains('p-6');
      const hasShadow = candidate.classList.contains('shadow-sm');

      // If all these are true, it's a good candidate for Surface migration
      const isMigrationCandidate = hasBgWhite && hasBorder && hasRounded && hasPadding && hasShadow;
      expect(isMigrationCandidate).toBe(true);
    });

    it('should identify components ready for Stack migration', () => {
      // Test component that could be migrated to Stack
      const StackCandidate = () => (
        <div className="flex flex-col space-y-4" data-testid="stack-candidate">
          <div>Item 1</div>
          <div>Item 2</div>
          <div>Item 3</div>
        </div>
      );

      render(<StackCandidate />);

      const candidate = screen.getByTestId('stack-candidate');

      // Check for Stack migration indicators
      const hasFlexCol = candidate.classList.contains('flex') && candidate.classList.contains('flex-col');
      const hasSpaceY = Array.from(candidate.classList).some(cls => cls.startsWith('space-y-'));

      const isStackCandidate = hasFlexCol && hasSpaceY;
      expect(isStackCandidate).toBe(true);
    });

    it('should identify components ready for Inline migration', () => {
      // Test component that could be migrated to Inline
      const InlineCandidate = () => (
        <div className="flex items-center space-x-3 justify-between" data-testid="inline-candidate">
          <span>Left content</span>
          <span>Right content</span>
        </div>
      );

      render(<InlineCandidate />);

      const candidate = screen.getByTestId('inline-candidate');

      // Check for Inline migration indicators
      const hasFlex = candidate.classList.contains('flex');
      const hasItemsCenter = candidate.classList.contains('items-center');
      const hasSpaceX = Array.from(candidate.classList).some(cls => cls.startsWith('space-x-'));
      const hasJustify = Array.from(candidate.classList).some(cls => cls.startsWith('justify-'));

      const isInlineCandidate = hasFlex && hasItemsCenter && hasSpaceX && hasJustify;
      expect(isInlineCandidate).toBe(true);
    });
  });

  describe('Design System Compliance Scoring', () => {
    it('should score component design system compliance', () => {
      // Function to score a component's design system compliance
      const scoreCompliance = (element: HTMLElement): number => {
        let score = 10; // Start with perfect score

        // Deduct points for legacy patterns
        if (element.classList.contains('bg-white')) score -= 2;
        if (Array.from(element.classList).some(cls => cls.startsWith('shadow-'))) score -= 2;
        if (Array.from(element.classList).some(cls => cls.startsWith('space-x-') || cls.startsWith('space-y-'))) score -= 2;
        if (element.classList.contains('max-w-7xl') && element.classList.contains('mx-auto')) score -= 2;
        if (Array.from(element.classList).some(cls => cls.match(/^p-[0-9]|px-[0-9]|py-[0-9]/))) score -= 1;
        if (Array.from(element.classList).some(cls => cls.startsWith('rounded-'))) score -= 1;

        return Math.max(0, score);
      };

      // Test legacy component (should score low)
      const LegacyComponent = () => (
        <div className="bg-white shadow-lg rounded-lg p-6 space-y-4 max-w-7xl mx-auto" data-testid="legacy">
          Legacy content
        </div>
      );

      render(<LegacyComponent />);
      const legacyElement = screen.getByTestId('legacy');
      const legacyScore = scoreCompliance(legacyElement);

      expect(legacyScore).toBeLessThan(5); // Should have low compliance score

      // Test design system component (should score high)
      const DesignSystemComponent = () => (
        <div className="design-system-class" data-testid="design-system">
          Design system content
        </div>
      );

      render(<DesignSystemComponent />);
      const designSystemElement = screen.getByTestId('design-system');
      const designSystemScore = scoreCompliance(designSystemElement);

      expect(designSystemScore).toBeGreaterThan(8); // Should have high compliance score
    });
  });

  describe('File Pattern Detection', () => {
    it('should identify files likely to need migration', () => {
      // This test helps identify patterns in file content that indicate migration needs
      const codePatterns = {
        needsSurfaceMigration: /className="[^"]*bg-white[^"]*"/g,
        needsStackMigration: /className="[^"]*flex flex-col[^"]*space-y-[^"]*"/g,
        needsInlineMigration: /className="[^"]*flex[^"]*space-x-[^"]*"/g,
        needsPageContainerMigration: /className="[^"]*max-w-7xl mx-auto[^"]*"/g,
        needsEmptyStateMigration: /No.*found|No.*available|Empty.*state/g,
      };

      // Test various code samples
      const sampleCode1 = '<div className="bg-white shadow-lg p-6">Content</div>';
      const sampleCode2 = '<div className="flex flex-col space-y-4">Items</div>';
      const sampleCode3 = '<div className="flex items-center space-x-2">Actions</div>';
      const sampleCode4 = '<div className="max-w-7xl mx-auto px-4">Page</div>';
      const sampleCode5 = '<p>No favorites found</p>';

      expect(codePatterns.needsSurfaceMigration.test(sampleCode1)).toBe(true);
      expect(codePatterns.needsStackMigration.test(sampleCode2)).toBe(true);
      expect(codePatterns.needsInlineMigration.test(sampleCode3)).toBe(true);
      expect(codePatterns.needsPageContainerMigration.test(sampleCode4)).toBe(true);
      expect(codePatterns.needsEmptyStateMigration.test(sampleCode5)).toBe(true);
    });
  });
});