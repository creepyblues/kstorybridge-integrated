/**
 * Utility to analyze user metadata discrepancies
 * Can be run from browser console or as a debug utility
 */

import { supabase } from '@/integrations/supabase/client';

// Expected metadata structure based on codebase analysis
const EXPECTED_BUYER_FIELDS = [
  'account_type',
  'full_name',
  'buyer_company',
  'buyer_role',
  'linkedin_url',
  'tier'
] as const;

const EXPECTED_CREATOR_FIELDS = [
  'account_type',
  'full_name',
  'pen_name',
  'ip_owner_role',
  'ip_owner_company',
  'website_url',
  'invitation_status'
] as const;

// Valid enum values
const VALID_ACCOUNT_TYPES = ['buyer', 'creator'] as const;
const VALID_BUYER_ROLES = ['producer', 'executive', 'agent', 'content_scout', 'other'] as const;
const VALID_CREATOR_ROLES = ['author', 'agent'] as const;
const VALID_TIERS = ['basic', 'invited', 'pro', 'suite'] as const;
const VALID_INVITATION_STATUS = ['invited', 'accepted'] as const;

interface MetadataIssue {
  userId: string;
  email: string;
  issueType: 'missing_field' | 'invalid_value' | 'camelcase_naming' | 'missing_account_type';
  field?: string;
  currentValue?: any;
  expectedValue?: any;
  suggestion: string;
}

interface AnalysisResult {
  totalUsersAnalyzed: number;
  buyerUsers: number;
  creatorUsers: number;
  usersWithIssues: number;
  issues: MetadataIssue[];
  sqlStatements: string[];
}

export async function analyzeCurrentUserMetadata(): Promise<void> {
  try {
    console.log('🔍 Analyzing current user metadata from profiles...\n');

    // Since we can't access auth.users directly, we'll analyze based on profile tables
    // and cross-reference with current user metadata

    const [buyerProfiles, creatorProfiles] = await Promise.all([
      supabase.from('user_buyers').select('*'),
      supabase.from('user_creators').select('*')
    ]);

    if (buyerProfiles.error) {
      console.error('❌ Error fetching buyer profiles:', buyerProfiles.error);
      return;
    }

    if (creatorProfiles.error) {
      console.error('❌ Error fetching creator profiles:', creatorProfiles.error);
      return;
    }

    const analysis: AnalysisResult = {
      totalUsersAnalyzed: 0,
      buyerUsers: buyerProfiles.data?.length || 0,
      creatorUsers: creatorProfiles.data?.length || 0,
      usersWithIssues: 0,
      issues: [],
      sqlStatements: []
    };

    console.log(`📊 Found ${analysis.buyerUsers} buyers and ${analysis.creatorUsers} creators\n`);

    // For demonstration, let's analyze the current user's metadata
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      console.error('❌ Could not get current user:', userError);
      return;
    }

    console.log('--- Current User Analysis ---');
    console.log(`Email: ${user.email}`);
    console.log(`ID: ${user.id}`);
    console.log('Raw Metadata:', JSON.stringify(user.user_metadata, null, 2));

    // Analyze current user metadata
    const userIssues = analyzeUserMetadataStructure(user);
    analysis.issues.push(...userIssues);
    analysis.totalUsersAnalyzed = 1;

    if (userIssues.length > 0) {
      analysis.usersWithIssues = 1;
      console.log(`\n❌ Found ${userIssues.length} issues with current user metadata:`);
      userIssues.forEach((issue, index) => {
        console.log(`\n${index + 1}. ${issue.issueType.toUpperCase()}`);
        console.log(`   Field: ${issue.field || 'N/A'}`);
        console.log(`   Current: ${issue.currentValue || 'N/A'}`);
        console.log(`   Expected: ${issue.expectedValue || 'N/A'}`);
        console.log(`   Suggestion: ${issue.suggestion}`);
      });
    } else {
      console.log('✅ Current user metadata looks good!');
    }

    // Generate SQL statements for common issues
    generateMetadataFixStatements(analysis);

    // Print summary
    printAnalysisSummary(analysis);

  } catch (error) {
    console.error('❌ Error during metadata analysis:', error);
  }
}

function analyzeUserMetadataStructure(user: any): MetadataIssue[] {
  const issues: MetadataIssue[] = [];
  const metadata = user.user_metadata || {};
  const accountType = metadata.account_type;

  // Check if account_type is missing
  if (!accountType) {
    issues.push({
      userId: user.id,
      email: user.email,
      issueType: 'missing_account_type',
      field: 'account_type',
      suggestion: 'Determine account type from profile tables and update metadata'
    });
    return issues; // Can't analyze further without account type
  }

  // Check if account_type is valid
  if (!VALID_ACCOUNT_TYPES.includes(accountType)) {
    issues.push({
      userId: user.id,
      email: user.email,
      issueType: 'invalid_value',
      field: 'account_type',
      currentValue: accountType,
      expectedValue: 'buyer or creator',
      suggestion: 'Update account_type to valid value'
    });
  }

  if (accountType === 'buyer') {
    // Check buyer-specific fields
    EXPECTED_BUYER_FIELDS.forEach(field => {
      if (!(field in metadata)) {
        issues.push({
          userId: user.id,
          email: user.email,
          issueType: 'missing_field',
          field,
          suggestion: `Add missing ${field} field to metadata`
        });
      }
    });

    // Check for camelCase naming issues
    const camelCaseFields = {
      'fullName': 'full_name',
      'buyerCompany': 'buyer_company',
      'buyerRole': 'buyer_role',
      'linkedinUrl': 'linkedin_url'
    };

    Object.entries(camelCaseFields).forEach(([camelCase, snakeCase]) => {
      if (metadata[camelCase] && !metadata[snakeCase]) {
        issues.push({
          userId: user.id,
          email: user.email,
          issueType: 'camelcase_naming',
          field: camelCase,
          currentValue: metadata[camelCase],
          expectedValue: snakeCase,
          suggestion: `Rename ${camelCase} to ${snakeCase}`
        });
      }
    });

    // Validate field values
    if (metadata.buyer_role && !VALID_BUYER_ROLES.includes(metadata.buyer_role)) {
      issues.push({
        userId: user.id,
        email: user.email,
        issueType: 'invalid_value',
        field: 'buyer_role',
        currentValue: metadata.buyer_role,
        expectedValue: VALID_BUYER_ROLES.join(', '),
        suggestion: 'Update to valid buyer role'
      });
    }

    if (metadata.tier && !VALID_TIERS.includes(metadata.tier)) {
      issues.push({
        userId: user.id,
        email: user.email,
        issueType: 'invalid_value',
        field: 'tier',
        currentValue: metadata.tier,
        expectedValue: VALID_TIERS.join(', '),
        suggestion: 'Update to valid tier value'
      });
    }

    // Check for missing defaults
    if (!metadata.tier) {
      issues.push({
        userId: user.id,
        email: user.email,
        issueType: 'missing_field',
        field: 'tier',
        expectedValue: 'basic',
        suggestion: 'Add default tier "basic"'
      });
    }

  } else if (accountType === 'creator') {
    // Check creator-specific fields
    EXPECTED_CREATOR_FIELDS.forEach(field => {
      if (!(field in metadata)) {
        issues.push({
          userId: user.id,
          email: user.email,
          issueType: 'missing_field',
          field,
          suggestion: `Add missing ${field} field to metadata`
        });
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
        issues.push({
          userId: user.id,
          email: user.email,
          issueType: 'camelcase_naming',
          field: incorrectName,
          currentValue: metadata[incorrectName],
          expectedValue: correctName,
          suggestion: `Rename ${incorrectName} to ${correctName}`
        });
      }
    });

    // Validate field values
    if (metadata.ip_owner_role && !VALID_CREATOR_ROLES.includes(metadata.ip_owner_role)) {
      issues.push({
        userId: user.id,
        email: user.email,
        issueType: 'invalid_value',
        field: 'ip_owner_role',
        currentValue: metadata.ip_owner_role,
        expectedValue: VALID_CREATOR_ROLES.join(', '),
        suggestion: 'Update to valid creator role'
      });
    }

    if (metadata.invitation_status && !VALID_INVITATION_STATUS.includes(metadata.invitation_status)) {
      issues.push({
        userId: user.id,
        email: user.email,
        issueType: 'invalid_value',
        field: 'invitation_status',
        currentValue: metadata.invitation_status,
        expectedValue: VALID_INVITATION_STATUS.join(', '),
        suggestion: 'Update to valid invitation status'
      });
    }

    // Check for missing defaults
    if (!metadata.invitation_status) {
      issues.push({
        userId: user.id,
        email: user.email,
        issueType: 'missing_field',
        field: 'invitation_status',
        expectedValue: 'invited',
        suggestion: 'Add default invitation_status "invited"'
      });
    }
  }

  return issues;
}

function generateMetadataFixStatements(analysis: AnalysisResult): void {
  console.log('\n' + '='.repeat(60));
  console.log('🔧 GENERATED SQL UPDATE STATEMENTS');
  console.log('='.repeat(60));

  const sqlStatements: string[] = [];

  analysis.issues.forEach(issue => {
    let sql = '';

    switch (issue.issueType) {
      case 'missing_field':
        if (issue.field === 'tier' && issue.expectedValue === 'basic') {
          sql = `-- Add missing tier field for buyer ${issue.email}
UPDATE auth.users
SET raw_user_meta_data = raw_user_meta_data || jsonb_build_object('tier', 'basic')
WHERE id = '${issue.userId}';`;
        } else if (issue.field === 'invitation_status' && issue.expectedValue === 'invited') {
          sql = `-- Add missing invitation_status field for creator ${issue.email}
UPDATE auth.users
SET raw_user_meta_data = raw_user_meta_data || jsonb_build_object('invitation_status', 'invited')
WHERE id = '${issue.userId}';`;
        }
        break;

      case 'camelcase_naming':
        sql = `-- Fix camelCase naming for user ${issue.email}
UPDATE auth.users
SET raw_user_meta_data = raw_user_meta_data - '${issue.field}' || jsonb_build_object('${issue.expectedValue}', raw_user_meta_data->>'${issue.field}')
WHERE id = '${issue.userId}';`;
        break;

      case 'invalid_value':
        sql = `-- WARNING: Invalid ${issue.field} value for user ${issue.email}
-- Current value: ${issue.currentValue}
-- Valid values: ${issue.expectedValue}
-- Manual review and update required`;
        break;

      case 'missing_account_type':
        sql = `-- WARNING: Missing account_type for user ${issue.email}
-- Check user_buyers and user_creators tables to determine account type
-- Then update with:
-- UPDATE auth.users SET raw_user_meta_data = raw_user_meta_data || jsonb_build_object('account_type', 'buyer_or_creator') WHERE id = '${issue.userId}';`;
        break;
    }

    if (sql) {
      sqlStatements.push(sql);
    }
  });

  analysis.sqlStatements = sqlStatements;

  if (sqlStatements.length === 0) {
    console.log('✅ No SQL updates needed - metadata is consistent!');
  } else {
    console.log(`\n📝 ${sqlStatements.length} update statements generated:\n`);
    sqlStatements.forEach((sql, index) => {
      console.log(`-- Statement ${index + 1}:`);
      console.log(sql);
      console.log('');
    });
  }
}

function printAnalysisSummary(analysis: AnalysisResult): void {
  console.log('\n' + '='.repeat(60));
  console.log('📋 METADATA ANALYSIS SUMMARY');
  console.log('='.repeat(60));

  console.log(`\n📊 Statistics:`);
  console.log(`   Users Analyzed: ${analysis.totalUsersAnalyzed}`);
  console.log(`   Total Buyers: ${analysis.buyerUsers}`);
  console.log(`   Total Creators: ${analysis.creatorUsers}`);
  console.log(`   Users with Issues: ${analysis.usersWithIssues}`);
  console.log(`   Total Issues Found: ${analysis.issues.length}`);

  if (analysis.issues.length > 0) {
    const issuesByType = analysis.issues.reduce((acc, issue) => {
      acc[issue.issueType] = (acc[issue.issueType] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    console.log(`\n🔍 Issue Breakdown:`);
    Object.entries(issuesByType).forEach(([type, count]) => {
      console.log(`   ${type}: ${count}`);
    });
  }

  console.log('\n⚠️  IMPORTANT NOTES:');
  console.log('1. This analysis shows current user only - full database analysis requires admin access');
  console.log('2. Review all SQL statements before executing in production');
  console.log('3. Test updates in development environment first');
  console.log('4. Backup database before applying changes');
  console.log('5. Some issues may require manual investigation');
}

// Export for use in browser console or debug tools
export function runMetadataAnalysis(): void {
  analyzeCurrentUserMetadata().catch(console.error);
}

// Make available on window for browser console access
if (typeof window !== 'undefined') {
  (window as any).runMetadataAnalysis = runMetadataAnalysis;
  (window as any).analyzeUserMetadata = analyzeCurrentUserMetadata;
}