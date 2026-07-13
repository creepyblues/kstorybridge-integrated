#!/usr/bin/env node

import { fileURLToPath } from 'node:url'
import { resolve } from 'node:path'

const APPLY_CONFIRMATION = 'MARK_ACTIVE_ADMINS_INTERNAL'

export const normalizeEmail = email => email.trim().toLowerCase()

export const maskEmail = email => {
  const [local = '', domain = 'unknown'] = normalizeEmail(email).split('@')
  return `${local.slice(0, 1) || '*'}***@${domain}`
}

export const buildAdminCandidates = (adminRows, authUsers) => {
  const authByEmail = new Map(
    authUsers
      .filter(user => typeof user.email === 'string')
      .map(user => [normalizeEmail(user.email), user])
  )

  return adminRows.map(admin => {
    const email = normalizeEmail(admin.email)
    const authUser = authByEmail.get(email)

    return {
      email,
      maskedEmail: maskEmail(email),
      authUserId: authUser?.id ?? null,
      currentlyInternal: authUser?.app_metadata?.internal_traffic === true,
      appMetadata: authUser?.app_metadata ?? {},
    }
  })
}

const requestJson = async (url, serviceRoleKey, path, options = {}) => {
  const response = await fetch(`${url}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${serviceRoleKey}`,
      apikey: serviceRoleKey,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  })

  const body = await response.text()
  if (!response.ok) {
    throw new Error(`${options.method ?? 'GET'} ${path} failed (${response.status}): ${body}`)
  }

  return body ? JSON.parse(body) : null
}

const listAllAuthUsers = async (url, serviceRoleKey) => {
  const users = []
  const perPage = 1000

  for (let page = 1; ; page += 1) {
    const result = await requestJson(
      url,
      serviceRoleKey,
      `/auth/v1/admin/users?page=${page}&per_page=${perPage}`
    )
    const pageUsers = result?.users ?? []
    users.push(...pageUsers)

    if (pageUsers.length < perPage) return users
  }
}

const main = async () => {
  const args = new Set(process.argv.slice(2))
  const apply = args.has('--apply-admins')
  const confirmed = args.has(`--confirm=${APPLY_CONFIRMATION}`)
  const supabaseUrl = process.env.SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required')
  }

  if (apply && !confirmed) {
    throw new Error(
      `Refusing to modify auth metadata without --confirm=${APPLY_CONFIRMATION}`
    )
  }

  const [adminRows, authUsers] = await Promise.all([
    requestJson(
      supabaseUrl,
      serviceRoleKey,
      '/rest/v1/admin?select=email&active=eq.true&order=email.asc'
    ),
    listAllAuthUsers(supabaseUrl, serviceRoleKey),
  ])
  const candidates = buildAdminCandidates(adminRows ?? [], authUsers)

  console.log(`Active admin records: ${candidates.length}`)
  console.log(`Matched auth users: ${candidates.filter(candidate => candidate.authUserId).length}`)
  console.log(`Already internal: ${candidates.filter(candidate => candidate.currentlyInternal).length}`)
  console.table(
    candidates.map(candidate => ({
      account: candidate.maskedEmail,
      auth_match: Boolean(candidate.authUserId),
      internal_traffic: candidate.currentlyInternal,
    }))
  )

  if (!apply) {
    console.log(
      `Dry run only. Apply with --apply-admins --confirm=${APPLY_CONFIRMATION}`
    )
    return
  }

  const unmatched = candidates.filter(candidate => !candidate.authUserId)
  if (unmatched.length > 0) {
    throw new Error(
      `Refusing partial apply: ${unmatched.length} active admin record(s) have no matching auth user`
    )
  }

  let updated = 0
  for (const candidate of candidates) {
    if (candidate.currentlyInternal) continue

    await requestJson(
      supabaseUrl,
      serviceRoleKey,
      `/auth/v1/admin/users/${candidate.authUserId}`,
      {
        method: 'PUT',
        body: JSON.stringify({
          app_metadata: {
            ...candidate.appMetadata,
            internal_traffic: true,
          },
        }),
      }
    )
    updated += 1
  }

  console.log(`Updated auth users: ${updated}`)
  console.log('Users must refresh their session or sign in again before the new claim reaches GA.')
}

const isMain = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)
if (isMain) await main()
