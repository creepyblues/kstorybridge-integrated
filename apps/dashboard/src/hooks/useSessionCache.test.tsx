import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useSessionCache } from './useSessionCache';

// Mock dependencies
vi.mock('./useAuth', () => ({
  useAuth: vi.fn(),
}));

vi.mock('@/contexts/DataCacheContext', () => ({
  useDataCache: vi.fn(),
}));

vi.mock('@/utils/debug', () => ({
  debug: {
    log: vi.fn(),
  },
}));

import { useAuth } from './useAuth';
import { useDataCache } from '@/contexts/DataCacheContext';
import { debug } from '@/utils/debug';

describe('useSessionCache', () => {
  const mockInitializeSession = vi.fn();
  const mockClearCache = vi.fn();
  const mockIsSessionValid = vi.fn();
  const mockSetDbConnectivityStatus = vi.fn();
  const mockGetDbConnectivityStatus = vi.fn();

  const mockUser = {
    id: 'user-123',
    email: 'test@example.com',
  };

  const mockSession = {
    access_token: 'mock-access-token',
    refresh_token: 'mock-refresh-token',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();

    // Default DataCache mock
    vi.mocked(useDataCache).mockReturnValue({
      initializeSession: mockInitializeSession,
      clearCache: mockClearCache,
      isSessionValid: mockIsSessionValid,
      setDbConnectivityStatus: mockSetDbConnectivityStatus,
      getDbConnectivityStatus: mockGetDbConnectivityStatus,
    } as any);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('session initialization', () => {
    it('should initialize cache session when user logs in', () => {
      vi.mocked(useAuth).mockReturnValue({
        user: mockUser,
        session: mockSession,
        loading: false,
        error: null,
        signOut: vi.fn(),
      } as any);

      renderHook(() => useSessionCache());

      expect(mockInitializeSession).toHaveBeenCalledWith('mock-access-token');
      expect(debug.log).toHaveBeenCalledWith(
        '🔐 Session cache initialized for user:',
        'test@example.com'
      );
    });

    it('should not initialize session while auth is loading', () => {
      vi.mocked(useAuth).mockReturnValue({
        user: mockUser,
        session: mockSession,
        loading: true,
        error: null,
        signOut: vi.fn(),
      } as any);

      renderHook(() => useSessionCache());

      expect(mockInitializeSession).not.toHaveBeenCalled();
    });

    it('should not initialize session without user', () => {
      vi.mocked(useAuth).mockReturnValue({
        user: null,
        session: null,
        loading: false,
        error: null,
        signOut: vi.fn(),
      } as any);

      renderHook(() => useSessionCache());

      expect(mockInitializeSession).not.toHaveBeenCalled();
    });

    it('should not initialize session without session object', () => {
      vi.mocked(useAuth).mockReturnValue({
        user: mockUser,
        session: null,
        loading: false,
        error: null,
        signOut: vi.fn(),
      } as any);

      renderHook(() => useSessionCache());

      expect(mockInitializeSession).not.toHaveBeenCalled();
    });
  });

  describe('cache clearing on logout', () => {
    it('should clear cache when user logs out', () => {
      vi.mocked(useAuth).mockReturnValue({
        user: null,
        session: null,
        loading: false,
        error: null,
        signOut: vi.fn(),
      } as any);

      renderHook(() => useSessionCache());

      expect(mockClearCache).toHaveBeenCalled();
      expect(debug.log).toHaveBeenCalledWith('🧹 Cache cleared - user logged out');
    });

    it('should not clear cache while loading', () => {
      vi.mocked(useAuth).mockReturnValue({
        user: null,
        session: null,
        loading: true,
        error: null,
        signOut: vi.fn(),
      } as any);

      renderHook(() => useSessionCache());

      expect(mockClearCache).not.toHaveBeenCalled();
    });

    it('should not clear cache when user is logged in', () => {
      vi.mocked(useAuth).mockReturnValue({
        user: mockUser,
        session: mockSession,
        loading: false,
        error: null,
        signOut: vi.fn(),
      } as any);

      renderHook(() => useSessionCache());

      // Clear cache should not be called for logged in user
      // Note: it gets called during the !user effect but not when user exists
      expect(mockClearCache).not.toHaveBeenCalled();
    });
  });

  describe('session validity monitoring', () => {
    it('should set up interval to check session validity when user exists', () => {
      mockIsSessionValid.mockReturnValue(true);

      vi.mocked(useAuth).mockReturnValue({
        user: mockUser,
        session: mockSession,
        loading: false,
        error: null,
        signOut: vi.fn(),
      } as any);

      renderHook(() => useSessionCache());

      // Fast forward 5 minutes
      act(() => {
        vi.advanceTimersByTime(5 * 60 * 1000);
      });

      expect(mockIsSessionValid).toHaveBeenCalled();
    });

    it('should clear cache when session becomes invalid', () => {
      mockIsSessionValid.mockReturnValue(false);

      vi.mocked(useAuth).mockReturnValue({
        user: mockUser,
        session: mockSession,
        loading: false,
        error: null,
        signOut: vi.fn(),
      } as any);

      renderHook(() => useSessionCache());

      // Fast forward 5 minutes
      act(() => {
        vi.advanceTimersByTime(5 * 60 * 1000);
      });

      expect(mockClearCache).toHaveBeenCalled();
      expect(debug.log).toHaveBeenCalledWith('⏰ Session cache expired, clearing and logging out...');
    });

    it('should not clear cache when session is still valid', () => {
      mockIsSessionValid.mockReturnValue(true);

      vi.mocked(useAuth).mockReturnValue({
        user: mockUser,
        session: mockSession,
        loading: false,
        error: null,
        signOut: vi.fn(),
      } as any);

      // Clear the mock from initialization
      mockClearCache.mockClear();

      renderHook(() => useSessionCache());

      // Fast forward 5 minutes
      act(() => {
        vi.advanceTimersByTime(5 * 60 * 1000);
      });

      expect(mockClearCache).not.toHaveBeenCalled();
    });

    it('should not set up interval when no user', () => {
      vi.mocked(useAuth).mockReturnValue({
        user: null,
        session: null,
        loading: false,
        error: null,
        signOut: vi.fn(),
      } as any);

      renderHook(() => useSessionCache());

      // Clear mocks from logout effect
      mockIsSessionValid.mockClear();

      // Fast forward 5 minutes
      act(() => {
        vi.advanceTimersByTime(5 * 60 * 1000);
      });

      expect(mockIsSessionValid).not.toHaveBeenCalled();
    });

    it('should clean up interval on unmount', () => {
      mockIsSessionValid.mockReturnValue(true);

      vi.mocked(useAuth).mockReturnValue({
        user: mockUser,
        session: mockSession,
        loading: false,
        error: null,
        signOut: vi.fn(),
      } as any);

      const { unmount } = renderHook(() => useSessionCache());

      // Clear mocks
      mockIsSessionValid.mockClear();

      // Unmount
      unmount();

      // Fast forward - interval should not fire
      act(() => {
        vi.advanceTimersByTime(5 * 60 * 1000);
      });

      expect(mockIsSessionValid).not.toHaveBeenCalled();
    });

    it('should check multiple times at 5-minute intervals', () => {
      mockIsSessionValid.mockReturnValue(true);

      vi.mocked(useAuth).mockReturnValue({
        user: mockUser,
        session: mockSession,
        loading: false,
        error: null,
        signOut: vi.fn(),
      } as any);

      renderHook(() => useSessionCache());

      // Clear from potential initial calls
      mockIsSessionValid.mockClear();

      // Fast forward 15 minutes (3 checks)
      act(() => {
        vi.advanceTimersByTime(15 * 60 * 1000);
      });

      expect(mockIsSessionValid).toHaveBeenCalledTimes(3);
    });
  });

  describe('return values', () => {
    it('should return isSessionValid function', () => {
      mockIsSessionValid.mockReturnValue(true);

      vi.mocked(useAuth).mockReturnValue({
        user: mockUser,
        session: mockSession,
        loading: false,
        error: null,
        signOut: vi.fn(),
      } as any);

      const { result } = renderHook(() => useSessionCache());

      expect(result.current.isSessionValid).toBe(mockIsSessionValid);
    });

    it('should return getDbConnectivityStatus function', () => {
      mockGetDbConnectivityStatus.mockReturnValue(true);

      vi.mocked(useAuth).mockReturnValue({
        user: mockUser,
        session: mockSession,
        loading: false,
        error: null,
        signOut: vi.fn(),
      } as any);

      const { result } = renderHook(() => useSessionCache());

      expect(result.current.getDbConnectivityStatus).toBe(mockGetDbConnectivityStatus);
    });

    it('should return setDbConnectivityStatus function', () => {
      vi.mocked(useAuth).mockReturnValue({
        user: mockUser,
        session: mockSession,
        loading: false,
        error: null,
        signOut: vi.fn(),
      } as any);

      const { result } = renderHook(() => useSessionCache());

      expect(result.current.setDbConnectivityStatus).toBe(mockSetDbConnectivityStatus);
    });
  });

  describe('state transitions', () => {
    it('should handle login -> logout transition', () => {
      const authMock = vi.mocked(useAuth);

      // Start logged in
      authMock.mockReturnValue({
        user: mockUser,
        session: mockSession,
        loading: false,
        error: null,
        signOut: vi.fn(),
      } as any);

      const { rerender } = renderHook(() => useSessionCache());

      expect(mockInitializeSession).toHaveBeenCalledTimes(1);

      // Log out
      authMock.mockReturnValue({
        user: null,
        session: null,
        loading: false,
        error: null,
        signOut: vi.fn(),
      } as any);

      rerender();

      expect(mockClearCache).toHaveBeenCalled();
    });

    it('should handle logout -> login transition', () => {
      const authMock = vi.mocked(useAuth);

      // Start logged out
      authMock.mockReturnValue({
        user: null,
        session: null,
        loading: false,
        error: null,
        signOut: vi.fn(),
      } as any);

      const { rerender } = renderHook(() => useSessionCache());

      expect(mockClearCache).toHaveBeenCalledTimes(1);
      mockInitializeSession.mockClear();

      // Log in
      authMock.mockReturnValue({
        user: mockUser,
        session: mockSession,
        loading: false,
        error: null,
        signOut: vi.fn(),
      } as any);

      rerender();

      expect(mockInitializeSession).toHaveBeenCalledWith('mock-access-token');
    });

    it('should handle loading -> authenticated transition', () => {
      const authMock = vi.mocked(useAuth);

      // Start loading
      authMock.mockReturnValue({
        user: null,
        session: null,
        loading: true,
        error: null,
        signOut: vi.fn(),
      } as any);

      const { rerender } = renderHook(() => useSessionCache());

      expect(mockInitializeSession).not.toHaveBeenCalled();
      expect(mockClearCache).not.toHaveBeenCalled();

      // Finish loading with user
      authMock.mockReturnValue({
        user: mockUser,
        session: mockSession,
        loading: false,
        error: null,
        signOut: vi.fn(),
      } as any);

      rerender();

      expect(mockInitializeSession).toHaveBeenCalledTimes(1);
    });
  });

  describe('edge cases', () => {
    it('should handle user with different session tokens', () => {
      const authMock = vi.mocked(useAuth);

      // First session
      authMock.mockReturnValue({
        user: mockUser,
        session: { ...mockSession, access_token: 'token-1' },
        loading: false,
        error: null,
        signOut: vi.fn(),
      } as any);

      const { rerender } = renderHook(() => useSessionCache());

      expect(mockInitializeSession).toHaveBeenCalledWith('token-1');

      // Session refresh with new token
      authMock.mockReturnValue({
        user: mockUser,
        session: { ...mockSession, access_token: 'token-2' },
        loading: false,
        error: null,
        signOut: vi.fn(),
      } as any);

      rerender();

      expect(mockInitializeSession).toHaveBeenCalledWith('token-2');
    });
  });
});
