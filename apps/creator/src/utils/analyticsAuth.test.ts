import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  trackCreatorProfileCompleted,
  trackSignin,
  trackSignup,
} from './analytics';

describe('creator auth analytics contract', () => {
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
      account_type: 'creator',
      app_section: 'creator',
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
      account_type: 'creator',
      app_section: 'creator',
    }));
  });

  it('uses the shared creator profile completion event', () => {
    const log = vi.spyOn(console, 'log').mockImplementation(() => undefined);

    trackCreatorProfileCompleted();

    expect(log).toHaveBeenCalledWith(
      '[Analytics] creator_profile_completed',
      expect.objectContaining({ account_type: 'creator', app_section: 'creator' })
    );
  });
});
