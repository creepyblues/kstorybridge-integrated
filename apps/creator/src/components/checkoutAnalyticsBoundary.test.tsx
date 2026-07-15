import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CheckoutModal } from './CheckoutModal';
import PaymentSuccess from '@/pages/PaymentSuccess';

const mocks = vi.hoisted(() => ({
  getTitlesByCreator: vi.fn(),
  getSession: vi.fn(),
  trackCheckoutStart: vi.fn(),
  trackPaymentSuccess: vi.fn(),
  redirectToCheckout: vi.fn(),
  user: { id: 'creator-1', email: 'creator@example.com' },
}));

vi.mock('@/hooks/useAuth', () => ({ useAuth: () => ({ user: mocks.user }) }));
vi.mock('@/services/titlesService', () => ({
  titlesService: { getTitlesByCreator: mocks.getTitlesByCreator },
}));
vi.mock('@/lib/supabase', () => ({
  supabase: { auth: { getSession: mocks.getSession } },
}));
vi.mock('@/utils/analytics', () => ({
  trackCheckoutStart: mocks.trackCheckoutStart,
  trackPaymentSuccess: mocks.trackPaymentSuccess,
}));
vi.mock('react-i18next', () => ({ useTranslation: () => ({ t: (key: string) => key }) }));
vi.mock('@/components/layout/MainLayout', () => ({
  MainLayout: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

describe('creator checkout analytics boundary', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getTitlesByCreator.mockResolvedValue([{
      title_id: 'title-1',
      title_name_en: 'Sample title',
      title_name_kr: null,
      title_image: null,
      genre: [],
    }]);
    mocks.getSession.mockResolvedValue({ data: { session: { access_token: 'token' } } });
  });

  it('emits once only after the server returns a checkout URL', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({ url: 'https://checkout.stripe.com/c/pay/test' }),
    }));
    render(
      <CheckoutModal
        isOpen
        onClose={vi.fn()}
        planType="premium"
        billingPeriod="monthly"
        redirectToCheckout={mocks.redirectToCheckout}
      />
    );
    const button = await screen.findByRole('button', { name: 'Proceed to Checkout' });

    fireEvent.click(button);

    await waitFor(() => expect(mocks.trackCheckoutStart).toHaveBeenCalledTimes(1));
    expect(mocks.trackCheckoutStart).toHaveBeenCalledWith('premium', 'monthly');
    expect(mocks.redirectToCheckout).toHaveBeenCalledWith('https://checkout.stripe.com/c/pay/test');
  });

  it('emits no started outcome when the server rejects checkout', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false,
      json: vi.fn().mockResolvedValue({ error: 'checkout rejected' }),
    }));
    render(<CheckoutModal isOpen onClose={vi.fn()} planType="packaging" billingPeriod="monthly" />);
    const button = await screen.findByRole('button', { name: 'Proceed to Checkout' });

    fireEvent.click(button);

    await screen.findByText('checkout rejected');
    expect(mocks.trackCheckoutStart).not.toHaveBeenCalled();
  });

  it('emits no started outcome when a successful response has no URL', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({}),
    }));
    render(<CheckoutModal isOpen onClose={vi.fn()} planType="premium" billingPeriod="monthly" />);
    const button = await screen.findByRole('button', { name: 'Proceed to Checkout' });

    fireEvent.click(button);

    await screen.findByText('No checkout URL returned');
    expect(mocks.trackCheckoutStart).not.toHaveBeenCalled();
  });

  it('does not claim payment or subscription success from the return page', async () => {
    vi.useFakeTimers();
    render(
      <MemoryRouter initialEntries={['/payment/success?session_id=cs_test_1']}>
        <PaymentSuccess />
      </MemoryRouter>
    );

    await act(async () => {
      await vi.advanceTimersByTimeAsync(2000);
    });
    expect(mocks.trackPaymentSuccess).not.toHaveBeenCalled();
    expect(mocks.trackCheckoutStart).not.toHaveBeenCalled();
    vi.useRealTimers();
  });
});
