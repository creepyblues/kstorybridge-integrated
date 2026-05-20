/**
 * Backfill AI scores on admin-added (manual) comps.
 *
 * Admin-added comps were saved with overall_match_score=0, empty
 * dimension_scores, and empty match_reasons, which makes them look bare on
 * the buyer-facing title detail page next to AI comps. This script invokes
 * the `score-manual-comp` edge function for each affected title so those
 * comps gain the same AI scoring as freshly-generated ones.
 *
 * A manual comp is considered "unscored" when source === 'manual' AND
 * (overall_match_score is 0/null OR dimension_scores is empty).
 *
 * Required env:
 *   SUPABASE_URL              - e.g. https://dlrnrgcoguxlkkcitlpd.supabase.co
 *   SUPABASE_SERVICE_ROLE_KEY - service-role key (bypasses RLS for UPDATE)
 *
 * Usage:
 *   node scripts/backfill-manual-comp-scores.js                       # dry-run
 *   node scripts/backfill-manual-comp-scores.js --cost-estimate       # dry-run + cost
 *   node scripts/backfill-manual-comp-scores.js --apply               # writes updates
 *   node scripts/backfill-manual-comp-scores.js --slug=lily-house --apply
 *   node scripts/backfill-manual-comp-scores.js --title-id=<uuid> --apply
 *   node scripts/backfill-manual-comp-scores.js --limit=10 --apply
 */

import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error(
    "Missing required env. Need SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY."
  );
  process.exit(1);
}

const args = process.argv.slice(2);
const APPLY = args.includes("--apply");
const COST_ESTIMATE = args.includes("--cost-estimate");
const SLUG_ARG = args.find((a) => a.startsWith("--slug="))?.split("=")[1];
const TITLE_ID_ARG = args.find((a) => a.startsWith("--title-id="))?.split("=")[1];
const LIMIT_ARG = args.find((a) => a.startsWith("--limit="))?.split("=")[1];
const LIMIT = LIMIT_ARG ? parseInt(LIMIT_ARG, 10) : undefined;
const RATE_LIMIT_MS = 2000; // 2s between titles to be polite to OpenAI

// Approximate cost per title: 1 deconstruction (gpt-4o) + 1 scoring call (gpt-4o)
const COST_PER_TITLE_USD = 0.01;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function isUnscoredManualComp(comp) {
  if (!comp || comp.source !== "manual") return false;
  const noScore = !comp.overall_match_score || comp.overall_match_score === 0;
  const noDims = !Array.isArray(comp.dimension_scores) || comp.dimension_scores.length === 0;
  return noScore || noDims;
}

async function loadTitles() {
  let query = supabase
    .from("titles")
    .select("title_id, slug, title_name_en, title_name_kr, comps_analysis")
    .not("comps_analysis", "is", null);

  if (TITLE_ID_ARG) query = query.eq("title_id", TITLE_ID_ARG);
  else if (SLUG_ARG) query = query.eq("slug", SLUG_ARG);

  const { data, error } = await query;
  if (error) throw new Error(`Supabase select failed: ${error.message}`);
  return data || [];
}

async function scoreCandidatesForTitle(titleId, candidates) {
  const { data, error } = await supabase.functions.invoke("score-manual-comp", {
    body: {
      title_id: titleId,
      candidates: candidates.map((c) => ({
        comp_title: c.comp_title,
        comp_year: c.comp_year,
        comp_type: c.comp_type,
        imdb_id: c.imdb_id,
        imdb_url: c.imdb_url,
        poster_url: c.poster_url,
      })),
      user_email: "backfill-script@kstorybridge.com",
    },
  });
  if (error) {
    let detail = error.message || "unknown error";
    try {
      if (error.context && typeof error.context.json === "function") {
        const body = await error.context.json();
        if (body?.error) detail = body.error;
      }
    } catch {
      // swallow
    }
    throw new Error(detail);
  }
  if (!data || !Array.isArray(data.scored_comps)) {
    throw new Error("Invalid response from score-manual-comp");
  }
  return data.scored_comps;
}

function mergeScored(originalAnalysis, scoredComps) {
  // Index scored comps by imdb_id and by comp_title for fallback lookup.
  const scoredByImdb = new Map();
  const scoredByTitle = new Map();
  for (const s of scoredComps) {
    if (s.imdb_id) scoredByImdb.set(s.imdb_id, s);
    if (s.comp_title) scoredByTitle.set(s.comp_title, s);
  }

  return originalAnalysis.map((comp) => {
    if (!isUnscoredManualComp(comp)) return comp;
    const match =
      (comp.imdb_id && scoredByImdb.get(comp.imdb_id)) ||
      scoredByTitle.get(comp.comp_title);
    if (!match) return comp;
    // Preserve the original identity fields (input order/title) and overlay scoring fields.
    return {
      ...comp,
      overall_match_score: match.overall_match_score ?? comp.overall_match_score,
      dimension_scores: match.dimension_scores ?? comp.dimension_scores,
      explanation: match.explanation ?? comp.explanation,
      match_reasons: match.match_reasons ?? comp.match_reasons,
      source: "manual",
    };
  });
}

async function main() {
  const mode = APPLY ? "APPLY" : "DRY-RUN";
  const filter = TITLE_ID_ARG
    ? ` title_id=${TITLE_ID_ARG}`
    : SLUG_ARG
    ? ` slug=${SLUG_ARG}`
    : "";
  console.log(`[backfill-manual-comps] mode=${mode}${filter}`);

  const titles = await loadTitles();

  const work = [];
  for (const title of titles) {
    const analysis = Array.isArray(title.comps_analysis) ? title.comps_analysis : [];
    const unscored = analysis.filter(isUnscoredManualComp);
    if (unscored.length > 0) {
      work.push({ title, analysis, unscored });
    }
  }

  const trimmed = LIMIT ? work.slice(0, LIMIT) : work;

  console.log(
    `[backfill-manual-comps] scanned ${titles.length} title(s), ${work.length} need backfill${
      LIMIT ? ` (limited to ${trimmed.length})` : ""
    }`
  );

  if (COST_ESTIMATE || !APPLY) {
    const estCost = (trimmed.length * COST_PER_TITLE_USD).toFixed(2);
    console.log(`[backfill-manual-comps] estimated cost: ~$${estCost} (~$${COST_PER_TITLE_USD}/title)`);
    for (const { title, unscored } of trimmed) {
      const label = title.slug || title.title_name_en || title.title_name_kr || title.title_id;
      console.log(`  • ${label} — ${unscored.length} unscored manual comp(s)`);
    }
    if (!APPLY) {
      console.log("\n[backfill-manual-comps] dry-run complete. Rerun with --apply to write updates.");
      return;
    }
  }

  let titlesUpdated = 0;
  let titlesFailed = 0;
  let compsPatched = 0;

  for (const [i, { title, analysis, unscored }] of trimmed.entries()) {
    const label = title.slug || title.title_name_en || title.title_name_kr || title.title_id;
    console.log(
      `\n[${i + 1}/${trimmed.length}] ${label} — scoring ${unscored.length} comp(s)…`
    );

    try {
      const scored = await scoreCandidatesForTitle(title.title_id, unscored);
      const merged = mergeScored(analysis, scored);

      const patchedCount = merged.filter((c, idx) => {
        const before = analysis[idx];
        return (
          c.source === "manual" &&
          Array.isArray(c.dimension_scores) &&
          c.dimension_scores.length > 0 &&
          (!before?.dimension_scores || before.dimension_scores.length === 0)
        );
      }).length;

      if (patchedCount === 0) {
        console.log(`  ! No comps were patched (scoring returned no usable matches)`);
      } else {
        const { error } = await supabase
          .from("titles")
          .update({ comps_analysis: merged })
          .eq("title_id", title.title_id);
        if (error) {
          console.error(`  !! UPDATE failed: ${error.message}`);
          titlesFailed++;
        } else {
          titlesUpdated++;
          compsPatched += patchedCount;
          console.log(`  ✓ patched ${patchedCount} comp(s)`);
        }
      }
    } catch (err) {
      console.error(`  !! scoring failed: ${err.message}`);
      titlesFailed++;
    }

    if (i < trimmed.length - 1) {
      await sleep(RATE_LIMIT_MS);
    }
  }

  console.log(`\n[backfill-manual-comps] summary`);
  console.log(`  titles needing fix : ${work.length}`);
  console.log(`  titles processed   : ${trimmed.length}`);
  console.log(`  titles updated     : ${titlesUpdated}`);
  console.log(`  titles failed      : ${titlesFailed}`);
  console.log(`  comps patched      : ${compsPatched}`);
  console.log(`  est. cost          : ~$${(titlesUpdated * COST_PER_TITLE_USD).toFixed(2)}`);
}

main().catch((err) => {
  console.error("[backfill-manual-comps] fatal:", err);
  process.exit(1);
});
