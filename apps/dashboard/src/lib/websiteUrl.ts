/**
 * Marketing website origin, normalized so a misconfigured env value
 * (e.g. "kstorybridge.com" without a protocol) can never turn into a
 * relative link like "/titles/kstorybridge.com".
 */
export const DEFAULT_WEBSITE_URL = 'https://kstorybridge.com';

export function normalizeWebsiteUrl(raw: string | undefined | null): string {
  const value = (raw ?? '').trim();
  if (!value) return DEFAULT_WEBSITE_URL;
  const withProtocol = /^https?:\/\//i.test(value) ? value : `https://${value}`;
  return withProtocol.replace(/\/+$/, '');
}

export const WEBSITE_URL = normalizeWebsiteUrl(import.meta.env.VITE_WEBSITE_URL);
