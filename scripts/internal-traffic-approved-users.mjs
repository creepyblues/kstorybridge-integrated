#!/usr/bin/env node

import { fileURLToPath } from 'node:url'
import { resolve } from 'node:path'

export const APPLY_CONFIRMATION = 'MARK_APPROVED_USERS_INTERNAL'
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
const MAX_APPROVED_USERS = 100

export function parseApprovedUserIds(value) {
  const ids = [...new Set(String(value ?? '')
    .split(',')
    .map(item => item.trim().toLowerCase())
    .filter(Boolean))]
  if (ids.length === 0) throw new Error('approved_internal_users_missing')
  if (ids.length > MAX_APPROVED_USERS || ids.some(id => !UUID_PATTERN.test(id))) {
    throw new Error('approved_internal_users_invalid')
  }
  return ids
}

const requestUser = async ({ supabaseUrl, serviceRoleKey, userId, method = 'GET', body }) => {
  const response = await fetch(`${supabaseUrl}/auth/v1/admin/users/${userId}`, {
    method,
    headers: {
      apikey: serviceRoleKey,
      Authorization: `Bearer ${serviceRoleKey}`,
      'Content-Type': 'application/json',
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  })
  if (response.status === 404) return null
  if (!response.ok) throw new Error('approved_internal_users_auth_request_failed')
  return response.json()
}

export async function reconcileApprovedInternalUsers({
  userIds,
  apply = false,
  requestUserImpl = requestUser,
  supabaseUrl,
  serviceRoleKey,
} = {}) {
  if (!Array.isArray(userIds) || userIds.length === 0) {
    throw new Error('approved_internal_users_missing')
  }
  const approvedUserIds = parseApprovedUserIds(userIds.join(','))
  if (approvedUserIds.length !== userIds.length) {
    throw new Error('approved_internal_users_invalid')
  }
  const users = []
  for (const userId of approvedUserIds) {
    users.push(await requestUserImpl({ supabaseUrl, serviceRoleKey, userId }))
  }
  const missing = users.filter(user => !user).length
  const alreadyInternal = users.filter(user => user?.app_metadata?.internal_traffic === true).length
  if (apply && missing > 0) throw new Error('approved_internal_users_refuse_partial_apply')

  let updated = 0
  if (apply) {
    for (let index = 0; index < users.length; index += 1) {
      const user = users[index]
      if (user.app_metadata?.internal_traffic === true) continue
      await requestUserImpl({
        supabaseUrl,
        serviceRoleKey,
        userId: approvedUserIds[index],
        method: 'PUT',
        body: {
          app_metadata: {
            ...(user.app_metadata ?? {}),
            internal_traffic: true,
          },
        },
      })
      updated += 1
    }
    for (const userId of approvedUserIds) {
      const verified = await requestUserImpl({ supabaseUrl, serviceRoleKey, userId })
      if (verified?.app_metadata?.internal_traffic !== true) {
        throw new Error('approved_internal_users_verification_failed')
      }
    }
  }

  return {
    approvedCount: approvedUserIds.length,
    matchedCount: users.length - missing,
    missingCount: missing,
    alreadyInternalCount: alreadyInternal,
    updatedCount: updated,
    allInternal: apply ? true : missing === 0 && alreadyInternal === users.length,
  }
}

const main = async () => {
  const args = new Set(process.argv.slice(2))
  const apply = args.has('--apply-users')
  const confirmed = args.has(`--confirm=${APPLY_CONFIRMATION}`)
  if (apply && !confirmed) {
    throw new Error(`Refusing auth metadata writes without --confirm=${APPLY_CONFIRMATION}`)
  }
  const supabaseUrl = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!supabaseUrl || !serviceRoleKey) throw new Error('missing_server_credentials')

  const userIds = parseApprovedUserIds(process.env.INTERNAL_TRAFFIC_USER_IDS)
  const result = await reconcileApprovedInternalUsers({
    userIds,
    apply,
    supabaseUrl,
    serviceRoleKey,
  })
  console.log(JSON.stringify(result, null, 2))
  if (!apply) {
    console.log(`Dry run only. Apply with --apply-users --confirm=${APPLY_CONFIRMATION}`)
  } else {
    console.log('Approved users must refresh their session or sign in again before the protected claim reaches GA.')
  }
}

const isMain = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)
if (isMain) await main()
