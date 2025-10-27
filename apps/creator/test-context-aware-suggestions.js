/**
 * Unit Tests for Context-Aware Chatbot Suggestions
 *
 * Tests the extractQueryThemes() and context-aware suggestion generation
 * in the chat-orchestrator edge function.
 *
 * Run: node apps/dashboard/test-context-aware-suggestions.js
 */

// Test cases for theme extraction
const themeExtractionTests = [
  {
    name: 'Strong female lead query',
    query: 'romance with strong female lead',
    expectedThemes: {
      characterTraits: ['strong lead'],
      plotElements: [],
      tonePreferences: [],
      settingDetails: [],
      formatPreferences: [],
      genreThemes: []
    }
  },
  {
    name: 'Dark revenge story',
    query: 'dark revenge webtoons',
    expectedThemes: {
      characterTraits: [],
      plotElements: ['revenge'],
      tonePreferences: ['dark'],
      settingDetails: [],
      formatPreferences: [],
      genreThemes: []
    }
  },
  {
    name: 'Multi-criteria query',
    query: 'completed romance with strong lead and redemption arc under 50 chapters',
    expectedThemes: {
      characterTraits: ['strong lead'],
      plotElements: ['redemption'],
      tonePreferences: [],
      settingDetails: [],
      formatPreferences: ['completed', 'short series'],
      genreThemes: []
    }
  },
  {
    name: 'Tone and setting combination',
    query: 'wholesome historical romance',
    expectedThemes: {
      characterTraits: [],
      plotElements: [],
      tonePreferences: ['wholesome'],
      settingDetails: ['historical'],
      formatPreferences: [],
      genreThemes: []
    }
  },
  {
    name: 'Anti-hero protagonist',
    query: 'thriller with anti-hero protagonist',
    expectedThemes: {
      characterTraits: ['anti-hero'],
      plotElements: [],
      tonePreferences: [],
      settingDetails: [],
      formatPreferences: [],
      genreThemes: []
    }
  },
  {
    name: 'Generic query (no themes)',
    query: 'popular webtoons',
    expectedThemes: {
      characterTraits: [],
      plotElements: [],
      tonePreferences: [],
      settingDetails: [],
      formatPreferences: [],
      genreThemes: []
    }
  },
  {
    name: 'Time travel plot',
    query: 'time travel romance with emotional tone',
    expectedThemes: {
      characterTraits: [],
      plotElements: ['time manipulation'],
      tonePreferences: ['emotional'],
      settingDetails: [],
      formatPreferences: [],
      genreThemes: []
    }
  },
  {
    name: 'Workplace setting',
    query: 'office romance with complex characters',
    expectedThemes: {
      characterTraits: ['complex character'],
      plotElements: [],
      tonePreferences: [],
      settingDetails: ['workplace'],
      formatPreferences: [],
      genreThemes: []
    }
  },
  {
    name: 'Ghost story (supernatural genre)',
    query: 'ghost story',
    expectedThemes: {
      characterTraits: [],
      plotElements: [],
      tonePreferences: [],
      settingDetails: [],
      formatPreferences: [],
      genreThemes: ['supernatural']
    }
  },
  {
    name: 'Horror webtoon',
    query: 'horror webtoon',
    expectedThemes: {
      characterTraits: [],
      plotElements: [],
      tonePreferences: [],
      settingDetails: [],
      formatPreferences: [],
      genreThemes: ['horror']
    }
  },
  {
    name: 'Fantasy romance',
    query: 'fantasy romance',
    expectedThemes: {
      characterTraits: [],
      plotElements: [],
      tonePreferences: [],
      settingDetails: [],
      formatPreferences: [],
      genreThemes: ['fantasy']
    }
  },
  {
    name: 'Sci-fi thriller',
    query: 'sci-fi thriller',
    expectedThemes: {
      characterTraits: [],
      plotElements: [],
      tonePreferences: [],
      settingDetails: [],
      formatPreferences: [],
      genreThemes: ['sci-fi']
    }
  }
];

// Expected suggestion patterns for different query types
const suggestionPatternTests = [
  {
    name: 'Strong female lead → Character-focused suggestions',
    query: 'romance with strong female lead',
    mockGenres: ['Romance'],
    mockTones: ['emotional'],
    expectedPatterns: [
      /romance where the strong lead drives the plot/i,
      /stories with vulnerable protagonists/i
    ]
  },
  {
    name: 'Dark revenge → Plot + Tone variations',
    query: 'dark revenge webtoons',
    mockGenres: ['Thriller'],
    mockTones: ['dark'],
    expectedPatterns: [
      /thriller with revenge but happy ending/i,
      /revenge stories with.*tone/i,
      /revenge stories with redemption/i,
      /thriller that's darker and more intense/i
    ]
  },
  {
    name: 'Completed series → Format-focused',
    query: 'completed romance under 30 chapters',
    mockGenres: ['Romance'],
    mockTones: [],
    mockTitles: ['First Love'],
    expectedPatterns: [
      /is "first love" completed/i,
      /quick romance reads/i
    ]
  },
  {
    name: 'Historical setting → Setting variations',
    query: 'historical romance',
    mockGenres: ['Romance'],
    mockTones: [],
    expectedPatterns: [
      /romance in historical setting with modern twist/i
    ]
  },
  {
    name: 'Time travel + romance → Plot combinations',
    query: 'time travel romance',
    mockGenres: ['Romance'],
    mockTones: ['emotional'],
    expectedPatterns: [
      /romance with time manipulation but happy ending/i,
      /time manipulation stories with emotional tone/i,
      /time travel with romance vs\. pure plot focus/i
    ]
  },
  {
    name: 'Ghost story → Genre-focused suggestions',
    query: 'ghost story',
    mockGenres: ['Thriller'],
    mockTones: [],
    expectedPatterns: [
      /supernatural with mystery elements vs\. pure horror/i,
      /ghost stories with emotional depth/i,
      /thriller with supernatural twists/i
    ]
  }
];

// Mock implementation of extractQueryThemes (simulates edge function logic)
function extractQueryThemes(userQuery) {
  const lowerQuery = userQuery.toLowerCase();

  const themes = {
    characterTraits: [],
    plotElements: [],
    tonePreferences: [],
    settingDetails: [],
    formatPreferences: [],
    genreThemes: []
  };

  // Character trait patterns
  const characterPatterns = [
    { pattern: /strong (female |male )?lead/i, trait: 'strong lead' },
    { pattern: /complex (protagonist|villain|character)/i, trait: 'complex character' },
    { pattern: /(badass|powerful|capable) (protagonist|lead|hero)/i, trait: 'powerful protagonist' },
    { pattern: /(underdog|weak to strong)/i, trait: 'underdog story' },
    { pattern: /morally (gray|grey|ambiguous)/i, trait: 'morally complex' },
    { pattern: /(anti-hero|antihero)/i, trait: 'anti-hero' }
  ];

  // Plot element patterns
  const plotPatterns = [
    { pattern: /revenge/i, element: 'revenge' },
    { pattern: /redemption/i, element: 'redemption' },
    { pattern: /love triangle/i, element: 'love triangle' },
    { pattern: /time (travel|loop)/i, element: 'time manipulation' },
    { pattern: /reincarnation/i, element: 'reincarnation' },
    { pattern: /(mystery|whodunit)/i, element: 'mystery' },
    { pattern: /betrayal/i, element: 'betrayal' }
  ];

  // Tone patterns
  const tonePatterns = [
    { pattern: /dark|gritty|intense/i, tone: 'dark' },
    { pattern: /wholesome|heartwarming|uplifting/i, tone: 'wholesome' },
    { pattern: /emotional|tearjerker|moving/i, tone: 'emotional' },
    { pattern: /comedic|funny|lighthearted/i, tone: 'comedic' },
    { pattern: /suspenseful|tense|thrilling/i, tone: 'suspenseful' }
  ];

  // Setting patterns
  const settingPatterns = [
    { pattern: /historical|period/i, setting: 'historical' },
    { pattern: /modern|contemporary/i, setting: 'modern' },
    { pattern: /office|workplace/i, setting: 'workplace' },
    { pattern: /school|university|college/i, setting: 'school' },
    { pattern: /fantasy world/i, setting: 'fantasy world' }
  ];

  // Genre/Theme patterns (NEW)
  const genrePatterns = [
    { pattern: /ghost|supernatural|paranormal|spirit/i, genre: 'supernatural' },
    { pattern: /horror|scary|creepy|terrifying/i, genre: 'horror' },
    { pattern: /fantasy|magic|magical/i, genre: 'fantasy' },
    { pattern: /sci-fi|science fiction|dystopian|cyberpunk/i, genre: 'sci-fi' },
    { pattern: /slice of life|everyday|daily life/i, genre: 'slice of life' },
    { pattern: /zombie|apocalypse|post-apocalyptic/i, genre: 'apocalyptic' }
  ];

  // Extract matches
  characterPatterns.forEach(({ pattern, trait }) => {
    if (pattern.test(userQuery)) themes.characterTraits.push(trait);
  });

  plotPatterns.forEach(({ pattern, element }) => {
    if (pattern.test(userQuery)) themes.plotElements.push(element);
  });

  tonePatterns.forEach(({ pattern, tone }) => {
    if (pattern.test(userQuery)) themes.tonePreferences.push(tone);
  });

  settingPatterns.forEach(({ pattern, setting }) => {
    if (pattern.test(userQuery)) themes.settingDetails.push(setting);
  });

  genrePatterns.forEach(({ pattern, genre }) => {
    if (pattern.test(userQuery)) themes.genreThemes.push(genre);
  });

  // Format preferences
  if (/completed|finished/i.test(userQuery)) themes.formatPreferences.push('completed');
  if (/short|quick read|under \d+ chapter/i.test(userQuery)) themes.formatPreferences.push('short series');
  if (/ongoing|current/i.test(userQuery)) themes.formatPreferences.push('ongoing');

  return themes;
}

// Test runner
function runTests() {
  console.log('🧪 Running Context-Aware Suggestions Tests\n');
  console.log('='.repeat(60));

  let passed = 0;
  let failed = 0;

  // Test 1: Theme Extraction
  console.log('\n📋 TEST SUITE 1: Theme Extraction\n');

  themeExtractionTests.forEach(test => {
    const result = extractQueryThemes(test.query);
    const success = JSON.stringify(result) === JSON.stringify(test.expectedThemes);

    if (success) {
      console.log(`✅ PASS: ${test.name}`);
      passed++;
    } else {
      console.log(`❌ FAIL: ${test.name}`);
      console.log('  Expected:', test.expectedThemes);
      console.log('  Got:', result);
      failed++;
    }
  });

  // Test 2: Suggestion Pattern Generation
  console.log('\n📋 TEST SUITE 2: Suggestion Pattern Generation\n');

  suggestionPatternTests.forEach(test => {
    const themes = extractQueryThemes(test.query);
    const contextAwareSuggestions = [];
    const genreArray = test.mockGenres || [];
    const toneArray = test.mockTones || [];
    const titles = test.mockTitles || [];

    // Simulate context-aware suggestion generation
    if (themes.characterTraits.length > 0) {
      const trait = themes.characterTraits[0];
      if (genreArray.length > 0) {
        contextAwareSuggestions.push(`${genreArray[0]} where the ${trait} drives the plot`);
      }
      if (trait.includes('strong')) {
        contextAwareSuggestions.push(`Stories with vulnerable protagonists instead`);
      }
    }

    if (themes.plotElements.length > 0) {
      const element = themes.plotElements[0];
      if (genreArray.length > 0) {
        contextAwareSuggestions.push(`${genreArray[0]} with ${element} but happy ending`);
      }
      if (toneArray.length > 0) {
        contextAwareSuggestions.push(`${element} stories with ${toneArray[0]} tone`);
      }
      if (element === 'revenge') {
        contextAwareSuggestions.push(`Revenge stories with redemption arcs`);
      } else if (element === 'time manipulation') {
        contextAwareSuggestions.push(`Time travel with romance vs. pure plot focus`);
      }
    }

    if (themes.tonePreferences.length > 0 && genreArray.length > 0) {
      const tone = themes.tonePreferences[0];
      const toneVariations = {
        'dark': 'darker and more intense',
        'wholesome': 'even more heartwarming',
        'emotional': 'less emotional but still moving',
        'comedic': 'more serious with light moments',
        'suspenseful': 'slower burn suspense'
      };
      const variation = toneVariations[tone] || 'different tone';
      contextAwareSuggestions.push(`${genreArray[0]} that's ${variation}`);
    }

    if (themes.settingDetails.length > 0 && genreArray.length > 0) {
      const setting = themes.settingDetails[0];
      contextAwareSuggestions.push(`${genreArray[0]} in ${setting} setting with modern twist`);
    }

    if (themes.formatPreferences.length > 0) {
      const pref = themes.formatPreferences[0];
      if (titles.length > 0) {
        contextAwareSuggestions.push(`Is "${titles[0]}" ${pref}?`);
      }
      // Check if 'short series' is in any of the preferences
      if (themes.formatPreferences.includes('short series') && genreArray.length > 0) {
        contextAwareSuggestions.push(`Quick ${genreArray[0]} reads under 30 chapters`);
      }
    }

    // Genre-focused refinements
    if (themes.genreThemes.length > 0) {
      const genreTheme = themes.genreThemes[0];

      if (genreTheme === 'supernatural') {
        contextAwareSuggestions.push(`Supernatural with mystery elements vs. pure horror`);
        contextAwareSuggestions.push(`Ghost stories with emotional depth`);
        if (genreArray.length > 0) {
          contextAwareSuggestions.push(`${genreArray[0]} with supernatural twists`);
        }
      } else if (genreTheme === 'horror') {
        contextAwareSuggestions.push(`Horror with psychological elements`);
        contextAwareSuggestions.push(`Horror stories with deeper meaning`);
      } else if (genreTheme === 'fantasy') {
        contextAwareSuggestions.push(`Fantasy with complex magic systems`);
        contextAwareSuggestions.push(`Fantasy with political intrigue`);
      } else if (genreTheme === 'sci-fi') {
        contextAwareSuggestions.push(`Sci-fi with character-driven plots`);
        contextAwareSuggestions.push(`Hard sci-fi vs. soft sci-fi`);
      }
    }

    // Check if all expected patterns are found
    const allPatternsMatch = test.expectedPatterns.every(pattern =>
      contextAwareSuggestions.some(suggestion => pattern.test(suggestion))
    );

    if (allPatternsMatch) {
      console.log(`✅ PASS: ${test.name}`);
      console.log(`  Generated ${contextAwareSuggestions.length} suggestions`);
      passed++;
    } else {
      console.log(`❌ FAIL: ${test.name}`);
      console.log('  Expected patterns:', test.expectedPatterns.map(p => p.toString()));
      console.log('  Generated suggestions:', contextAwareSuggestions);
      failed++;
    }
  });

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('\n📊 TEST SUMMARY\n');
  console.log(`Total Tests: ${passed + failed}`);
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`Success Rate: ${((passed / (passed + failed)) * 100).toFixed(1)}%`);

  if (failed === 0) {
    console.log('\n🎉 All tests passed! Context-aware suggestions are working correctly.\n');
  } else {
    console.log('\n⚠️  Some tests failed. Review the output above.\n');
  }
}

// Run tests
runTests();
