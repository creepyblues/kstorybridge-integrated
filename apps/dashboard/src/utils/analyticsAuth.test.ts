import { afterEach, describe, expect, it, vi } from 'vitest';
import { trackSignin, trackSignup } from './analytics';

describe('buyer auth analytics contract', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it.each([
    ['viewed', 'signup_viewed'],
    ['attempted', 'signup_attempted'],
    ['completed', 'signup_completed'],
    ['failed', 'signup_failed'],
  ] as const)('emits %s as its own signup event', (stage, eventName) => {
    const log = vi.spyOn(console, 'log').mockImplementation(() => undefined);

    trackSignup(stage, 'email');

    expect(log).toHaveBeenCalledWith(`[Analytics] ${eventName}`, expect.objectContaining({
      method: 'email',
      account_type: 'buyer',
      app_section: 'dashboard',
    }));
  });

  it.each([
    ['viewed', 'signin_viewed'],
    ['attempted', 'signin_attempted'],
    ['completed', 'signin_completed'],
    ['failed', 'signin_failed'],
  ] as const)('emits %s as its own signin event', (stage, eventName) => {
    const log = vi.spyOn(console, 'log').mockImplementation(() => undefined);

    trackSignin(stage, 'google');

    expect(log).toHaveBeenCalledWith(`[Analytics] ${eventName}`, expect.objectContaining({
      method: 'google',
      account_type: 'buyer',
      app_section: 'dashboard',
    }));
  });

  it('sends only an allowlisted failure reason', () => {
    const log = vi.spyOn(console, 'log').mockImplementation(() => undefined);

    trackSignup('failed', 'email', { failure_reason: 'auth_rejected' });

    expect(log).toHaveBeenCalledWith('[Analytics] signup_failed', expect.objectContaining({
      failure_reason: 'auth_rejected',
    }));
  });
});
