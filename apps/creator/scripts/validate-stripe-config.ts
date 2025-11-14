/**
 * Stripe Configuration Validation Script
 *
 * Purpose: Verify all required Stripe environment variables are properly configured
 * Usage: npx tsx scripts/validate-stripe-config.ts
 *
 * Checks:
 * - All required env vars exist
 * - Price IDs have correct format (price_xxx)
 * - Product IDs have correct format (prod_xxx)
 * - Publishable key has correct format (pk_test_xxx or pk_live_xxx)
 */

interface ValidationResult {
  variable: string;
  status: 'success' | 'warning' | 'error';
  message: string;
}

const requiredEnvVars = [
  { key: 'VITE_STRIPE_PUBLISHABLE_KEY', format: /^pk_(test|live)_/ },
  { key: 'VITE_STRIPE_PRICE_PACKAGING_MONTHLY_LAUNCH', format: /^price_/ },
  { key: 'VITE_STRIPE_PRICE_PACKAGING_YEARLY_LAUNCH', format: /^price_/ },
  { key: 'VITE_STRIPE_PRICE_PREMIUM_MONTHLY_LAUNCH', format: /^price_/ },
  { key: 'VITE_STRIPE_PRICE_PREMIUM_YEARLY_LAUNCH', format: /^price_/ },
  { key: 'VITE_STRIPE_PRICE_PACKAGING_MONTHLY_REGULAR', format: /^price_/ },
  { key: 'VITE_STRIPE_PRICE_PACKAGING_YEARLY_REGULAR', format: /^price_/ },
  { key: 'VITE_STRIPE_PRICE_PREMIUM_MONTHLY_REGULAR', format: /^price_/ },
  { key: 'VITE_STRIPE_PRICE_PREMIUM_YEARLY_REGULAR', format: /^price_/ },
  { key: 'VITE_STRIPE_PRODUCT_PACKAGING', format: /^prod_/ },
  { key: 'VITE_STRIPE_PRODUCT_PREMIUM', format: /^prod_/ },
];

const optionalEnvVars = [
  { key: 'VITE_STRIPE_COUPON_BUNDLE_2', format: /^BUNDLE25$/ },
  { key: 'VITE_STRIPE_COUPON_BUNDLE_3', format: /^BUNDLE40$/ },
  { key: 'VITE_LAUNCH_PROMO_ACTIVE', format: /^(true|false)$/ },
  { key: 'VITE_LAUNCH_PROMO_END_DATE', format: /^\d{4}-\d{2}-\d{2}$/ },
];

function validateEnvVar(key: string, format: RegExp, required: boolean = true): ValidationResult {
  const value = import.meta.env[key];

  if (!value) {
    return {
      variable: key,
      status: required ? 'error' : 'warning',
      message: required ? 'Missing (required)' : 'Missing (optional)',
    };
  }

  if (!format.test(value)) {
    return {
      variable: key,
      status: 'warning',
      message: `Invalid format. Expected: ${format.toString()}. Got: ${value.substring(0, 20)}...`,
    };
  }

  return {
    variable: key,
    status: 'success',
    message: `${value.substring(0, 25)}...`,
  };
}

function printResults(results: ValidationResult[], title: string) {
  console.log(`\n${'='.repeat(80)}`);
  console.log(title);
  console.log('='.repeat(80));

  results.forEach((result) => {
    const icon = result.status === 'success' ? '✅' : result.status === 'warning' ? '⚠️' : '❌';
    const padding = ' '.repeat(Math.max(0, 60 - result.variable.length));
    console.log(`${icon} ${result.variable}${padding}${result.message}`);
  });
}

function main() {
  console.log('\n🔍 Validating Stripe Configuration...\n');

  // Validate required env vars
  const requiredResults = requiredEnvVars.map((config) =>
    validateEnvVar(config.key, config.format, true)
  );

  // Validate optional env vars
  const optionalResults = optionalEnvVars.map((config) =>
    validateEnvVar(config.key, config.format, false)
  );

  // Print results
  printResults(requiredResults, 'REQUIRED ENVIRONMENT VARIABLES');
  printResults(optionalResults, 'OPTIONAL ENVIRONMENT VARIABLES');

  // Summary
  const errors = requiredResults.filter((r) => r.status === 'error').length;
  const warnings = [...requiredResults, ...optionalResults].filter((r) => r.status === 'warning')
    .length;
  const success = requiredResults.filter((r) => r.status === 'success').length;

  console.log(`\n${'='.repeat(80)}`);
  console.log('SUMMARY');
  console.log('='.repeat(80));
  console.log(`✅ Success: ${success}/${requiredEnvVars.length} required variables configured`);
  console.log(`⚠️  Warnings: ${warnings} variables with format issues`);
  console.log(`❌ Errors: ${errors} required variables missing`);

  if (errors > 0) {
    console.log(
      '\n❌ VALIDATION FAILED: Missing required environment variables. Please add them to .env.local'
    );
    process.exit(1);
  } else if (warnings > 0) {
    console.log(
      '\n⚠️  VALIDATION PASSED WITH WARNINGS: Some variables have unexpected formats. Review above.'
    );
    process.exit(0);
  } else {
    console.log('\n✅ VALIDATION PASSED: All Stripe environment variables are properly configured!');
    process.exit(0);
  }
}

main();
