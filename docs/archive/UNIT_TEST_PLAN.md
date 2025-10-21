# KStoryBridge Dashboard - Comprehensive Unit Test Plan

**Last Updated:** 2025-01-19
**Version:** 1.0
**Coverage Target:** 85%+ for critical authentication flows

This document outlines the comprehensive unit testing strategy for the KStoryBridge Dashboard application, focusing on authentication flows, user journeys, and system reliability.

## Table of Contents

1. [Test Strategy Overview](#test-strategy-overview)
2. [Test Module Structure](#test-module-structure)
3. [Priority Levels & Execution](#priority-levels--execution)
4. [Test Environment Setup](#test-environment-setup)
5. [Mock Utilities](#mock-utilities)
6. [Critical Test Scenarios](#critical-test-scenarios)
7. [Execution Commands](#execution-commands)

---

## Test Strategy Overview

### Core Testing Philosophy

- **Authentication-First**: Prioritize testing critical auth flows that can break user access
- **Failure-Driven**: Focus on known failure points and edge cases
- **Integration-Aware**: Test component interactions, not just isolated units
- **Recovery-Focused**: Verify error recovery and fallback mechanisms

### Technology Stack

- **Test Framework**: Jest + React Testing Library
- **Mocking**: Jest mocks for Supabase, external APIs
- **Test Database**: Local Supabase instance with test schema
- **Coverage**: Istanbul for coverage reporting

---

## Test Module Structure

### Module 1: Authentication Core (`auth.test.ts`)

**Purpose**: Test the core authentication system and session management

```typescript
describe('Authentication System', () => {
  describe('useAuth Hook', () => {
    it('should initialize session from URL parameters', async () => {
      // Test OAuth callback token extraction
      // Verify session establishment from access_token/refresh_token
      // Validate user state updates
    });

    it('should perform session health checks', async () => {
      // Test periodic health check execution (5-minute intervals)
      // Verify unhealthy session detection
      // Validate session refresh when needed
    });

    it('should handle token refresh automatically', async () => {
      // Test TOKEN_REFRESHED event handling
      // Verify automatic refresh before expiry
      // Validate state updates after refresh
    });

    it('should send welcome emails on SIGNED_IN event', async () => {
      // Test email sending for verified users
      // Verify profile lookup for email personalization
      // Validate duplicate prevention
    });

    it('should recover from corrupted sessions', async () => {
      // Test session recovery utilities
      // Verify cleanup of invalid tokens
      // Validate fallback to fresh authentication
    });

    it('should clear cache on logout', async () => {
      // Test complete session cleanup
      // Verify localStorage/sessionStorage clearing
      // Validate redirect to appropriate signin page
    });

    it('should handle cross-domain session transfer', async () => {
      // Test token parameter extraction
      // Verify session establishment from URL
      // Validate URL cleanup after processing
    });
  });

  describe('Session Manager', () => {
    it('should validate session health', async () => {
      // Test session validation logic
      // Verify token expiry detection
      // Validate user profile accessibility
    });

    it('should recover corrupted sessions', async () => {
      // Test recovery from invalid tokens
      // Verify automatic refresh attempts
      // Validate fallback to logout when recovery fails
    });

    it('should initialize from URL tokens', async () => {
      // Test token extraction from URL parameters
      // Verify session establishment
      // Validate URL parameter cleanup
    });

    it('should handle session timeout', async () => {
      // Test timeout detection and handling
      // Verify automatic logout on expired sessions
      // Validate user notification of timeout
    });
  });
});
```

### Module 2: Account Type Detection (`accountType.test.ts`)

**Purpose**: Test the multi-source account type detection system

```typescript
describe('Account Type Detection', () => {
  describe('determineAccountType', () => {
    it('should use user metadata as primary source', async () => {
      // Test metadata-based detection (OAuth flows)
      // Verify precedence over other sources
      // Validate confidence scoring
    });

    it('should fall back to database lookup', async () => {
      // Test profile existence check in user_buyers/user_creators
      // Verify email-based lookup (not user_id)
      // Validate query timeout handling
    });

    it('should use URL parameters for signup flows', async () => {
      // Test account_type parameter extraction
      // Verify signup flow account type preservation
      // Validate parameter cleanup after use
    });

    it('should recover from sessionStorage', async () => {
      // Test oauth_account_type recovery
      // Verify storage cleanup after use
      // Validate fallback reliability
    });

    it('should default to buyer for backward compatibility', async () => {
      // Test default fallback behavior
      // Verify buyer assignment when no type detected
      // Validate logging of fallback usage
    });

    it('should handle RLS permission errors', async () => {
      // Test graceful handling of database permission errors
      // Verify fallback to alternative detection methods
      // Validate error logging without user impact
    });

    it('should cache results appropriately', async () => {
      // Test result caching mechanisms
      // Verify cache invalidation rules
      // Validate performance improvement
    });
  });

  describe('Database Profile Checks', () => {
    it('should check user_buyers table by email', async () => {
      // Test buyer profile existence check
      // Verify email normalization (lowercase)
      // Validate query error handling
    });

    it('should check user_creators table by email', async () => {
      // Test creator profile existence check
      // Verify pen_name field usage
      // Validate query timeout handling
    });

    it('should handle network timeouts', async () => {
      // Test 5-second query timeout
      // Verify graceful timeout handling
      // Validate fallback behavior
    });

    it('should bypass checks for OAuth users', async () => {
      // Test OAuth user detection
      // Verify database check bypass
      // Validate performance optimization
    });
  });
});
```

### Module 3: Signup Flows (`signup.test.ts`)

**Purpose**: Test user registration processes for both account types

```typescript
describe('Signup Flows', () => {
  describe('Email Signup', () => {
    it('should validate buyer work email requirement', async () => {
      // Test consumer email domain blocking
      // Verify work email acceptance
      // Validate error messaging
    });

    it('should create auth user with metadata', async () => {
      // Test auth.signUp with complete metadata
      // Verify snake_case field mapping
      // Validate required field inclusion
    });

    it('should trigger database profile creation', async () => {
      // Test database trigger execution
      // Verify profile creation from metadata
      // Validate all required fields
    });

    it('should send verification email', async () => {
      // Test verification email sending
      // Verify correct redirect URL
      // Validate email content
    });

    it('should prevent duplicate profiles', async () => {
      // Test duplicate email handling
      // Verify error messaging
      // Validate existing user redirection
    });

    it('should handle signup errors gracefully', async () => {
      // Test various signup error scenarios
      // Verify user-friendly error messages
      // Validate form state management
    });
  });

  describe('OAuth Signup', () => {
    it('should extract account type from URL', async () => {
      // Test account_type parameter extraction
      // Verify sessionStorage fallback
      // Validate type preservation through OAuth flow
    });

    it('should pre-fill form with Google data', async () => {
      // Test Google profile data extraction
      // Verify form field pre-population
      // Validate user metadata usage
    });

    it('should create profile atomically', async () => {
      // Test atomic profile creation utility
      // Verify retry mechanism
      // Validate conflict resolution
    });

    it('should send welcome email immediately', async () => {
      // Test immediate email for verified OAuth users
      // Verify account type-specific content
      // Validate duplicate prevention
    });

    it('should handle OAuth callback errors', async () => {
      // Test callback error scenarios
      // Verify error message storage in sessionStorage
      // Validate error display in signup form
    });

    it('should update user metadata correctly', async () => {
      // Test metadata normalization
      // Verify account_type setting
      // Validate metadata consistency
    });
  });

  describe('Profile Creation', () => {
    it('should use snake_case field mapping', async () => {
      // Test consistent field naming
      // Verify form → database mapping
      // Validate metadata → profile mapping
    });

    it('should include all required fields', async () => {
      // Test required field validation
      // Verify database schema compliance
      // Validate default value handling
    });

    it('should handle atomic creation with retries', async () => {
      // Test createBuyerProfileAtomic utility
      // Verify retry logic (3 attempts)
      // Validate error handling and reporting
    });

    it('should prevent race conditions', async () => {
      // Test concurrent signup attempts
      // Verify conflict resolution
      // Validate profile uniqueness
    });
  });
});
```

### Module 4: Signin Flows (`signin.test.ts`)

**Purpose**: Test user authentication and login processes

```typescript
describe('Signin Flows', () => {
  describe('Email Signin', () => {
    it('should validate credentials', async () => {
      // Test email/password validation
      // Verify Supabase auth integration
      // Validate error handling for invalid credentials
    });

    it('should check profile existence', async () => {
      // Test profile lookup after authentication
      // Verify account type-specific profile checks
      // Validate missing profile handling
    });

    it('should redirect to appropriate dashboard', async () => {
      // Test buyer → /buyers/home redirection
      // Test creator → /creators/home redirection
      // Validate tier-based routing for buyers
    });

    it('should handle invalid credentials', async () => {
      // Test invalid email/password handling
      // Verify user-friendly error messages
      // Validate form state management
    });

    it('should show email verification alerts', async () => {
      // Test unverified email detection
      // Verify verification reminder UI
      // Validate resend verification functionality
    });
  });

  describe('OAuth Signin', () => {
    it('should preserve account type in callback', async () => {
      // Test account_type preservation through OAuth
      // Verify callback URL parameter handling
      // Validate flow detection (signin vs signup)
    });

    it('should handle existing users', async () => {
      // Test existing profile detection
      // Verify direct dashboard redirection
      // Validate session establishment
    });

    it('should create missing profiles', async () => {
      // Test profile creation for OAuth users without profiles
      // Verify atomic creation process
      // Validate welcome email sending
    });

    it('should redirect correctly after completion', async () => {
      // Test post-signin redirection logic
      // Verify account type-specific routing
      // Validate URL parameter cleanup
    });
  });

  describe('Cross-Account Signin', () => {
    it('should prevent buyer signin with creator account', async () => {
      // Test account type mismatch detection
      // Verify prevention of cross-account access
      // Validate helpful error messaging
    });

    it('should provide helpful error messages', async () => {
      // Test error message clarity
      // Verify guidance for correct signin
      // Validate user experience
    });

    it('should suggest correct signin page', async () => {
      // Test automatic redirection suggestions
      // Verify account type-specific signin links
      // Validate user guidance
    });
  });
});
```

### Module 5: OAuth Callback Processing (`callback.test.ts`)

**Purpose**: Test OAuth callback handling and session establishment

```typescript
describe('OAuth Callback System', () => {
  describe('AuthCallbackPageSimple', () => {
    it('should extract session from code exchange', async () => {
      // Test OAuth code parameter extraction
      // Verify exchangeCodeForSession call
      // Validate session establishment
    });

    it('should resolve account type from multiple sources', async () => {
      // Test account type resolution priority
      // Verify URL params → storage → metadata chain
      // Validate fallback mechanisms
    });

    it('should handle signin vs signup flows', async () => {
      // Test flow parameter detection
      // Verify signin flow handling
      // Validate signup completion redirection
    });

    it('should bypass RLS issues with fallback detection', async () => {
      // Test RLS permission error handling
      // Verify fallback to multiple profile check methods
      // Validate graceful degradation
    });

    it('should timeout and recover gracefully', async () => {
      // Test 20-second timeout handling
      // Verify recovery mechanisms
      // Validate user feedback during timeout
    });

    it('should handle missing account type', async () => {
      // Test account type detection failure
      // Verify fallback profile detection
      // Validate signin redirection
    });
  });

  describe('Session Exchange', () => {
    it('should exchange OAuth code for session', async () => {
      // Test code → session exchange
      // Verify token validation
      // Validate user data extraction
    });

    it('should handle exchange errors', async () => {
      // Test code exchange failure scenarios
      // Verify error handling and user feedback
      // Validate fallback behavior
    });

    it('should validate session after exchange', async () => {
      // Test session validation post-exchange
      // Verify user object completeness
      // Validate metadata availability
    });
  });
});
```

### Module 6: Email System (`email.test.ts`)

**Purpose**: Test email sending and deduplication system

```typescript
describe('Email System', () => {
  describe('EmailService', () => {
    it('should prevent duplicate welcome emails', async () => {
      // Test email_logs table checking
      // Verify duplicate detection
      // Validate skip behavior for duplicates
    });

    it('should log email attempts in database', async () => {
      // Test email_logs table insertion
      // Verify success/failure logging
      // Validate metadata storage
    });

    it('should handle email service failures', async () => {
      // Test Resend API failure handling
      // Verify graceful degradation
      // Validate error logging
    });

    it('should use correct templates for account types', async () => {
      // Test buyer vs creator email templates
      // Verify account type-specific content
      // Validate personalization
    });

    it('should send emails via Supabase Edge Function', async () => {
      // Test Edge Function integration
      // Verify request formatting
      // Validate response handling
    });
  });

  describe('Welcome Email Logic', () => {
    it('should send for verified email users', async () => {
      // Test email sending on SIGNED_IN event
      // Verify verification status checking
      // Validate timing of email sending
    });

    it('should send immediately for OAuth users', async () => {
      // Test immediate sending for OAuth signups
      // Verify bypass of email verification
      // Validate OAuth user detection
    });

    it('should include correct dashboard URLs', async () => {
      // Test environment-specific URL generation
      // Verify buyer vs creator dashboard URLs
      // Validate localhost vs production URLs
    });

    it('should personalize content by account type', async () => {
      // Test account type-specific email content
      // Verify personalization variables
      // Validate template selection
    });
  });
});
```

### Module 7: Dashboard Entry & Routing (`routing.test.ts`)

**Purpose**: Test dashboard entry point and route protection

```typescript
describe('Dashboard Routing', () => {
  describe('DashboardEntrypoint', () => {
    it('should perform system health checks', async () => {
      // Test Supabase health check execution
      // Verify health status reporting
      // Validate health-based decisions
    });

    it('should timeout and recover from hanging auth', async () => {
      // Test 3s warning, 8s recovery, 15s emergency timeouts
      // Verify recovery attempt execution
      // Validate emergency cleanup procedures
    });

    it('should redirect based on account type', async () => {
      // Test buyer → /buyers/home redirection
      // Test creator → /creators/home redirection
      // Validate account type detection integration
    });

    it('should handle missing account type gracefully', async () => {
      // Test account type detection failure
      // Verify recovery attempts
      // Validate fallback to signin
    });

    it('should attempt session recovery', async () => {
      // Test recoverCorruptedSession integration
      // Verify recovery success handling
      // Validate recovery failure fallback
    });
  });

  describe('Protected Routes', () => {
    it('should protect buyer routes from creators', async () => {
      // Test BuyerProtectedLayout enforcement
      // Verify creator access blocking
      // Validate redirection behavior
    });

    it('should protect creator routes from buyers', async () => {
      // Test CreatorProtectedLayout enforcement
      // Verify buyer access blocking
      // Validate redirection behavior
    });

    it('should redirect unauthenticated users', async () => {
      // Test ProtectedRoute enforcement
      // Verify signin redirection
      // Validate return URL preservation
    });

    it('should handle missing profiles', async () => {
      // Test profile existence checking
      // Verify profile creation prompts
      // Validate error handling
    });
  });
});
```

### Module 8: External Systems (`external.test.ts`)

**Purpose**: Test integration with external services

```typescript
describe('External System Integration', () => {
  describe('Slack Notifications', () => {
    it('should filter blacklisted emails', async () => {
      // Test EXCLUDED_EMAILS filtering
      // Test EXCLUDED_DOMAINS filtering
      // Verify notification skipping
    });

    it('should send signup notifications', async () => {
      // Test buyer signup notifications
      // Test creator signup notifications
      // Verify notification content
    });

    it('should send signin notifications', async () => {
      // Test signin notification sending
      // Verify account type inclusion
      // Validate notification timing
    });

    it('should handle notification failures gracefully', async () => {
      // Test Slack API failure handling
      // Verify non-blocking behavior
      // Validate error logging
    });
  });

  describe('Database Operations', () => {
    it('should handle RLS policy restrictions', async () => {
      // Test RLS permission error handling
      // Verify fallback query methods
      // Validate graceful degradation
    });

    it('should retry failed operations', async () => {
      // Test retry logic for database operations
      // Verify exponential backoff
      // Validate max retry limits
    });

    it('should use correct field mappings', async () => {
      // Test snake_case field consistency
      // Verify form → database mapping
      // Validate required field inclusion
    });

    it('should validate data integrity', async () => {
      // Test data validation before insertion
      // Verify constraint compliance
      // Validate error handling
    });
  });

  describe('Session-Based Cache', () => {
    it('should expire after 1 hour', async () => {
      // Test cache expiry mechanism
      // Verify automatic cleanup
      // Validate fresh data fetching
    });

    it('should clear on logout', async () => {
      // Test cache clearing on signout
      // Verify complete cleanup
      // Validate fresh session behavior
    });

    it('should validate session before using cache', async () => {
      // Test session validity checking
      // Verify cache bypass for invalid sessions
      // Validate fresh data fetching
    });

    it('should handle cache corruption', async () => {
      // Test corrupted cache detection
      // Verify automatic cache clearing
      // Validate fallback to fresh data
    });
  });
});
```

### Module 9: Error Recovery (`recovery.test.ts`)

**Purpose**: Test error recovery and resilience mechanisms

```typescript
describe('Error Recovery System', () => {
  describe('Session Recovery', () => {
    it('should detect corrupted sessions', async () => {
      // Test session validation logic
      // Verify corruption detection criteria
      // Validate detection accuracy
    });

    it('should attempt token refresh', async () => {
      // Test automatic refresh attempts
      // Verify refresh success handling
      // Validate refresh failure handling
    });

    it('should clear corrupted data', async () => {
      // Test cleanup of invalid tokens
      // Verify localStorage/sessionStorage clearing
      // Validate clean state restoration
    });

    it('should force logout when recovery fails', async () => {
      // Test fallback to logout
      // Verify complete session cleanup
      // Validate signin redirection
    });
  });

  describe('Timeout Handling', () => {
    it('should warn at 3 seconds', async () => {
      // Test 3-second warning timeout
      // Verify warning message display
      // Validate non-blocking behavior
    });

    it('should attempt recovery at 8 seconds', async () => {
      // Test 8-second recovery timeout
      // Verify recovery attempt execution
      // Validate recovery success handling
    });

    it('should emergency recover at 15 seconds', async () => {
      // Test 15-second emergency timeout
      // Verify emergency cleanup procedures
      // Validate nuclear option fallback
    });
  });

  describe('Database Fallbacks', () => {
    it('should bypass RLS issues', async () => {
      // Test RLS permission bypass methods
      // Verify alternative query strategies
      // Validate fallback reliability
    });

    it('should use multiple detection methods', async () => {
      // Test account type detection fallback chain
      // Verify method priority ordering
      // Validate detection confidence
    });

    it('should handle network timeouts', async () => {
      // Test network timeout handling
      // Verify timeout detection
      // Validate fallback behavior
    });
  });
});
```

### Module 10: Edge Cases & Integration (`integration.test.ts`)

**Purpose**: Test edge cases and full system integration

```typescript
describe('Integration & Edge Cases', () => {
  describe('Cross-Domain Scenarios', () => {
    it('should handle localhost development', async () => {
      // Test localhost:port handling
      // Verify development URL generation
      // Validate cross-port communication
    });

    it('should work with custom domains', async () => {
      // Test custom domain configuration
      // Verify environment variable usage
      // Validate domain-specific behavior
    });

    it('should transfer sessions between apps', async () => {
      // Test website → dashboard session transfer
      // Verify token parameter handling
      // Validate session establishment
    });
  });

  describe('Data Consistency', () => {
    it('should maintain field name consistency', async () => {
      // Test snake_case consistency across all data layers
      // Verify form → auth → database mapping
      // Validate field name standards
    });

    it('should prevent duplicate profile creation', async () => {
      // Test concurrent signup attempt handling
      // Verify duplicate detection
      // Validate conflict resolution
    });

    it('should handle concurrent signup attempts', async () => {
      // Test race condition handling
      // Verify atomic operations
      // Validate data integrity
    });
  });

  describe('Browser Edge Cases', () => {
    it('should handle localStorage corruption', async () => {
      // Test corrupted localStorage detection
      // Verify automatic cleanup
      // Validate fallback behavior
    });

    it('should work with disabled cookies', async () => {
      // Test cookie-less operation
      // Verify session management alternatives
      // Validate functionality degradation
    });

    it('should handle network connectivity issues', async () => {
      // Test offline/online transitions
      // Verify retry mechanisms
      // Validate user feedback
    });
  });
});
```

---

## Priority Levels & Execution

### Priority Level Definitions

#### P0 (Critical) - Must Pass
- Authentication core functionality
- Account type detection
- Profile creation mechanisms
- Session management
- OAuth callback processing

#### P1 (High) - Should Pass
- Signup/signin flows
- Email system functionality
- Dashboard routing
- Error recovery mechanisms

#### P2 (Medium) - Nice to Have
- External system integration
- Performance optimizations
- Advanced error handling

#### P3 (Low) - Future Enhancement
- Edge case handling
- Browser compatibility
- Advanced features

### Execution Schedule

**Week 1: P0 Tests**
- `auth.test.ts`
- `accountType.test.ts`
- `callback.test.ts`

**Week 2: P1 Tests**
- `signup.test.ts`
- `signin.test.ts`
- `email.test.ts`
- `routing.test.ts`

**Week 3: P2 Tests**
- `external.test.ts`
- `recovery.test.ts`

**Week 4: P3 Tests**
- `integration.test.ts`
- Performance and optimization tests

---

## Test Environment Setup

### Local Development Setup

```bash
# 1. Start local Supabase stack
cd apps/dashboard/supabase
npx supabase start

# 2. Run database migrations
npx supabase db reset

# 3. Install test dependencies
npm install --save-dev @testing-library/react @testing-library/jest-dom jest-environment-jsdom

# 4. Create test configuration
# jest.config.js, setupTests.js
```

### Environment Variables

```bash
# .env.test
VITE_SUPABASE_URL=http://localhost:54321
VITE_SUPABASE_ANON_KEY=test_anon_key
VITE_DASHBOARD_URL=http://localhost:8081
VITE_WEBSITE_URL=http://localhost:5173
VITE_AUTH_DEBUG=true
VITE_LOCAL_TESTING=true
VITE_OAUTH_TESTING=true
```

### Test Database Schema

```sql
-- Create test-specific tables and data
-- Sample users for testing
-- Email logs table for email testing
-- Mock data for various scenarios
```

---

## Mock Utilities

### Supabase Client Mock (`__mocks__/supabase.ts`)

```typescript
export const createMockSupabaseClient = () => ({
  auth: {
    signUp: jest.fn(),
    signInWithPassword: jest.fn(),
    signInWithOAuth: jest.fn(),
    getSession: jest.fn(),
    onAuthStateChange: jest.fn(() => ({
      data: { subscription: { unsubscribe: jest.fn() } }
    })),
    refreshSession: jest.fn(),
    signOut: jest.fn(),
    exchangeCodeForSession: jest.fn()
  },
  from: jest.fn(() => ({
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    maybeSingle: jest.fn(),
    insert: jest.fn(),
    update: jest.fn(),
    delete: jest.fn()
  })),
  functions: {
    invoke: jest.fn()
  }
});
```

### User Data Generators (`test-utils/userData.ts`)

```typescript
export const mockBuyerUser = (overrides = {}) => ({
  id: 'buyer-user-123',
  email: 'buyer@company.com',
  email_confirmed_at: new Date().toISOString(),
  user_metadata: {
    account_type: 'buyer',
    full_name: 'Test Buyer',
    buyer_company: 'Test Company',
    buyer_role: 'producer',
    tier: 'basic'
  },
  app_metadata: {},
  created_at: new Date().toISOString(),
  ...overrides
});

export const mockCreatorUser = (overrides = {}) => ({
  id: 'creator-user-456',
  email: 'creator@example.com',
  email_confirmed_at: new Date().toISOString(),
  user_metadata: {
    account_type: 'creator',
    full_name: 'Test Creator',
    pen_name: 'Test Pen Name',
    ip_owner_role: 'author'
  },
  app_metadata: {},
  created_at: new Date().toISOString(),
  ...overrides
});

export const mockBuyerProfile = (overrides = {}) => ({
  id: 'buyer-user-123',
  email: 'buyer@company.com',
  full_name: 'Test Buyer',
  buyer_company: 'Test Company',
  buyer_role: 'producer',
  tier: 'basic',
  requested: false,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  ...overrides
});

export const mockCreatorProfile = (overrides = {}) => ({
  id: 'creator-user-456',
  email: 'creator@example.com',
  full_name: 'Test Creator',
  pen_name: 'Test Pen Name',
  ip_owner_role: 'author',
  invitation_status: 'invited',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  ...overrides
});
```

### Component Testing Utilities (`test-utils/render.tsx`)

```typescript
import { render, RenderOptions } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '@/hooks/useAuth';

const createTestQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: { retry: false },
    mutations: { retry: false }
  }
});

export const renderWithProviders = (
  ui: React.ReactElement,
  options: RenderOptions & {
    queryClient?: QueryClient;
    initialRoute?: string;
  } = {}
) => {
  const { queryClient = createTestQueryClient(), initialRoute = '/', ...renderOptions } = options;

  if (initialRoute !== '/') {
    window.history.pushState({}, 'Test page', initialRoute);
  }

  const Wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          {children}
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );

  return render(ui, { wrapper: Wrapper, ...renderOptions });
};

export * from '@testing-library/react';
export { renderWithProviders as render };
```

---

## Critical Test Scenarios

### High-Risk Scenarios to Test

1. **OAuth Callback RLS Failure**
   - Simulate RLS permission errors during profile checks
   - Verify fallback detection methods work
   - Validate graceful degradation

2. **Session Corruption Recovery**
   - Simulate corrupted localStorage tokens
   - Test automatic recovery mechanisms
   - Verify clean state restoration

3. **Concurrent Signup Attempts**
   - Test race conditions in profile creation
   - Verify atomic operations work correctly
   - Validate conflict resolution

4. **Network Connectivity Issues**
   - Simulate timeout scenarios
   - Test retry mechanisms
   - Verify user feedback during failures

5. **Cross-Domain Session Transfer**
   - Test website → dashboard token transfer
   - Verify session establishment
   - Validate URL parameter handling

### Performance Critical Tests

1. **Authentication Speed**
   - Measure signin/signup completion time
   - Verify timeout thresholds are appropriate
   - Test under various network conditions

2. **Account Type Detection**
   - Measure detection speed across all methods
   - Verify cache effectiveness
   - Test database query performance

3. **Session Health Checks**
   - Measure health check execution time
   - Verify 5-minute interval performance
   - Test under degraded conditions

---

## Execution Commands

### Basic Test Commands

```bash
# Run all tests
npm test

# Run specific test file
npm test auth.test.ts

# Run tests in watch mode
npm test -- --watch

# Run tests with coverage
npm test -- --coverage

# Run tests matching pattern
npm test -- --testNamePattern="OAuth"
```

### Test Environment Commands

```bash
# Setup test environment
npm run test:setup

# Start test database
npm run test:db:start

# Reset test database
npm run test:db:reset

# Stop test services
npm run test:cleanup
```

### CI/CD Integration

```bash
# Run tests in CI mode
npm run test:ci

# Generate coverage report
npm run test:coverage

# Run tests with specific timeout
npm test -- --testTimeout=30000

# Run tests in parallel
npm test -- --maxWorkers=4
```

### Debug Commands

```bash
# Run tests with debugging
npm test -- --verbose

# Run single test with logs
npm test -- --testNamePattern="should initialize session" --verbose

# Run tests with Node debugging
node --inspect-brk node_modules/.bin/jest --runInBand
```

---

## Success Criteria

### Coverage Targets
- **Overall Coverage**: 85%
- **Critical Paths**: 95% (auth, account detection, profile creation)
- **Branches**: 80%
- **Functions**: 90%

### Performance Targets
- **Test Suite Runtime**: < 2 minutes for full suite
- **Individual Test**: < 5 seconds per test
- **Setup/Teardown**: < 10 seconds total

### Quality Metrics
- **Test Reliability**: 99% pass rate on clean runs
- **Flaky Test Rate**: < 1%
- **Coverage Trend**: Increasing over time
- **Bug Detection**: 90% of production bugs caught by tests

This comprehensive unit test plan provides the foundation for ensuring the reliability and robustness of the KStoryBridge Dashboard authentication and user journey systems.