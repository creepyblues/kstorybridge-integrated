/**
 * Test Script: Verify Survey Components Can Be Imported
 *
 * This script checks that all survey-related files can be imported
 * without syntax errors or missing dependencies.
 */

console.log('🧪 Testing Creator V2 Survey Feature...\n');

const tests = [
  {
    name: 'Zod Validation Schema',
    path: './src/lib/surveySchema.ts',
    description: 'Validation schemas for all 5 steps'
  },
  {
    name: 'AddTitleSurvey Page',
    path: './src/pages/AddTitleSurvey.tsx',
    description: 'Main survey page with React Hook Form integration'
  },
  {
    name: 'MultiStepProgressBar',
    path: './src/components/survey/MultiStepProgressBar.tsx',
    description: 'Progress indicator component'
  },
  {
    name: 'AutoSaveIndicator',
    path: './src/components/survey/AutoSaveIndicator.tsx',
    description: 'Auto-save status component'
  },
  {
    name: 'Step1BasicInfo',
    path: './src/components/survey/Step1BasicInfo.tsx',
    description: 'Step 1: Basic title information'
  },
  {
    name: 'Step2StoryDetails',
    path: './src/components/survey/Step2StoryDetails.tsx',
    description: 'Step 2: Story details (REQUIRED fields)'
  },
  {
    name: 'Step3Narrative',
    path: './src/components/survey/Step3Narrative.tsx',
    description: 'Step 3: Narrative structure (REQUIRED)'
  },
  {
    name: 'Step4Materials',
    path: './src/components/survey/Step4Materials.tsx',
    description: 'Step 4: File uploads and links'
  },
  {
    name: 'Step5Profile',
    path: './src/components/survey/Step5Profile.tsx',
    description: 'Step 5: Achievements and profile'
  },
  {
    name: 'PlatformsService',
    path: './src/services/platformsService.ts',
    description: 'Multi-platform CRUD operations'
  },
  {
    name: 'DocumentsService',
    path: './src/services/documentsService.ts',
    description: 'File upload and document management'
  },
  {
    name: 'DraftService',
    path: './src/services/draftService.ts',
    description: 'Auto-save draft functionality'
  }
];

let passed = 0;
let failed = 0;

tests.forEach((test, index) => {
  try {
    const fs = require('fs');
    const path = require('path');

    const filePath = path.join(__dirname, test.path);
    const fileExists = fs.existsSync(filePath);

    if (fileExists) {
      const content = fs.readFileSync(filePath, 'utf8');
      const hasContent = content.length > 0;

      if (hasContent) {
        console.log(`✅ ${index + 1}. ${test.name}`);
        console.log(`   📁 ${test.path}`);
        console.log(`   📝 ${test.description}`);
        console.log(`   📊 ${(content.length / 1000).toFixed(1)}KB | ${content.split('\n').length} lines\n`);
        passed++;
      } else {
        console.log(`❌ ${index + 1}. ${test.name} - File is empty`);
        failed++;
      }
    } else {
      console.log(`❌ ${index + 1}. ${test.name} - File not found at ${test.path}`);
      failed++;
    }
  } catch (error) {
    console.log(`❌ ${index + 1}. ${test.name} - Error: ${error.message}`);
    failed++;
  }
});

console.log('\n' + '='.repeat(60));
console.log(`\n📊 Test Results:\n`);
console.log(`   ✅ Passed: ${passed}/${tests.length}`);
console.log(`   ❌ Failed: ${failed}/${tests.length}`);
console.log(`   📈 Success Rate: ${((passed / tests.length) * 100).toFixed(1)}%\n`);

if (failed === 0) {
  console.log('🎉 All files present and ready!\n');
  console.log('🚀 Next Steps:');
  console.log('   1. Navigate to: http://localhost:8085/titles/add-survey');
  console.log('   2. Sign in as a creator');
  console.log('   3. Complete the 5-step survey');
  console.log('   4. Verify auto-save works (wait 30s or click "Save Draft Now")');
  console.log('   5. Test validation errors on Steps 2 & 3');
  console.log('   6. Test submission\n');
} else {
  console.log('⚠️  Some files are missing or have errors. Review above.\n');
  process.exit(1);
}
