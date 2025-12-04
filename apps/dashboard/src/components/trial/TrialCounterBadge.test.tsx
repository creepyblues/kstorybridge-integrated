import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { TrialCounterBadge } from './TrialCounterBadge';
import { TrialProvider } from '@/contexts/TrialContext';

// Helper to render with provider
function renderWithProvider(initialUsage = 0) {
  if (initialUsage > 0) {
    localStorage.setItem('kstorybridge_trial_usage', JSON.stringify({
      searches_used: initialUsage,
      version: 1,
    }));
  }

  return render(
    <TrialProvider>
      <TrialCounterBadge />
    </TrialProvider>
  );
}

describe('TrialCounterBadge', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('should display correct remaining trials count', () => {
    renderWithProvider(1);
    expect(screen.getByText('2 of 3 searches left')).toBeInTheDocument();
  });

  it('should show 3 remaining with no usage', () => {
    renderWithProvider(0);
    expect(screen.getByText('3 of 3 searches left')).toBeInTheDocument();
  });

  it('should show 0 remaining when all used', () => {
    renderWithProvider(3);
    expect(screen.getByText('0 of 3 searches left')).toBeInTheDocument();
  });

  describe('color states', () => {
    it('should have green styling with 3 trials remaining', () => {
      renderWithProvider(0);
      const badge = screen.getByText('3 of 3 searches left').closest('div');
      expect(badge?.className).toContain('bg-green-100');
      expect(badge?.className).toContain('text-green-700');
    });

    it('should have amber styling with 2 trials remaining', () => {
      renderWithProvider(1);
      const badge = screen.getByText('2 of 3 searches left').closest('div');
      expect(badge?.className).toContain('bg-amber-100');
      expect(badge?.className).toContain('text-amber-700');
    });

    it('should have orange styling with 1 trial remaining', () => {
      renderWithProvider(2);
      const badge = screen.getByText('1 of 3 searches left').closest('div');
      expect(badge?.className).toContain('bg-orange-100');
      expect(badge?.className).toContain('text-orange-700');
    });

    it('should have red styling with 0 trials remaining', () => {
      renderWithProvider(3);
      const badge = screen.getByText('0 of 3 searches left').closest('div');
      expect(badge?.className).toContain('bg-red-100');
      expect(badge?.className).toContain('text-red-700');
    });
  });
});
