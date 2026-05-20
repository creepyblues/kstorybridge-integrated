import { supabase } from '@/lib/supabase';

export interface TitleAudit {
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
  created_at?: string;
  updated_at?: string;
}

export type AuditMode = 'all' | 'never-audited' | 'stale';

export interface BatchProgress {
  done: number;
  total: number;
  currentTitleName?: string;
  errors: number;
}

const STALE_AFTER_DAYS = 7;

class AuditService {
  /**
   * Run an audit for a single title via the edge function.
   * UPSERTs into title_audits as a side effect.
   */
  async auditTitle(titleId: string): Promise<TitleAudit> {
    const { data, error } = await supabase.functions.invoke<{
      status: 'ok' | 'error';
      audit?: TitleAudit;
      error?: string;
    }>('audit-title', { body: { title_id: titleId } });

    if (error) {
      let message = error.message || 'Audit failed';
      try {
        if (error.context && typeof error.context.json === 'function') {
          const errBody = await error.context.json();
          message = errBody?.error || message;
        }
      } catch {
        // ignore
      }
      throw new Error(message);
    }

    if (!data || data.status !== 'ok' || !data.audit) {
      throw new Error(data?.error || 'Audit failed');
    }

    return data.audit;
  }

  /** Get the latest audit row for a single title, or null. */
  async getTitleAudit(titleId: string): Promise<TitleAudit | null> {
    const { data, error } = await supabase
      .from('title_audits')
      .select('*')
      .eq('title_id', titleId)
      .maybeSingle();

    if (error) {
      console.error('[auditService] getTitleAudit error:', error);
      return null;
    }
    return (data as TitleAudit) ?? null;
  }

  /**
   * Get the set of title_ids that should be audited for a given mode.
   *  - 'all': every title row
   *  - 'never-audited': titles without a corresponding title_audits row
   *  - 'stale': titles whose audit is older than STALE_AFTER_DAYS, OR never audited
   *
   * Only includes titles that have at least one URL to scrape.
   */
  async getTitleIdsForMode(mode: AuditMode): Promise<string[]> {
    // Fetch candidate titles (need at least one URL to be auditable)
    const { data: titles, error: tErr } = await supabase
      .from('titles')
      .select('title_id, title_url, title_url_en');

    if (tErr) throw new Error(`Failed to list titles: ${tErr.message}`);
    const candidates = (titles ?? []).filter(
      (t) => (t.title_url && t.title_url.length > 0) || (t.title_url_en && t.title_url_en.length > 0),
    );

    if (mode === 'all') {
      return candidates.map((t) => t.title_id);
    }

    const { data: audits, error: aErr } = await supabase
      .from('title_audits')
      .select('title_id, last_audited_at');

    if (aErr) throw new Error(`Failed to list audits: ${aErr.message}`);

    const auditMap = new Map<string, string>(
      (audits ?? []).map((a) => [a.title_id as string, a.last_audited_at as string]),
    );

    if (mode === 'never-audited') {
      return candidates.filter((t) => !auditMap.has(t.title_id)).map((t) => t.title_id);
    }

    // mode === 'stale'
    const cutoff = Date.now() - STALE_AFTER_DAYS * 24 * 60 * 60 * 1000;
    return candidates
      .filter((t) => {
        const ts = auditMap.get(t.title_id);
        if (!ts) return true; // never audited counts as stale
        return new Date(ts).getTime() < cutoff;
      })
      .map((t) => t.title_id);
  }

  /**
   * Audit many titles with a bounded concurrency pool.
   * Calls onProgress after each completion. Aborts pending work if the signal fires.
   */
  async batchAudit(
    titleIds: string[],
    titleNameLookup: (id: string) => string | undefined,
    onProgress: (p: BatchProgress) => void,
    signal: AbortSignal,
    concurrency = 5,
  ): Promise<BatchProgress> {
    const total = titleIds.length;
    let done = 0;
    let errors = 0;
    let cursor = 0;

    const runOne = async (id: string) => {
      if (signal.aborted) return;
      try {
        await this.auditTitle(id);
      } catch (err) {
        errors++;
        console.warn(`[auditService] audit failed for ${id}:`, err);
      } finally {
        done++;
        onProgress({ done, total, currentTitleName: titleNameLookup(id), errors });
      }
    };

    const worker = async () => {
      while (!signal.aborted) {
        const i = cursor++;
        if (i >= titleIds.length) return;
        await runOne(titleIds[i]);
      }
    };

    const workers = Array.from({ length: Math.min(concurrency, total) }, () => worker());
    await Promise.all(workers);

    return { done, total, errors };
  }
}

export const auditService = new AuditService();
