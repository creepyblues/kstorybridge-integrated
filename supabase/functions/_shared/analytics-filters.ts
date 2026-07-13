export const PRODUCTION_ANALYTICS_HOSTS = [
  'kstorybridge.com',
  'dashboard.kstorybridge.com',
  'creator.kstorybridge.com',
]

// Security scanners have used multiple Brevo/Sendinblue redirect domains over
// time. Keep this list centralized so every scheduled report uses the same
// historical exclusions.
export const BREVO_SCANNER_SOURCE_MEDIUMS = [
  'lu001.r.sp1-brevo.net / referral',
  'lu001.r.a.d.sendibm1.com / referral',
  'lu001.r.bh.d.sendibt3.com / referral',
]

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
        ...additionalExpressions,
      ],
    },
  }
}
