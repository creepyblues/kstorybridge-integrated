import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { TrialProvider, useTrial } from './TrialContext';

// Test component that exposes context values
function TestConsumer() {
  const { remainingTrials, hasTrialRemaining, incrementUsage, showLimitModal, maxTrials } = useTrial();
  return (
    <div>
      <span data-testid="remaining">{remainingTrials}</span>
      <span data-testid="hasRemaining">{String(hasTrialRemaining)}</span>
      <span data-testid="showModal">{String(showLimitModal)}</span>
      <span data-testid="maxTrials">{maxTrials}</span>
      <button data-testid="increment" onClick={incrementUsage}>
        Increment
      </button>
    </div>
  );
}

describe('TrialContext', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe('initial state', () => {
    it('should start with 5 remaining trials when localStorage is empty', () => {
      render(
        <TrialProvider>
          <TestConsumer />
        </TrialProvider>
      );

      expect(screen.getByTestId('remaining').textContent).toBe('5');
      expect(screen.getByTestId('hasRemaining').textContent).toBe('true');
      expect(screen.getByTestId('showModal').textContent).toBe('false');
      expect(screen.getByTestId('maxTrials').textContent).toBe('5');
    });

    it('should restore state from localStorage', () => {
      localStorage.setItem('kstorybridge_trial_usage', JSON.stringify({
        searches_used: 2,
        version: 1,
      }));

      render(
        <TrialProvider>
          <TestConsumer />
        </TrialProvider>
      );

      expect(screen.getByTestId('remaining').textContent).toBe('3');
      expect(screen.getByTestId('hasRemaining').textContent).toBe('true');
    });

    it('should ignore invalid localStorage data', () => {
      localStorage.setItem('kstorybridge_trial_usage', 'invalid json');

      render(
        <TrialProvider>
          <TestConsumer />
        </TrialProvider>
      );

      expect(screen.getByTestId('remaining').textContent).toBe('5');
    });

    it('should ignore old version localStorage data', () => {
      localStorage.setItem('kstorybridge_trial_usage', JSON.stringify({
        searches_used: 2,
        version: 0, // Old version
      }));

      render(
        <TrialProvider>
          <TestConsumer />
        </TrialProvider>
      );

      expect(screen.getByTestId('remaining').textContent).toBe('5');
    });
  });

  describe('incrementUsage', () => {
    it('should decrement remaining trials when incrementUsage is called', () => {
      render(
        <TrialProvider>
          <TestConsumer />
        </TrialProvider>
      );

      expect(screen.getByTestId('remaining').textContent).toBe('5');

      act(() => {
        screen.getByTestId('increment').click();
      });

      expect(screen.getByTestId('remaining').textContent).toBe('4');
    });

    it('should save usage to localStorage', () => {
      render(
        <TrialProvider>
          <TestConsumer />
        </TrialProvider>
      );

      act(() => {
        screen.getByTestId('increment').click();
      });

      const stored = JSON.parse(localStorage.getItem('kstorybridge_trial_usage') || '{}');
      expect(stored.searches_used).toBe(1);
      expect(stored.version).toBe(1);
    });

    it('should show limit modal when all trials are used', () => {
      localStorage.setItem('kstorybridge_trial_usage', JSON.stringify({
        searches_used: 4,
        version: 1,
      }));

      render(
        <TrialProvider>
          <TestConsumer />
        </TrialProvider>
      );

      expect(screen.getByTestId('showModal').textContent).toBe('false');

      act(() => {
        screen.getByTestId('increment').click();
      });

      expect(screen.getByTestId('remaining').textContent).toBe('0');
      expect(screen.getByTestId('hasRemaining').textContent).toBe('false');
      expect(screen.getByTestId('showModal').textContent).toBe('true');
    });

    it('should not go below 0 remaining trials', () => {
      localStorage.setItem('kstorybridge_trial_usage', JSON.stringify({
        searches_used: 5,
        version: 1,
      }));

      render(
        <TrialProvider>
          <TestConsumer />
        </TrialProvider>
      );

      expect(screen.getByTestId('remaining').textContent).toBe('0');

      act(() => {
        screen.getByTestId('increment').click();
      });

      // Should stay at 0, not go negative
      expect(screen.getByTestId('remaining').textContent).toBe('0');
    });
  });

  describe('useTrial hook', () => {
    it('should throw error when used outside provider', () => {
      // Suppress console.error for this test
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      expect(() => {
        render(<TestConsumer />);
      }).toThrow('useTrial must be used within a TrialProvider');

      consoleSpy.mockRestore();
    });
  });
});
