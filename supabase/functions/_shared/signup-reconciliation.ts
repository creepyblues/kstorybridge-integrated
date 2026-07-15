export type SignupAccountType = 'buyer' | 'creator'

export type SignupReconciliationStatus =
  | 'matched'
  | 'drift'
  | 'instrumentation_pending'
  | 'no_activity'

export interface SignupCounts {
  buyer: number
  creator: number
}

export interface SignupReconciliationRow {
  accountType: SignupAccountType
  authoritativeProfiles: number
  gaCompletedUsers: number
  variance: number
  varianceRate: number | null
  status: SignupReconciliationStatus
}

export interface GA4SignupRow {
  dimensionValues: { value: string }[]
  metricValues: { value: string }[]
}

const HOST_ACCOUNT_TYPES: Record<string, SignupAccountType> = {
  'dashboard.kstorybridge.com': 'buyer',
  'creator.kstorybridge.com': 'creator',
}

export function parseSignupUsersByHost(rows: GA4SignupRow[] = []): SignupCounts {
  const counts: SignupCounts = { buyer: 0, creator: 0 }

  for (const row of rows) {
    const accountType = HOST_ACCOUNT_TYPES[row.dimensionValues[0]?.value]
    if (!accountType) continue

    counts[accountType] += Number.parseInt(row.metricValues[0]?.value || '0', 10)
  }

  return counts
}

export function reconcileSignupCounts(
  profiles: SignupCounts,
  gaUsers: SignupCounts,
  instrumentationLive: boolean
): SignupReconciliationRow[] {
  return (['buyer', 'creator'] as const).map(accountType => {
    const authoritativeProfiles = profiles[accountType]
    const gaCompletedUsers = gaUsers[accountType]
    const variance = gaCompletedUsers - authoritativeProfiles
    const varianceRate = authoritativeProfiles > 0
      ? Math.abs(variance) / authoritativeProfiles
      : null

    let status: SignupReconciliationStatus
    if (!instrumentationLive) {
      status = 'instrumentation_pending'
    } else if (authoritativeProfiles === 0 && gaCompletedUsers === 0) {
      status = 'no_activity'
    } else if (authoritativeProfiles > 0 && varianceRate !== null && varianceRate <= 0.05) {
      status = 'matched'
    } else {
      status = 'drift'
    }

    return {
      accountType,
      authoritativeProfiles,
      gaCompletedUsers,
      variance,
      varianceRate,
      status,
    }
  })
}

export function isInstrumentationLiveForWindow(
  liveAt: string | undefined,
  windowStart: Date
): boolean {
  if (!liveAt) return false

  const liveAtDate = new Date(liveAt)
  return !Number.isNaN(liveAtDate.getTime()) && liveAtDate <= windowStart
}
