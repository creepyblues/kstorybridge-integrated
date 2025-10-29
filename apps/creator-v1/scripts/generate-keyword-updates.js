#!/usr/bin/env node

/**
 * Generate SQL UPDATE queries from Excel file to update title keywords
 *
 * Usage: node generate-keyword-updates.js [path-to-excel-file]
 *
 * Input: Excel file with columns: title_name_kr, keywords
 * Output: SQL migration file with UPDATE statements
 */

const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

// Configuration
const EXCEL_FILE_PATH = process.argv[2] || '/Users/sungholee/code/kstorybridge-v2/query.xlsx';
const MIGRATION_DIR = path.join(__dirname, '../supabase/migrations');
const TIMESTAMP = new Date().toISOString().split('T')[0].replace(/-/g, '');

// Helper function to escape single quotes for SQL
function escapeSqlString(str) {
  if (!str) return '';
  return str.replace(/'/g, "''");
}

// Helper function to parse keywords string into array
function parseKeywords(keywordsString) {
  if (!keywordsString) return [];

  // Split by comma and trim whitespace
  const keywords = keywordsString
    .split(',')
    .map(k => k.trim())
    .filter(k => k.length > 0);

  return keywords;
}

// Helper function to generate PostgreSQL ARRAY literal
function generateArrayLiteral(keywords) {
  if (!keywords || keywords.length === 0) {
    return "'{}'";
  }

  const escapedKeywords = keywords.map(k => `'${escapeSqlString(k)}'`);
  return `ARRAY[${escapedKeywords.join(', ')}]`;
}

// Main function
function generateSqlUpdates() {
  console.log('📖 Reading Excel file:', EXCEL_FILE_PATH);

  // Check if file exists
  if (!fs.existsSync(EXCEL_FILE_PATH)) {
    console.error('❌ Error: Excel file not found at', EXCEL_FILE_PATH);
    process.exit(1);
  }

  // Read Excel file
  const workbook = XLSX.readFile(EXCEL_FILE_PATH);
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];

  // Convert to JSON
  const data = XLSX.utils.sheet_to_json(worksheet);

  console.log(`✅ Found ${data.length} rows in Excel file`);

  if (data.length === 0) {
    console.error('❌ Error: No data found in Excel file');
    process.exit(1);
  }

  // Validate columns
  const firstRow = data[0];
  if (!firstRow.title_name_kr && !firstRow.keywords) {
    console.error('❌ Error: Expected columns "title_name_kr" and "keywords"');
    console.error('Found columns:', Object.keys(firstRow));
    process.exit(1);
  }

  // Generate SQL statements
  const sqlStatements = [];
  let successCount = 0;
  let skippedCount = 0;

  data.forEach((row, index) => {
    const titleNameKr = row.title_name_kr;
    const keywordsString = row.keywords;

    // Skip rows without title name
    if (!titleNameKr) {
      console.warn(`⚠️  Row ${index + 2}: Skipping - no title_name_kr`);
      skippedCount++;
      return;
    }

    // Parse keywords
    const keywords = parseKeywords(keywordsString);

    if (keywords.length === 0) {
      console.warn(`⚠️  Row ${index + 2}: Skipping "${titleNameKr}" - no keywords`);
      skippedCount++;
      return;
    }

    // Generate UPDATE statement
    const arrayLiteral = generateArrayLiteral(keywords);
    const sql = `UPDATE titles
SET keywords = ${arrayLiteral},
    updated_at = now()
WHERE title_name_kr = '${escapeSqlString(titleNameKr)}';`;

    sqlStatements.push(sql);
    successCount++;

    console.log(`✅ Row ${index + 2}: "${titleNameKr}" - ${keywords.length} keywords`);
  });

  console.log('\n📊 Summary:');
  console.log(`   Total rows: ${data.length}`);
  console.log(`   Generated updates: ${successCount}`);
  console.log(`   Skipped: ${skippedCount}`);

  if (sqlStatements.length === 0) {
    console.error('\n❌ No SQL statements generated. Exiting.');
    process.exit(1);
  }

  // Create migration file
  const migrationFileName = `${TIMESTAMP}000000_update_title_keywords.sql`;
  const migrationFilePath = path.join(MIGRATION_DIR, migrationFileName);

  // Ensure migration directory exists
  if (!fs.existsSync(MIGRATION_DIR)) {
    fs.mkdirSync(MIGRATION_DIR, { recursive: true });
  }

  // Generate full migration content
  const migrationContent = `-- Migration: Update title keywords from Excel import
-- Generated: ${new Date().toISOString()}
-- Source: ${path.basename(EXCEL_FILE_PATH)}
-- Updates: ${successCount} titles

BEGIN;

${sqlStatements.join('\n\n')}

-- Log update count
DO $$
DECLARE
  updated_count INTEGER;
BEGIN
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RAISE NOTICE 'Updated % title(s) with new keywords', updated_count;
END $$;

COMMIT;
`;

  // Write migration file
  fs.writeFileSync(migrationFilePath, migrationContent, 'utf8');

  console.log('\n✅ Migration file created:');
  console.log(`   ${migrationFilePath}`);
  console.log('\n📝 Next steps:');
  console.log('   1. Review the generated SQL file');
  console.log('   2. cd apps/dashboard/supabase');
  console.log('   3. npx supabase db push');

  return migrationFilePath;
}

// Run script
try {
  generateSqlUpdates();
} catch (error) {
  console.error('\n❌ Error generating SQL:', error.message);
  console.error(error.stack);
  process.exit(1);
}
