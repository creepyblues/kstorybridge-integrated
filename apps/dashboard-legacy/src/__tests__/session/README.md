# Session Management Test Suite

Comprehensive unit tests for the session management implementation in the dashboard app.

## Test Files

### 1. `client.sessionStorage.test.ts`
**Focus**: sessionStorage integration and bootstrap functionality

**Coverage**:
- ✅ sessionStorage vs localStorage usage verification
- ✅ Bootstrap session loading from sessionStorage
- ✅ Session cache freshness checks (30-minute cache)
- ✅ OAuth callback detection and handling
- ✅ Storage disabled/blocked scenarios
- ✅ Storage quota exceeded errors
- ✅ Multi-tab scenarios
- ✅ Corrupted JSON handling
- ✅ Clock skew scenarios

**Key Tests**:
- `should use sessionStorage instead of localStorage`
- `should handle sessionStorage being disabled`
- `should successfully bootstrap valid session from sessionStorage`
- `should skip bootstrap during OAuth callback`
- `should handle corrupted JSON in sessionStorage`

### 2. `sessionConfig.test.ts`
**Focus**: Configuration validation and immutability

**Coverage**:
- ✅ Configuration value correctness
- ✅ Immutability (as const) enforcement
- ✅ Time unit conversions
- ✅ Threshold hierarchy validation
- ✅ Type exports
- ✅ Retry configuration validation
- ✅ Integrity configuration validation

**Key Tests**:
- `should have correct timeout values`
- `should verify threshold hierarchy (critical < warning < info)`
- `should be readonly (as const)`
- `should calculate exponential backoff correctly`

### 3. `sessionManager.edge-cases.test.ts`
**Focus**: Edge cases, error recovery, and security

**Coverage**:
- ✅ Storage unavailability (private browsing, SSR)
- ✅ Concurrent operations and race conditions
- ✅ OAuth edge cases (missing code, errors, timeouts)
- ✅ Network error scenarios and retries
- ✅ Session expiry during active use
- ✅ Security scenarios (injection, fixation, tampering)
- ✅ Performance edge cases
- ✅ Recovery metrics tracking

**Key Tests**:
- `should handle sessionStorage disabled (private browsing)`
- `should prevent concurrent getCurrentSession calls`
- `should handle OAuth callback with error parameter`
- `should retry on network timeout`
- `should detect token injection attempt`

### 4. `sessionManager.test.ts` (Existing)
**Focus**: Core session manager functionality

**Coverage** (existing):
- ✅ Session integrity validation
- ✅ Session token validation
- ✅ Session cleanup operations
- ✅ Expiry checks and refresh logic
- ✅ Health check functionality
- ✅ Concurrent operation locking

## Running Tests

### Run All Session Tests
```bash
npm test -- src/__tests__/session
```

### Run Specific Test File
```bash
npm test -- src/__tests__/session/client.sessionStorage.test.ts
npm test -- src/__tests__/session/sessionConfig.test.ts
npm test -- src/__tests__/session/sessionManager.edge-cases.test.ts
```

### Run in Watch Mode
```bash
npm run test:watch -- src/__tests__/session
```

### Generate Coverage Report
```bash
npm run test:coverage -- src/__tests__/session
```

### Run Tests with Specific Pattern
```bash
# Run only OAuth-related tests
npm test -- src/__tests__/session -t "OAuth"

# Run only storage tests
npm test -- src/__tests__/session -t "storage"

# Run only security tests
npm test -- src/__tests__/session -t "security"
```

## Test Coverage Goals

| File | Target Coverage | Current Status |
|------|----------------|----------------|
| `client.ts` (sessionStorage) | 80% | ✅ (New tests) |
| `sessionConfig.ts` | 100% | ✅ (New tests) |
| `sessionManager.ts` | 85% | ✅ (Existing + New) |
| `useAuth.tsx` (session parts) | 70% | ⏳ (Partial) |

## Expected Test Results

### Total Tests
- **client.sessionStorage.test.ts**: ~45 tests
- **sessionConfig.test.ts**: ~35 tests
- **sessionManager.edge-cases.test.ts**: ~40 tests
- **sessionManager.test.ts** (existing): ~30 tests

**Total**: ~150 tests

### Expected Runtime
- Quick tests (< 100ms): ~80%
- Medium tests (100-500ms): ~15%
- Slow tests (> 500ms): ~5% (network simulation, timeouts)

**Average suite runtime**: 3-5 seconds

## Common Issues & Solutions

### Issue: Tests Failing Due to Missing Mocks

**Symptom**: `Cannot find module '@/integrations/supabase/client'`

**Solution**:
```bash
# Ensure vitest config includes path aliases
# Check vite.config.ts has correct resolve.alias
```

### Issue: Storage Mocks Not Working

**Symptom**: `TypeError: Cannot read property 'getItem' of undefined`

**Solution**:
```typescript
// Ensure beforeEach sets up storage properly
beforeEach(() => {
  Object.defineProperty(window, 'sessionStorage', {
    value: mockSessionStorage,
    writable: true,
    configurable: true
  });
});
```

### Issue: Async Tests Timing Out

**Symptom**: `Timeout - Async callback was not invoked within the 5000 ms timeout`

**Solution**:
```typescript
// Increase timeout for specific tests
it('should handle slow operation', async () => {
  // test code
}, 10000); // 10 second timeout
```

### Issue: Mock Functions Not Being Called

**Symptom**: `expect(received).toHaveBeenCalled() Expected number of calls: >= 1 Received number of calls:    0`

**Solution**:
```typescript
// Clear mocks between tests
beforeEach(() => {
  vi.clearAllMocks();
});
```

## Test Patterns Used

### 1. Storage Mocking
```typescript
const createMockStorage = (): Storage => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key) => store[key] || null),
    setItem: vi.fn((key, value) => { store[key] = value; }),
    removeItem: vi.fn((key) => { delete store[key]; }),
    clear: vi.fn(() => { store = {}; }),
    key: vi.fn((index) => Object.keys(store)[index] || null),
    get length() { return Object.keys(store).length; }
  };
};
```

### 2. Async Operation Testing
```typescript
it('should handle async operation', async () => {
  const promise = someAsyncFunction();
  await expect(promise).resolves.toBeTruthy();
});
```

### 3. Error Scenario Testing
```typescript
it('should handle error gracefully', () => {
  const throwingFn = () => { throw new Error('Test error'); };
  expect(throwingFn).toThrow('Test error');
});
```

### 4. Mock Supabase Client
```typescript
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: {
      getSession: vi.fn(),
      refreshSession: vi.fn(),
      setSession: vi.fn(),
    },
  },
  isNetworkError: vi.fn(),
  performSupabaseHealthCheck: vi.fn(),
}));
```

## Debugging Tests

### Enable Verbose Logging
```bash
# Run tests with console output
npm test -- src/__tests__/session --reporter=verbose
```

### Debug Specific Test
```bash
# Use --inspect flag
node --inspect-brk node_modules/.bin/vitest src/__tests__/session/client.sessionStorage.test.ts
```

### View Test Coverage HTML Report
```bash
npm run test:coverage -- src/__tests__/session
# Open coverage/index.html in browser
```

## Best Practices

### ✅ Do
- Clear mocks between tests (`vi.clearAllMocks()`)
- Use descriptive test names
- Test both success and failure paths
- Mock external dependencies (Supabase, storage, network)
- Use `beforeEach`/`afterEach` for setup/teardown
- Test edge cases (null, undefined, empty, large values)

### ❌ Don't
- Rely on test execution order
- Use hardcoded timeouts (use constants)
- Skip error scenarios
- Forget to restore mocks in `afterEach`
- Test implementation details (test behavior)
- Make tests dependent on external services

## Coverage Gaps & Future Tests

### Needs Coverage
1. **useAuth.tsx integration tests**
   - Session initialization on mount
   - Health check interval behavior
   - Welcome email triggering
   - Sign out cleanup

2. **Performance tests**
   - Session cache hit rates
   - Health check throttling effectiveness
   - Memory leak detection

3. **Integration tests**
   - Full OAuth flow end-to-end
   - Multi-tab synchronization
   - Session refresh during page navigation

4. **Load tests**
   - 1000+ concurrent session operations
   - Storage quota limits
   - Memory usage under load

## CI/CD Integration

### GitHub Actions Example
```yaml
- name: Run session tests
  run: npm test -- src/__tests__/session --coverage

- name: Upload coverage
  uses: codecov/codecov-action@v3
  with:
    files: ./coverage/coverage-final.json
    flags: session-tests
```

## Related Documentation

- [Code Review: Session Management](../../CODE_REVIEW_SESSION_MANAGEMENT.md)
- [Session Config](../../src/config/sessionConfig.ts)
- [Session Manager](../../src/utils/sessionManager.ts)
- [Supabase Client](../../src/integrations/supabase/client.ts)
- [Root Testing Guide](../../../../docs/TESTING.md) (if exists)

## Contributing

When adding new session management features:

1. **Write tests first** (TDD approach)
2. **Cover edge cases** (null, undefined, errors)
3. **Mock external dependencies**
4. **Update this README** with new test files
5. **Maintain 80%+ coverage** target

## Questions?

For questions about tests or coverage, contact:
- Code Owner: [Your Name]
- Testing Lead: [Testing Lead]
- Documentation: See [CLAUDE.md](../../CLAUDE.md)
