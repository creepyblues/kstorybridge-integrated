/**
 * audit-title edge function
 *
 * Per-title audit: fetches title_url / title_url_en, extracts the page title
 * and cover image from OG meta tags, compares against the stored values on
 * `titles`, and UPSERTs the comparison results into `title_audits`.
 *
 * Client orchestrates batch runs by invoking this per title (with concurrency).
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const FETCH_TIMEOUT_MS = 15000;
const USER_AGENT =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36 KStoryBridgeAuditBot/1.0';

const NAME_MATCH_THRESHOLD = 0.85;

// =====================================================================
// HTML / OG-meta extraction
// =====================================================================

interface ScrapedMeta {
  title?: string;
  image?: string;
}

/**
 * Site-name patterns we want to strip out of a scraped title. These appear
 * as either prefix verbs ("Read ", "Watch ") or trailing platform labels
 * after a separator (" | Tapas Web Comics", " - Manta", " :: 다음 웹툰").
 */
const TITLE_PREFIX_VERBS = /^(read|view|watch|webtoon)\s+/i;

const SITE_NAME_PATTERNS: RegExp[] = [
  /^tapas( web comics| media)?$/i,
  /^manta$/i,
  /manhwa.*manta/i,
  /webcomic.*manta/i,
  /^webtoon$/i,
  /^line\s*webtoon$/i,
  /^lezhin( comics)?( - korean.*)?$/i,
  /^kakao(\s*page)?$/i,
  /^kakaopage$/i,
  /^naver(\s*(series|webtoon|comic))?$/i,
  /^ridi(books)?$/i,
  /^tappytoon$/i,
  /^bomtoon$/i,
  /^bufftoon$/i,
  /^toomics$/i,
  /^toptoon$/i,
  /^ono$/i,
  /^lalatoon$/i,
  /^다음\s*웹툰$/i,
  /^카카오\s*페이지$/i,
  /^네이버\s*(시리즈|웹툰)$/i,
  /^탑툰$/i,
  /^레진코믹스$/i,
  /^봄툰$/i,
  /^버프툰$/i,
  /^리디(북스)?$/i,
  /^만타$/i,
  /^라라툰$/i,
  /^태피툰$/i,
];

function isSiteName(segment: string): boolean {
  const s = segment.trim();
  if (!s) return true;
  return SITE_NAME_PATTERNS.some((p) => p.test(s));
}

/**
 * Detect site-wide marketing taglines that some platforms (Bomtoon, etc.)
 * serve as `og:title` when they don't expose per-title metadata or when
 * the page is geo-fenced. These are obviously not the title — better to
 * skip the comparison than flag a false mismatch.
 */
function looksLikeTagline(s: string): boolean {
  const t = s.trim();
  if (!t) return false;
  // Korean platform tagline keywords
  if (/프리미엄.*웹툰/.test(t)) return true;
  if (/(장르|작품).*(독자|fans?)/i.test(t)) return true;
  if (/한국\s*(최대|대표|최고)/i.test(t)) return true;
  // English marketing copy
  if (/premium\s+(web\s*)?(comics?|toons?|novel)/i.test(t)) return true;
  if (/read\s+(the\s+)?(best|latest|most)/i.test(t)) return true;
  // Sentence-ish title (multiple commas = list, not a title)
  if ((t.match(/,/g) || []).length >= 2) return true;
  // Very long titles are almost always taglines
  if (t.length > 80) return true;
  return false;
}

/**
 * Strip platform decoration from a scraped page title.
 *
 * Examples:
 *   "Read The Cellist | Tapas Web Comics"           -> "The Cellist"
 *   "The Butterfly Girl - Manhwa/Webcomic - Manta"  -> "The Butterfly Girl"
 *   "[탑툰] 해금 : 시작되는 쾌락"                       -> "해금"
 *   "나비인간"                                       -> "나비인간"
 *   "텍미하이(Take me high) | RIDIBOOKS"             -> "텍미하이(Take me high)"
 */
function cleanScrapedTitle(raw: string): string {
  let t = raw.trim();

  // 1. Strip leading verbs ("Read ", "View ", "Watch ", "Webtoon ")
  t = t.replace(TITLE_PREFIX_VERBS, '');

  // 2. Strip leading bracketed platform tags: "[탑툰] ", "[BL] ", "[성인] ", etc.
  //    Repeat in case there are stacked tags like "[BL][성인] 제목".
  while (/^[\[\(【〔][^\]\)\)】〕]+[\]\)\)】〕]\s*/.test(t)) {
    t = t.replace(/^[\[\(【〔][^\]\)\)】〕]+[\]\)\)】〕]\s*/, '');
  }

  // 3. Split on common decoration separators and remove site-name segments.
  //    " : " is included because many KR platforms format as
  //    "[PLATFORM] TITLE : SUBTITLE" and the canonical title is the LHS.
  //    Note: requires spaces around the colon so "Wars: A New Hope" still matches.
  for (const sep of [' | ', ' :: ', ' : ', ' – ', ' - ', ' · ', ' • ']) {
    if (!t.includes(sep)) continue;
    const parts = t
      .split(sep)
      .map((p) => p.trim())
      .filter(Boolean);
    if (parts.length <= 1) continue;
    const realTitleParts = parts.filter((p) => !isSiteName(p));
    if (realTitleParts.length > 0) {
      // Take the first non-site segment (left-to-right reads as "title | platform")
      t = realTitleParts[0];
    } else {
      // Everything looks site-y; just keep the first segment.
      t = parts[0];
    }
    break;
  }

  t = t.trim();

  // 4. If after all cleanup the title is JUST a platform name (e.g. Bomtoon
  //    returns its site OG title "봄툰" because per-title metadata is
  //    rendered client-side), or it looks like a marketing tagline served
  //    when the page is geo-fenced / not indexed, treat as "no title
  //    scraped" — leaving the audit row null beats flagging a false mismatch.
  if (isSiteName(t)) return '';
  if (looksLikeTagline(t)) return '';

  return t;
}

/**
 * Detect generic site-wide OG placeholder images. Some platforms (Bomtoon,
 * Toomics, etc.) render per-title cover images client-side and serve a
 * branded fallback in their HTML OG meta. Comparing against that gives a
 * misleading "image_match = false" — we'd rather record null.
 */
function isGenericPlaceholderImage(url: string): boolean {
  if (!url) return true;
  return /(meta-image|og-default|og_default|default-thumb|default_og|share-default|common\/(meta|og|default|share)|placeholder)/i.test(url);
}

/** Pull og:title / og:image (with twitter: fallback) from a raw HTML string. */
function extractOgMeta(html: string): ScrapedMeta {
  const found: Record<string, string> = {};

  // property/name first, content second
  const metaRegex1 =
    /<meta\s+(?:[^>]*?\s)?(?:property|name)\s*=\s*["']([^"']+)["'][^>]*?\s+content\s*=\s*["']([^"']*)["'][^>]*>/gi;
  for (const m of html.matchAll(metaRegex1)) {
    found[m[1].toLowerCase()] = m[2];
  }
  // content first, property/name second
  const metaRegex2 =
    /<meta\s+(?:[^>]*?\s)?content\s*=\s*["']([^"']*)["'][^>]*?\s+(?:property|name)\s*=\s*["']([^"']+)["'][^>]*>/gi;
  for (const m of html.matchAll(metaRegex2)) {
    found[m[2].toLowerCase()] = m[1];
  }

  // Prefer JSON-LD structured data (BookSeries/CreativeWork) when present —
  // it's the cleanest source. Falls back to og:title.
  let title: string | undefined;
  const ldBlocks = [...html.matchAll(/<script[^>]*application\/ld\+json[^>]*>([\s\S]*?)<\/script>/gi)];
  for (const m of ldBlocks) {
    try {
      const json = JSON.parse(m[1].trim());
      const items = Array.isArray(json) ? json : [json];
      for (const item of items) {
        const type = item['@type'];
        const typeStr = Array.isArray(type) ? type.join(',') : String(type || '');
        // Skip "Organization" / "WebSite" — those carry the platform name, not the title
        if (/organization|website|breadcrumblist/i.test(typeStr)) continue;
        if (typeof item.name === 'string' && item.name.trim()) {
          title = item.name.trim();
          break;
        }
      }
      if (title) break;
    } catch {
      // ignore invalid JSON-LD
    }
  }

  if (!title) {
    title = found['og:title'] || found['twitter:title'];
  }

  if (!title) {
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    if (titleMatch) title = titleMatch[1];
  }

  const cleanedTitle = title ? cleanScrapedTitle(title) : '';
  const meta: ScrapedMeta = {
    title: cleanedTitle || undefined,
    image:
      found['og:image'] ||
      found['twitter:image'] ||
      found['twitter:image:src'] ||
      undefined,
  };

  // Resolve protocol-relative image URLs.
  if (meta.image && meta.image.startsWith('//')) {
    meta.image = `https:${meta.image}`;
  }

  return meta;
}

async function fetchWithTimeout(url: string, ms: number): Promise<Response> {
  const ctl = new AbortController();
  const timer = setTimeout(() => ctl.abort(), ms);
  try {
    return await fetch(url, {
      signal: ctl.signal,
      redirect: 'follow',
      headers: {
        'User-Agent': USER_AGENT,
        Accept: 'text/html,application/xhtml+xml',
        'Accept-Language': 'ko-KR,ko;q=0.9,en;q=0.8',
      },
    });
  } finally {
    clearTimeout(timer);
  }
}

async function scrapeUrl(url: string): Promise<ScrapedMeta | null> {
  try {
    const res = await fetchWithTimeout(url, FETCH_TIMEOUT_MS);
    if (!res.ok) {
      console.warn(`[audit-title] ${url} -> HTTP ${res.status}`);
      return null;
    }
    const html = await res.text();
    return extractOgMeta(html);
  } catch (err) {
    console.warn(`[audit-title] fetch failed for ${url}:`, err instanceof Error ? err.message : err);
    return null;
  }
}

async function isReachable(url: string): Promise<boolean | null> {
  if (!url) return null;
  try {
    // Some CDNs reject HEAD; fall back to a ranged GET.
    let res = await fetch(url, {
      method: 'HEAD',
      headers: { 'User-Agent': USER_AGENT },
    }).catch(() => null);
    if (res && (res.status === 405 || res.status === 403)) {
      res = await fetch(url, {
        method: 'GET',
        headers: { 'User-Agent': USER_AGENT, Range: 'bytes=0-0' },
      });
    }
    if (!res) return false;
    return res.status >= 200 && res.status < 400;
  } catch {
    return false;
  }
}

// =====================================================================
// Title normalization + Jaro-Winkler
// =====================================================================

const BRACKET_CHARS = /[《》「」『』〈〉【】\[\]()（）"'"'·•\-—–:：,，.。!！?？]/g;

function normalizeTitle(input: string): string {
  if (!input) return '';
  return input
    .normalize('NFKC')
    .replace(BRACKET_CHARS, ' ')
    // Strip trailing badges like "(완결)", "[완결]"
    .replace(/\b(완결|미완|연재중|webtoon|web novel|소설|만화)\b/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

/** Jaro similarity (0..1) */
function jaro(a: string, b: string): number {
  if (a === b) return 1;
  if (!a.length || !b.length) return 0;

  const matchDist = Math.floor(Math.max(a.length, b.length) / 2) - 1;
  const aMatches = new Array<boolean>(a.length).fill(false);
  const bMatches = new Array<boolean>(b.length).fill(false);

  let matches = 0;
  for (let i = 0; i < a.length; i++) {
    const start = Math.max(0, i - matchDist);
    const end = Math.min(i + matchDist + 1, b.length);
    for (let j = start; j < end; j++) {
      if (bMatches[j]) continue;
      if (a[i] !== b[j]) continue;
      aMatches[i] = true;
      bMatches[j] = true;
      matches++;
      break;
    }
  }

  if (!matches) return 0;

  let transpositions = 0;
  let k = 0;
  for (let i = 0; i < a.length; i++) {
    if (!aMatches[i]) continue;
    while (!bMatches[k]) k++;
    if (a[i] !== b[k]) transpositions++;
    k++;
  }

  const m = matches;
  return (m / a.length + m / b.length + (m - transpositions / 2) / m) / 3;
}

/** Jaro-Winkler similarity (prefix-boosted Jaro), max prefix length 4, p=0.1 */
function jaroWinkler(a: string, b: string): number {
  const j = jaro(a, b);
  let prefix = 0;
  const max = Math.min(4, a.length, b.length);
  for (let i = 0; i < max; i++) {
    if (a[i] === b[i]) prefix++;
    else break;
  }
  return j + prefix * 0.1 * (1 - j);
}

// =====================================================================
// Image comparison
// =====================================================================

function sameImagePath(scrapedUrl: string | undefined, storedUrl: string | undefined): boolean | null {
  if (!scrapedUrl || !storedUrl) return null;
  try {
    const a = new URL(scrapedUrl);
    const b = new URL(storedUrl);
    if (a.hostname === b.hostname && a.pathname === b.pathname) return true;
    return null;
  } catch {
    return null;
  }
}

// =====================================================================
// Main handler
// =====================================================================

interface AuditRequest {
  title_id: string;
}

interface AuditRecord {
  title_id: string;
  last_audited_at: string;
  title_name_kr_scraped: string | null;
  title_name_en_scraped: string | null;
  title_image_scraped: string | null;
  name_similarity_kr: number | null;
  name_similarity_en: number | null;
  name_match_kr: boolean | null;
  name_match_en: boolean | null;
  image_match: boolean | null;
  image_reachable: boolean | null;
  scrape_error: string | null;
  scraped_at_kr: string | null;
  scraped_at_en: string | null;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = (await req.json()) as AuditRequest;
    if (!body.title_id) {
      return new Response(JSON.stringify({ error: 'title_id is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { autoRefreshToken: false, persistSession: false } },
    );

    const { data: title, error: titleErr } = await supabase
      .from('titles')
      .select('title_id, title_name_kr, title_name_en, title_url, title_url_en, title_image')
      .eq('title_id', body.title_id)
      .maybeSingle();

    if (titleErr) throw new Error(`Failed to fetch title: ${titleErr.message}`);
    if (!title) {
      return new Response(JSON.stringify({ error: 'Title not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const now = new Date().toISOString();
    const errors: string[] = [];
    let krScraped: ScrapedMeta | null = null;
    let enScraped: ScrapedMeta | null = null;
    let scrapedAtKr: string | null = null;
    let scrapedAtEn: string | null = null;

    if (title.title_url) {
      krScraped = await scrapeUrl(title.title_url);
      scrapedAtKr = now;
      if (!krScraped) errors.push(`KR scrape failed: ${title.title_url}`);
    }
    if (title.title_url_en) {
      enScraped = await scrapeUrl(title.title_url_en);
      scrapedAtEn = now;
      if (!enScraped) errors.push(`EN scrape failed: ${title.title_url_en}`);
    }

    let nameSimKr: number | null = null;
    let nameMatchKr: boolean | null = null;
    if (krScraped?.title && title.title_name_kr) {
      const a = normalizeTitle(krScraped.title);
      const b = normalizeTitle(title.title_name_kr);
      nameSimKr = a && b ? Number(jaroWinkler(a, b).toFixed(3)) : null;
      nameMatchKr = nameSimKr === null ? null : nameSimKr >= NAME_MATCH_THRESHOLD;
    }

    let nameSimEn: number | null = null;
    let nameMatchEn: boolean | null = null;
    if (enScraped?.title && title.title_name_en) {
      const a = normalizeTitle(enScraped.title);
      const b = normalizeTitle(title.title_name_en);
      nameSimEn = a && b ? Number(jaroWinkler(a, b).toFixed(3)) : null;
      nameMatchEn = nameSimEn === null ? null : nameSimEn >= NAME_MATCH_THRESHOLD;
    }

    // EN-first: prefer the cover from the English release when available;
    // fall back to the Korean source. Generic site-wide placeholder images
    // (e.g. Bomtoon's branded "meta-image.jpg") are treated as no image —
    // they'd otherwise cause false image_match=null but pollute the field.
    const enImage =
      enScraped?.image && !isGenericPlaceholderImage(enScraped.image) ? enScraped.image : null;
    const krImage =
      krScraped?.image && !isGenericPlaceholderImage(krScraped.image) ? krScraped.image : null;
    const scrapedImage = enImage ?? krImage ?? null;
    const imageMatch = sameImagePath(scrapedImage ?? undefined, title.title_image ?? undefined);

    let imageReachable: boolean | null = null;
    if (title.title_image) {
      imageReachable = await isReachable(title.title_image);
    }

    const auditRow: AuditRecord = {
      title_id: title.title_id,
      last_audited_at: now,
      title_name_kr_scraped: krScraped?.title ?? null,
      title_name_en_scraped: enScraped?.title ?? null,
      title_image_scraped: scrapedImage,
      name_similarity_kr: nameSimKr,
      name_similarity_en: nameSimEn,
      name_match_kr: nameMatchKr,
      name_match_en: nameMatchEn,
      image_match: imageMatch,
      image_reachable: imageReachable,
      scrape_error: errors.length ? errors.join(' | ') : null,
      scraped_at_kr: scrapedAtKr,
      scraped_at_en: scrapedAtEn,
    };

    const { error: upsertErr } = await supabase
      .from('title_audits')
      .upsert(auditRow, { onConflict: 'title_id' });

    if (upsertErr) throw new Error(`Failed to upsert audit: ${upsertErr.message}`);

    return new Response(JSON.stringify({ status: 'ok', audit: auditRow }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('[audit-title] error:', message);
    return new Response(JSON.stringify({ status: 'error', error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
