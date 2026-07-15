import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const source = await readFile(new URL('./index.ts', import.meta.url), 'utf8')

test('every successful approval branch passes through durable analytics finalization', () => {
  assert.equal((source.match(/return finalizeApprovalSuccess\(\{/g) ?? []).length, 3)
  assert.equal((source.match(/return approvalSuccessResponse\(/g) ?? []).length, 1)
  assert.match(source, /await enqueueTitleWorkflowOutcomesForCreator\([\s\S]*await sendApprovalNotification/)
})

test('active-admin authorization occurs before any draft read or mutation', () => {
  const authorization = source.indexOf('await authorizeActiveAdminRequest')
  const draftRead = source.indexOf(".from('title_drafts')")
  assert.ok(authorization >= 0)
  assert.ok(draftRead > authorization)
  assert.match(source, /claimedAdminUserId,[\s\S]*\.from\('admin'\)[\s\S]*\.eq\('active', true\)/)
})
