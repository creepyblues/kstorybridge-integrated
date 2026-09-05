/**
 * Authenticated profile creation for user_buyers / user_creators (Gate 2).
 *
 * Security model:
 * - The caller's identity (id, email) comes ONLY from a verified user JWT in the
 *   Authorization header. Body ids/emails are ignored. Anonymous callers (anon key
 *   or no token) are rejected unless ALLOW_ANON_PROFILE_CREATE=true, a temporary
 *   rollout switch for clients that still create profiles at signup time.
 * - Profile fields come from the body (OAuth CompleteProfile form) or from the
 *   caller's user_metadata `pending_*_profile` namespace (email signup); both are
 *   revalidated (see profile-input.ts). After a successful insert only that
 *   pending key is cleared — never full_name / avatar / provider metadata.
 *
 * Outcomes (authenticated callers):
 *   200 { success:true,  status:'created', profile }
 *   200 { success:true,  status:'exists',  profile }            same id already has a row
 *   409 { success:false, code:'EMAIL_CONFLICT' }               another id owns this email
 *   400 { success:false, code:'INVALID_INPUT', errors }        revalidation failed
 *   400 { success:false, code:'NO_PROFILE_DATA' }              nothing in body or metadata
 *   401 { success:false, code:'AUTH_REQUIRED' }
 */
import { createClient, type SupabaseClient, type User } from 'https://esm.sh/@supabase/supabase-js@2';
import {
  type BuyerInput,
  type CreatorInput,
  classifyInsertError,
  normalizeBuyerRaw,
  normalizeCreatorRaw,
  PENDING_BUYER_KEY,
  PENDING_CREATOR_KEY,
  resolveProfileSource,
  validateBuyerInput,
  validateCreatorInput,
} from './profile-input.ts';

export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

export function json(status: number, body: Record<string, unknown>): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

export class ProfileError extends Error {
  constructor(public status: number, public code: string, message?: string, public extra: Record<string, unknown> = {}) {
    super(message ?? code);
  }
  toResponse(): Response {
    return json(this.status, { success: false, code: this.code, error: this.message, ...this.extra });
  }
}

export function adminClient(): SupabaseClient {
  return createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '', {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

export interface Caller {
  user: Pick<User, 'id' | 'email' | 'user_metadata'>;
  /** true only in the temporary anon rollout mode (identity taken from body) */
  legacyAnon: boolean;
}

/**
 * Resolve the caller from the JWT. Rejects anonymous callers unless the rollout
 * switch is on, in which case identity falls back to body.user_id / body.email
 * (the pre-Gate-2 contract) and no metadata is read or cleared.
 */
export async function requireCaller(req: Request, admin: SupabaseClient, body: Record<string, unknown>): Promise<Caller> {
  const token = (req.headers.get('Authorization') ?? '').replace(/^Bearer\s+/i, '').trim();
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
  const isAnon = !token || token === anonKey;

  if (!isAnon) {
    const { data, error } = await admin.auth.getUser(token);
    if (error || !data.user?.email) throw new ProfileError(401, 'AUTH_REQUIRED', 'Invalid or expired token');
    return { user: data.user, legacyAnon: false };
  }

  if ((Deno.env.get('ALLOW_ANON_PROFILE_CREATE') ?? '').toLowerCase() === 'true') {
    const id = typeof body.user_id === 'string' ? body.user_id : typeof body.userId === 'string' ? body.userId : null;
    const email = typeof body.email === 'string' ? body.email : null;
    if (!id || !email) throw new ProfileError(400, 'INVALID_INPUT', 'user_id and email are required', { errors: ['user_id/email missing'] });
    console.warn('[profile-create] legacy anonymous call accepted (ALLOW_ANON_PROFILE_CREATE=true)', { id });
    return { user: { id, email, user_metadata: {} }, legacyAnon: true };
  }

  throw new ProfileError(401, 'AUTH_REQUIRED', 'Sign in before creating a profile');
}

async function clearPending(admin: SupabaseClient, caller: Caller, key: string): Promise<void> {
  if (caller.legacyAnon) return;
  const meta = (caller.user.user_metadata ?? {}) as Record<string, unknown>;
  if (meta[key] === undefined || meta[key] === null) return;
  // Admin update merges user_metadata; setting the namespace key to null clears
  // only that key. Stable/provider keys (full_name, avatar_url, picture…) untouched.
  const { error } = await admin.auth.admin.updateUserById(caller.user.id, { user_metadata: { [key]: null } });
  if (error) console.warn('[profile-create] failed to clear pending metadata', key, error.message);
}

/** A row for this email under a different id? */
async function emailOwnedByOther(admin: SupabaseClient, table: string, email: string, id: string): Promise<boolean> {
  const { data, error } = await admin.from(table).select('id').ilike('email', email).neq('id', id).limit(1);
  if (error) {
    console.error('[profile-create] email pre-check failed', table, error.message);
    return false; // fall through to the insert; the unique index is the backstop
  }
  return (data?.length ?? 0) > 0;
}

export async function createBuyerProfile(admin: SupabaseClient, caller: Caller, body: Record<string, unknown>) {
  const id = caller.user.id;
  const email = caller.user.email!.toLowerCase();

  const { data: existing } = await admin.from('user_buyers').select('*').eq('id', id).maybeSingle();
  if (existing) {
    await clearPending(admin, caller, PENDING_BUYER_KEY);
    return json(200, { success: true, status: 'exists', message: 'Buyer profile already exists', profile: existing });
  }

  const source = resolveProfileSource(body, caller.user.user_metadata as Record<string, unknown>, PENDING_BUYER_KEY, normalizeBuyerRaw);
  if (!source) throw new ProfileError(400, 'NO_PROFILE_DATA', 'No profile fields in request or pending metadata');
  const v = validateBuyerInput(source.raw);
  if (v.ok === false) throw new ProfileError(400, 'INVALID_INPUT', 'Profile data failed validation', { errors: v.errors });
  const input: BuyerInput = v.value;

  if (await emailOwnedByOther(admin, 'user_buyers', email, id)) {
    console.error('[profile-create] EMAIL_CONFLICT user_buyers', { id, email });
    throw new ProfileError(409, 'EMAIL_CONFLICT', 'This email is already attached to a different account');
  }

  const trialLinked = await linkTrialSession(admin, input.trial_session_id, id, email);

  const { data: profile, error } = await admin
    .from('user_buyers')
    .insert({
      id,
      email,
      full_name: input.full_name,
      buyer_company: input.buyer_company,
      buyer_role: input.buyer_role,
      linkedin_url: input.linkedin_url,
      tier: 'basic',
      newsletter_consent: input.newsletter_consent,
      newsletter_consented_at: input.newsletter_consent ? new Date().toISOString() : null,
      trial_session_id: trialLinked ? input.trial_session_id : null,
      came_from_trial: trialLinked,
    })
    .select()
    .single();

  if (error) {
    const kind = classifyInsertError(error, 'user_buyers');
    if (kind === 'email_conflict') {
      console.error('[profile-create] EMAIL_CONFLICT (index) user_buyers', { id, email });
      throw new ProfileError(409, 'EMAIL_CONFLICT', 'This email is already attached to a different account');
    }
    console.error('[profile-create] insert failed user_buyers', error);
    throw new ProfileError(500, 'INSERT_FAILED', 'Could not create buyer profile');
  }

  await clearPending(admin, caller, PENDING_BUYER_KEY);
  return json(200, { success: true, status: 'created', profile, trialLinked, source: source.source });
}

export async function createCreatorProfile(admin: SupabaseClient, caller: Caller, body: Record<string, unknown>) {
  const id = caller.user.id;
  const email = caller.user.email!.toLowerCase();

  const { data: existing } = await admin.from('user_creators').select('*').eq('id', id).maybeSingle();
  if (existing) {
    await clearPending(admin, caller, PENDING_CREATOR_KEY);
    return json(200, { success: true, status: 'exists', message: 'Creator profile already exists', profile: existing });
  }

  const source = resolveProfileSource(body, caller.user.user_metadata as Record<string, unknown>, PENDING_CREATOR_KEY, normalizeCreatorRaw);
  if (!source) throw new ProfileError(400, 'NO_PROFILE_DATA', 'No profile fields in request or pending metadata');
  const v = validateCreatorInput(source.raw);
  if (v.ok === false) throw new ProfileError(400, 'INVALID_INPUT', 'Profile data failed validation', { errors: v.errors });
  const input: CreatorInput = v.value;

  if (await emailOwnedByOther(admin, 'user_creators', email, id)) {
    console.error('[profile-create] EMAIL_CONFLICT user_creators', { id, email });
    throw new ProfileError(409, 'EMAIL_CONFLICT', 'This email is already attached to a different account');
  }

  const { data: profile, error } = await admin
    .from('user_creators')
    .insert({
      id,
      email,
      full_name: input.full_name,
      pen_name: input.pen_name,
      ip_owner_role: input.ip_owner_role,
      ip_owner_company: input.ip_owner_company,
      website_url: input.website_url,
      newsletter_consent: input.newsletter_consent,
      newsletter_consented_at: input.newsletter_consent ? new Date().toISOString() : null,
    })
    .select()
    .single();

  if (error) {
    const kind = classifyInsertError(error, 'user_creators');
    if (kind === 'email_conflict') {
      console.error('[profile-create] EMAIL_CONFLICT (index) user_creators', { id, email });
      throw new ProfileError(409, 'EMAIL_CONFLICT', 'This email is already attached to a different account');
    }
    console.error('[profile-create] insert failed user_creators', error);
    throw new ProfileError(500, 'INSERT_FAILED', 'Could not create creator profile');
  }

  await clearPending(admin, caller, PENDING_CREATOR_KEY);
  return json(200, { success: true, status: 'created', profile, source: source.source });
}

/**
 * trial_session_id is client-generated attribution, not an entitlement. Link only
 * when the referenced row exists and is not already converted; otherwise ignore.
 */
async function linkTrialSession(admin: SupabaseClient, trialSessionId: string | null, userId: string, email: string): Promise<boolean> {
  if (!trialSessionId) return false;
  const { data: row, error } = await admin.from('trial_sessions').select('session_id, converted').eq('session_id', trialSessionId).maybeSingle();
  if (error || !row) {
    console.warn('[profile-create] trial_session_id ignored: not found', { trialSessionId });
    return false;
  }
  if (row.converted) {
    console.warn('[profile-create] trial_session_id ignored: already converted', { trialSessionId });
    return false;
  }
  const { error: updErr } = await admin
    .from('trial_sessions')
    .update({ converted: true, converted_at: new Date().toISOString(), user_id: userId, user_email: email })
    .eq('session_id', trialSessionId)
    .eq('converted', false);
  if (updErr) {
    console.warn('[profile-create] trial link failed', updErr.message);
    return false;
  }
  return true;
}

/** Common request wrapper for the three functions. */
export function serveProfileFunction(
  handler: (admin: SupabaseClient, caller: Caller, body: Record<string, unknown>) => Promise<Response>,
) {
  return async (req: Request): Promise<Response> => {
    if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
    if (req.method !== 'POST') return json(405, { success: false, code: 'METHOD_NOT_ALLOWED' });
    try {
      const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
      const admin = adminClient();
      const caller = await requireCaller(req, admin, body);
      return await handler(admin, caller, body);
    } catch (err) {
      if (err instanceof ProfileError) return err.toResponse();
      console.error('[profile-create] unexpected error', err);
      return json(500, { success: false, code: 'INTERNAL', error: 'Unexpected error' });
    }
  };
}
