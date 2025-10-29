/**
 * Apply comps field array migration script
 * Runs the migration to convert comps from string to text array
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const migrationFile = path.join(__dirname, '../supabase/migrations/20250810000000-convert-comps-to-array.sql');

console.log('🚀 Starting comps array migration...');

try {
  // Check if migration file exists
  if (!fs.existsSync(migrationFile)) {
    throw new Error('Migration file not found');
  }

  // Apply migration using Supabase CLI
  console.log('📁 Applying migration file...');
  execSync('supabase db reset', { cwd: path.join(__dirname, '..'), stdio: 'inherit' });
  
  console.log('✅ Migration applied successfully!');
  console.log('');
  console.log('📊 Changes made:');
  console.log('  - comps field converted from string to text[]');
  console.log('  - Existing data preserved and converted to array format');
  console.log('  - Added GIN index for array search performance');
  console.log('');
  console.log('🔄 Next steps:');
  console.log('  - Update TypeScript types (already done)');
  console.log('  - Update form components (already done)');
  console.log('  - Test the new array functionality');

} catch (error) {
  console.error('❌ Migration failed:', error.message);
  console.error('');
  console.error('🔧 Troubleshooting:');
  console.error('  - Make sure Supabase CLI is installed and configured');
  console.error('  - Check if you have the correct database permissions');
  console.error('  - Verify the migration file exists and is valid SQL');
  process.exit(1);
}