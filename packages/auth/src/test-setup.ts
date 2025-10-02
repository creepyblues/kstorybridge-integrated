import { vi } from 'vitest';

// Set up test environment variables
process.env.VITE_SUPABASE_URL = 'https://test.supabase.co';
process.env.VITE_SUPABASE_ANON_KEY = 'test-anon-key-1234567890';
process.env.SITE_URL = 'https://test.example.com';

// Mock console.error to reduce noise in tests
const originalConsoleError = console.error;
console.error = vi.fn((...args) => {
  // Only suppress auth configuration errors during tests
  if (args[0]?.includes?.('Auth Configuration Error')) {
    return;
  }
  originalConsoleError(...args);
});

// Clean up after tests
afterEach(() => {
  vi.clearAllMocks();
});