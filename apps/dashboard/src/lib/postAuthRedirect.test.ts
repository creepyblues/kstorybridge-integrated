import { describe, it, expect, beforeEach } from 'vitest';
import {
  resolvePostAuthRedirect,
  consumePostAuthRedirect,
  isSafeRedirectPath,
  REDIRECT_KEY,
} from './postAuthRedirect';

describe('resolvePostAuthRedirect', () => {
  it('prefers the in-tab session value', () => {
    expect(resolvePostAuthRedirect('/buyers/titles/a', '/buyers/titles/b')).toBe('/buyers/titles/a');
  });

  it('falls back to user metadata when the tab has no stash (email link in new tab)', () => {
    expect(resolvePostAuthRedirect(null, '/buyers/titles/the-odd-one-next-door')).toBe(
      '/buyers/titles/the-odd-one-next-door',
    );
  });

  it('falls back to home when neither is present', () => {
    expect(resolvePostAuthRedirect(null, undefined)).toBe('/buyers/home');
    expect(resolvePostAuthRedirect(null, null, '/buyers/home?first_run=1')).toBe('/buyers/home?first_run=1');
  });

  it('rejects anything that is not an internal buyer path', () => {
    expect(isSafeRedirectPath('https://evil.example/buyers/x')).toBe(false);
    expect(isSafeRedirectPath('//evil.example')).toBe(false);
    expect(isSafeRedirectPath('/admin/titles')).toBe(false);
    expect(isSafeRedirectPath(42)).toBe(false);
    expect(resolvePostAuthRedirect('https://evil.example', '/admin/x')).toBe('/buyers/home');
  });
});

describe('consumePostAuthRedirect', () => {
  beforeEach(() => sessionStorage.clear());

  it('reads then clears the session copy', () => {
    sessionStorage.setItem(REDIRECT_KEY, '/buyers/titles/x');
    expect(consumePostAuthRedirect(undefined)).toBe('/buyers/titles/x');
    expect(sessionStorage.getItem(REDIRECT_KEY)).toBeNull();
  });

  it('uses metadata when the session is empty', () => {
    expect(consumePostAuthRedirect('/buyers/titles/y')).toBe('/buyers/titles/y');
  });
});
