import { afterEach, describe, expect, it, vi } from 'vitest';
import { trackCheckoutStart } from './analytics';

describe('creator checkout analytics contract', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('emits the canonical outcome without title, creator, or Stripe identifiers', () => {
    const log = vi.spyOn(console, 'log').mockImplementation(() => undefined);

    trackCheckoutStart('premium', 'monthly');

    expect(log).toHaveBeenCalledWith('[Analytics] checkout_started', {
      account_type: 'creator',
      plan_type: 'premium',
      billing_period: 'monthly',
      app_section: 'creator',
    });
    const params = log.mock.calls[0][1] as Record<string, unknown>;
    expect(params).not.toHaveProperty('title_id');
    expect(params).not.toHaveProperty('creator_email');
    expect(params).not.toHaveProperty('session_id');
    expect(params).not.toHaveProperty('value');
  });
});
