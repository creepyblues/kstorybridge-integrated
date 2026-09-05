#!/usr/bin/env node
/**
 * Snapshot critical tables to JSON before a migration (service role, read-only).
 *
 *   node scripts/backup-critical-tables.mjs user_buyers user_creators
 *
 * Writes backups/<UTC timestamp>/<table>.json (gitignored). Requires
 * SUPABASE_SERVICE_ROLE_KEY in repo-root .env.local (or env).
 */
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'node:fs';
import path from 'node:path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || 'https://dlrnrgcoguxlkkcitlpd.supabase.co';
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const tables = process.argv.slice(2);
if (!KEY || tables.length === 0) {
  console.error('usage: SUPABASE_SERVICE_ROLE_KEY=… node scripts/backup-critical-tables.mjs <table> [table…]');
  process.exit(1);
}

const admin = createClient(URL, KEY, { auth: { persistSession: false, autoRefreshToken: false } });
const stamp = new Date().toISOString().replace(/[:.]/g, '-');
const dir = path.resolve(process.cwd(), 'backups', stamp);
fs.mkdirSync(dir, { recursive: true });

for (const table of tables) {
  const rows = [];
  for (let from = 0; ; from += 1000) {
    const { data, error } = await admin.from(table).select('*').range(from, from + 999);
    if (error) { console.error(`${table}: ${error.message}`); process.exit(1); }
    rows.push(...data);
    if (data.length < 1000) break;
  }
  const file = path.join(dir, `${table}.json`);
  fs.writeFileSync(file, JSON.stringify(rows, null, 2));
  console.log(`${table}: ${rows.length} rows -> ${path.relative(process.cwd(), file)}`);
}
