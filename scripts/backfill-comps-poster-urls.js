/**
 * Backfill missing poster_url on titles.comps_analysis entries.
 *
 * For each comp where imdb_id is set but poster_url is missing/empty, fetch
 * the poster via OMDB Detail (?i=) and patch it in place. Other fields are
 * left untouched.
 *
 * Why Detail and not Search: OMDB Search occasionally returns Poster: 'N/A'
 * for titles that DO have a valid poster; the Detail endpoint resolves them
 * reliably. See supabase/functions/comps-generator/index.ts:omdbFetchPoster.
 *
 * Required env:
 *   SUPABASE_URL              - e.g. https://dlrnrgcoguxlkkcitlpd.supabase.co
 *   SUPABASE_SERVICE_ROLE_KEY - service-role key (bypasses RLS for UPDATE)
 *   OMDB_API_KEY              - same key used by the comps-generator function
 *
 * Usage:
 *   node scripts/backfill-comps-poster-urls.js              # dry-run, prints plan
 *   node scripts/backfill-comps-poster-urls.js --apply      # writes updates
 *   node scripts/backfill-comps-poster-urls.js --slug=lily-house --apply
 */

import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const OMDB_API_KEY = process.env.OMDB_API_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !OMDB_API_KEY) {
  console.error(
    "Missing required env. Need SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, OMDB_API_KEY."
  );
  process.exit(1);
}

const args = process.argv.slice(2);
const APPLY = args.includes("--apply");
const SLUG_ARG = args.find((a) => a.startsWith("--slug="))?.split("=")[1];
const DELAY_MS = 100; // be polite to OMDB free tier

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function fetchOmdbPoster(imdbId) {
  const url = `https://www.omdbapi.com/?apikey=${OMDB_API_KEY}&i=${encodeURIComponent(imdbId)}`;
  const res = await fetch(url);
  if (!res.ok) return { ok: false, reason: `http_${res.status}` };
  const data = await res.json();
  if (data.Response !== "True") return { ok: false, reason: data.Error || "unknown" };
  if (!data.Poster || data.Poster === "N/A") return { ok: false, reason: "no_poster" };
  return { ok: true, poster: data.Poster };
}

function needsBackfill(comp) {
  return !!comp?.imdb_id && (!comp.poster_url || comp.poster_url === "N/A");
}

async function loadTitles() {
  let query = supabase
    .from("titles")
    .select("title_id, slug, comps_analysis")
    .not("comps_analysis", "is", null);
  if (SLUG_ARG) query = query.eq("slug", SLUG_ARG);

  const { data, error } = await query;
  if (error) throw new Error(`Supabase select failed: ${error.message}`);
  return data || [];
}

async function main() {
  console.log(
    `[backfill] mode=${APPLY ? "APPLY" : "DRY-RUN"}${SLUG_ARG ? ` slug=${SLUG_ARG}` : ""}`
  );

  const titles = await loadTitles();
  console.log(`[backfill] scanning ${titles.length} title(s)`);

  let totalNeedsFix = 0;
  let totalPatched = 0;
  let totalOmdbMisses = 0;
  let titlesUpdated = 0;

  for (const title of titles) {
    const analysis = Array.isArray(title.comps_analysis) ? title.comps_analysis : [];
    const targets = analysis
      .map((comp, idx) => ({ comp, idx }))
      .filter(({ comp }) => needsBackfill(comp));

    if (targets.length === 0) continue;

    totalNeedsFix += targets.length;
    console.log(
      `\n[backfill] ${title.slug} (${title.title_id}) — ${targets.length} comp(s) need poster_url`
    );

    const patched = [...analysis];
    let titleHadAnyPatch = false;

    for (const { comp, idx } of targets) {
      const result = await fetchOmdbPoster(comp.imdb_id);
      if (result.ok) {
        patched[idx] = { ...comp, poster_url: result.poster };
        totalPatched++;
        titleHadAnyPatch = true;
        console.log(`  ✓ ${comp.comp_title} → ${result.poster.slice(0, 80)}…`);
      } else {
        totalOmdbMisses++;
        console.log(`  ✗ ${comp.comp_title} (imdb=${comp.imdb_id}) — ${result.reason}`);
      }
      await sleep(DELAY_MS);
    }

    if (APPLY && titleHadAnyPatch) {
      const { error } = await supabase
        .from("titles")
        .update({ comps_analysis: patched })
        .eq("title_id", title.title_id);
      if (error) {
        console.error(`  !! UPDATE failed for ${title.slug}: ${error.message}`);
      } else {
        titlesUpdated++;
      }
    }
  }

  console.log(`\n[backfill] summary`);
  console.log(`  comps needing fix : ${totalNeedsFix}`);
  console.log(`  posters fetched   : ${totalPatched}`);
  console.log(`  OMDB misses       : ${totalOmdbMisses}`);
  console.log(`  titles updated    : ${APPLY ? titlesUpdated : `0 (dry-run; rerun with --apply)`}`);
}

main().catch((err) => {
  console.error("[backfill] fatal:", err);
  process.exit(1);
});
