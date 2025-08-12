import React, { ReactElement } from 'react';
import { render, RenderOptions, RenderResult } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';

// Mock Supabase client for testing
export const mockSupabaseClient = {
  auth: {
    getSession: jest.fn(),
    onAuthStateChange: jest.fn(),
    signOut: jest.fn(),
    signInWithPassword: jest.fn(),
    signUp: jest.fn(),
  },
  from: jest.fn(() => ({
    select: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    single: jest.fn(),
    then: jest.fn(),
  })),
};

interface TestProvidersProps {
  children: React.ReactNode;
  queryClient?: QueryClient;
  initialRoute?: string;
}

// Test providers wrapper that includes common providers
export function TestProviders({
  children,
  queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
      },
      mutations: {
        retry: false,
      },
    },
  }),
  initialRoute = '/',
}: TestProvidersProps) {
  // Set initial route if specified
  if (initialRoute !== '/') {
    window.history.pushState({}, 'Test page', initialRoute);
  }

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        {children}
      </BrowserRouter>
    </QueryClientProvider>
  );
}

interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  queryClient?: QueryClient;
  initialRoute?: string;
  wrapper?: React.ComponentType<any>;
}

// Custom render function that includes providers
export function renderWithProviders(
  ui: ReactElement,
  options: CustomRenderOptions = {}
): RenderResult {
  const {
    queryClient,
    initialRoute,
    wrapper: Wrapper,
    ...renderOptions
  } = options;

  const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
    const content = (
      <TestProviders queryClient={queryClient} initialRoute={initialRoute}>
        {children}
      </TestProviders>
    );

    return Wrapper ? <Wrapper>{content}</Wrapper> : content;
  };

  return render(ui, { wrapper: AllTheProviders, ...renderOptions });
}

// Create a mock user session for testing
export function createMockUser(overrides: any = {}) {
  return {
    id: 'test-user-id',
    email: 'test@example.com',
    user_metadata: {
      account_type: 'buyer',
      ...overrides.user_metadata,
    },
    app_metadata: {},
    aud: 'authenticated',
    created_at: '2023-01-01T00:00:00.000Z',
    ...overrides,
  };
}

// Create a mock profile for testing
export function createMockProfile(overrides: any = {}) {
  return {
    id: 'test-profile-id',
    user_id: 'test-user-id',
    account_type: 'buyer',
    created_at: '2023-01-01T00:00:00.000Z',
    updated_at: '2023-01-01T00:00:00.000Z',
    ...overrides,
  };
}

// Mock handlers for common API responses
export const createMockQueryResponse = (data: any, isLoading = false, error = null) => ({
  data,
  isLoading,
  error,
  isError: !!error,
  isSuccess: !error && !isLoading,
  refetch: jest.fn(),
});

// Wait for component to stabilize (useful for async components)
export const waitForStabilization = () =>
  new Promise(resolve => setTimeout(resolve, 0));

// Helper to mock React Query mutations
export const createMockMutation = (options: any = {}) => ({
  mutate: jest.fn(),
  mutateAsync: jest.fn(),
  isLoading: false,
  isError: false,
  isSuccess: false,
  error: null,
  data: null,
  reset: jest.fn(),
  ...options,
});

// Re-export everything from React Testing Library
export * from '@testing-library/react';
export { default as userEvent } from '@testing-library/user-event';