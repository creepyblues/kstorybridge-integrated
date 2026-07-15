export type ActiveAdminAuthorization =
  | { authorized: true; adminUserId: string }
  | { authorized: false; status: 401 | 403; error: 'Unauthorized' | 'Admin access required' }

interface ActiveAdminAuthorizationInput {
  authorization: string | null
  claimedAdminUserId: unknown
  getAuthenticatedUserId: (token: string) => Promise<string | null>
  isActiveAdmin: (userId: string) => Promise<boolean>
}

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

function bearerToken(authorization: string | null): string | null {
  if (!authorization) return null
  const match = authorization.match(/^Bearer ([^\s]+)$/)
  return match?.[1] ?? null
}

export async function authorizeActiveAdminRequest({
  authorization,
  claimedAdminUserId,
  getAuthenticatedUserId,
  isActiveAdmin,
}: ActiveAdminAuthorizationInput): Promise<ActiveAdminAuthorization> {
  const token = bearerToken(authorization)
  if (!token) return { authorized: false, status: 401, error: 'Unauthorized' }

  const authenticatedUserId = await getAuthenticatedUserId(token)
  if (!authenticatedUserId || !UUID_PATTERN.test(authenticatedUserId)) {
    return { authorized: false, status: 401, error: 'Unauthorized' }
  }
  if (claimedAdminUserId !== authenticatedUserId) {
    return { authorized: false, status: 403, error: 'Admin access required' }
  }
  if (!await isActiveAdmin(authenticatedUserId)) {
    return { authorized: false, status: 403, error: 'Admin access required' }
  }

  return { authorized: true, adminUserId: authenticatedUserId }
}
