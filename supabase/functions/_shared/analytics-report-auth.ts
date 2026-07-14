export type AnalyticsReportTriggerKind =
  | 'scheduled'
  | 'manual'
  | 'local_progress'
  | 'github_progress'

export type FunnelAuthorization =
  | { authorized: true; triggerKind: 'scheduled' | 'manual' }
  | { authorized: false; reason: 'missing_configuration' | 'invalid_credentials' }

function constantTimeEqual(left: string, right: string): boolean {
  const maxLength = Math.max(left.length, right.length)
  let mismatch = left.length ^ right.length

  for (let index = 0; index < maxLength; index += 1) {
    mismatch |= (left.charCodeAt(index) || 0) ^ (right.charCodeAt(index) || 0)
  }

  return mismatch === 0
}

export function bearerToken(authorization: string | null): string | null {
  if (!authorization) return null
  const match = authorization.match(/^Bearer ([^\s]+)$/)
  return match?.[1] ?? null
}

export function isServiceRoleRequest(
  authorization: string | null,
  serviceRoleKey: string | undefined
): boolean {
  if (!serviceRoleKey) return false
  const token = bearerToken(authorization)
  return token !== null && constantTimeEqual(token, serviceRoleKey)
}

export function authorizeFunnelReportRequest({
  authorization,
  cronSecretHeader,
  serviceRoleKey,
  cronSecret,
}: {
  authorization: string | null
  cronSecretHeader: string | null
  serviceRoleKey: string | undefined
  cronSecret: string | undefined
}): FunnelAuthorization {
  if (!serviceRoleKey || !cronSecret) {
    return { authorized: false, reason: 'missing_configuration' }
  }

  if (cronSecretHeader && constantTimeEqual(cronSecretHeader, cronSecret)) {
    return { authorized: true, triggerKind: 'scheduled' }
  }

  if (isServiceRoleRequest(authorization, serviceRoleKey)) {
    return { authorized: true, triggerKind: 'manual' }
  }

  return { authorized: false, reason: 'invalid_credentials' }
}

export function validateInvocationKey(value: unknown): string | null {
  if (typeof value !== 'string') return null
  const normalized = value.trim()
  if (normalized.length < 8 || normalized.length > 160) return null
  if (!/^[a-z0-9][a-z0-9:._-]+$/i.test(normalized)) return null
  return normalized
}

export function scheduledFunnelInvocationKey(
  startDate: string,
  endDate: string
): string {
  return `weekly-funnel:${startDate}:${endDate}:v1`
}

export function progressInvocationKey(
  triggerKind: 'local_progress' | 'github_progress',
  date: string,
  revision: string
): string {
  const safeRevision = revision.replace(/[^a-z0-9._-]/gi, '').slice(0, 40) || 'unknown'
  return `analytics-progress:${triggerKind}:${date}:${safeRevision}`
}
