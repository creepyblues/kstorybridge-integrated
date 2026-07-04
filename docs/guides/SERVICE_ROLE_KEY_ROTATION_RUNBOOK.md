# Service Role Key Rotation — Step-by-Step Runbook

**Goal:** invalidate the leaked `service_role` key (committed to git) without breaking anything, using the reversible new-API-keys path.

**Why:** the old `service_role` JWT bypasses all database security and is sitting in git history. Rotating is the only thing that actually neutralizes it. This guide is written so every step is verifiable and the one irreversible-feeling step is last and undoable.

**Time:** ~45–60 min. Do it in a low-traffic window.

---

## Mental model (read once)

Only three things touch keys:

1. **Your 3 websites** (marketing, dashboard, creator) → use the **anon / publishable** key. Public by design; already in the browser.
2. **Edge functions + your 4 scripts** → use the **secret / service_role** key. *This is the one that leaked.*
3. **Logged-in users** → have sessions (unaffected by this path — no forced logout).

The catch: the leaked secret key and the public anon key are "twins" signed by one underlying secret, so you can't disable the leaked one without also retiring the anon key. That's why the frontends also need the new publishable key. It's just swapping one value per app.

**Your safety net:** the health check. Run it after every step.
```bash
bash scripts/rotation-healthcheck.sh
```
All green = safe to continue. Any red = stop, undo the step you just did, re-run until green.

---

## Phase 0 — Baseline (5 min, no changes)

1. Confirm you can run the check and everything is currently green:
   ```bash
   bash scripts/rotation-healthcheck.sh
   ```
   Expected: `8 passed, 0 failed — all green`. This is your "known good" state.
2. Have a password manager / secure note open to paste the new keys into (never commit them).
3. Know where your env vars live:
   - **Local:** repo root `.env.local` (has `SUPABASE_SERVICE_ROLE_KEY`), and `apps/{dashboard,creator,website}/.env.local` / `.env.production` (have `VITE_SUPABASE_ANON_KEY`).
   - **Vercel:** ~5 projects (dashboard prod + staging, creator prod + staging, website). Env vars under each project → **Settings → Environment Variables**.

✅ Checkpoint: baseline is all green.

---

## Phase 1 — Create the new keys (5 min, additive, zero risk)

Nothing breaks here — you're only *creating* keys, not using them yet.

1. Supabase Dashboard → **Settings → API Keys**.
2. Create a **Publishable key** → copy it (`sb_publishable_…`) into your secure note.
3. Create a **Secret key** → copy it (`sb_secret_…`) into your secure note.
4. Leave the **legacy** keys enabled for now.

Verify nothing changed:
```bash
bash scripts/rotation-healthcheck.sh      # still uses the OLD anon key
```
✅ Checkpoint: still all green (you haven't switched anything yet).

Also test that the **new publishable key works** before you rely on it:
```bash
SUPABASE_KEY=sb_publishable_YOURKEYHERE bash scripts/rotation-healthcheck.sh
```
✅ Checkpoint: the `public_titles` and `PII blocked` lines are green with the new key. If red, the key was copied wrong — recopy.

---

## Phase 2 — Migrate the SECRET key (backend) (15 min)

The old secret key still works throughout this phase, so mistakes are harmless.

### 2a. Local scripts
1. In your shell, set the new secret key:
   ```bash
   export SUPABASE_SERVICE_ROLE_KEY='sb_secret_YOURKEYHERE'
   ```
   Also update the value in repo-root `.env.local`.
2. Test a script that uses it (read-only diagnostics):
   ```bash
   node scripts/diagnose-asset.js
   ```
   ✅ Checkpoint: it connects and runs (no auth error). The scripts now refuse to run without this env var — that's intended.

### 2b. Edge functions
Edge functions receive their service-role key automatically from the Supabase platform — you do **not** paste it into code. When legacy keys are disabled in Phase 4, the platform serves the new secret. You don't change anything here now; you *verify* in Phase 4 and can roll back if needed.

Run the check to confirm nothing regressed:
```bash
bash scripts/rotation-healthcheck.sh
```
✅ Checkpoint: all green.

---

## Phase 3 — Migrate the PUBLISHABLE key (frontends) (15 min)

Swap the public key in each app. The old anon key still works until Phase 4, so you can do these one at a time and test each.

⚠️ **The key lives in BOTH Vercel env vars AND hardcoded in source files** — the source copies are easy to miss and will break the app on legacy-shutdown if not swapped. All hardcoded source copies have already been swapped to the publishable key on branch `fix/p0-anon-title-exposure` (they still need to be committed + deployed).

| App | Vercel env var | Hardcoded source copies (already swapped on branch) |
|---|---|---|
| **Website** | none (source only) | `src/integrations/supabase/client.ts`, `src/utils/slack.ts`, `src/utils/slackNotifications.ts` |
| **Dashboard** | `VITE_SUPABASE_ANON_KEY` (prod + staging) | `src/services/directApiService.ts`, `src/utils/slack.ts` |
| **Creator** | `VITE_SUPABASE_ANON_KEY` (prod + staging) | `src/utils/slack.ts` |

So each app needs **both**: the code changes deployed *and* (dashboard/creator) the Vercel env var updated. Old and new keys both work until Phase 4, so order within this phase doesn't matter — just get all of them done before Phase 4.

### 3a. Website (source file, not Vercel)
1. In `apps/website/src/integrations/supabase/client.ts`, replace the value of `SUPABASE_PUBLISHABLE_KEY` with the new **publishable** key (`sb_publishable_…`). (The file says "automatically generated" — editing it directly is fine here; the generator isn't running.)
2. Commit and deploy the website (push to `main`, or trigger a Vercel redeploy of the website project).
3. When live, run `bash scripts/rotation-healthcheck.sh` and open kstorybridge.com to confirm it loads.

### 3b. Dashboard & Creator (Vercel env)
For **each** of the 4 projects (dashboard prod, dashboard staging, creator prod, creator staging):
1. Project → **Settings → Environment Variables** → edit `VITE_SUPABASE_ANON_KEY` → paste the new **publishable** key → save.
   - If a project doesn't have that variable, that app isn't reading from Vercel — check its `src/lib/supabase.ts` to see where it reads from, and tell me.
2. **Redeploy** that project (Deployments → latest → Redeploy) — Vite bakes the key in at build time, so a redeploy is required.
3. When it finishes, run `bash scripts/rotation-healthcheck.sh`, then open that site and confirm **sign-in works** with a test account.

### 3c. Local dev
Update `VITE_SUPABASE_ANON_KEY` in `apps/dashboard/.env.local` and `apps/creator/.env.local` so local dev matches. (The website's local value is the hardcoded one you just edited.)

✅ Checkpoint after all apps: all green **and** you've logged into dashboard + creator successfully in a browser.

---

## Phase 4 — Disable the legacy keys (THE KILL) (5 min, reversible)

This is the step that actually invalidates the leaked key. Everything already runs on the new keys, so this should be a no-op — but it's fully reversible if not.

1. Supabase Dashboard → **Settings → API Keys** → **disable legacy keys**.
2. Immediately run:
   ```bash
   bash scripts/rotation-healthcheck.sh
   ```
3. Read the result:
   - **All green** → 🎉 done, proceed to Phase 5.
   - **Any red** (most likely an edge-function line) → **re-enable legacy keys** (same screen, one toggle). Within a minute you're back to all-green and nothing is broken. Then tell me which line went red and we fix that surface before retrying.

✅ Checkpoint: all green with legacy keys disabled. (If you had to roll back, that's fine — you're safe, just not done yet.)

---

## Phase 5 — Confirm the leaked key is dead + clean up (5 min)

1. Prove the OLD `service_role` key no longer works. Paste the old key (from git history) into `OLD`:
   ```bash
   OLD='eyJ...oldServiceRoleKey...'
   curl -s -o /dev/null -w "%{http_code}\n" \
     "https://dlrnrgcoguxlkkcitlpd.supabase.co/rest/v1/user_buyers?select=email&limit=1" \
     -H "apikey: $OLD" -H "Authorization: Bearer $OLD"
   ```
   ✅ Expect **401** (it was 200 with full PII access before). That confirms the leak is neutralized.
2. Commit the four scripts that no longer contain the hardcoded key (already prepared on branch `fix/p0-anon-title-exposure`):
   `dangerous-scripts/fix-vector-search.js`, `scripts/create-storage-bucket.js`, `scripts/diagnose-asset.js`, `scripts/make-bucket-public.js`.
3. **History purge (optional but recommended):** the old key is still in git history. Since it's now rotated and dead, this is cleanup, not urgent. When ready, do a `git filter-repo` pass to remove it (and the PII CSVs) from history — separate task, coordinate first.

---

## If you get stuck / rollback summary

| Situation | Undo |
|---|---|
| Something red in Phase 1–3 | The old keys still work; just fix the value you swapped and re-run the check. |
| Red after disabling legacy (Phase 4) | Re-enable legacy keys (one toggle). Instantly back to working. |
| A site won't load after redeploy | Its `VITE_SUPABASE_ANON_KEY` is wrong or it wasn't redeployed — re-check the env var and redeploy. |
| Sign-in broken on a site | Same as above — publishable key mismatch on that project. |

**Golden rule:** never move to the next phase until `bash scripts/rotation-healthcheck.sh` is all green. If in doubt, stop — nothing is lost, and the old keys stay working until Phase 4.

---

## Not covered here (separate tasks)

- **P0-3 anon catalog exposure** — the migration + website code on branch `fix/p0-anon-title-exposure` is a *separate* deploy (RLS/grant issue, not a key issue). Do it after rotation, on its own, using the same health check.
- **Git history purge** of the old key + PII CSVs — Phase 5 step 3.
