/**
 * Service-role helpers for E2E tests that create real accounts.
 *
 * Reads SUPABASE_SERVICE_ROLE_KEY from the repo-root .env.local (or the
 * environment). Test emails use @kstorybridge-test.com, which analytics
 * already treats as internal (see _shared/weekly-activity-digest).
 */
import path from 'node:path';
import dotenv from 'dotenv';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

dotenv.config({ path: path.resolve(process.cwd(), '../../.env.local') });
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://dlrnrgcoguxlkkcitlpd.supabase.co';
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

export const TEST_PASSWORD = 'E2eTest!2026';
export const TEST_EMAIL_DOMAIN = 'kstorybridge-test.com';

export function testEmail(tag: string): string {
  return `e2e.${tag}.${Date.now()}@${TEST_EMAIL_DOMAIN}`;
}

export function adminClient(): SupabaseClient {
  if (!SERVICE_KEY) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY not set (expected in repo-root .env.local)');
  }
  return createClient(SUPABASE_URL, SERVICE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

const BUYER_METADATA = { account_type: 'buyer', full_name: 'E2E Buyer' };

/**
 * Create a confirmed auth user directly (bypassing the app's create-buyer-profile
 * edge function). The DB trigger handle_new_user_routing creates the user_buyers
 * row from metadata, so this is the state a user is in if the edge function failed.
 */
export async function createOrphanAuthUser(email: string, password = TEST_PASSWORD): Promise<string> {
  const admin = adminClient();
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: BUYER_METADATA,
  });
  if (error || !data.user) throw error ?? new Error('createUser returned no user');
  return data.user.id;
}

/** A fully set-up, confirmed basic-tier buyer — the "returning user". */
export async function createConfirmedBuyer(email: string, password = TEST_PASSWORD): Promise<string> {
  const id = await createOrphanAuthUser(email, password);
  const admin = adminClient();
  await admin
    .from('user_buyers')
    .upsert(
      { email: email.toLowerCase(), full_name: 'E2E Buyer', buyer_company: 'E2E Studios', buyer_role: 'producer', tier: 'basic' },
      { onConflict: 'email' },
    );
  return id;
}

/**
 * Emulate the verification email: returns the action link Supabase would have
 * emailed for a password signup, targeting `redirectTo` (the app's /auth/callback).
 */
export async function generateSignupConfirmLink(email: string, password: string, redirectTo: string): Promise<string> {
  const admin = adminClient();
  const { data, error } = await admin.auth.admin.generateLink({
    type: 'signup',
    email,
    password,
    options: { redirectTo },
  });
  if (error || !data.properties?.action_link) throw error ?? new Error('generateLink returned no action_link');
  return data.properties.action_link;
}

export async function getBuyerProfile(email: string) {
  const admin = adminClient();
  const { data } = await admin
    .from('user_buyers')
    .select('email, tier, full_name')
    .eq('email', email.toLowerCase())
    .maybeSingle();
  return data;
}

/**
 * Remove everything a test signup leaves behind. Safe to call when nothing exists.
 * Only ever touches @kstorybridge-test.com addresses.
 */
export async function deleteTestUser(email: string): Promise<void> {
  const lower = email.toLowerCase();
  if (!lower.endsWith(`@${TEST_EMAIL_DOMAIN}`)) {
    throw new Error(`Refusing to delete non-test account: ${email}`);
  }
  const admin = adminClient();
  await admin.from('user_buyers').delete().eq('email', lower);
  const { data } = await admin.auth.admin.listUsers({ perPage: 1000 });
  const user = data?.users?.find((u: { email?: string }) => u.email?.toLowerCase() === lower);
  if (user) await admin.auth.admin.deleteUser(user.id);
}
