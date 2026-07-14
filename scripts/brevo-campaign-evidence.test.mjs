import assert from 'node:assert/strict'
import test from 'node:test'

import {
  parseBrevoCampaignEvidence,
  REQUIRED_BREVO_SEND_DATES,
  summarizeBrevoCampaignGate,
} from './brevo-campaign-evidence.mjs'

const campaign = (sendDate, overrides = {}) => ({
  sendDate,
  delivered: 100,
  uniqueClicks: 10,
  knownHumanClicks: 5,
  humanClickMethod: 'manual-review',
  ...overrides,
})

const evidence = (overrides = {}) => JSON.stringify({
  schemaVersion: 1,
  source: 'brevo-export',
  collectedAt: '2026-07-14T18:00:00Z',
  campaigns: REQUIRED_BREVO_SEND_DATES.map(date => campaign(date)),
  ...overrides,
})

test('accepts only complete aggregate evidence for the three required sends', () => {
  assert.deepEqual(parseBrevoCampaignEvidence(evidence()), {
    campaignCount: 3,
    completeCampaignCount: 3,
    ready: true,
  })
})

test('treats the tracked null template as valid but pending', () => {
  const pending = evidence({
    source: 'pending',
    collectedAt: null,
    campaigns: REQUIRED_BREVO_SEND_DATES.map(date => campaign(date, {
      delivered: null,
      uniqueClicks: null,
      knownHumanClicks: null,
      humanClickMethod: 'pending',
    })),
  })
  const parsed = parseBrevoCampaignEvidence(pending)
  assert.equal(parsed.ready, false)
  assert.equal(parsed.completeCampaignCount, 0)
  assert.equal(summarizeBrevoCampaignGate(pending).status, 'PENDING')
})

test('rejects missing, duplicate, and unexpected campaign dates', () => {
  assert.throws(() => parseBrevoCampaignEvidence(evidence({
    campaigns: REQUIRED_BREVO_SEND_DATES.slice(0, 2).map(date => campaign(date)),
  })), /required_dates_missing/)
  assert.throws(() => parseBrevoCampaignEvidence(evidence({
    campaigns: [campaign(REQUIRED_BREVO_SEND_DATES[0]), campaign(REQUIRED_BREVO_SEND_DATES[0]), campaign('2026-07-09')],
  })), /invalid_campaign/)
  assert.throws(() => parseBrevoCampaignEvidence(evidence({
    campaigns: [...REQUIRED_BREVO_SEND_DATES.map(date => campaign(date)), campaign('2026-07-09')],
  })), /required_dates_missing/)
})

test('rejects negative, noninteger, and impossible count relationships', () => {
  for (const overrides of [
    { delivered: -1 },
    { uniqueClicks: 1.5 },
    { delivered: 5, uniqueClicks: 6 },
    { uniqueClicks: 5, knownHumanClicks: 6 },
  ]) {
    assert.throws(() => parseBrevoCampaignEvidence(evidence({
      campaigns: REQUIRED_BREVO_SEND_DATES.map((date, index) =>
        campaign(date, index === 0 ? overrides : {})
      ),
    })), /invalid/)
  }
})

test('requires explicit provenance for every known-human-click count', () => {
  assert.throws(() => parseBrevoCampaignEvidence(evidence({
    campaigns: REQUIRED_BREVO_SEND_DATES.map((date, index) => campaign(
      date,
      index === 0 ? { knownHumanClicks: null, humanClickMethod: 'manual-review' } : {}
    )),
  })), /human_click_basis/)
  assert.throws(() => parseBrevoCampaignEvidence(evidence({
    campaigns: REQUIRED_BREVO_SEND_DATES.map((date, index) => campaign(
      date,
      index === 0 ? { knownHumanClicks: 5, humanClickMethod: 'pending' } : {}
    )),
  })), /human_click_basis/)
})

test('requires a timezone-qualified ISO collection timestamp', () => {
  assert.throws(() => parseBrevoCampaignEvidence(evidence({
    collectedAt: '2026-07-14',
  })), /invalid_collection/)
  assert.throws(() => parseBrevoCampaignEvidence(evidence({
    collectedAt: 'July 14, 2026',
  })), /invalid_collection/)
})

test('gate fails closed for missing or malformed evidence and contains no source values', () => {
  assert.equal(summarizeBrevoCampaignGate(null).status, 'UNAVAILABLE')
  const malformed = summarizeBrevoCampaignGate('{"email":"must-not-leak@example.com"}')
  assert.equal(malformed.status, 'UNAVAILABLE')
  assert.doesNotMatch(JSON.stringify(malformed), /example\.com/)
})

test('rejects arbitrary fields so recipient or campaign-level PII cannot enter evidence', () => {
  assert.throws(() => parseBrevoCampaignEvidence(evidence({
    recipientEmail: 'must-not-be-stored@example.com',
  })), /invalid_schema/)
  assert.throws(() => parseBrevoCampaignEvidence(evidence({
    campaigns: REQUIRED_BREVO_SEND_DATES.map((date, index) => ({
      ...campaign(date),
      ...(index === 0 ? { recipient: 'private-value' } : {}),
    })),
  })), /invalid_campaign/)
})
