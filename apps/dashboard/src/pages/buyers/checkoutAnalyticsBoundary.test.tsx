import { StrictMode } from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import Checkout from './Checkout';
import CheckoutSuccess from './CheckoutSuccess';

const mocks = vi.hoisted(() => ({
  invoke: vi.fn(),
  redirectToCheckout: vi.fn(),
  toast: vi.fn(),
  trackCheckout: vi.fn(),
  trackCheckoutAbandoned: vi.fn(),
  trackCheckoutStarted: vi.fn(),
  refetch: vi.fn(),
  user: { id: 'buyer-1', email: 'buyer@example.com' },
}));

vi.mock('@stripe/stripe-js', () => ({
  loadStripe: () => Promise.resolve({ redirectToCheckout: mocks.redirectToCheckout }),
}));
vi.mock('@/hooks/useAuth', () => ({ useAuth: () => ({ user: mocks.user }) }));
vi.mock('@/hooks/use-toast', () => ({ useToast: () => ({ toast: mocks.toast }) }));
vi.mock('@/contexts/TierContext', () => ({ useTierAccess: () => ({ refetch: mocks.refetch }) }));
vi.mock('@/lib/supabase', () => ({
  supabase: { functions: { invoke: mocks.invoke } },
}));
vi.mock('@/utils/analytics', () => ({
  trackCheckout: mocks.trackCheckout,
  trackCheckoutAbandoned: mocks.trackCheckoutAbandoned,
  trackCheckoutStarted: mocks.trackCheckoutStarted,
}));

const renderCheckout = (path = '/buyers/checkout?tier=pro') => render(
  <StrictMode>
    <MemoryRouter initialEntries={[path]}>
      <Checkout />
    </MemoryRouter>
  </StrictMode>
);

describe('buyer checkout analytics boundary', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.redirectToCheckout.mockResolvedValue({ error: null });
  });

  it('emits once only after the server returns a usable Checkout session', async () => {
    mocks.invoke.mockResolvedValue({ data: { sessionId: 'cs_test_1' }, error: null });

    renderCheckout();

    await waitFor(() => expect(mocks.redirectToCheckout).toHaveBeenCalledWith({ sessionId: 'cs_test_1' }));
    expect(mocks.invoke).toHaveBeenCalledTimes(1);
    expect(mocks.trackCheckoutStarted).toHaveBeenCalledTimes(1);
    expect(mocks.trackCheckoutStarted).toHaveBeenCalledWith('pro', 'monthly');
  });

  it('emits no started outcome when session creation fails', async () => {
    mocks.invoke.mockResolvedValue({ data: null, error: { message: 'request failed' } });

    renderCheckout();

    await screen.findByText('Checkout Error');
    expect(mocks.trackCheckoutStarted).not.toHaveBeenCalled();
    expect(mocks.trackCheckout).toHaveBeenCalledWith('error', 'pro', {
      failure_reason: 'session_creation_failed',
    });
  });

  it('emits no started outcome when required checkout context is missing', async () => {
    renderCheckout('/buyers/checkout');

    await screen.findByText('Checkout Error');
    expect(mocks.invoke).not.toHaveBeenCalled();
    expect(mocks.trackCheckoutStarted).not.toHaveBeenCalled();
  });

  it('does not claim purchase or subscription success from the return page', async () => {
    render(
      <MemoryRouter initialEntries={['/buyers/checkout/success?session_id=cs_test_1']}>
        <CheckoutSuccess />
      </MemoryRouter>
    );

    await waitFor(() => expect(mocks.refetch).toHaveBeenCalledTimes(1));
    expect(mocks.trackCheckout).not.toHaveBeenCalled();
    expect(mocks.trackCheckoutStarted).not.toHaveBeenCalled();
  });
});
