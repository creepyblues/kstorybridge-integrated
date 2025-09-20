#!/usr/bin/env node

/**
 * Script to analyze auth.users raw_user_meta_data for discrepancies
 * This script will identify missing or inconsistent fields that need updates
 */

import { createClient } from '@supabase/supabase-js';

// Supabase configuration
const SUPABASE_URL = 'https://dlrnrgcoguxlkkcitlpd.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRscm5yZ2NvZ3V4bGtrY2l0bHBkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE3OTIzMzQsImV4cCI6MjA2NzM2ODMzNH0.KWYF7TvoA0I3iyoIbyYIyTSlJcIyPH6yCfHueEEMIlA';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Expected metadata structure based on codebase analysis
const EXPECTED_BUYER_FIELDS = [
  'account_type',
  'full_name',
  'buyer_company',
  'buyer_role',
  'linkedin_url',
  'tier'
];

const EXPECTED_CREATOR_FIELDS = [
  'account_type',
  'full_name',
  'pen_name',
  'ip_owner_role',
  'ip_owner_company',
  'website_url',
  'invitation_status'
];

// Valid enum values
const VALID_ACCOUNT_TYPES = ['buyer', 'creator'];
const VALID_BUYER_ROLES = ['producer', 'executive', 'agent', 'content_scout', 'other'];
const VALID_CREATOR_ROLES = ['author', 'agent'];
const VALID_TIERS = ['basic', 'invited', 'pro', 'suite'];
const VALID_INVITATION_STATUS = ['invited', 'accepted'];

async function analyzeUserMetadata() {
  try {
    console.log('🔍 Analyzing auth.users raw_user_meta_data...\n');

    // Query all users with their metadata
    const { data: users, error } = await supabase.auth.admin.listUsers();

    if (error) {
      console.error('❌ Error fetching users:', error);
      return;
    }

    console.log(`📊 Found ${users.users.length} total users\n`);

    const analysis = {
      totalUsers: users.users.length,
      usersWithMetadata: 0,
      usersWithoutMetadata: 0,
      buyerUsers: 0,
      creatorUsers: 0,
      unknownAccountType: 0,
      missingFields: {},
      invalidFields: {},
      inconsistentNaming: {},
      updateStatements: []
    };

    users.users.forEach((user, index) => {
      console.log(`\n--- User ${index + 1}: ${user.email} ---`);
      console.log(`ID: ${user.id}`);
      console.log(`Created: ${user.created_at}`);
      console.log(`Email Verified: ${user.email_confirmed_at ? 'Yes' : 'No'}`);

      const metadata = user.raw_user_meta_data || {};
      console.log('Raw Metadata:', JSON.stringify(metadata, null, 2));

      if (Object.keys(metadata).length === 0) {
        analysis.usersWithoutMetadata++;
        console.log('⚠️  No metadata found');
        return;
      }

      analysis.usersWithMetadata++;

      const accountType = metadata.account_type;
      console.log(`Account Type: ${accountType || 'MISSING'}`);

      // Analyze account type
      if (!accountType) {
        analysis.unknownAccountType++;
        console.log('❌ Missing account_type');

        // Try to determine account type from profile tables
        analysis.updateStatements.push({
          userId: user.id,
          email: user.email,
          issue: 'missing_account_type',
          suggestion: 'Check user_buyers/user_creators tables to determine account type'
        });
      } else if (!VALID_ACCOUNT_TYPES.includes(accountType)) {
        if (!analysis.invalidFields.account_type) analysis.invalidFields.account_type = [];
        analysis.invalidFields.account_type.push({
          userId: user.id,
          email: user.email,
          value: accountType
        });
        console.log(`❌ Invalid account_type: ${accountType}`);
      } else {
        if (accountType === 'buyer') {
          analysis.buyerUsers++;
          analyzeBuyerMetadata(user, metadata, analysis);
        } else if (accountType === 'creator') {
          analysis.creatorUsers++;
          analyzeCreatorMetadata(user, metadata, analysis);
        }
      }
    });

    // Print analysis summary
    printAnalysisSummary(analysis);

    // Generate SQL update statements
    generateSQLUpdates(analysis);

  } catch (error) {
    console.error('❌ Error during analysis:', error);
  }
}

function analyzeBuyerMetadata(user, metadata, analysis) {
  console.log('👔 Analyzing buyer metadata...');

  EXPECTED_BUYER_FIELDS.forEach(field => {
    if (!(field in metadata)) {
      if (!analysis.missingFields[field]) analysis.missingFields[field] = [];
      analysis.missingFields[field].push({
        userId: user.id,
        email: user.email,
        accountType: 'buyer'
      });
      console.log(`❌ Missing field: ${field}`);
    }
  });

  // Check for camelCase field names that should be snake_case
  const camelCaseMapping = {
    'fullName': 'full_name',
    'buyerCompany': 'buyer_company',
    'buyerRole': 'buyer_role',
    'linkedinUrl': 'linkedin_url'
  };

  Object.entries(camelCaseMapping).forEach(([camelCase, snakeCase]) => {
    if (metadata[camelCase] && !metadata[snakeCase]) {
      if (!analysis.inconsistentNaming[camelCase]) analysis.inconsistentNaming[camelCase] = [];
      analysis.inconsistentNaming[camelCase].push({
        userId: user.id,
        email: user.email,
        value: metadata[camelCase],
        shouldBe: snakeCase
      });
      console.log(`⚠️  Found camelCase field '${camelCase}', should be '${snakeCase}'`);
    }
  });

  // Validate field values
  if (metadata.buyer_role && !VALID_BUYER_ROLES.includes(metadata.buyer_role)) {
    if (!analysis.invalidFields.buyer_role) analysis.invalidFields.buyer_role = [];
    analysis.invalidFields.buyer_role.push({
      userId: user.id,
      email: user.email,
      value: metadata.buyer_role
    });
    console.log(`❌ Invalid buyer_role: ${metadata.buyer_role}`);
  }

  if (metadata.tier && !VALID_TIERS.includes(metadata.tier)) {
    if (!analysis.invalidFields.tier) analysis.invalidFields.tier = [];
    analysis.invalidFields.tier.push({
      userId: user.id,
      email: user.email,
      value: metadata.tier
    });
    console.log(`❌ Invalid tier: ${metadata.tier}`);
  }

  // Check for default values
  if (!metadata.tier) {
    console.log('⚠️  Missing tier, should default to "basic"');
  }
}

function analyzeCreatorMetadata(user, metadata, analysis) {
  console.log('🎨 Analyzing creator metadata...');

  EXPECTED_CREATOR_FIELDS.forEach(field => {
    if (!(field in metadata)) {
      if (!analysis.missingFields[field]) analysis.missingFields[field] = [];
      analysis.missingFields[field].push({
        userId: user.id,
        email: user.email,
        accountType: 'creator'
      });
      console.log(`❌ Missing field: ${field}`);
    }
  });

  // Check for incorrect field names
  const fieldMapping = {
    'fullName': 'full_name',
    'penName': 'pen_name',
    'penNameOrStudio': 'pen_name',
    'ipOwnerRole': 'ip_owner_role',
    'ipOwnerCompany': 'ip_owner_company',
    'websiteUrl': 'website_url'
  };

  Object.entries(fieldMapping).forEach(([incorrectName, correctName]) => {
    if (metadata[incorrectName] && !metadata[correctName]) {
      if (!analysis.inconsistentNaming[incorrectName]) analysis.inconsistentNaming[incorrectName] = [];
      analysis.inconsistentNaming[incorrectName].push({
        userId: user.id,
        email: user.email,
        value: metadata[incorrectName],
        shouldBe: correctName
      });
      console.log(`⚠️  Found incorrect field '${incorrectName}', should be '${correctName}'`);
    }
  });

  // Validate field values
  if (metadata.ip_owner_role && !VALID_CREATOR_ROLES.includes(metadata.ip_owner_role)) {
    if (!analysis.invalidFields.ip_owner_role) analysis.invalidFields.ip_owner_role = [];
    analysis.invalidFields.ip_owner_role.push({
      userId: user.id,
      email: user.email,
      value: metadata.ip_owner_role
    });
    console.log(`❌ Invalid ip_owner_role: ${metadata.ip_owner_role}`);
  }

  if (metadata.invitation_status && !VALID_INVITATION_STATUS.includes(metadata.invitation_status)) {
    if (!analysis.invalidFields.invitation_status) analysis.invalidFields.invitation_status = [];
    analysis.invalidFields.invitation_status.push({
      userId: user.id,
      email: user.email,
      value: metadata.invitation_status
    });
    console.log(`❌ Invalid invitation_status: ${metadata.invitation_status}`);
  }

  // Check for default values
  if (!metadata.invitation_status) {
    console.log('⚠️  Missing invitation_status, should default to "invited"');
  }
}

function printAnalysisSummary(analysis) {
  console.log('\n' + '='.repeat(60));
  console.log('📋 METADATA ANALYSIS SUMMARY');
  console.log('='.repeat(60));

  console.log(`\n📊 User Distribution:`);
  console.log(`   Total Users: ${analysis.totalUsers}`);
  console.log(`   Users with Metadata: ${analysis.usersWithMetadata}`);
  console.log(`   Users without Metadata: ${analysis.usersWithoutMetadata}`);
  console.log(`   Buyer Users: ${analysis.buyerUsers}`);
  console.log(`   Creator Users: ${analysis.creatorUsers}`);
  console.log(`   Unknown Account Type: ${analysis.unknownAccountType}`);

  if (Object.keys(analysis.missingFields).length > 0) {
    console.log(`\n❌ Missing Fields:`);
    Object.entries(analysis.missingFields).forEach(([field, users]) => {
      console.log(`   ${field}: ${users.length} users`);
    });
  }

  if (Object.keys(analysis.invalidFields).length > 0) {
    console.log(`\n❌ Invalid Field Values:`);
    Object.entries(analysis.invalidFields).forEach(([field, users]) => {
      console.log(`   ${field}: ${users.length} users`);
    });
  }

  if (Object.keys(analysis.inconsistentNaming).length > 0) {
    console.log(`\n⚠️  Inconsistent Field Naming:`);
    Object.entries(analysis.inconsistentNaming).forEach(([field, users]) => {
      console.log(`   ${field}: ${users.length} users`);
    });
  }
}

function generateSQLUpdates(analysis) {
  console.log('\n' + '='.repeat(60));
  console.log('🔧 GENERATED SQL UPDATE STATEMENTS');
  console.log('='.repeat(60));

  let updateStatements = [];

  // Fix inconsistent naming (camelCase to snake_case)
  Object.entries(analysis.inconsistentNaming).forEach(([incorrectField, users]) => {
    users.forEach(user => {
      const correctField = user.shouldBe;
      const sql = `
-- Fix camelCase naming for user ${user.email}
UPDATE auth.users
SET raw_user_meta_data = raw_user_meta_data - '${incorrectField}' || jsonb_build_object('${correctField}', raw_user_meta_data->>'${incorrectField}')
WHERE id = '${user.userId}';`;
      updateStatements.push(sql);
    });
  });

  // Add missing required fields with defaults
  analysis.missingFields.tier?.forEach(user => {
    if (user.accountType === 'buyer') {
      const sql = `
-- Add missing tier field for buyer ${user.email}
UPDATE auth.users
SET raw_user_meta_data = raw_user_meta_data || jsonb_build_object('tier', 'basic')
WHERE id = '${user.userId}';`;
      updateStatements.push(sql);
    }
  });

  analysis.missingFields.invitation_status?.forEach(user => {
    if (user.accountType === 'creator') {
      const sql = `
-- Add missing invitation_status field for creator ${user.email}
UPDATE auth.users
SET raw_user_meta_data = raw_user_meta_data || jsonb_build_object('invitation_status', 'invited')
WHERE id = '${user.userId}';`;
      updateStatements.push(sql);
    }
  });

  // Add missing account_type field (requires manual review)
  if (analysis.unknownAccountType > 0) {
    updateStatements.push(`
-- WARNING: ${analysis.unknownAccountType} users missing account_type
-- Manual review required to determine correct account type
-- Check user_buyers and user_creators tables to identify account type
-- Then run appropriate update statement:
--
-- For buyers:
-- UPDATE auth.users SET raw_user_meta_data = raw_user_meta_data || jsonb_build_object('account_type', 'buyer') WHERE id = 'USER_ID';
--
-- For creators:
-- UPDATE auth.users SET raw_user_meta_data = raw_user_meta_data || jsonb_build_object('account_type', 'creator') WHERE id = 'USER_ID';`);
  }

  if (updateStatements.length === 0) {
    console.log('✅ No SQL updates needed - all metadata is consistent!');
  } else {
    console.log(`\n📝 ${updateStatements.length} update statements generated:\n`);
    updateStatements.forEach((sql, index) => {
      console.log(`-- Update ${index + 1}:`);
      console.log(sql);
      console.log('');
    });

    console.log('\n⚠️  IMPORTANT NOTES:');
    console.log('1. Review all SQL statements before executing');
    console.log('2. Test in development environment first');
    console.log('3. Backup database before applying updates');
    console.log('4. Users missing account_type require manual investigation');
    console.log('5. Consider running these updates during maintenance window');
  }
}

// Run the analysis
analyzeUserMetadata().catch(console.error);