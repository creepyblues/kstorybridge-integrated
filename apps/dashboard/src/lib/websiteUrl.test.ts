import { describe, it, expect } from 'vitest';
import { normalizeWebsiteUrl, DEFAULT_WEBSITE_URL } from './websiteUrl';

describe('normalizeWebsiteUrl', () => {
  it('falls back to the default when unset', () => {
    expect(normalizeWebsiteUrl(undefined)).toBe(DEFAULT_WEBSITE_URL);
    expect(normalizeWebsiteUrl('')).toBe(DEFAULT_WEBSITE_URL);
    expect(normalizeWebsiteUrl('   ')).toBe(DEFAULT_WEBSITE_URL);
  });

  it('prepends https:// when the protocol is missing', () => {
    expect(normalizeWebsiteUrl('kstorybridge.com')).toBe('https://kstorybridge.com');
  });

  it('keeps an explicit protocol and strips trailing slashes', () => {
    expect(normalizeWebsiteUrl('https://staging.kstorybridge.com/')).toBe('https://staging.kstorybridge.com');
    expect(normalizeWebsiteUrl('http://localhost:5173')).toBe('http://localhost:5173');
  });
});
