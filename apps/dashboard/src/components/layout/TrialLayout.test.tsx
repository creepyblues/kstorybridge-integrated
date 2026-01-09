import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { TrialLayout } from './TrialLayout';
import { TrialProvider } from '@/contexts/TrialContext';

function renderLayout(children: React.ReactNode = <div>Test Content</div>) {
  return render(
    <BrowserRouter>
      <TrialProvider>
        <TrialLayout>{children}</TrialLayout>
      </TrialProvider>
    </BrowserRouter>
  );
}

describe('TrialLayout', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe('header', () => {
    it('should display KStoryBridge logo parts', () => {
      renderLayout();
      // Logo is split into K + Story + Bridge spans
      expect(screen.getByText('K')).toBeInTheDocument();
      expect(screen.getByText('Story')).toBeInTheDocument();
      expect(screen.getByText('Bridge')).toBeInTheDocument();
    });

    it('should display Trial badge', () => {
      renderLayout();
      expect(screen.getByText('Trial')).toBeInTheDocument();
    });

    it('should have Sign Up button in header', () => {
      renderLayout();
      // Header has "SIGN UP" button linking to signup
      expect(screen.getByRole('link', { name: /sign up/i })).toHaveAttribute('href', '/signup');
    });

    it('should display trial counter badge', () => {
      renderLayout();
      expect(screen.getByText('5 of 5 searches left')).toBeInTheDocument();
    });
  });

  describe('content', () => {
    it('should render children content', () => {
      renderLayout(<div>My Test Content</div>);
      expect(screen.getByText('My Test Content')).toBeInTheDocument();
    });
  });
});
