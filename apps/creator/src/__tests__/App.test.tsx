import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import App from '../App';

// Mock all page components
vi.mock('../pages/CreatorHome', () => ({
  default: () => <div>Creator Home Page</div>
}));

vi.mock('../pages/TitleList', () => ({
  default: () => <div>Title List Page</div>
}));

vi.mock('../pages/CreatorAddTitlePage', () => ({
  default: () => <div>Add Title Page</div>
}));

vi.mock('../pages/CreatorEditTitlePage', () => ({
  default: () => <div>Edit Title Page</div>
}));

vi.mock('../pages/CreatorTitleDetailNew', () => ({
  default: () => <div>Title Detail Page</div>
}));

vi.mock('../pages/MyRequests', () => ({
  default: () => <div>My Requests Page</div>
}));

vi.mock('../pages/Profile', () => ({
  default: () => <div>Profile Page</div>
}));

vi.mock('../pages/News', () => ({
  default: () => <div>News Page</div>
}));

vi.mock('../pages/SendMessage', () => ({
  default: () => <div>Send Message Page</div>
}));

vi.mock('../pages/NotFound', () => ({
  default: () => <div>404 Not Found</div>
}));

vi.mock('../pages/CreatorSigninPage', () => ({
  default: () => <div>Creator Signin Page</div>
}));

vi.mock('../pages/CreatorSignupPage', () => ({
  default: () => <div>Creator Signup Page</div>
}));

vi.mock('../pages/ForgotPasswordPage', () => ({
  default: () => <div>Forgot Password Page</div>
}));

vi.mock('../pages/AuthCallbackSimple', () => ({
  default: () => <div>Auth Callback Page</div>
}));

vi.mock('../pages/Docs', () => ({
  default: () => <div>Docs Page</div>
}));

vi.mock('../pages/DatabaseSchema', () => ({
  default: () => <div>Database Schema Page</div>
}));

vi.mock('../pages/DocumentViewer', () => ({
  default: () => <div>Document Viewer Page</div>
}));

vi.mock('../pages/ux/UXDashboard', () => ({
  default: () => <div>UX Dashboard Page</div>
}));

vi.mock('../pages/ux/UserJourneyPage', () => ({
  default: () => <div>User Journey Page</div>
}));

vi.mock('../pages/ux/MessagingPage', () => ({
  default: () => <div>Messaging Page</div>
}));

// Mock layout components
vi.mock('../components/CreatorProtectedLayout', () => ({
  CreatorProtectedLayout: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="creator-protected-layout">{children}</div>
  )
}));

vi.mock('../components/DocsProtectedLayout', () => ({
  DocsProtectedLayout: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="docs-protected-layout">{children}</div>
  )
}));

vi.mock('../components/ProtectedRoute', () => ({
  ProtectedRoute: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="protected-route">{children}</div>
  )
}));

// Mock other components
vi.mock('../components/ErrorBoundary', () => ({
  ErrorBoundary: ({ children }: { children: React.ReactNode }) => <>{children}</>
}));

vi.mock('../components/AnalyticsProvider', () => ({
  AnalyticsProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>
}));

// Mock hooks
vi.mock('../hooks/useAuth', () => ({
  AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  useAuth: () => ({ user: null, loading: false })
}));

// Mock contexts
vi.mock('../contexts/DataCacheContext', () => ({
  DataCacheProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>
}));

vi.mock('../contexts/OnboardingContext', () => ({
  OnboardingProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>
}));

// Mock UI components
vi.mock('@kstorybridge/ui', () => ({
  Toaster: () => null,
  TooltipProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>
}));

// Mock TanStack Query
vi.mock('@tanstack/react-query', () => ({
  QueryClient: vi.fn(() => ({})),
  QueryClientProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>
}));

// Mock React Router to use MemoryRouter
const mockNavigate = vi.fn();
const mockLocation = { pathname: '/home' };

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    BrowserRouter: ({ children }: { children: React.ReactNode }) => {
      const { MemoryRouter } = actual as any;
      const initialEntries = (global as any).__testRoute ? [(global as any).__testRoute] : ['/'];
      return <MemoryRouter initialEntries={initialEntries}>{children}</MemoryRouter>;
    },
    useNavigate: () => mockNavigate,
    useLocation: () => mockLocation
  };
});

// Mock debug utilities
vi.mock('../utils/debugGA', () => ({}));
vi.mock('../utils/testSearchTracking', () => ({}));

describe('Creator App Routes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockNavigate.mockClear();
    delete (global as any).__testRoute;
  });

  describe('Authentication Routes (Creator-only)', () => {
    it('should render creator signin page at /signin', async () => {
      (global as any).__testRoute = '/signin';
      render(<App />);

      await waitFor(() => {
        expect(screen.getByText('Creator Signin Page')).toBeInTheDocument();
      });
    });

    it('should render creator signup page at /signup', async () => {
      (global as any).__testRoute = '/signup';
      render(<App />);

      await waitFor(() => {
        expect(screen.getByText('Creator Signup Page')).toBeInTheDocument();
      });
    });

    it('should redirect /signin/creator to /signin (backwards compatibility)', async () => {
      (global as any).__testRoute = '/signin/creator';
      render(<App />);

      await waitFor(() => {
        // After redirect, should show Creator Signin Page
        expect(screen.getByText('Creator Signin Page')).toBeInTheDocument();
      });
    });

    it('should redirect /signup/creator to /signup (backwards compatibility)', async () => {
      (global as any).__testRoute = '/signup/creator';
      render(<App />);

      await waitFor(() => {
        // After redirect, should show Creator Signup Page
        expect(screen.getByText('Creator Signup Page')).toBeInTheDocument();
      });
    });

    it('should render forgot password page at /forgot-password', async () => {
      render(
        <MemoryRouter initialEntries={['/forgot-password']}>
          <App />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('Forgot Password Page')).toBeInTheDocument();
      });
    });

    it('should render auth callback page at /auth/callback', async () => {
      render(
        <MemoryRouter initialEntries={['/auth/callback']}>
          <App />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('Auth Callback Page')).toBeInTheDocument();
      });
    });
  });

  describe('Creator Routes (Protected, Clean URLs)', () => {
    it('should render home page at /home (not /creators/home)', async () => {
      render(
        <MemoryRouter initialEntries={['/home']}>
          <App />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('Creator Home Page')).toBeInTheDocument();
        expect(screen.getByTestId('creator-protected-layout')).toBeInTheDocument();
      });
    });

    it('should render titles page at /titles (not /creators/titles)', async () => {
      render(
        <MemoryRouter initialEntries={['/titles']}>
          <App />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('Title List Page')).toBeInTheDocument();
        expect(screen.getByTestId('creator-protected-layout')).toBeInTheDocument();
      });
    });

    it('should render add title page at /titles/add', async () => {
      render(
        <MemoryRouter initialEntries={['/titles/add']}>
          <App />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('Add Title Page')).toBeInTheDocument();
        expect(screen.getByTestId('creator-protected-layout')).toBeInTheDocument();
      });
    });

    it('should render edit title page at /titles/:titleId/edit', async () => {
      render(
        <MemoryRouter initialEntries={['/titles/123/edit']}>
          <App />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('Edit Title Page')).toBeInTheDocument();
        expect(screen.getByTestId('creator-protected-layout')).toBeInTheDocument();
      });
    });

    it('should render title detail page at /titles/:titleId', async () => {
      render(
        <MemoryRouter initialEntries={['/titles/123']}>
          <App />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('Title Detail Page')).toBeInTheDocument();
        expect(screen.getByTestId('creator-protected-layout')).toBeInTheDocument();
      });
    });

    it('should render requests page at /requests', async () => {
      render(
        <MemoryRouter initialEntries={['/requests']}>
          <App />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('My Requests Page')).toBeInTheDocument();
        expect(screen.getByTestId('creator-protected-layout')).toBeInTheDocument();
      });
    });

    it('should render profile page at /profile', async () => {
      render(
        <MemoryRouter initialEntries={['/profile']}>
          <App />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('Profile Page')).toBeInTheDocument();
        expect(screen.getByTestId('creator-protected-layout')).toBeInTheDocument();
      });
    });

    it('should render news page at /news', async () => {
      render(
        <MemoryRouter initialEntries={['/news']}>
          <App />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('News Page')).toBeInTheDocument();
        expect(screen.getByTestId('creator-protected-layout')).toBeInTheDocument();
      });
    });

    it('should render send message page at /send-message', async () => {
      render(
        <MemoryRouter initialEntries={['/send-message']}>
          <App />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('Send Message Page')).toBeInTheDocument();
        expect(screen.getByTestId('creator-protected-layout')).toBeInTheDocument();
      });
    });
  });

  describe('Buyer-Specific Routes (Should Not Exist)', () => {
    it('should NOT have /chat route', async () => {
      render(
        <MemoryRouter initialEntries={['/chat']}>
          <App />
        </MemoryRouter>
      );

      await waitFor(() => {
        // Should show 404, not Chat page
        expect(screen.getByText('404 Not Found')).toBeInTheDocument();
      });
    });

    it('should NOT have /buyers/* routes', async () => {
      render(
        <MemoryRouter initialEntries={['/buyers/chat']}>
          <App />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('404 Not Found')).toBeInTheDocument();
      });
    });

    it('should NOT have /buyers/titles route', async () => {
      render(
        <MemoryRouter initialEntries={['/buyers/titles']}>
          <App />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('404 Not Found')).toBeInTheDocument();
      });
    });
  });

  describe('Documentation Routes', () => {
    it('should render docs page at /docs', async () => {
      render(
        <MemoryRouter initialEntries={['/docs']}>
          <App />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('Docs Page')).toBeInTheDocument();
        expect(screen.getByTestId('docs-protected-layout')).toBeInTheDocument();
      });
    });

    it('should render database schema at /docs/schema', async () => {
      render(
        <MemoryRouter initialEntries={['/docs/schema']}>
          <App />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('Database Schema Page')).toBeInTheDocument();
        expect(screen.getByTestId('docs-protected-layout')).toBeInTheDocument();
      });
    });

    it('should render document viewer at /docs/view/:filename', async () => {
      render(
        <MemoryRouter initialEntries={['/docs/view/test.md']}>
          <App />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('Document Viewer Page')).toBeInTheDocument();
        expect(screen.getByTestId('docs-protected-layout')).toBeInTheDocument();
      });
    });
  });

  describe('Root Redirect', () => {
    it('should redirect root (/) to /home', async () => {
      render(
        <MemoryRouter initialEntries={['/']}>
          <App />
        </MemoryRouter>
      );

      await waitFor(() => {
        // After redirect, should show home page
        expect(screen.getByText('Creator Home Page')).toBeInTheDocument();
      });
    });
  });

  describe('404 Not Found', () => {
    it('should render 404 for unknown routes', async () => {
      render(
        <MemoryRouter initialEntries={['/unknown-route']}>
          <App />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('404 Not Found')).toBeInTheDocument();
        expect(screen.getByTestId('protected-route')).toBeInTheDocument();
      });
    });
  });
});
