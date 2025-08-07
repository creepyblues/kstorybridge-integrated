#!/usr/bin/env node

/**
 * Keyword Extraction Script for KStoryBridge Titles
 * 
 * This script extracts keywords from titles in the Supabase database
 * to help buyers find and identify stories suitable for film/TV adaptation.
 * 
 * Features:
 * - Extracts keywords from multiple text fields (synopsis, tagline, pitch, etc.)
 * - Generates genre-based keywords
 * - Creates thematic keywords based on content analysis
 * - Supports both Korean and English content
 * - Outputs structured keyword data for search optimization
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Supabase configuration
const SUPABASE_URL = "https://dlrnrgcoguxlkkcitlpd.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRscm5yZ2NvZ3V4bGtrY2l0bHBkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE3OTIzMzQsImV4cCI6MjA2NzM2ODMzNH0.KWYF7TvoA0I3iyoIbyYIyTSlJcIyPH6yCfHueEEMIlA";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Keyword extraction patterns and rules
const KEYWORD_PATTERNS = {
  // Character types and relationships
  characters: [
    'protagonist', 'hero', 'heroine', 'villain', 'antagonist', 'mentor', 'sidekick',
    'love interest', 'family', 'siblings', 'parents', 'children', 'friends',
    'rivals', 'enemies', 'allies', 'teacher', 'student', 'boss', 'employee'
  ],
  
  // Settings and locations
  settings: [
    'school', 'university', 'office', 'hospital', 'police', 'military', 'court',
    'prison', 'apartment', 'house', 'city', 'countryside', 'village', 'island',
    'mountain', 'forest', 'desert', 'ocean', 'space', 'future', 'past', 'medieval',
    'modern', 'contemporary', 'historical', 'fantasy world', 'alternate reality'
  ],
  
  // Themes and concepts
  themes: [
    'revenge', 'betrayal', 'loyalty', 'sacrifice', 'redemption', 'forgiveness',
    'justice', 'corruption', 'power', 'ambition', 'greed', 'love', 'heartbreak',
    'friendship', 'family bonds', 'coming of age', 'identity', 'self-discovery',
    'survival', 'competition', 'success', 'failure', 'second chances', 'destiny',
    'fate', 'choice', 'freedom', 'oppression', 'rebellion', 'revolution'
  ],
  
  // Plot elements
  plotElements: [
    'mystery', 'investigation', 'murder', 'crime', 'heist', 'conspiracy', 'secret',
    'hidden truth', 'revelation', 'twist', 'flashback', 'time travel', 'parallel worlds',
    'supernatural', 'magic', 'powers', 'abilities', 'transformation', 'curse',
    'prophecy', 'quest', 'journey', 'adventure', 'escape', 'chase', 'battle',
    'war', 'conflict', 'tournament', 'competition', 'game', 'sport'
  ],
  
  // Visual and cinematic elements
  visual: [
    'action sequences', 'fight scenes', 'car chases', 'explosions', 'special effects',
    'costume drama', 'period piece', 'ensemble cast', 'dual timeline', 'multiple perspectives',
    'flashbacks', 'non-linear narrative', 'voiceover', 'montage', 'symbolism'
  ],
  
  // Adaptation potential markers
  adaptationMarkers: [
    'visual storytelling', 'dialogue-heavy', 'action-packed', 'character-driven',
    'plot-driven', 'episodic', 'serialized', 'standalone', 'franchise potential',
    'international appeal', 'cultural specificity', 'universal themes',
    'high concept', 'low budget', 'big budget', 'intimate story', 'epic scope'
  ]
};

// Korean keyword patterns for Korean content
const KOREAN_KEYWORDS = {
  cultural: [
    '한국', '서울', '부산', '제주도', '전통', '현대', '가족', '효도', '인맥',
    '사회', '계층', '재벌', '대기업', '스타트업', '한강', '궁궐', '한옥',
    '아파트', '지하철', '카페', '치킨', '소주', 'K-pop', '한류'
  ],
  themes: [
    '복수', '사랑', '우정', '가족애', '성장', '성공', '실패', '배신', '희생',
    '정의', '부정부패', '권력', '야망', '꿈', '현실', '이상', '갈등', '화해',
    '용서', '구원', '운명', '선택', '자유', '억압', '반항', '혁명'
  ]
};

// Genre-to-keyword mapping
const GENRE_KEYWORDS = {
  romance: ['love story', 'romantic comedy', 'love triangle', 'relationship', 'marriage', 'dating', 'heartbreak', 'passion'],
  fantasy: ['magic', 'supernatural', 'mythical creatures', 'alternate world', 'prophecy', 'quest', 'powers', 'enchantment'],
  action: ['fight scenes', 'martial arts', 'explosions', 'chase sequences', 'weapons', 'combat', 'adrenaline', 'high stakes'],
  drama: ['emotional depth', 'character development', 'family drama', 'social issues', 'human condition', 'relationships', 'conflict'],
  comedy: ['humor', 'satire', 'slapstick', 'witty dialogue', 'situational comedy', 'parody', 'light-hearted', 'entertainment'],
  thriller: ['suspense', 'tension', 'mystery', 'danger', 'psychological', 'cat and mouse', 'edge of seat', 'plot twists'],
  horror: ['scary', 'supernatural horror', 'psychological horror', 'monsters', 'fear', 'dread', 'gore', 'jump scares'],
  sci_fi: ['technology', 'future', 'space', 'robots', 'AI', 'time travel', 'dystopia', 'utopia', 'scientific concepts'],
  slice_of_life: ['everyday life', 'realistic', 'mundane moments', 'character study', 'observational', 'quiet drama'],
  historical: ['period piece', 'historical setting', 'costume drama', 'authentic period details', 'historical figures'],
  mystery: ['detective', 'investigation', 'clues', 'solving puzzles', 'whodunit', 'crime solving', 'deduction'],
  sports: ['competition', 'teamwork', 'training', 'victory', 'defeat', 'athleticism', 'dedication', 'sports drama']
};

// Content format adaptation potential
const FORMAT_ADAPTATION_KEYWORDS = {
  webtoon: ['visual storytelling', 'episodic structure', 'cliffhangers', 'visual effects potential', 'character designs'],
  web_novel: ['detailed world-building', 'character depth', 'internal monologue', 'complex plot', 'serialized narrative'],
  book: ['literary adaptation', 'established fanbase', 'rich source material', 'character development', 'narrative depth'],
  script: ['ready for production', 'screenplay format', 'dialogue-driven', 'scene descriptions', 'camera-ready'],
  game: ['interactive elements', 'multiple storylines', 'character choices', 'world exploration', 'gaming culture'],
  animation: ['animated sequences', 'visual creativity', 'fantasy elements', 'stylized visuals', 'broad appeal']
};

// Filtering patterns for non-sensical keywords
const FILTER_PATTERNS = {
  // URLs and file paths
  urls: /^https?:\/\/|\.com|\.co|\.pdf|\.jpg|\.png|storage\/|object\/|supabase/i,
  
  // UUIDs and random strings
  uuids: /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i,
  randomStrings: /^[a-f0-9]{20,}$/i,
  
  // Common stop words (expanded)
  stopWords: new Set([
    'the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by',
    'a', 'an', 'is', 'are', 'was', 'were', 'been', 'be', 'have', 'has', 'had',
    'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might',
    'this', 'that', 'these', 'those', 'i', 'you', 'he', 'she', 'it', 'we', 'they',
    'me', 'him', 'her', 'us', 'them', 'my', 'your', 'his', 'her', 'its', 'our', 'their',
    'about', 'above', 'after', 'again', 'against', 'all', 'am', 'any', 'as', 'because',
    'before', 'being', 'below', 'between', 'both', 'can', 'down', 'during', 'each',
    'few', 'from', 'further', 'how', 'if', 'into', 'more', 'most', 'no', 'not',
    'now', 'off', 'once', 'only', 'other', 'out', 'over', 'own', 'same', 'so',
    'some', 'such', 'than', 'then', 'there', 'through', 'too', 'under', 'until',
    'up', 'very', 'what', 'when', 'where', 'which', 'while', 'who', 'why', 'with'
  ]),
  
  // Technical terms to filter out
  technical: /^(http|https|www|com|pdf|jpg|png|jpeg|gif|svg|css|js|html|php|asp|json|xml)$/i,
  
  // Extremely long words (likely URLs or technical strings)
  tooLong: 30,
  
  // Words with mixed case/numbers that look like IDs
  technicalIds: /^[a-z0-9]+[A-Z][a-z0-9]*[A-Z]/,
  
  // File extensions
  fileExtensions: /\.(pdf|jpg|jpeg|png|gif|svg|css|js|html|php|asp|json|xml|doc|docx)$/i
};

/**
 * Check if a keyword should be filtered out
 */
function shouldFilterKeyword(keyword) {
  if (!keyword || typeof keyword !== 'string') return true;
  
  const trimmed = keyword.trim();
  
  // Filter empty or very short keywords
  if (trimmed.length < 3) return true;
  
  // Filter very long keywords (likely URLs or technical strings)
  if (trimmed.length > FILTER_PATTERNS.tooLong) return true;
  
  // Filter URLs and file paths
  if (FILTER_PATTERNS.urls.test(trimmed)) return true;
  
  // Filter UUIDs
  if (FILTER_PATTERNS.uuids.test(trimmed)) return true;
  
  // Filter random strings
  if (FILTER_PATTERNS.randomStrings.test(trimmed)) return true;
  
  // Filter stop words
  if (FILTER_PATTERNS.stopWords.has(trimmed.toLowerCase())) return true;
  
  // Filter technical terms
  if (FILTER_PATTERNS.technical.test(trimmed)) return true;
  
  // Filter file extensions
  if (FILTER_PATTERNS.fileExtensions.test(trimmed)) return true;
  
  // Filter technical IDs
  if (FILTER_PATTERNS.technicalIds.test(trimmed)) return true;
  
  // Filter strings that are mostly numbers
  if (/^\d{8,}$/.test(trimmed)) return true;
  
  // Filter strings with too many consecutive consonants (likely technical)
  if (/[bcdfghjklmnpqrstvwxz]{6,}/i.test(trimmed)) return true;
  
  return false;
}

/**
 * Extract keywords from text using natural language processing
 */
function extractTextKeywords(text, language = 'en') {
  if (!text) return [];
  
  const keywords = new Set();
  const lowercaseText = text.toLowerCase();
  
  // Extract from all pattern categories (predefined meaningful keywords)
  Object.values(KEYWORD_PATTERNS).flat().forEach(pattern => {
    if (lowercaseText.includes(pattern.toLowerCase())) {
      keywords.add(pattern);
    }
  });
  
  // Add Korean keywords for Korean content
  if (language === 'ko' || /[가-힣]/.test(text)) {
    Object.values(KOREAN_KEYWORDS).flat().forEach(keyword => {
      if (text.includes(keyword)) {
        keywords.add(keyword);
      }
    });
  }
  
  // Extract meaningful words from text (with improved filtering)
  const words = text.split(/\s+/).map(word => word.replace(/[^\w가-힣-]/g, ''));
  const significantWords = words.filter(word => {
    // Basic length check
    if (word.length < 3 || word.length > 25) return false;
    
    // Apply filtering
    if (shouldFilterKeyword(word)) return false;
    
    // Keep words with Korean characters
    if (/[가-힣]/.test(word)) return true;
    
    // Keep meaningful English words (at least 3 chars, not all numbers)
    if (word.length >= 3 && !/^\d+$/.test(word)) return true;
    
    return false;
  });
  
  significantWords.forEach(word => {
    const cleanWord = word.toLowerCase().trim();
    if (!shouldFilterKeyword(cleanWord)) {
      keywords.add(cleanWord);
    }
  });
  
  return Array.from(keywords).filter(k => !shouldFilterKeyword(k));
}

/**
 * Generate genre-based keywords
 */
function generateGenreKeywords(genres) {
  if (!genres || !Array.isArray(genres)) return [];
  
  const keywords = new Set();
  
  genres.forEach(genre => {
    // Add the genre itself
    keywords.add(genre);
    
    // Add associated keywords
    if (GENRE_KEYWORDS[genre]) {
      GENRE_KEYWORDS[genre].forEach(keyword => keywords.add(keyword));
    }
  });
  
  return Array.from(keywords);
}

/**
 * Generate content format keywords
 */
function generateFormatKeywords(format) {
  if (!format) return [];
  
  const keywords = [format];
  
  if (FORMAT_ADAPTATION_KEYWORDS[format]) {
    keywords.push(...FORMAT_ADAPTATION_KEYWORDS[format]);
  }
  
  return keywords;
}

/**
 * Analyze title for adaptation potential
 */
function analyzeAdaptationPotential(title) {
  const adaptationScore = {
    visual_potential: 0,
    character_driven: 0,
    universal_appeal: 0,
    production_complexity: 0
  };
  
  const allText = [
    title.title_name_en,
    title.title_name_kr,
    title.synopsis,
    title.tagline,
    title.pitch
  ].filter(Boolean).join(' ').toLowerCase();
  
  // Visual potential indicators
  const visualIndicators = ['action', 'visual', 'fight', 'chase', 'explosion', 'magic', 'supernatural', 'special effects'];
  visualIndicators.forEach(indicator => {
    if (allText.includes(indicator)) adaptationScore.visual_potential++;
  });
  
  // Character-driven indicators
  const characterIndicators = ['character', 'relationship', 'family', 'love', 'friendship', 'betrayal', 'growth'];
  characterIndicators.forEach(indicator => {
    if (allText.includes(indicator)) adaptationScore.character_driven++;
  });
  
  // Universal appeal indicators
  const universalIndicators = ['love', 'family', 'friendship', 'justice', 'freedom', 'success', 'revenge'];
  universalIndicators.forEach(indicator => {
    if (allText.includes(indicator)) adaptationScore.universal_appeal++;
  });
  
  // Production complexity indicators
  const complexityIndicators = ['fantasy', 'sci-fi', 'supernatural', 'magic', 'time travel', 'alternate world'];
  complexityIndicators.forEach(indicator => {
    if (allText.includes(indicator)) adaptationScore.production_complexity++;
  });
  
  return adaptationScore;
}

/**
 * Extract comprehensive keywords for a single title
 */
function extractTitleKeywords(title) {
  const extractedKeywords = {
    title_id: title.title_id,
    title_name_kr: title.title_name_kr,
    title_name_en: title.title_name_en,
    content_format: title.content_format,
    genres: title.genre || [],
    existing_tags: title.tags || [],
    extracted_keywords: {
      text_based: [],
      genre_based: [],
      format_based: [],
      thematic: [],
      adaptation_markers: []
    },
    adaptation_analysis: null,
    keyword_summary: []
  };
  
  // Extract from text fields
  const textFields = [
    title.synopsis,
    title.tagline,
    title.pitch,
    title.title_name_en,
    title.title_name_kr
  ];
  
  textFields.forEach(field => {
    if (field) {
      const keywords = extractTextKeywords(field, /[가-힣]/.test(field) ? 'ko' : 'en');
      extractedKeywords.extracted_keywords.text_based.push(...keywords);
    }
  });
  
  // Generate genre-based keywords
  extractedKeywords.extracted_keywords.genre_based = generateGenreKeywords(title.genre);
  
  // Generate format-based keywords
  extractedKeywords.extracted_keywords.format_based = generateFormatKeywords(title.content_format);
  
  // Extract thematic keywords based on content analysis
  const allText = textFields.filter(Boolean).join(' ');
  KEYWORD_PATTERNS.themes.forEach(theme => {
    if (allText.toLowerCase().includes(theme.toLowerCase())) {
      extractedKeywords.extracted_keywords.thematic.push(theme);
    }
  });
  
  // Extract adaptation markers
  KEYWORD_PATTERNS.adaptationMarkers.forEach(marker => {
    if (allText.toLowerCase().includes(marker.toLowerCase())) {
      extractedKeywords.extracted_keywords.adaptation_markers.push(marker);
    }
  });
  
  // Analyze adaptation potential
  extractedKeywords.adaptation_analysis = analyzeAdaptationPotential(title);
  
  // Create comprehensive keyword summary (remove duplicates)
  const allKeywords = new Set([
    ...extractedKeywords.extracted_keywords.text_based,
    ...extractedKeywords.extracted_keywords.genre_based,
    ...extractedKeywords.extracted_keywords.format_based,
    ...extractedKeywords.extracted_keywords.thematic,
    ...extractedKeywords.extracted_keywords.adaptation_markers,
    ...extractedKeywords.existing_tags
  ]);
  
  extractedKeywords.keyword_summary = Array.from(allKeywords).filter(keyword => 
    keyword && keyword.length > 2 && !shouldFilterKeyword(keyword)
  );
  
  return extractedKeywords;
}

/**
 * Main execution function
 */
async function main() {
  console.log('🎬 Starting keyword extraction for KStoryBridge titles...\n');
  
  try {
    // Fetch all titles from Supabase
    console.log('📊 Fetching titles from Supabase...');
    const { data: titles, error } = await supabase
      .from('titles')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('❌ Error fetching titles:', error);
      return;
    }
    
    console.log(`✅ Found ${titles.length} titles to process\n`);
    
    // Process each title
    const results = [];
    const stats = {
      processed: 0,
      total_keywords: 0,
      genres_found: new Set(),
      formats_found: new Set()
    };
    
    for (const title of titles) {
      console.log(`🔄 Processing: ${title.title_name_kr} (${title.title_name_en || 'No English title'})`);
      
      const keywordData = extractTitleKeywords(title);
      results.push(keywordData);
      
      stats.processed++;
      stats.total_keywords += keywordData.keyword_summary.length;
      
      if (title.genre) {
        title.genre.forEach(genre => stats.genres_found.add(genre));
      }
      if (title.content_format) {
        stats.formats_found.add(title.content_format);
      }
      
      console.log(`   └── Extracted ${keywordData.keyword_summary.length} keywords`);
    }
    
    // Save results to file
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const outputPath = path.join(process.cwd(), `keyword-extraction-results-${timestamp}.json`);
    
    const output = {
      metadata: {
        extraction_date: new Date().toISOString(),
        total_titles_processed: stats.processed,
        total_keywords_extracted: stats.total_keywords,
        average_keywords_per_title: Math.round(stats.total_keywords / stats.processed),
        unique_genres_found: Array.from(stats.genres_found),
        unique_formats_found: Array.from(stats.formats_found)
      },
      extraction_config: {
        keyword_patterns: Object.keys(KEYWORD_PATTERNS),
        genre_mappings: Object.keys(GENRE_KEYWORDS),
        format_mappings: Object.keys(FORMAT_ADAPTATION_KEYWORDS)
      },
      results: results
    };
    
    fs.writeFileSync(outputPath, JSON.stringify(output, null, 2));
    
    // Generate summary report
    console.log('\n📈 EXTRACTION SUMMARY');
    console.log('=' .repeat(50));
    console.log(`📚 Total titles processed: ${stats.processed}`);
    console.log(`🔍 Total keywords extracted: ${stats.total_keywords}`);
    console.log(`📊 Average keywords per title: ${Math.round(stats.total_keywords / stats.processed)}`);
    console.log(`🎭 Unique genres found: ${stats.genres_found.size}`);
    console.log(`📖 Unique formats found: ${stats.formats_found.size}`);
    console.log(`💾 Results saved to: ${outputPath}`);
    
    console.log('\n🏷️  GENRE DISTRIBUTION:');
    Array.from(stats.genres_found).sort().forEach(genre => {
      const count = results.filter(r => r.genres && r.genres.includes(genre)).length;
      console.log(`   ${genre}: ${count} titles`);
    });
    
    console.log('\n📚 FORMAT DISTRIBUTION:');
    Array.from(stats.formats_found).sort().forEach(format => {
      const count = results.filter(r => r.content_format === format).length;
      console.log(`   ${format}: ${count} titles`);
    });
    
    // Show top keywords
    const keywordFrequency = {};
    results.forEach(result => {
      result.keyword_summary.forEach(keyword => {
        keywordFrequency[keyword] = (keywordFrequency[keyword] || 0) + 1;
      });
    });
    
    const topKeywords = Object.entries(keywordFrequency)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 20);
    
    console.log('\n🔝 TOP 20 MOST COMMON KEYWORDS:');
    topKeywords.forEach(([keyword, count], index) => {
      console.log(`   ${index + 1}. ${keyword}: ${count} titles`);
    });
    
    console.log('\n✨ Keyword extraction completed successfully!');
    console.log(`📄 Detailed results available in: ${outputPath}`);
    
  } catch (error) {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  }
}

// Run the script
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { extractTitleKeywords, KEYWORD_PATTERNS, GENRE_KEYWORDS };