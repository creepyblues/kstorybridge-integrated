/**
 * Test Utilities
 *
 * Reusable utilities, render helpers, and mock factories for testing.
 * Following patterns established in existing tests (compsNavigatorService.test.ts, TrialContext.test.tsx)
 */

import React, { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { vi } from 'vitest';

// ============================================
// Supabase Mock Factory
// ============================================

/**
 * Creates a chainable mock for Supabase query builder
 * Usage: vi.mock('@/lib/supabase', () => ({ supabase: { from: vi.fn(() => createChainableMock()) } }))
 */
export const createChainableMock = (options?: {
  data?: any;
  error?: any;
  count?: number;
}) => {
  const mock: any = {
    select: vi.fn(() => mock),
    eq: vi.fn(() => mock),
    neq: vi.fn(() => mock),
    gt: vi.fn(() => mock),
    gte: vi.fn(() => mock),
    lt: vi.fn(() => mock),
    lte: vi.fn(() => mock),
    in: vi.fn(() => mock),
    contains: vi.fn(() => mock),
    ilike: vi.fn(() => mock),
    or: vi.fn(() => mock),
    order: vi.fn(() => mock),
    limit: vi.fn(() => mock),
    range: vi.fn(() => mock),
    single: vi.fn(() => Promise.resolve({
      data: options?.data ?? null,
      error: options?.error ?? null
    })),
    maybeSingle: vi.fn(() => Promise.resolve({
      data: options?.data ?? null,
      error: options?.error ?? null
    })),
    insert: vi.fn(() => mock),
    update: vi.fn(() => mock),
    delete: vi.fn(() => mock),
    upsert: vi.fn(() => mock),
    then: (resolve: (value: any) => any) => resolve({
      data: options?.data ?? [],
      error: options?.error ?? null,
      count: options?.count ?? 0,
    }),
  };
  return mock;
};

/**
 * Creates a mock Supabase client for testing
 */
export const createMockSupabaseClient = () => ({
  auth: {
    signUp: vi.fn(),
    signInWithPassword: vi.fn(),
    signInWithOAuth: vi.fn(),
    signOut: vi.fn(),
    getSession: vi.fn(() => Promise.resolve({ data: { session: null }, error: null })),
    getUser: vi.fn(() => Promise.resolve({ data: { user: null }, error: null })),
    onAuthStateChange: vi.fn(() => ({ data: { subscription: { unsubscribe: vi.fn() } } })),
    resetPasswordForEmail: vi.fn(),
    updateUser: vi.fn(),
  },
  from: vi.fn(() => createChainableMock()),
  functions: {
    invoke: vi.fn(),
  },
  rpc: vi.fn(),
});

// ============================================
// Test Fixtures
// ============================================

export const mockUser = {
  id: 'test-user-id-123',
  email: 'test@example.com',
  created_at: '2024-01-01T00:00:00Z',
  app_metadata: {},
  user_metadata: {
    account_type: 'buyer',
    full_name: 'Test User',
  },
  aud: 'authenticated',
};

export const mockBuyerProfile = {
  id: 'profile-123',
  email: 'test@example.com',
  full_name: 'Test User',
  buyer_company: 'Test Company',
  buyer_role: 'Producer',
  tier: 'basic' as const,
  requested: false,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
};

export const mockTitle = {
  title_id: 'title-uuid-123',
  title_name_en: 'Test Title',
  title_name_kr: '테스트 제목',
  synopsis: 'A compelling story about...',
  description_kr: '매력적인 이야기...',
  genre: ['Drama', 'Thriller'],
  tone: 'Dark',
  content_format: 'TV Series',
  story_author: 'Test Author',
  art_author: null,
  views: 1000000,
  likes: 50000,
  rating: 9.5,
  chapters: 100,
  rights: 'Available',
  rights_holder_name: 'Test Rights Holder',
  title_image: 'https://example.com/image.jpg',
  title_url: 'https://example.com/title',
  verified: true,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
};

export const mockTitleMatch = {
  title_id: 'title-uuid-123',
  title_name_en: 'Matched Title',
  title_name_kr: '매치된 제목',
  match_score: 85,
  explanation: 'High similarity in tone and genre',
  synopsis: 'A story about...',
  genre: ['Drama'],
  tone: 'Dark',
  title_image: 'https://example.com/image.jpg',
};

export const mockSearchResult = {
  results: [mockTitleMatch],
  search_id: 'search-123',
  processing_time_ms: 3500,
  cost_estimate: 0.015,
};

// ============================================
// Render Utilities
// ============================================

/**
 * Creates a fresh QueryClient for each test
 */
const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
      },
      mutations: {
        retry: false,
      },
    },
  });

interface WrapperOptions {
  route?: string;
  queryClient?: QueryClient;
}

/**
 * Renders a component with common providers (Router, QueryClient)
 * Use this for most component tests
 */
export function renderWithProviders(
  ui: ReactElement,
  options?: WrapperOptions & Omit<RenderOptions, 'wrapper'>
) {
  const { route = '/', queryClient = createTestQueryClient(), ...renderOptions } = options ?? {};

  // Set initial route
  window.history.pushState({}, 'Test page', route);

  const Wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        {children}
      </BrowserRouter>
    </QueryClientProvider>
  );

  return {
    ...render(ui, { wrapper: Wrapper, ...renderOptions }),
    queryClient,
  };
}

// ============================================
// Async Utilities
// ============================================

/**
 * Wait for a condition to be true
 */
export const waitFor = async (
  condition: () => boolean,
  timeout = 5000,
  interval = 100
): Promise<void> => {
  const startTime = Date.now();
  while (!condition()) {
    if (Date.now() - startTime > timeout) {
      throw new Error('Timeout waiting for condition');
    }
    await new Promise((resolve) => setTimeout(resolve, interval));
  }
};

/**
 * Delay for a specified number of milliseconds
 */
export const delay = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

// ============================================
// Factory Functions
// ============================================

/**
 * Creates a mock title with optional overrides
 */
export const createMockTitle = (overrides?: Partial<typeof mockTitle>) => ({
  ...mockTitle,
  title_id: `title-${Math.random().toString(36).substr(2, 9)}`,
  ...overrides,
});

/**
 * Creates multiple mock titles
 */
export const createMockTitles = (count: number, overrides?: Partial<typeof mockTitle>) =>
  Array.from({ length: count }, (_, i) =>
    createMockTitle({
      title_name_en: `Test Title ${i + 1}`,
      title_name_kr: `테스트 제목 ${i + 1}`,
      ...overrides,
    })
  );

/**
 * Creates a mock buyer profile with optional overrides
 */
export const createMockBuyerProfile = (overrides?: Partial<typeof mockBuyerProfile>) => ({
  ...mockBuyerProfile,
  id: `profile-${Math.random().toString(36).substr(2, 9)}`,
  ...overrides,
});
