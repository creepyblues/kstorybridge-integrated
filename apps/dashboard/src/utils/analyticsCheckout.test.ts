import { afterEach, describe, expect, it, vi } from 'vitest';
import { trackCheckoutStarted } from './analytics';

describe('buyer checkout analytics contract', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('emits the canonical outcome with only controlled checkout metadata', () => {
    const log = vi.spyOn(console, 'log').mockImplementation(() => undefined);

    trackCheckoutStarted('suite', 'monthly');

    expect(log).toHaveBeenCalledWith('[Analytics] checkout_started', {
      account_type: 'buyer',
      plan_type: 'suite',
      billing_period: 'monthly',
      app_section: 'dashboard',
    });
    const params = log.mock.calls[0][1] as Record<string, unknown>;
    expect(params).not.toHaveProperty('user_id');
    expect(params).not.toHaveProperty('email');
    expect(params).not.toHaveProperty('session_id');
    expect(params).not.toHaveProperty('value');
  });
});
