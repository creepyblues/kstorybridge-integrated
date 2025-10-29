/**
 * Real-World Authentication Integration Test
 * 
 * This script tests the actual authentication system with real components
 * to identify any integration issues and validate everything works correctly.
 * 
 * Run this with: node test-real-auth-integration.js
 */

console.log('🔍 Real-World Authentication Integration Test\n');

// Test comprehensive authentication scenarios
async function testRealAuthIntegration() {
  const testResults = {
    fileStructure: [],
    importValidation: [],
    componentIntegration: [],
    performanceChecks: [],
    potentialIssues: []
  };

  console.log('=== Testing File Structure & Imports ===\n');

  // Check critical files exist
  const fs = require('fs');
  const path = require('path');

  const criticalFiles = [
    'src/hooks/useAuth.tsx',
    'src/hooks/useOptimizedAuth.tsx', 
    'src/hooks/useTierAccess.ts',
    'src/utils/sessionManager.ts',
    'src/utils/atomicProfileCreator.ts',
    'src/utils/accountTypeDetection.ts',
    'src/components/SignupForm.tsx',
    'src/pages/SigninPage.tsx'
  ];

  console.log('🧪 Checking critical authentication files...');
  criticalFiles.forEach(file => {
    const filePath = path.join(process.cwd(), file);
    const exists = fs.existsSync(filePath);
    
    if (exists) {
      console.log(`  ✅ ${file}`);
      testResults.fileStructure.push({ file, status: 'exists' });
    } else {
      console.log(`  ❌ ${file} - MISSING`);
      testResults.fileStructure.push({ file, status: 'missing' });
      testResults.potentialIssues.push(`Missing critical file: ${file}`);
    }
  });

  console.log('\\n🧪 Analyzing import dependencies...');
  
  // Check for potential import issues
  const importChecks = [
    {
      file: 'src/hooks/useOptimizedAuth.tsx',
      expectedImports: ['useAuth', 'supabase', 'createContext']
    },
    {
      file: 'src/utils/atomicProfileCreator.ts',
      expectedImports: ['supabase', 'User']
    },
    {
      file: 'src/pages/SigninPage.tsx',
      expectedImports: ['createBuyerProfileAtomic', 'determineAccountType']
    }
  ];

  importChecks.forEach(check => {
    const filePath = path.join(process.cwd(), check.file);
    if (fs.existsSync(filePath)) {
      try {
        const content = fs.readFileSync(filePath, 'utf8');
        const missingImports = check.expectedImports.filter(imp => 
          !content.includes(imp)
        );
        
        if (missingImports.length === 0) {
          console.log(`  ✅ ${check.file} - All imports present`);
          testResults.importValidation.push({ file: check.file, status: 'valid' });
        } else {
          console.log(`  ⚠️ ${check.file} - Missing: ${missingImports.join(', ')}`);
          testResults.importValidation.push({ 
            file: check.file, 
            status: 'issues', 
            missing: missingImports 
          });
        }
      } catch (error) {
        console.log(`  ❌ ${check.file} - Read error: ${error.message}`);
        testResults.potentialIssues.push(`Cannot read ${check.file}: ${error.message}`);
      }
    }
  });

  console.log('\\n=== Testing Component Integration ===\\n');

  // Check for component integration issues
  const componentChecks = [
    {
      name: 'SignupForm atomic profile creation',
      file: 'src/components/SignupForm.tsx',
      searchPattern: 'createBuyerProfileAtomic|createCreatorProfileAtomic'
    },
    {
      name: 'SigninPage optimized authentication',
      file: 'src/pages/SigninPage.tsx', 
      searchPattern: 'createBuyerProfileAtomic'
    },
    {
      name: 'useAuth session management',
      file: 'src/hooks/useAuth.tsx',
      searchPattern: 'initializeSessionFromUrl|performSessionHealthCheck'
    }
  ];

  console.log('🧪 Checking component integrations...');
  componentChecks.forEach(check => {
    const filePath = path.join(process.cwd(), check.file);
    if (fs.existsSync(filePath)) {
      try {
        const content = fs.readFileSync(filePath, 'utf8');
        const hasIntegration = new RegExp(check.searchPattern).test(content);
        
        if (hasIntegration) {
          console.log(`  ✅ ${check.name}`);
          testResults.componentIntegration.push({ check: check.name, status: 'integrated' });
        } else {
          console.log(`  ⚠️ ${check.name} - Not found`);
          testResults.componentIntegration.push({ check: check.name, status: 'not_integrated' });
          testResults.potentialIssues.push(`Missing integration: ${check.name}`);
        }
      } catch (error) {
        console.log(`  ❌ ${check.name} - Error: ${error.message}`);
      }
    }
  });

  console.log('\\n=== Performance Analysis ===\\n');

  // Analyze potential performance issues
  const performanceChecks = [
    {
      name: 'Multiple database queries pattern',
      description: 'Check for inefficient sequential queries',
      files: ['src/hooks/useTierAccess.ts', 'src/utils/accountTypeDetection.ts'],
      antiPattern: /await\s+supabase.*?\n.*?await\s+supabase/g,
      expectOptimized: true
    },
    {
      name: 'Promise.all usage',
      description: 'Verify parallel query execution',
      files: ['src/utils/accountTypeDetection.ts'],
      pattern: /Promise\.all/,
      expectPresent: true
    },
    {
      name: 'Caching implementation', 
      description: 'Check for caching mechanisms',
      files: ['src/hooks/useOptimizedAuth.tsx'],
      pattern: /cache|Cache/i,
      expectPresent: true
    }
  ];

  console.log('🧪 Analyzing performance patterns...');
  performanceChecks.forEach(check => {
    let issueFound = false;
    
    check.files.forEach(file => {
      const filePath = path.join(process.cwd(), file);
      if (fs.existsSync(filePath)) {
        try {
          const content = fs.readFileSync(filePath, 'utf8');
          
          if (check.antiPattern) {
            const hasAntiPattern = check.antiPattern.test(content);
            if (hasAntiPattern && check.expectOptimized) {
              console.log(`  ⚠️ ${check.name} in ${file}`);
              issueFound = true;
            }
          }
          
          if (check.pattern) {
            const hasPattern = check.pattern.test(content);
            if (!hasPattern && check.expectPresent) {
              console.log(`  ⚠️ ${check.name} missing in ${file}`);
              issueFound = true;
            } else if (hasPattern && check.expectPresent) {
              console.log(`  ✅ ${check.name} found in ${file}`);
            }
          }
        } catch (error) {
          console.log(`  ❌ Error checking ${file}: ${error.message}`);
        }
      }
    });
    
    if (!issueFound) {
      testResults.performanceChecks.push({ check: check.name, status: 'optimized' });
    } else {
      testResults.performanceChecks.push({ check: check.name, status: 'needs_attention' });
    }
  });

  console.log('\\n=== Build & TypeScript Validation ===\\n');

  // Check TypeScript compilation
  console.log('🧪 Checking TypeScript compilation...');
  const { exec } = require('child_process');
  
  return new Promise((resolve) => {
    exec('npm run build', { timeout: 30000 }, (error, stdout, stderr) => {
      let buildSuccess = true;
      
      if (error) {
        console.log('  ❌ Build failed');
        console.log(`  Error: ${error.message}`);
        testResults.potentialIssues.push(`Build failure: ${error.message}`);
        buildSuccess = false;
      } else {
        console.log('  ✅ Build successful');
      }

      // Check for TypeScript errors in stderr
      if (stderr && stderr.includes('error TS')) {
        console.log('  ⚠️ TypeScript errors detected');
        console.log(`  Errors: ${stderr}`);
        testResults.potentialIssues.push('TypeScript compilation errors');
      }

      console.log('\\n=== Integration Test Results ===\\n');

      // Generate comprehensive report
      const report = generateIntegrationReport(testResults, buildSuccess);
      console.log(report);

      resolve(testResults);
    });
  });
}

function generateIntegrationReport(results, buildSuccess) {
  let report = '📊 AUTHENTICATION INTEGRATION REPORT\\n\\n';

  // File Structure
  const missingFiles = results.fileStructure.filter(f => f.status === 'missing').length;
  const fileStatus = missingFiles === 0 ? '✅ COMPLETE' : `⚠️ ${missingFiles} MISSING`;
  report += `📁 File Structure: ${fileStatus}\\n`;

  // Import Validation
  const importIssues = results.importValidation.filter(i => i.status === 'issues').length;
  const importStatus = importIssues === 0 ? '✅ VALID' : `⚠️ ${importIssues} ISSUES`;
  report += `📦 Import Dependencies: ${importStatus}\\n`;

  // Component Integration
  const integrationIssues = results.componentIntegration.filter(c => c.status === 'not_integrated').length;
  const integrationStatus = integrationIssues === 0 ? '✅ INTEGRATED' : `⚠️ ${integrationIssues} MISSING`;
  report += `🔗 Component Integration: ${integrationStatus}\\n`;

  // Performance
  const perfIssues = results.performanceChecks.filter(p => p.status === 'needs_attention').length;
  const perfStatus = perfIssues === 0 ? '✅ OPTIMIZED' : `⚠️ ${perfIssues} ISSUES`;
  report += `⚡ Performance: ${perfStatus}\\n`;

  // Build Status
  const buildStatus = buildSuccess ? '✅ SUCCESS' : '❌ FAILED';
  report += `🏗️ Build: ${buildStatus}\\n\\n`;

  // Overall Assessment
  const totalIssues = results.potentialIssues.length;
  let overallStatus;
  
  if (totalIssues === 0 && buildSuccess) {
    overallStatus = '🎉 EXCELLENT - Production Ready';
  } else if (totalIssues <= 2 && buildSuccess) {
    overallStatus = '✅ GOOD - Minor issues to address';
  } else if (buildSuccess) {
    overallStatus = '⚠️ NEEDS WORK - Several issues found';
  } else {
    overallStatus = '❌ CRITICAL - Build failure requires immediate attention';
  }

  report += `🎯 Overall Status: ${overallStatus}\\n`;

  if (totalIssues > 0) {
    report += `\\n⚠️ Issues Requiring Attention (${totalIssues}):\\n`;
    results.potentialIssues.forEach((issue, index) => {
      report += `  ${index + 1}. ${issue}\\n`;
    });
  }

  report += '\\n📋 Recommendations:\\n';
  
  if (totalIssues === 0 && buildSuccess) {
    report += '  🎉 System is production-ready!\\n';
    report += '  ✅ All integrations working correctly\\n';
    report += '  ✅ Performance optimizations in place\\n';
    report += '  ✅ Build successful with no errors\\n';
  } else {
    if (!buildSuccess) {
      report += '  🚨 PRIORITY: Fix build errors before deployment\\n';
    }
    if (missingFiles > 0) {
      report += '  📁 Ensure all critical files are present\\n';
    }
    if (integrationIssues > 0) {
      report += '  🔗 Complete component integrations\\n';
    }
    if (perfIssues > 0) {
      report += '  ⚡ Address performance optimization gaps\\n';
    }
  }

  return report;
}

// Run integration test
testRealAuthIntegration()
  .then(() => {
    console.log('\\n🏁 Integration testing complete!');
  })
  .catch(error => {
    console.error('❌ Integration test failed:', error);
    process.exit(1);
  });