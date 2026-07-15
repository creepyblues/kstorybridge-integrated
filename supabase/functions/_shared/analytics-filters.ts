import {
  BREVO_SCANNER_SOURCE_MEDIUMS,
  NON_PRODUCTION_REFERRER_PATTERNS,
  PRODUCTION_ANALYTICS_HOSTS,
} from './analytics-filter-values.mjs'

export {
  BREVO_SCANNER_SOURCE_MEDIUMS,
  NON_PRODUCTION_REFERRER_PATTERNS,
  PRODUCTION_ANALYTICS_HOSTS,
}

export type GA4FilterExpression = Record<string, unknown>

export function buildProductionHostFilter(): GA4FilterExpression {
  return {
    filter: {
      fieldName: 'hostName',
      inListFilter: {
        values: [...PRODUCTION_ANALYTICS_HOSTS],
        caseSensitive: false,
      },
    },
  }
}

export function buildCleanProductionFilter(
  additionalExpressions: GA4FilterExpression[] = []
): GA4FilterExpression {
  return {
    andGroup: {
      expressions: [
        buildProductionHostFilter(),
        {
          notExpression: {
            orGroup: {
              expressions: BREVO_SCANNER_SOURCE_MEDIUMS.map(value => ({
                filter: {
                  fieldName: 'sessionSourceMedium',
                  stringFilter: {
                    matchType: 'EXACT',
                    value,
                    caseSensitive: false,
                  },
                },
              })),
            },
          },
        },
        {
          notExpression: {
            orGroup: {
              expressions: NON_PRODUCTION_REFERRER_PATTERNS.map(value => ({
                filter: {
                  fieldName: 'sessionSourceMedium',
                  stringFilter: {
                    matchType: 'CONTAINS',
                    value,
                    caseSensitive: false,
                  },
                },
              })),
            },
          },
        },
        ...additionalExpressions,
      ],
    },
  }
}
