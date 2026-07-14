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

// A production-host session can still originate from local, staging, or
// preview tooling. Those referrals are development activity even though the
// destination hostname is production, so exclude them from customer KPIs.
export const NON_PRODUCTION_REFERRER_PATTERNS = [
  'localhost',
  '127.0.0.1',
  'dashboard-staging.kstorybridge.com',
  'creator-staging.kstorybridge.com',
  '.vercel.app',
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
