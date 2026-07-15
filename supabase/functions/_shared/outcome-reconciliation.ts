export type OutcomeReconciliationStatus =
  | 'matched'
  | 'drift'
  | 'no_activity'
  | 'instrumentation_pending'

export interface OutcomeReconciliationRow {
  outcome: string
  authoritativeCount: number
  gaEventCount: number
  variance: number
  varianceRate: number | null
  status: OutcomeReconciliationStatus
}

export interface GA4OutcomeRow {
  dimensionValues: { value: string }[]
  metricValues: { value: string }[]
}

export function parseOutcomeEventCount(
  rows: GA4OutcomeRow[] = [],
  eventName: string
): number {
  return rows
    .filter(row => row.dimensionValues[0]?.value === eventName)
    .reduce(
      (total, row) => total + Number.parseInt(row.metricValues[0]?.value || '0', 10),
      0
    )
}

export function reconcileOutcome(
  outcome: string,
  authoritativeCount: number,
  gaEventCount: number,
  instrumentationLive: boolean
): OutcomeReconciliationRow {
  const variance = gaEventCount - authoritativeCount
  const varianceRate = authoritativeCount > 0
    ? Math.abs(variance) / authoritativeCount
    : null

  let status: OutcomeReconciliationStatus
  if (!instrumentationLive) {
    status = 'instrumentation_pending'
  } else if (authoritativeCount === 0 && gaEventCount === 0) {
    status = 'no_activity'
  } else if (authoritativeCount > 0 && varianceRate !== null && varianceRate <= 0.05) {
    status = 'matched'
  } else {
    status = 'drift'
  }

  return {
    outcome,
    authoritativeCount,
    gaEventCount,
    variance,
    varianceRate,
    status,
  }
}
