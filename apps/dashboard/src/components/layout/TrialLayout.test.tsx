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
    it('should display KStoryBridge logo', () => {
      renderLayout();
      expect(screen.getByText('KStoryBridge')).toBeInTheDocument();
    });

    it('should display Trial badge', () => {
      renderLayout();
      expect(screen.getByText('Trial')).toBeInTheDocument();
    });

    it('should have Sign In button', () => {
      renderLayout();
      expect(screen.getByRole('link', { name: /sign in/i })).toHaveAttribute('href', '/signin');
    });

    it('should have Sign Up Free button in header', () => {
      renderLayout();
      const signUpButtons = screen.getAllByRole('link', { name: /sign up free/i });
      expect(signUpButtons[0]).toHaveAttribute('href', '/signup');
    });

    it('should display trial counter badge', () => {
      renderLayout();
      expect(screen.getByText('3 of 3 searches left')).toBeInTheDocument();
    });
  });

  describe('content', () => {
    it('should render children content', () => {
      renderLayout(<div>My Test Content</div>);
      expect(screen.getByText('My Test Content')).toBeInTheDocument();
    });
  });

  describe('footer', () => {
    it('should display CTA text', () => {
      renderLayout();
      expect(screen.getByText('Ready to unlock unlimited searches and save your discoveries?')).toBeInTheDocument();
    });

    it('should have Sign Up Free button in footer', () => {
      renderLayout();
      const signUpButtons = screen.getAllByRole('link', { name: /sign up free/i });
      // Footer is the second signup button
      expect(signUpButtons.length).toBeGreaterThanOrEqual(2);
    });
  });
});
