import assert from 'node:assert/strict'
import { existsSync } from 'node:fs'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const canonicalPath = new URL('../.claude/skills/analytics/SKILL.md', import.meta.url)
const runtimePath = new URL('../.agents/skills/analytics/SKILL.md', import.meta.url)

test('manual analytics instructions preserve the clean canonical reporting contract', async () => {
  const skill = await readFile(canonicalPath, 'utf8')

  for (const eventName of [
    'signin_completed',
    'comps_search_submitted',
    'subscription_started',
    'audience_path_selected',
    'creator_inquiry_submitted',
  ]) {
    assert.match(skill, new RegExp(`"${eventName}"`))
  }
  for (const obsoleteLiteral of ['"signin"', '"comps_search"', '"checkout_completed"']) {
    assert.doesNotMatch(skill, new RegExp(obsoleteLiteral))
  }
  for (const requiredFilterValue of [
    'kstorybridge.com',
    'dashboard.kstorybridge.com',
    'creator.kstorybridge.com',
    'lu001.r.sp1-brevo.net / referral',
    'lu001.r.a.d.sendibm1.com / referral',
    'lu001.r.bh.d.sendibt3.com / referral',
    'localhost',
    '.vercel.app',
  ]) {
    assert.match(skill, new RegExp(requiredFilterValue.replaceAll('.', '\\.')))
  }

  assert.match(skill, /complete Pacific calendar days/)
  assert.match(skill, /Conversion rate: Not reported from event rows/)
  assert.match(skill, /Targets remain pending `AR-503`/)
  assert.doesNotMatch(skill, />15%|>70%|>80%|>60%|>50%|>30%/)

  const standardQueryBlocks = [...skill.matchAll(
    /```[\s\S]*?mcp__analytics-mcp__run_report:[\s\S]*?```/g
  )].map(match => match[0])
  assert.equal(standardQueryBlocks.length, 10)
  for (const queryBlock of standardQueryBlocks) {
    assert.match(queryBlock, /dimension_filter:/)
    assert.match(queryBlock, /CLEAN_PRODUCTION_FILTER/)
  }
})

test('installed agent skill matches the canonical tracked skill when present', async () => {
  if (!existsSync(runtimePath)) return

  const [canonical, runtime] = await Promise.all([
    readFile(canonicalPath, 'utf8'),
    readFile(runtimePath, 'utf8'),
  ])
  assert.equal(runtime, canonical)
})
