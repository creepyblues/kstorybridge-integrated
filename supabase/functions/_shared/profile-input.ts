/**
 * Pure (no Deno / no network) input handling for profile creation.
 * Shared by create-buyer-profile, create-creator-profile, create-oauth-profile.
 * Node-testable: `node --test supabase/functions/_shared/profile-input.test.mjs`.
 *
 * Profile fields arrive either in the request body (OAuth CompleteProfile form)
 * or in the caller's auth user_metadata under `pending_buyer_profile` /
 * `pending_creator_profile` (email signup, created at the first authenticated
 * moment). Metadata is user-editable via updateUser, so BOTH sources are
 * untrusted and revalidated here. Ids and emails never come from either source.
 */

export const BUYER_ROLES = ['producer', 'executive', 'agent', 'content_scout', 'other'] as const;
export const IP_OWNER_ROLES = ['author', 'agent'] as const;
export const PENDING_BUYER_KEY = 'pending_buyer_profile';
export const PENDING_CREATOR_KEY = 'pending_creator_profile';

export type BuyerRole = (typeof BUYER_ROLES)[number];
export type IpOwnerRole = (typeof IP_OWNER_ROLES)[number];

export interface BuyerInput {
  full_name: string;
  buyer_company: string | null;
  buyer_role: BuyerRole | null;
  linkedin_url: string | null;
  newsletter_consent: boolean;
  trial_session_id: string | null;
}

export interface CreatorInput {
  full_name: string;
  pen_name: string;
  ip_owner_role: IpOwnerRole;
  ip_owner_company: string | null;
  website_url: string | null;
  newsletter_consent: boolean;
}

export type Validation<T> = { ok: true; value: T } | { ok: false; errors: string[] };

type Raw = Record<string, unknown>;

const str = (v: unknown): string | null => {
  if (typeof v !== 'string') return null;
  const t = v.replace(/<[^>]*>/g, '').trim();
  return t.length ? t : null;
};
const bool = (v: unknown): boolean => v === true || v === 'true';
const pick = (raw: Raw, ...keys: string[]): unknown => {
  for (const k of keys) if (raw[k] !== undefined && raw[k] !== null) return raw[k];
  return undefined;
};

/** Accept snake_case (dashboard) and camelCase (creator legacy) field names. */
export function normalizeBuyerRaw(raw: Raw): Raw {
  return {
    full_name: pick(raw, 'full_name', 'fullName'),
    buyer_company: pick(raw, 'buyer_company', 'buyerCompany'),
    buyer_role: pick(raw, 'buyer_role', 'buyerRole'),
    linkedin_url: pick(raw, 'linkedin_url', 'linkedinUrl'),
    newsletter_consent: pick(raw, 'newsletter_consent', 'newsletterConsent'),
    trial_session_id: pick(raw, 'trial_session_id', 'trialSessionId'),
  };
}

export function normalizeCreatorRaw(raw: Raw): Raw {
  return {
    full_name: pick(raw, 'full_name', 'fullName'),
    pen_name: pick(raw, 'pen_name', 'penName'),
    ip_owner_role: pick(raw, 'ip_owner_role', 'ipOwnerRole'),
    ip_owner_company: pick(raw, 'ip_owner_company', 'ipOwnerCompany'),
    website_url: pick(raw, 'website_url', 'websiteUrl'),
    newsletter_consent: pick(raw, 'newsletter_consent', 'newsletterConsent'),
  };
}

/** True when the body carries at least one profile field (i.e. a form submission). */
export function hasProfileFields(normalized: Raw): boolean {
  return Object.values(normalized).some((v) => v !== undefined);
}

function urlOrNull(v: unknown, field: string, errors: string[]): string | null {
  const s = str(v);
  if (!s) return null;
  if (s.length > 500) { errors.push(`${field} too long`); return null; }
  try {
    const u = new URL(s.startsWith('http') ? s : `https://${s}`);
    if (!/^https?:$/.test(u.protocol)) throw new Error('protocol');
    return u.toString();
  } catch {
    errors.push(`${field} is not a valid URL`);
    return null;
  }
}

export function validateBuyerInput(raw: Raw): Validation<BuyerInput> {
  const n = normalizeBuyerRaw(raw);
  const errors: string[] = [];
  const full_name = str(n.full_name);
  if (!full_name) errors.push('full_name is required');
  else if (full_name.length > 100) errors.push('full_name too long');

  const buyer_company = str(n.buyer_company);
  if (buyer_company && buyer_company.length > 200) errors.push('buyer_company too long');

  const roleRaw = str(n.buyer_role);
  const buyer_role = roleRaw ? (BUYER_ROLES.includes(roleRaw as BuyerRole) ? (roleRaw as BuyerRole) : null) : null;
  if (roleRaw && !buyer_role) errors.push('buyer_role is invalid');

  const linkedin_url = urlOrNull(n.linkedin_url, 'linkedin_url', errors);

  const trialRaw = str(n.trial_session_id);
  const trial_session_id = trialRaw && /^[A-Za-z0-9_-]{1,200}$/.test(trialRaw) ? trialRaw : null;
  if (trialRaw && !trial_session_id) errors.push('trial_session_id is invalid');

  if (errors.length) return { ok: false, errors };
  return {
    ok: true,
    value: { full_name: full_name!, buyer_company, buyer_role, linkedin_url, newsletter_consent: bool(n.newsletter_consent), trial_session_id },
  };
}

export function validateCreatorInput(raw: Raw): Validation<CreatorInput> {
  const n = normalizeCreatorRaw(raw);
  const errors: string[] = [];
  const full_name = str(n.full_name);
  if (!full_name) errors.push('full_name is required');
  else if (full_name.length > 100) errors.push('full_name too long');

  const pen_name = str(n.pen_name);
  if (!pen_name) errors.push('pen_name is required');
  else if (pen_name.length > 100) errors.push('pen_name too long');

  const roleRaw = str(n.ip_owner_role);
  const ip_owner_role = roleRaw && IP_OWNER_ROLES.includes(roleRaw as IpOwnerRole) ? (roleRaw as IpOwnerRole) : null;
  if (!ip_owner_role) errors.push('ip_owner_role must be author or agent');

  const ip_owner_company = str(n.ip_owner_company);
  if (ip_owner_company && ip_owner_company.length > 200) errors.push('ip_owner_company too long');

  const website_url = urlOrNull(n.website_url, 'website_url', errors);

  if (errors.length) return { ok: false, errors };
  return {
    ok: true,
    value: { full_name: full_name!, pen_name: pen_name!, ip_owner_role: ip_owner_role!, ip_owner_company, website_url, newsletter_consent: bool(n.newsletter_consent) },
  };
}

/**
 * Choose the input source: an explicit form body wins; otherwise the pending
 * namespace in user_metadata. Returns null when neither has profile fields.
 */
export function resolveProfileSource(
  body: Raw | null | undefined,
  userMetadata: Raw | null | undefined,
  pendingKey: string,
  normalize: (raw: Raw) => Raw,
): { source: 'body' | 'metadata'; raw: Raw } | null {
  if (body && hasProfileFields(normalize(body))) return { source: 'body', raw: body };
  const pending = userMetadata?.[pendingKey];
  if (pending && typeof pending === 'object' && hasProfileFields(normalize(pending as Raw))) {
    return { source: 'metadata', raw: pending as Raw };
  }
  return null;
}

/**
 * Postgres 23505 on one of these tables: only the EMAIL unique constraint is an
 * "email owned by another id" conflict. Any other unique violation is a plain error.
 * Constraint names are implicit (`<table>_email_key`) plus the Gate 2 index
 * `<table>_email_lower_key`; Postgres puts the name in `message`/`details`.
 */
export function classifyInsertError(
  error: { code?: string; message?: string; details?: string } | null | undefined,
  table: 'user_buyers' | 'user_creators',
): 'email_conflict' | 'other' | null {
  if (!error) return null;
  if (error.code !== '23505') return 'other';
  const text = `${error.message ?? ''} ${error.details ?? ''}`;
  return new RegExp(`${table}_email(_lower)?_key|\\(email\\)|\\(lower\\(email`).test(text) ? 'email_conflict' : 'other';
}
