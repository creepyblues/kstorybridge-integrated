export type TitleWorkflowStage = 'draft_created' | 'submitted' | 'approved' | 'published'

export type TitleWorkflowStatus =
  | 'matched'
  | 'drift'
  | 'no_activity'
  | 'instrumentation_pending'
  | 'server_event_pending'
  | 'linkage_pending'

export interface TitleWorkflowCounts {
  draft_created: number
  submitted: number
  approved: number
  published: number
}

export interface TitleWorkflowReconciliationRow {
  stage: TitleWorkflowStage
  authoritativeOutcomes: number
  gaEvents: number
  variance: number
  varianceRate: number | null
  status: TitleWorkflowStatus
}

export interface GA4TitleWorkflowRow {
  dimensionValues: { value: string }[]
  metricValues: { value: string }[]
}

const EVENT_STAGES: Record<string, TitleWorkflowStage> = {
  title_draft_created: 'draft_created',
  title_submitted: 'submitted',
  title_approved: 'approved',
  title_published: 'published',
}

export const TITLE_WORKFLOW_EVENTS = Object.keys(EVENT_STAGES)

export function parseTitleWorkflowEvents(rows: GA4TitleWorkflowRow[] = []): TitleWorkflowCounts {
  const counts: TitleWorkflowCounts = {
    draft_created: 0,
    submitted: 0,
    approved: 0,
    published: 0,
  }

  for (const row of rows) {
    const stage = EVENT_STAGES[row.dimensionValues[0]?.value]
    if (!stage) continue
    counts[stage] += Number.parseInt(row.metricValues[0]?.value || '0', 10)
  }

  return counts
}

export function reconcileTitleWorkflow(
  authoritative: TitleWorkflowCounts,
  gaEvents: TitleWorkflowCounts,
  clientInstrumentationLive: boolean,
  serverInstrumentationLive: boolean,
  publicationLinked: boolean
): TitleWorkflowReconciliationRow[] {
  return (['draft_created', 'submitted', 'approved', 'published'] as const).map(stage => {
    const authoritativeOutcomes = authoritative[stage]
    const trackedEvents = gaEvents[stage]
    const variance = trackedEvents - authoritativeOutcomes
    const varianceRate = authoritativeOutcomes > 0
      ? Math.abs(variance) / authoritativeOutcomes
      : null

    let status: TitleWorkflowStatus
    if (stage === 'published' && !publicationLinked) {
      status = 'linkage_pending'
    } else if ((stage === 'draft_created' || stage === 'submitted') && !clientInstrumentationLive) {
      status = 'instrumentation_pending'
    } else if ((stage === 'approved' || stage === 'published') && !serverInstrumentationLive) {
      status = 'server_event_pending'
    } else if (authoritativeOutcomes === 0 && trackedEvents === 0) {
      status = 'no_activity'
    } else if (authoritativeOutcomes > 0 && varianceRate !== null && varianceRate <= 0.05) {
      status = 'matched'
    } else {
      status = 'drift'
    }

    return {
      stage,
      authoritativeOutcomes,
      gaEvents: trackedEvents,
      variance,
      varianceRate,
      status,
    }
  })
}
