#!/usr/bin/env node

import { readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { resolve } from 'node:path'

export const REQUIRED_BREVO_SEND_DATES = Object.freeze([
  '2026-06-17',
  '2026-06-24',
  '2026-07-08',
])

const EVIDENCE_SOURCES = new Set([
  'pending',
  'brevo-api',
  'brevo-export',
  'brevo-ui',
])
const HUMAN_CLICK_METHODS = new Set([
  'pending',
  'brevo-reported',
  'manual-review',
])
const ISO_TIMESTAMP_PATTERN = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?(?:Z|[+-]\d{2}:\d{2})$/
const DEFAULT_EVIDENCE_PATH = resolve(
  'docs/active/BREVO_CAMPAIGN_AGGREGATE_EVIDENCE.json'
)
const TOP_LEVEL_FIELDS = new Set(['schemaVersion', 'source', 'collectedAt', 'campaigns'])
const CAMPAIGN_FIELDS = new Set([
  'sendDate',
  'delivered',
  'uniqueClicks',
  'knownHumanClicks',
  'humanClickMethod',
])

const isCountOrNull = value => value === null || Number.isSafeInteger(value) && value >= 0
const hasOnlyFields = (value, allowed) =>
  Object.keys(value).length === allowed.size
  && Object.keys(value).every(key => allowed.has(key))

export function parseBrevoCampaignEvidence(text) {
  let evidence
  try {
    evidence = JSON.parse(text)
  } catch {
    throw new Error('brevo_evidence_invalid_json')
  }

  if (
    !evidence
    || Array.isArray(evidence)
    || !hasOnlyFields(evidence, TOP_LEVEL_FIELDS)
    || evidence.schemaVersion !== 1
    || !EVIDENCE_SOURCES.has(evidence.source)
    || !Array.isArray(evidence.campaigns)
  ) {
    throw new Error('brevo_evidence_invalid_schema')
  }

  if (evidence.source === 'pending') {
    if (evidence.collectedAt !== null) throw new Error('brevo_evidence_invalid_collection')
  } else if (
    typeof evidence.collectedAt !== 'string'
    || !ISO_TIMESTAMP_PATTERN.test(evidence.collectedAt)
    || !Number.isFinite(Date.parse(evidence.collectedAt))
  ) {
    throw new Error('brevo_evidence_invalid_collection')
  }

  const campaignsByDate = new Map()
  for (const campaign of evidence.campaigns) {
    if (
      !campaign
      || Array.isArray(campaign)
      || !hasOnlyFields(campaign, CAMPAIGN_FIELDS)
      || typeof campaign.sendDate !== 'string'
      || campaignsByDate.has(campaign.sendDate)
      || !isCountOrNull(campaign.delivered)
      || !isCountOrNull(campaign.uniqueClicks)
      || !isCountOrNull(campaign.knownHumanClicks)
      || !HUMAN_CLICK_METHODS.has(campaign.humanClickMethod)
    ) {
      throw new Error('brevo_evidence_invalid_campaign')
    }

    if (
      campaign.delivered !== null
      && campaign.uniqueClicks !== null
      && campaign.uniqueClicks > campaign.delivered
    ) {
      throw new Error('brevo_evidence_invalid_count_order')
    }
    if (
      campaign.uniqueClicks !== null
      && campaign.knownHumanClicks !== null
      && campaign.knownHumanClicks > campaign.uniqueClicks
    ) {
      throw new Error('brevo_evidence_invalid_count_order')
    }
    if (
      (campaign.knownHumanClicks === null) !== (campaign.humanClickMethod === 'pending')
    ) {
      throw new Error('brevo_evidence_invalid_human_click_basis')
    }

    campaignsByDate.set(campaign.sendDate, campaign)
  }

  if (
    campaignsByDate.size !== REQUIRED_BREVO_SEND_DATES.length
    || REQUIRED_BREVO_SEND_DATES.some(date => !campaignsByDate.has(date))
  ) {
    throw new Error('brevo_evidence_required_dates_missing')
  }

  const completeCampaigns = REQUIRED_BREVO_SEND_DATES.filter(date => {
    const campaign = campaignsByDate.get(date)
    return Number.isSafeInteger(campaign.delivered)
      && Number.isSafeInteger(campaign.uniqueClicks)
      && Number.isSafeInteger(campaign.knownHumanClicks)
      && campaign.humanClickMethod !== 'pending'
  }).length
  const ready = evidence.source !== 'pending'
    && completeCampaigns === REQUIRED_BREVO_SEND_DATES.length

  return {
    campaignCount: campaignsByDate.size,
    completeCampaignCount: completeCampaigns,
    ready,
  }
}

export function summarizeBrevoCampaignGate(text) {
  if (typeof text !== 'string') {
    return {
      id: 'AR-008',
      name: 'Brevo campaign aggregate evidence',
      status: 'UNAVAILABLE',
      summary: 'the tracked Brevo aggregate evidence is missing or unreadable',
      alert: 'AR-008 Brevo evidence is unavailable; restore the aggregate-only record before evaluating email performance',
    }
  }

  try {
    const evidence = parseBrevoCampaignEvidence(text)
    if (evidence.ready) {
      return {
        id: 'AR-008',
        name: 'Brevo campaign aggregate evidence',
        status: 'HEALTHY',
        summary: '3/3 required campaign aggregates have verified provider and human-click evidence',
        alert: null,
      }
    }
    return {
      id: 'AR-008',
      name: 'Brevo campaign aggregate evidence',
      status: 'PENDING',
      summary: `${evidence.completeCampaignCount}/3 required campaign aggregates are complete`,
      alert: 'AR-008 Brevo delivered, unique-click, and known-human-click aggregates remain incomplete; do not infer email performance from scanner traffic',
    }
  } catch {
    return {
      id: 'AR-008',
      name: 'Brevo campaign aggregate evidence',
      status: 'UNAVAILABLE',
      summary: 'the tracked Brevo aggregate evidence is malformed',
      alert: 'AR-008 Brevo evidence failed validation; repair the aggregate-only record before evaluating email performance',
    }
  }
}

const main = async () => {
  const evidencePath = process.argv[2] ? resolve(process.argv[2]) : DEFAULT_EVIDENCE_PATH
  const result = parseBrevoCampaignEvidence(await readFile(evidencePath, 'utf8'))
  console.log(JSON.stringify(result, null, 2))
  if (!result.ready) process.exitCode = 2
}

const isMain = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)
if (isMain) await main()
