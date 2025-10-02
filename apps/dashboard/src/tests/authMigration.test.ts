/**
 * Auth Migration Tests
 *
 * Verifies that the migrated auth system maintains compatibility
 * and doesn't break existing functionality
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { authServiceMigrated } from '@/services/auth/AuthServiceMigrated';
import { authService } from '@/services/auth/AuthService';
import { authAdapter } from '@/adapters/authAdapter';
import { updateMigrationConfig, getMigrationConfig, logMigration } from '@/config/authMigration';

// Mock dependencies
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: {
      signUp: vi.fn(),
      signInWithPassword: vi.fn(),
      signInWithOAuth: vi.fn(),
      signOut: vi.fn(),
      getSession: vi.fn(),
      getUser: vi.fn(),
      exchangeCodeForSession: vi.fn(),
      updateUser: vi.fn(),
      resetPasswordForEmail: vi.fn(),
      onAuthStateChange: vi.fn()
    }
  }
}));

vi.mock('@/services/emailService', () => ({
  sendWelcomeEmail: vi.fn()
}));

vi.mock('@/utils/slack', () => ({
  notifyBuyerSignup: vi.fn(),
  notifyCreatorSignup: vi.fn()
}));

vi.mock('@/services/authErrorTracking', () => ({
  trackAuthError: vi.fn()
}));

vi.mock('@/services/database/DatabaseClient', () => ({
  databaseClient: {
    getCurrentUser: vi.fn(),
    getCurrentSession: vi.fn(),
    signOut: vi.fn(),
    insert: vi.fn(),
    select: vi.fn()
  }
}));

describe('Auth Migration System', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset migration config to defaults
    updateMigrationConfig({
      useAuthServiceAdapter: false,
      useDatabaseClientAdapter: false,
      useAuthCallbackAdapter: false,
      useSignupFormAdapter: false,
      useSigninFormAdapter: false,
      enableMigrationLogging: true,
      enablePerformanceComparison: true,
      rollbackOnError: true
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Migration Configuration', () => {
    it('should start with migration disabled by default', () => {
      const config = getMigrationConfig();
      expect(config.useAuthServiceAdapter).toBe(false);
      expect(config.useDatabaseClientAdapter).toBe(false);
      expect(config.enableMigrationLogging).toBe(true);
    });

    it('should allow updating migration config', () => {
      updateMigrationConfig({
        useAuthServiceAdapter: true,
        useDatabaseClientAdapter: true
      });

      const config = getMigrationConfig();
      expect(config.useAuthServiceAdapter).toBe(true);
      expect(config.useDatabaseClientAdapter).toBe(true);
    });

    it('should log migration events when enabled', () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      logMigration('TestComponent', 'test action', { data: 'test' });

      expect(consoleSpy).toHaveBeenCalledWith(
        '🔄 AUTH_MIGRATION [TestComponent]: test action',
        { data: 'test' }
      );

      consoleSpy.mockRestore();
    });
  });

  describe('AuthAdapter Fallback Behavior', () => {
    it('should use Supabase when migration is disabled', async () => {
      const { supabase } = await import('@/integrations/supabase/client');

      supabase.auth.signUp.mockResolvedValue({
        data: { user: { id: 'test-user', email: 'test@example.com' } },
        error: null
      });

      const result = await authAdapter.signUp({
        email: 'test@example.com',
        password: 'password123'
      });

      expect(supabase.auth.signUp).toHaveBeenCalled();
      expect(result.user?.id).toBe('test-user');
    });

    it('should handle Supabase errors gracefully', async () => {
      const { supabase } = await import('@/integrations/supabase/client');

      supabase.auth.signUp.mockResolvedValue({
        data: null,
        error: { message: 'Email already exists' }
      });

      const result = await authAdapter.signUp({
        email: 'test@example.com',
        password: 'password123'
      });

      expect(result.user).toBeNull();
      expect(result.error).toBe('Email already exists');
    });

    it('should handle network errors with rollback', async () => {
      const { supabase } = await import('@/integrations/supabase/client');

      // First call fails (sealed auth simulation)
      supabase.auth.signUp.mockRejectedValueOnce(new Error('Network error'));

      // Second call succeeds (rollback to Supabase)
      supabase.auth.signUp.mockResolvedValueOnce({
        data: { user: { id: 'test-user', email: 'test@example.com' } },
        error: null
      });

      updateMigrationConfig({ rollbackOnError: true });

      const result = await authAdapter.signUp({
        email: 'test@example.com',
        password: 'password123'
      });

      // Should succeed with rollback
      expect(result.user?.id).toBe('test-user');
    });
  });

  describe('AuthServiceMigrated Compatibility', () => {
    it('should maintain identical API to original AuthService', async () => {
      // Compare method signatures
      const originalMethods = Object.getOwnPropertyNames(Object.getPrototypeOf(authService))
        .filter(name => name !== 'constructor' && typeof authService[name] === 'function');

      const migratedMethods = Object.getOwnPropertyNames(Object.getPrototypeOf(authServiceMigrated))
        .filter(name => name !== 'constructor' && typeof authServiceMigrated[name] === 'function');

      expect(migratedMethods).toEqual(expect.arrayContaining(originalMethods));
    });

    it('should handle signup with same interface as original', async () => {
      const { supabase } = await import('@/integrations/supabase/client');

      supabase.auth.signUp.mockResolvedValue({
        data: { user: { id: 'test-user', email: 'test@example.com' } },
        error: null
      });

      const signupData = {
        email: 'test@example.com',
        password: 'password123',
        metadata: { account_type: 'buyer' }
      };

      const result = await authServiceMigrated.signUp(signupData);

      expect(result).toHaveProperty('user');
      expect(result).toHaveProperty('session');
      expect(result).toHaveProperty('error');
      expect(result.user?.id).toBe('test-user');
    });

    it('should handle signin with same interface as original', async () => {
      const { supabase } = await import('@/integrations/supabase/client');

      supabase.auth.signInWithPassword.mockResolvedValue({
        data: { user: { id: 'test-user', email: 'test@example.com' } },
        error: null
      });

      const result = await authServiceMigrated.signIn('test@example.com', 'password123');

      expect(result).toHaveProperty('user');
      expect(result).toHaveProperty('session');
      expect(result).toHaveProperty('error');
      expect(result.user?.id).toBe('test-user');
    });

    it('should handle OAuth signin with same interface as original', async () => {
      const { supabase } = await import('@/integrations/supabase/client');

      supabase.auth.signInWithOAuth.mockResolvedValue({
        data: {},
        error: null
      });

      const result = await authServiceMigrated.signInWithOAuth('google', {
        redirectTo: '/auth/callback'
      });

      expect(result).toHaveProperty('error');
      expect(result.error).toBeUndefined();
    });

    it('should handle signout with same interface as original', async () => {
      const { databaseClient } = await import('@/services/database/DatabaseClient');

      databaseClient.signOut.mockResolvedValue({});

      const result = await authServiceMigrated.signOut();

      expect(result).toHaveProperty('error');
      expect(result.error).toBeUndefined();
    });
  });

  describe('Performance Monitoring', () => {
    it('should track performance differences when enabled', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      updateMigrationConfig({
        enablePerformanceComparison: true
      });

      const { supabase } = await import('@/integrations/supabase/client');

      supabase.auth.signUp.mockResolvedValue({
        data: { user: { id: 'test-user', email: 'test@example.com' } },
        error: null
      });

      await authAdapter.signUp({
        email: 'test@example.com',
        password: 'password123'
      });

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('📊 PERF [AuthAdapter] signUp:')
      );

      consoleSpy.mockRestore();
    });
  });

  describe('Error Tracking Integration', () => {
    it('should track errors consistently between old and new systems', async () => {
      const { trackAuthError } = await import('@/services/authErrorTracking');
      const { supabase } = await import('@/integrations/supabase/client');

      supabase.auth.signUp.mockResolvedValue({
        data: null,
        error: { message: 'Invalid email' }
      });

      await authServiceMigrated.signUp({
        email: 'invalid-email',
        password: 'password123'
      });

      expect(trackAuthError).toHaveBeenCalledWith(
        expect.objectContaining({ message: 'Invalid email' }),
        expect.objectContaining({
          failureType: 'signup_email',
          stage: 'auth_adapter',
          email: 'invalid-email'
        })
      );
    });
  });

  describe('Gradual Migration Safety', () => {
    it('should allow enabling only specific components', () => {
      updateMigrationConfig({
        useAuthServiceAdapter: true,
        useDatabaseClientAdapter: false, // Keep this disabled
        useSignupFormAdapter: false
      });

      const config = getMigrationConfig();
      expect(config.useAuthServiceAdapter).toBe(true);
      expect(config.useDatabaseClientAdapter).toBe(false);
      expect(config.useSignupFormAdapter).toBe(false);
    });

    it('should maintain separate migration states for different components', () => {
      // Simulate real-world migration: enable AuthService but not DatabaseClient
      updateMigrationConfig({
        useAuthServiceAdapter: true,
        useDatabaseClientAdapter: false
      });

      // This should be possible without conflicts
      const config = getMigrationConfig();
      expect(config.useAuthServiceAdapter).toBe(true);
      expect(config.useDatabaseClientAdapter).toBe(false);
    });
  });

  describe('Backward Compatibility', () => {
    it('should preserve Supabase user object structure', async () => {
      const { supabase } = await import('@/integrations/supabase/client');

      const mockSupabaseUser = {
        id: 'test-user',
        email: 'test@example.com',
        user_metadata: { account_type: 'buyer' },
        role: 'authenticated'
      };

      supabase.auth.getUser.mockResolvedValue({
        data: { user: mockSupabaseUser },
        error: null
      });

      const user = await authAdapter.getCurrentUser();

      // Should have both new and old fields for compatibility
      expect(user).toMatchObject({
        id: 'test-user',
        email: 'test@example.com',
        metadata: { account_type: 'buyer' },
        accountType: 'buyer',
        // Backward compatibility fields
        user_metadata: { account_type: 'buyer' },
        role: 'authenticated'
      });
    });

    it('should preserve Supabase session object structure', async () => {
      const { supabase } = await import('@/integrations/supabase/client');

      const mockSupabaseSession = {
        user: { id: 'test-user', email: 'test@example.com' },
        access_token: 'token123',
        expires_at: Math.floor(Date.now() / 1000) + 3600
      };

      supabase.auth.getSession.mockResolvedValue({
        data: { session: mockSupabaseSession },
        error: null
      });

      const session = await authAdapter.getSession();

      // Should have both new and old fields for compatibility
      expect(session).toMatchObject({
        user: expect.objectContaining({ id: 'test-user' }),
        accessToken: 'token123',
        expiresAt: expect.any(Number),
        // Backward compatibility fields
        access_token: 'token123',
        expires_at: expect.any(Number)
      });
    });
  });
});