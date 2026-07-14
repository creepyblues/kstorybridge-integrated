export const PRODUCTION_ANALYTICS_HOSTS = Object.freeze([
  'kstorybridge.com',
  'dashboard.kstorybridge.com',
  'creator.kstorybridge.com',
])

export const BREVO_SCANNER_SOURCE_MEDIUMS = Object.freeze([
  'lu001.r.sp1-brevo.net / referral',
  'lu001.r.a.d.sendibm1.com / referral',
  'lu001.r.bh.d.sendibt3.com / referral',
])

export const NON_PRODUCTION_REFERRER_PATTERNS = Object.freeze([
  'localhost',
  '127.0.0.1',
  'dashboard-staging.kstorybridge.com',
  'creator-staging.kstorybridge.com',
  '.vercel.app',
])
