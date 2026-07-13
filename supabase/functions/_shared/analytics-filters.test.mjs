import assert from 'node:assert/strict'
import test from 'node:test'

import {
  BREVO_SCANNER_SOURCE_MEDIUMS,
  PRODUCTION_ANALYTICS_HOSTS,
  buildCleanProductionFilter,
  buildProductionHostFilter,
} from './analytics-filters.ts'

test('production host filter includes only the three production apps', () => {
  assert.deepEqual(
    buildProductionHostFilter().filter.inListFilter.values,
    PRODUCTION_ANALYTICS_HOSTS
  )
  assert.equal(PRODUCTION_ANALYTICS_HOSTS.includes('localhost'), false)
  assert.equal(PRODUCTION_ANALYTICS_HOSTS.some(host => host.includes('staging')), false)
})

test('clean filter excludes every observed Brevo scanner source', () => {
  const filter = buildCleanProductionFilter()
  const scannerExpressions = filter.andGroup.expressions[1].notExpression.orGroup.expressions
  const excludedSources = scannerExpressions.map(expression => expression.filter.stringFilter.value)

  assert.deepEqual(excludedSources, BREVO_SCANNER_SOURCE_MEDIUMS)
  assert.ok(scannerExpressions.every(expression =>
    expression.filter.fieldName === 'sessionSourceMedium' &&
    expression.filter.stringFilter.matchType === 'EXACT'
  ))
})

test('clean filter appends query-specific conditions without mutating inputs', () => {
  const eventFilter = {
    filter: {
      fieldName: 'eventName',
      inListFilter: { values: ['trial_page_view'], caseSensitive: true },
    },
  }
  const filter = buildCleanProductionFilter([eventFilter])

  assert.equal(filter.andGroup.expressions.length, 3)
  assert.deepEqual(filter.andGroup.expressions[2], eventFilter)
  assert.deepEqual(eventFilter.filter.inListFilter.values, ['trial_page_view'])
})
