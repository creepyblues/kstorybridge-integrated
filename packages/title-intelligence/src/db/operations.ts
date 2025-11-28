/**
 * Database Operations
 *
 * CRUD operations for intelligence schema tables
 */

import { getDatabase } from './client'
import {
  IntelligenceTitle,
  IntelligenceAlias,
  IntelligenceSource,
  IntelligenceMetric,
  UpsertIntelligenceTitlePayload,
  IntelligenceTitleWithRelations
} from '../model/schema'

/**
 * Upsert intelligence title with sources and metrics
 * This is the main operation used by the pipeline
 */
export async function upsertIntelligenceTitle(
  payload: UpsertIntelligenceTitlePayload
): Promise<string> {
  const db = getDatabase()

  // 1. Upsert main title record
  const { data: existingTitle } = await db
    .from('intelligence_titles')
    .select('id')
    .eq('slug', payload.title.slug)
    .single()

  let titleId: string

  if (existingTitle) {
    // Update existing title
    const { data, error } = await db
      .from('intelligence_titles')
      .update({
        original_title_ko: payload.title.original_title_ko,
        original_title_en: payload.title.original_title_en,
        type: payload.title.type,
        original_language: payload.title.original_language,
        primary_genres: payload.title.primary_genres,
        demographic: payload.title.demographic,
        has_webnovel: payload.title.has_webnovel,
        updated_at: new Date().toISOString()
      })
      .eq('id', existingTitle.id)
      .select('id')
      .single()

    if (error) throw new Error(`Failed to update title: ${error.message}`)
    titleId = data.id
  } else {
    // Insert new title
    const { data, error } = await db
      .from('intelligence_titles')
      .insert({
        original_title_ko: payload.title.original_title_ko,
        original_title_en: payload.title.original_title_en,
        slug: payload.title.slug,
        type: payload.title.type,
        original_language: payload.title.original_language,
        primary_genres: payload.title.primary_genres,
        demographic: payload.title.demographic,
        has_webnovel: payload.title.has_webnovel
      })
      .select('id')
      .single()

    if (error) throw new Error(`Failed to insert title: ${error.message}`)
    titleId = data.id
  }

  // 2. Insert aliases (skip if already exist)
  if (payload.aliases && payload.aliases.length > 0) {
    for (const alias of payload.aliases) {
      const { error } = await db
        .from('intelligence_aliases')
        .upsert({
          intelligence_title_id: titleId,
          alias: alias.alias,
          language: alias.language,
          kind: alias.kind
        }, {
          onConflict: 'intelligence_title_id,alias',
          ignoreDuplicates: true
        })

      if (error && !error.message.includes('duplicate')) {
        console.warn(`Failed to insert alias "${alias.alias}": ${error.message}`)
      }
    }
  }

  // 3. Upsert sources
  const sourceIds: Record<string, string> = {}
  for (const source of payload.sources) {
    const { data, error } = await db
      .from('intelligence_sources')
      .upsert({
        intelligence_title_id: titleId,
        domain: source.domain,
        category: source.category,
        url: source.url,
        region: source.region,
        language: source.language,
        raw_meta: source.raw_meta,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'intelligence_title_id,url'
      })
      .select('id')
      .single()

    if (error) {
      console.warn(`Failed to upsert source ${source.url}: ${error.message}`)
      continue
    }

    sourceIds[source.url] = data.id
  }

  // 4. Insert metrics snapshots
  for (const metric of payload.metrics) {
    const sourceId = sourceIds[metric.source_url]
    if (!sourceId) {
      console.warn(`Source ID not found for URL: ${metric.source_url}`)
      continue
    }

    const { error } = await db
      .from('intelligence_metrics')
      .insert({
        intelligence_title_id: titleId,
        source_id: sourceId,
        snapshot_time: new Date().toISOString(),
        views: metric.views,
        subscribers: metric.subscribers,
        rating_score: metric.rating_score,
        rating_votes: metric.rating_votes,
        favorites: metric.favorites,
        episode_count: metric.episode_count,
        status: metric.status,
        age_rating: metric.age_rating,
        raw: metric.raw || {}
      })

    if (error) {
      console.warn(`Failed to insert metrics for source ${sourceId}: ${error.message}`)
    }
  }

  return titleId
}

/**
 * Get intelligence title with all relations
 */
export async function getIntelligenceTitleById(
  id: string,
  includeHistory = false
): Promise<IntelligenceTitleWithRelations | null> {
  const db = getDatabase()

  // Fetch title
  const { data: title, error: titleError } = await db
    .from('intelligence_titles')
    .select('*')
    .eq('id', id)
    .single()

  if (titleError || !title) return null

  // Fetch aliases
  const { data: aliases } = await db
    .from('intelligence_aliases')
    .select('*')
    .eq('intelligence_title_id', id)

  // Fetch sources
  const { data: sources } = await db
    .from('intelligence_sources')
    .select('*')
    .eq('intelligence_title_id', id)

  // Fetch latest metrics (one per source)
  const latestMetrics: IntelligenceMetric[] = []
  const metricsHistory: IntelligenceMetric[] = []

  if (sources && sources.length > 0) {
    for (const source of sources) {
      const { data: latest } = await db
        .from('intelligence_metrics')
        .select('*')
        .eq('source_id', source.id)
        .order('snapshot_time', { ascending: false })
        .limit(1)

      if (latest && latest.length > 0) {
        latestMetrics.push(latest[0])
      }

      if (includeHistory) {
        const { data: history } = await db
          .from('intelligence_metrics')
          .select('*')
          .eq('source_id', source.id)
          .order('snapshot_time', { ascending: false })

        if (history) {
          metricsHistory.push(...history)
        }
      }
    }
  }

  return {
    title: title as IntelligenceTitle,
    aliases: (aliases || []) as IntelligenceAlias[],
    sources: (sources || []) as IntelligenceSource[],
    latestMetrics,
    metricsHistory: includeHistory ? metricsHistory : undefined
  }
}

/**
 * Get intelligence title by slug
 */
export async function getIntelligenceTitleBySlug(
  slug: string,
  includeHistory = false
): Promise<IntelligenceTitleWithRelations | null> {
  const db = getDatabase()

  const { data: title } = await db
    .from('intelligence_titles')
    .select('id')
    .eq('slug', slug)
    .single()

  if (!title) return null

  return getIntelligenceTitleById(title.id, includeHistory)
}

/**
 * Search intelligence titles by title name (Korean or English)
 */
export async function searchIntelligenceTitles(
  query: string,
  limit = 20
): Promise<IntelligenceTitle[]> {
  const db = getDatabase()

  // Try exact slug match first
  const { data: exactMatch } = await db
    .from('intelligence_titles')
    .select('*')
    .eq('slug', query.toLowerCase().replace(/\s+/g, '-'))
    .single()

  if (exactMatch) {
    return [exactMatch as IntelligenceTitle]
  }

  // Full-text search on titles
  const { data, error } = await db
    .from('intelligence_titles')
    .select('*')
    .or(`original_title_ko.ilike.%${query}%,original_title_en.ilike.%${query}%`)
    .limit(limit)

  if (error) {
    console.warn(`Search error: ${error.message}`)
    return []
  }

  return (data || []) as IntelligenceTitle[]
}

/**
 * Delete intelligence title and all related data
 */
export async function deleteIntelligenceTitle(id: string): Promise<void> {
  const db = getDatabase()

  // Cascade delete handles aliases, sources, metrics
  const { error } = await db
    .from('intelligence_titles')
    .delete()
    .eq('id', id)

  if (error) {
    throw new Error(`Failed to delete title: ${error.message}`)
  }
}
