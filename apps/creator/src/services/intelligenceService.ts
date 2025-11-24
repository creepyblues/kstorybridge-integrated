/**
 * Intelligence Service
 *
 * Purpose: Frontend service for Title Intelligence System
 *
 * Features:
 * - Trigger intelligence collection
 * - Fetch intelligence records
 * - Update field verification status
 * - Ingest verified data into titles table
 */

import { supabase } from '@/integrations/supabase/client'

export interface IntelligenceRecord {
  id: string
  title_name_input: string
  title_id: string | null
  collected_by: string
  collected_at: string
  sources_requested: string[]
  raw_data: Record<string, any>
  collection_status: 'pending' | 'in_progress' | 'completed' | 'partial_failure' | 'failed'
  collection_errors: Record<string, string>
  verified_fields: Record<string, FieldVerification>
  verification_status: 'pending' | 'in_progress' | 'completed' | 'skipped'
  verified_by: string | null
  verified_at: string | null
  ingested: boolean
  ingested_by: string | null
  ingested_at: string | null
  ingested_to_title_id: string | null
  ingestion_notes: string | null
  created_at: string
  updated_at: string
}

export interface FieldVerification {
  approved: boolean
  verified_by: string
  verified_at: string
  rejected_reason?: string
}

export interface CollectIntelligenceRequest {
  titleNameInput: string
  sources: string[]
  titleId?: string
}

export interface CollectIntelligenceResponse {
  success: boolean
  intelligenceId: string
  status: string
  sourcesCollected: string[]
  errors: Record<string, string>
}

/**
 * Trigger intelligence collection for a title
 */
export async function collectIntelligence(
  request: CollectIntelligenceRequest,
  userEmail: string
): Promise<CollectIntelligenceResponse> {
  const { data: { session } } = await supabase.auth.getSession()

  if (!session) {
    throw new Error('Not authenticated')
  }

  const response = await fetch(
    `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/title-intelligence`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`
      },
      body: JSON.stringify({
        titleNameInput: request.titleNameInput,
        sources: request.sources,
        collectedBy: userEmail,
        titleId: request.titleId
      })
    }
  )

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to collect intelligence')
  }

  return await response.json()
}

/**
 * Fetch all intelligence records (admin only)
 */
export async function getIntelligenceRecords(): Promise<IntelligenceRecord[]> {
  const { data, error } = await supabase
    .from('title_intelligence_data')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    throw new Error(`Failed to fetch intelligence records: ${error.message}`)
  }

  return data as IntelligenceRecord[]
}

/**
 * Fetch single intelligence record by ID
 */
export async function getIntelligenceRecord(id: string): Promise<IntelligenceRecord> {
  const { data, error } = await supabase
    .from('title_intelligence_data')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    throw new Error(`Failed to fetch intelligence record: ${error.message}`)
  }

  return data as IntelligenceRecord
}

/**
 * Update field verification status
 */
export async function verifyField(
  intelligenceId: string,
  fieldPath: string,  // e.g., "naver.views"
  approved: boolean,
  verifiedBy: string,
  rejectedReason?: string
): Promise<void> {
  // Fetch current record
  const record = await getIntelligenceRecord(intelligenceId)

  // Update verified_fields
  const verifiedFields = record.verified_fields || {}
  verifiedFields[fieldPath] = {
    approved,
    verified_by: verifiedBy,
    verified_at: new Date().toISOString(),
    ...(rejectedReason && { rejected_reason: rejectedReason })
  }

  // Update record
  const { error } = await supabase
    .from('title_intelligence_data')
    .update({
      verified_fields: verifiedFields,
      verification_status: 'in_progress',
      updated_at: new Date().toISOString()
    })
    .eq('id', intelligenceId)

  if (error) {
    throw new Error(`Failed to verify field: ${error.message}`)
  }
}

/**
 * Mark verification as completed
 */
export async function completeVerification(
  intelligenceId: string,
  verifiedBy: string
): Promise<void> {
  const { error } = await supabase
    .from('title_intelligence_data')
    .update({
      verification_status: 'completed',
      verified_by: verifiedBy,
      verified_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .eq('id', intelligenceId)

  if (error) {
    throw new Error(`Failed to complete verification: ${error.message}`)
  }
}

/**
 * Ingest verified fields into titles table
 */
export async function ingestIntelligence(
  intelligenceId: string,
  titleId: string,
  ingestedBy: string,
  notes?: string
): Promise<void> {
  // Fetch intelligence record
  const record = await getIntelligenceRecord(intelligenceId)

  // Extract approved fields only
  const approvedData: Record<string, any> = {}
  for (const [fieldPath, verification] of Object.entries(record.verified_fields)) {
    if (verification.approved) {
      // Parse field path (e.g., "naver.views" -> { naver: { views: value } })
      const [source, field] = fieldPath.split('.')
      const value = record.raw_data[source]?.[field]

      if (value !== undefined && value !== null) {
        if (!approvedData[field]) {
          approvedData[field] = value
        }
      }
    }
  }

  // Update titles table with approved fields
  // Note: This is simplified - production should map fields appropriately
  const { error: updateError } = await supabase
    .from('titles')
    .update({
      ...approvedData,
      updated_at: new Date().toISOString()
    })
    .eq('title_id', titleId)

  if (updateError) {
    throw new Error(`Failed to update title: ${updateError.message}`)
  }

  // Mark intelligence record as ingested
  const { error: ingestError } = await supabase
    .from('title_intelligence_data')
    .update({
      ingested: true,
      ingested_by: ingestedBy,
      ingested_at: new Date().toISOString(),
      ingested_to_title_id: titleId,
      ingestion_notes: notes || null,
      updated_at: new Date().toISOString()
    })
    .eq('id', intelligenceId)

  if (ingestError) {
    throw new Error(`Failed to mark as ingested: ${ingestError.message}`)
  }
}

/**
 * Delete intelligence record (admin only)
 * Note: We generally keep raw data permanently, but allow deletion for data cleanup
 */
export async function deleteIntelligenceRecord(id: string): Promise<void> {
  const { error } = await supabase
    .from('title_intelligence_data')
    .delete()
    .eq('id', id)

  if (error) {
    throw new Error(`Failed to delete intelligence record: ${error.message}`)
  }
}
