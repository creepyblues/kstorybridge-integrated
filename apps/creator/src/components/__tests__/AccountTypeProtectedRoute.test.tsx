import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { AccountTypeProtectedRoute } from '../AccountTypeProtectedRoute';
import type { User as SupabaseUser } from '@supabase/supabase-js';

// Mock hooks
vi.mock('@/hooks/useAuth', () => ({
  useAuth: vi.fn()
}));

vi.mock('@/hooks/useAccountType', () => ({
  useAccountType: vi.fn(),
  getAccountTypeDisplayInfo: vi.fn((accountType: string) => {
    if (accountType === 'buyer') {
      return {
        dashboardPath: '/buyers/chat',
        label: 'Buyer'
      };
    }
    return {
      dashboardPath: '/home',
      label: 'Creator'
    };
  })
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useLocation: () => ({ pathname: '/home' })
  };
});

const mockNavigate = vi.fn();

import { useAuth } from '@/hooks/useAuth';
import { useAccountType } from '@/hooks/useAccountType';

describe('AccountTypeProtectedRoute (Creator App)', () => {
  const mockCreatorUser = {
    id: 'creator-123',
    email: 'creator@example.com',
    user_metadata: {
      account_type: 'creator'
    }
  } as unknown as SupabaseUser;

  const mockBuyerUser = {
    id: 'buyer-123',
    email: 'buyer@example.com',
    user_metadata: {
      account_type: 'buyer'
    }
  } as unknown as SupabaseUser;

  beforeEach(() => {
    vi.clearAllMocks();
    mockNavigate.mockClear();
  });

  it('should allow creators to access creator routes', async () => {
    (useAuth as any).mockReturnValue({
      user: mockCreatorUser,
      loading: false
    });

    (useAccountType as any).mockReturnValue({
      accountType: 'creator',
      loading: false,
      source: 'metadata',
      confidence: 'high'
    });

    render(
      <BrowserRouter>
        <AccountTypeProtectedRoute allowedAccountTypes={['creator']}>
          <div>Creator Content</div>
        </AccountTypeProtectedRoute>
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Creator Content')).toBeInTheDocument();
    });

    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it('should redirect buyers to dashboard domain', async () => {
    (useAuth as any).mockReturnValue({
      user: mockBuyerUser,
      loading: false
    });

    (useAccountType as any).mockReturnValue({
      accountType: 'buyer',
      loading: false,
      source: 'metadata',
      confidence: 'high'
    });

    render(
      <BrowserRouter>
        <AccountTypeProtectedRoute allowedAccountTypes={['creator']}>
          <div>Creator Content</div>
        </AccountTypeProtectedRoute>
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/buyers/chat', { replace: true });
    });

    // Should show loading state while redirecting
    expect(screen.getByText('Redirecting to your dashboard...')).toBeInTheDocument();
  });

  it('should show loading state while auth is loading', () => {
    (useAuth as any).mockReturnValue({
      user: null,
      loading: true
    });

    (useAccountType as any).mockReturnValue({
      accountType: null,
      loading: true,
      source: null,
      confidence: null
    });

    render(
      <BrowserRouter>
        <AccountTypeProtectedRoute allowedAccountTypes={['creator']}>
          <div>Creator Content</div>
        </AccountTypeProtectedRoute>
      </BrowserRouter>
    );

    // Should show loading spinner (check for Loader2 component or animation class)
    const loadingElement = screen.getByRole('status', { hidden: true });
    expect(loadingElement).toBeInTheDocument();
  });

  it('should show loading state while account type is loading', () => {
    (useAuth as any).mockReturnValue({
      user: mockCreatorUser,
      loading: false
    });

    (useAccountType as any).mockReturnValue({
      accountType: null,
      loading: true,
      source: null,
      confidence: null
    });

    render(
      <BrowserRouter>
        <AccountTypeProtectedRoute allowedAccountTypes={['creator']}>
          <div>Creator Content</div>
        </AccountTypeProtectedRoute>
      </BrowserRouter>
    );

    // Should show loading spinner
    const loadingElement = screen.getByRole('status', { hidden: true });
    expect(loadingElement).toBeInTheDocument();
  });

  it('should handle unauthenticated users', () => {
    (useAuth as any).mockReturnValue({
      user: null,
      loading: false
    });

    (useAccountType as any).mockReturnValue({
      accountType: null,
      loading: false,
      source: null,
      confidence: null
    });

    render(
      <BrowserRouter>
        <AccountTypeProtectedRoute allowedAccountTypes={['creator']}>
          <div>Creator Content</div>
        </AccountTypeProtectedRoute>
      </BrowserRouter>
    );

    // Should show authenticating message (ProtectedRoute should handle redirect)
    expect(screen.getByText('Authenticating...')).toBeInTheDocument();
  });

  it('should redirect to account type selection if account type cannot be determined', async () => {
    (useAuth as any).mockReturnValue({
      user: mockCreatorUser,
      loading: false
    });

    (useAccountType as any).mockReturnValue({
      accountType: null, // Account type could not be determined
      loading: false,
      source: null,
      confidence: null
    });

    render(
      <BrowserRouter>
        <AccountTypeProtectedRoute allowedAccountTypes={['creator']}>
          <div>Creator Content</div>
        </AccountTypeProtectedRoute>
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/account-type-selection?missing=true', { replace: true });
    });
  });

  it('should log protection check details in debug mode', async () => {
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    (useAuth as any).mockReturnValue({
      user: mockCreatorUser,
      loading: false
    });

    (useAccountType as any).mockReturnValue({
      accountType: 'creator',
      loading: false,
      source: 'metadata',
      confidence: 'high'
    });

    render(
      <BrowserRouter>
        <AccountTypeProtectedRoute allowedAccountTypes={['creator']}>
          <div>Creator Content</div>
        </AccountTypeProtectedRoute>
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('🛡️ Account type protection check'),
        expect.any(Object)
      );
    });

    consoleSpy.mockRestore();
  });

  it('should handle multiple allowed account types', async () => {
    (useAuth as any).mockReturnValue({
      user: mockCreatorUser,
      loading: false
    });

    (useAccountType as any).mockReturnValue({
      accountType: 'creator',
      loading: false,
      source: 'metadata',
      confidence: 'high'
    });

    render(
      <BrowserRouter>
        <AccountTypeProtectedRoute allowedAccountTypes={['creator', 'admin']}>
          <div>Creator Content</div>
        </AccountTypeProtectedRoute>
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Creator Content')).toBeInTheDocument();
    });
  });

  it('should show preparing workspace message when account type is undefined', () => {
    (useAuth as any).mockReturnValue({
      user: mockCreatorUser,
      loading: false
    });

    (useAccountType as any).mockReturnValue({
      accountType: undefined,
      loading: false,
      source: null,
      confidence: null
    });

    render(
      <BrowserRouter>
        <AccountTypeProtectedRoute allowedAccountTypes={['creator']}>
          <div>Creator Content</div>
        </AccountTypeProtectedRoute>
      </BrowserRouter>
    );

    expect(screen.getByText('Preparing your workspace...')).toBeInTheDocument();
  });
});
