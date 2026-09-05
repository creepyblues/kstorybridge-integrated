#!/usr/bin/env node
/**
 * Auth / profile consistency audit (read-only, service role).
 *
 * Reports:
 *   1. auth users sharing an email across different ids (case-insensitive)
 *   2. auth users with no profile in user_buyers or user_creators
 *   3. users holding BOTH a buyer and a creator profile (dual-role, expected to be legal)
 *   4. profile rows whose email is not lowercase, and lower(email) collisions per table
 *   5. profile rows whose email has no matching auth user (orphaned profiles)
 *   6. profile rows whose id does not match the auth user with the same email (id/email drift)
 *
 * Usage (from repo root):  node scripts/audit-auth-profiles.mjs [--json]
 * Requires SUPABASE_SERVICE_ROLE_KEY in repo-root .env.local (or env).
 */
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'node:path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || 'https://dlrnrgcoguxlkkcitlpd.supabase.co';
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!KEY) {
  console.error('SUPABASE_SERVICE_ROLE_KEY not set');
  process.exit(1);
}
const asJson = process.argv.includes('--json');
const admin = createClient(URL, KEY, { auth: { persistSession: false, autoRefreshToken: false } });

async function allAuthUsers() {
  const users = [];
  for (let page = 1; ; page++) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 1000 });
    if (error) throw error;
    users.push(...data.users);
    if (data.users.length < 1000) break;
  }
  return users;
}

async function allRows(table) {
  const rows = [];
  for (let from = 0; ; from += 1000) {
    const { data, error } = await admin.from(table).select('id, email, created_at').range(from, from + 999);
    if (error) throw error;
    rows.push(...data);
    if (data.length < 1000) break;
  }
  return rows;
}

const lower = (s) => (s || '').toLowerCase();
const redact = (email) => {
  const [local, domain] = (email || '').split('@');
  return `${local.slice(0, 2)}***@${domain || ''}`;
};

const [authUsers, buyers, creators] = await Promise.all([allAuthUsers(), allRows('user_buyers'), allRows('user_creators')]);

// 1. auth email shared across ids
const byEmail = new Map();
for (const u of authUsers) {
  const k = lower(u.email);
  if (!k) continue;
  byEmail.set(k, [...(byEmail.get(k) || []), u]);
}
const sharedAuthEmails = [...byEmail.entries()]
  .filter(([, us]) => us.length > 1)
  .map(([email, us]) => ({ email, ids: us.map((u) => u.id), providers: us.map((u) => u.app_metadata?.provider) }));

// 2. auth users with no profile
const buyerIds = new Set(buyers.map((b) => b.id));
const creatorIds = new Set(creators.map((c) => c.id));
const buyerEmails = new Set(buyers.map((b) => lower(b.email)));
const creatorEmails = new Set(creators.map((c) => lower(c.email)));
const noProfile = authUsers.filter(
  (u) => !buyerIds.has(u.id) && !creatorIds.has(u.id) && !buyerEmails.has(lower(u.email)) && !creatorEmails.has(lower(u.email)),
);

// 3. dual-role
const dualRole = authUsers.filter((u) => (buyerIds.has(u.id) || buyerEmails.has(lower(u.email))) && (creatorIds.has(u.id) || creatorEmails.has(lower(u.email))));

// 4. case issues
const caseReport = (rows) => {
  const notLower = rows.filter((r) => r.email && r.email !== r.email.toLowerCase());
  const groups = new Map();
  for (const r of rows) groups.set(lower(r.email), [...(groups.get(lower(r.email)) || []), r]);
  const collisions = [...groups.entries()].filter(([, rs]) => rs.length > 1).map(([email, rs]) => ({ email, ids: rs.map((r) => r.id) }));
  return { notLower, collisions };
};
const buyerCase = caseReport(buyers);
const creatorCase = caseReport(creators);

// 5. orphaned profiles (no auth user by id or email)
const authIds = new Set(authUsers.map((u) => u.id));
const authEmails = new Set(authUsers.map((u) => lower(u.email)));
const orphanBuyers = buyers.filter((b) => !authIds.has(b.id) && !authEmails.has(lower(b.email)));
const orphanCreators = creators.filter((c) => !authIds.has(c.id) && !authEmails.has(lower(c.email)));

// 6. id/email drift: profile email matches an auth user, but profile.id is a different id
const authIdByEmail = new Map(authUsers.map((u) => [lower(u.email), u.id]));
const drift = (rows, table) =>
  rows
    .filter((r) => authIdByEmail.has(lower(r.email)) && authIdByEmail.get(lower(r.email)) !== r.id)
    .map((r) => ({ table, profileId: r.id, authId: authIdByEmail.get(lower(r.email)), email: r.email }));
const idDrift = [...drift(buyers, 'user_buyers'), ...drift(creators, 'user_creators')];

const report = {
  counts: { authUsers: authUsers.length, buyers: buyers.length, creators: creators.length },
  sharedAuthEmails,
  authUsersWithoutProfile: noProfile.map((u) => ({ id: u.id, email: u.email, provider: u.app_metadata?.provider, created: u.created_at, confirmed: !!u.email_confirmed_at })),
  dualRole: dualRole.map((u) => ({ id: u.id, email: u.email })),
  emailCase: {
    user_buyers: { notLowercase: buyerCase.notLower.map((r) => ({ id: r.id, email: r.email })), lowerCollisions: buyerCase.collisions },
    user_creators: { notLowercase: creatorCase.notLower.map((r) => ({ id: r.id, email: r.email })), lowerCollisions: creatorCase.collisions },
  },
  orphanedProfiles: { user_buyers: orphanBuyers.map((r) => ({ id: r.id, email: r.email })), user_creators: orphanCreators.map((r) => ({ id: r.id, email: r.email })) },
  idEmailDrift: idDrift,
};

if (asJson) {
  console.log(JSON.stringify(report, null, 2));
} else {
  const n = (a) => a.length;
  console.log(`auth users: ${report.counts.authUsers} | user_buyers: ${report.counts.buyers} | user_creators: ${report.counts.creators}`);
  console.log(`1. auth emails shared across ids: ${n(sharedAuthEmails)}`);
  for (const s of sharedAuthEmails) console.log(`   ${redact(s.email)} -> ${s.ids.length} ids (${s.providers.join(', ')})`);
  console.log(`2. auth users with NO profile: ${n(noProfile)}`);
  for (const u of report.authUsersWithoutProfile) console.log(`   ${redact(u.email)} provider=${u.provider} confirmed=${u.confirmed} created=${u.created.slice(0, 10)}`);
  console.log(`3. dual-role (buyer + creator): ${n(dualRole)}`);
  for (const u of report.dualRole) console.log(`   ${redact(u.email)}`);
  console.log(`4. email case — user_buyers: ${n(buyerCase.notLower)} not lowercase, ${n(buyerCase.collisions)} lower() collisions; user_creators: ${n(creatorCase.notLower)} not lowercase, ${n(creatorCase.collisions)} collisions`);
  for (const r of [...buyerCase.notLower, ...creatorCase.notLower]) console.log(`   not lowercase: ${redact(r.email)} (${r.email !== r.email.toLowerCase() ? 'has uppercase' : ''})`);
  for (const c of [...buyerCase.collisions, ...creatorCase.collisions]) console.log(`   collision: ${redact(c.email)} -> ${c.ids.length} rows`);
  console.log(`5. orphaned profiles (no auth user): user_buyers ${n(orphanBuyers)}, user_creators ${n(orphanCreators)}`);
  for (const r of [...orphanBuyers, ...orphanCreators]) console.log(`   ${redact(r.email)} id=${r.id}`);
  console.log(`6. id/email drift (profile.id ≠ auth id for same email): ${n(idDrift)}`);
  for (const d of idDrift) console.log(`   ${d.table} ${redact(d.email)} profile=${d.profileId} auth=${d.authId}`);
}
