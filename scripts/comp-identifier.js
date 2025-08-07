#!/usr/bin/env node

/**
 * Comparable Titles (Comps) Identification Script for KStoryBridge
 * 
 * This script identifies comparable titles for stories in the Supabase database
 * by analyzing similarities in genres, themes, keywords, and adaptation potential.
 * 
 * Comps help buyers understand how a title compares to existing successful
 * properties for adaptation decisions and market positioning.
 * 
 * Features:
 * - Multi-dimensional similarity analysis
 * - Genre-based matching with weighted scores
 * - Keyword similarity using cosine similarity
 * - Thematic and narrative element matching
 * - Adaptation potential comparison
 * - Production complexity similarity
 * - Cultural context consideration
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Supabase configuration
const SUPABASE_URL = "https://dlrnrgcoguxlkkcitlpd.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRscm5yZ2NvZ3V4bGtrY2l0bHBkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE3OTIzMzQsImV4cCI6MjA2NzM2ODMzNH0.KWYF7TvoA0I3iyoIbyYIyTSlJcIyPH6yCfHueEEMIlA";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Comp analysis configuration
const COMP_CONFIG = {
  // Minimum similarity score to be considered a comp (0-1 scale)
  MIN_SIMILARITY_THRESHOLD: 0.3,
  
  // Maximum number of comps to return per title
  MAX_COMPS_PER_TITLE: 10,
  
  // Similarity weight distribution (should sum to 1.0)
  SIMILARITY_WEIGHTS: {
    genre: 0.25,           // Genre overlap importance
    keywords: 0.20,        // Keyword similarity importance
    themes: 0.15,          // Thematic similarity importance
    adaptation: 0.15,      // Adaptation potential similarity
    content_format: 0.10,  // Content format similarity
    popularity: 0.10,      // Popularity metrics similarity
    cultural: 0.05         // Cultural context similarity
  },
  
  // Bonus scores for special matches
  BONUS_WEIGHTS: {
    exact_genre_match: 0.1,      // Bonus for exact genre matches
    similar_popularity: 0.05,    // Bonus for similar ratings/views
    same_format: 0.05,           // Bonus for same content format
    korean_content_match: 0.03   // Bonus for both being Korean content
  }
};

// Genre hierarchy for smart matching
const GENRE_HIERARCHY = {
  // Primary genre families
  romance: ['romance', 'ROMANCE', 'Romance', 'ROM-COM', 'ROMANTIC'],
  drama: ['drama', 'DRAMA', 'Drama', 'DRAMEDY', 'melodrama'],
  fantasy: ['fantasy', 'Fantasy', 'FANTASTICAL', 'orientalfantasy', 'SFfantasy'],
  comedy: ['comedy', 'Comedy', 'COMEDY', 'gag', 'gags', 'Gag', 'Gags', 'familycomedy', 'blackcomedy'],
  action: ['action', 'Action', 'ACTION', 'SF/ACTIONADVENTURE'],
  thriller: ['thriller', 'Thriller', 'THRILLER', 'ROMANTICTHRILLER'],
  horror: ['horror', 'Horror'],
  scifi: ['SCI-FI', 'SFfantasy', 'SF/ACTIONADVENTURE'],
  historical: ['HISTORICAL', 'PERIOD'],
  slice_of_life: ['dailylife', 'Dailylife', 'DailyLife', 'daily', 'healing', 'Healing'],
  youth: ['school', 'School', 'Campus', 'coming-of-agestory', 'boy', 'Boy'],
  supernatural: ['SUPERNATURAL', 'exorcism', 'Exorcism', 'Zombie', 'Wizard']
};

// Known successful comps database (can be expanded)
const EXTERNAL_COMPS = {
  // Romance comps
  romance: [
    { title: "The Notebook", year: 2004, type: "movie", themes: ["love", "memory", "class_difference"] },
    { title: "Pride and Prejudice", year: 2005, type: "movie", themes: ["period_romance", "class_difference", "misunderstanding"] },
    { title: "Bridgerton", year: 2020, type: "series", themes: ["period_romance", "society", "family"] },
    { title: "Crash Landing on You", year: 2019, type: "k-drama", themes: ["cross_border", "romance", "culture_clash"] },
    { title: "Business Proposal", year: 2022, type: "k-drama", themes: ["fake_relationship", "office_romance", "comedy"] }
  ],
  
  // Fantasy comps
  fantasy: [
    { title: "Harry Potter", year: 2001, type: "movie", themes: ["magic", "coming_of_age", "good_vs_evil"] },
    { title: "Game of Thrones", year: 2011, type: "series", themes: ["political_intrigue", "fantasy", "complex_characters"] },
    { title: "The Witcher", year: 2019, type: "series", themes: ["monster_hunting", "magic", "destiny"] },
    { title: "Hotel del Luna", year: 2019, type: "k-drama", themes: ["supernatural", "romance", "redemption"] },
    { title: "Guardian: The Lonely and Great God", year: 2016, type: "k-drama", themes: ["immortal", "modern_fantasy", "romance"] }
  ],
  
  // Action/Thriller comps  
  action: [
    { title: "John Wick", year: 2014, type: "movie", themes: ["revenge", "action", "underworld"] },
    { title: "Squid Game", year: 2021, type: "k-series", themes: ["survival", "social_commentary", "competition"] },
    { title: "Money Heist", year: 2017, type: "series", themes: ["heist", "strategy", "anti_hero"] },
    { title: "My Name", year: 2021, type: "k-series", themes: ["revenge", "undercover", "crime"] }
  ],
  
  // Comedy comps
  comedy: [
    { title: "The Office", year: 2005, type: "series", themes: ["workplace", "mockumentary", "relationships"] },
    { title: "Brooklyn Nine-Nine", year: 2013, type: "series", themes: ["workplace", "ensemble", "comedy"] },
    { title: "Welcome to Waikiki", year: 2018, type: "k-drama", themes: ["friendship", "comedy", "youth"] }
  ],
  
  // Drama comps
  drama: [
    { title: "This Is Us", year: 2016, type: "series", themes: ["family", "generational", "emotional"] },
    { title: "Sky Castle", year: 2018, type: "k-drama", themes: ["education", "society", "family_pressure"] },
    { title: "Reply 1988", year: 2015, type: "k-drama", themes: ["nostalgia", "friendship", "family"] }
  ]
};

/**
 * Calculate Jaccard similarity between two arrays
 */
function jaccardSimilarity(set1, set2) {
  if (!set1.length && !set2.length) return 1;
  if (!set1.length || !set2.length) return 0;
  
  const intersection = set1.filter(item => set2.includes(item)).length;
  const union = new Set([...set1, ...set2]).size;
  
  return intersection / union;
}

/**
 * Calculate cosine similarity between two keyword arrays
 */
function cosineSimilarity(keywords1, keywords2) {
  if (!keywords1.length && !keywords2.length) return 1;
  if (!keywords1.length || !keywords2.length) return 0;
  
  // Create vocabulary
  const allKeywords = new Set([...keywords1, ...keywords2]);
  const vocab = Array.from(allKeywords);
  
  // Create vectors
  const vector1 = vocab.map(word => keywords1.includes(word) ? 1 : 0);
  const vector2 = vocab.map(word => keywords2.includes(word) ? 1 : 0);
  
  // Calculate dot product
  const dotProduct = vector1.reduce((sum, val, i) => sum + val * vector2[i], 0);
  
  // Calculate magnitudes
  const magnitude1 = Math.sqrt(vector1.reduce((sum, val) => sum + val * val, 0));
  const magnitude2 = Math.sqrt(vector2.reduce((sum, val) => sum + val * val, 0));
  
  if (magnitude1 === 0 || magnitude2 === 0) return 0;
  
  return dotProduct / (magnitude1 * magnitude2);
}

/**
 * Normalize genres to primary categories
 */
function normalizeGenres(genres) {
  if (!genres || !Array.isArray(genres)) return [];
  
  const normalized = new Set();
  
  genres.forEach(genre => {
    // Find which primary category this genre belongs to
    for (const [primary, variants] of Object.entries(GENRE_HIERARCHY)) {
      if (variants.includes(genre)) {
        normalized.add(primary);
        break;
      }
    }
    // If no category found, add as-is (normalized to lowercase)
    if (![...normalized].some(n => GENRE_HIERARCHY[n]?.includes(genre))) {
      normalized.add(genre.toLowerCase());
    }
  });
  
  return Array.from(normalized);
}

/**
 * Calculate genre similarity with hierarchical matching
 */
function calculateGenreSimilarity(genres1, genres2) {
  const norm1 = normalizeGenres(genres1);
  const norm2 = normalizeGenres(genres2);
  
  return jaccardSimilarity(norm1, norm2);
}

/**
 * Calculate adaptation potential similarity
 */
function calculateAdaptationSimilarity(adapt1, adapt2) {
  if (!adapt1 || !adapt2) return 0;
  
  const metrics = ['visual_potential', 'character_driven', 'universal_appeal', 'production_complexity'];
  let totalSimilarity = 0;
  
  metrics.forEach(metric => {
    const val1 = adapt1[metric] || 0;
    const val2 = adapt2[metric] || 0;
    
    // Calculate similarity as inverse of absolute difference (normalized)
    const maxVal = Math.max(val1, val2, 1); // Avoid division by zero
    const similarity = 1 - Math.abs(val1 - val2) / maxVal;
    totalSimilarity += similarity;
  });
  
  return totalSimilarity / metrics.length;
}

/**
 * Calculate popularity similarity
 */
function calculatePopularitySimilarity(title1, title2) {
  // Extract popularity metrics
  const getPopularity = (title) => ({
    rating: title.rating || 0,
    views: title.views || 0,
    likes: title.likes || 0,
    rating_count: title.rating_count || 0
  });
  
  const pop1 = getPopularity(title1);
  const pop2 = getPopularity(title2);
  
  // Calculate normalized similarities
  let totalSim = 0;
  let validMetrics = 0;
  
  Object.keys(pop1).forEach(metric => {
    const val1 = pop1[metric];
    const val2 = pop2[metric];
    
    if (val1 > 0 || val2 > 0) {
      const maxVal = Math.max(val1, val2, 1);
      const similarity = 1 - Math.abs(val1 - val2) / maxVal;
      totalSim += similarity;
      validMetrics++;
    }
  });
  
  return validMetrics > 0 ? totalSim / validMetrics : 0;
}

/**
 * Check if title has Korean cultural elements
 */
function hasKoreanContent(title) {
  const koreanText = [title.title_name_kr, title.synopsis, title.tagline, title.pitch]
    .filter(Boolean)
    .join(' ');
  
  return /[가-힣]/.test(koreanText);
}

/**
 * Calculate overall similarity between two titles
 */
function calculateSimilarity(title1, title2) {
  if (title1.title_id === title2.title_id) return 0; // Don't compare with self
  
  const weights = COMP_CONFIG.SIMILARITY_WEIGHTS;
  const bonuses = COMP_CONFIG.BONUS_WEIGHTS;
  
  // Core similarity calculations
  const genreSim = calculateGenreSimilarity(title1.genres, title2.genres);
  const keywordSim = cosineSimilarity(title1.keyword_summary, title2.keyword_summary);
  const themeSim = jaccardSimilarity(
    title1.extracted_keywords?.thematic || [],
    title2.extracted_keywords?.thematic || []
  );
  const adaptationSim = calculateAdaptationSimilarity(
    title1.adaptation_analysis,
    title2.adaptation_analysis
  );
  const formatSim = title1.content_format === title2.content_format ? 1 : 0;
  const popularitySim = calculatePopularitySimilarity(title1, title2);
  const culturalSim = hasKoreanContent(title1) === hasKoreanContent(title2) ? 1 : 0;
  
  // Calculate weighted similarity
  let similarity = 
    genreSim * weights.genre +
    keywordSim * weights.keywords +
    themeSim * weights.themes +
    adaptationSim * weights.adaptation +
    formatSim * weights.content_format +
    popularitySim * weights.popularity +
    culturalSim * weights.cultural;
  
  // Apply bonuses
  let bonusScore = 0;
  
  // Exact genre match bonus
  if (title1.genres && title2.genres && 
      title1.genres.some(g => title2.genres.includes(g))) {
    bonusScore += bonuses.exact_genre_match;
  }
  
  // Similar popularity bonus
  if (popularitySim > 0.8) {
    bonusScore += bonuses.similar_popularity;
  }
  
  // Same format bonus
  if (title1.content_format === title2.content_format && title1.content_format) {
    bonusScore += bonuses.same_format;
  }
  
  // Korean content match bonus
  if (hasKoreanContent(title1) && hasKoreanContent(title2)) {
    bonusScore += bonuses.korean_content_match;
  }
  
  similarity += bonusScore;
  
  return Math.min(similarity, 1); // Cap at 1.0
}

/**
 * Find external comps based on genres and themes
 */
function findExternalComps(title, maxComps = 3) {
  const titleGenres = normalizeGenres(title.genres || []);
  const titleKeywords = title.keyword_summary || [];
  
  const potentialComps = [];
  
  // Check each external comp category
  Object.entries(EXTERNAL_COMPS).forEach(([category, comps]) => {
    if (titleGenres.includes(category)) {
      comps.forEach(comp => {
        // Calculate similarity based on themes
        const themeSimilarity = jaccardSimilarity(titleKeywords, comp.themes);
        const genreMatch = titleGenres.includes(category);
        
        const score = themeSimilarity * 0.7 + (genreMatch ? 0.3 : 0);
        
        if (score > 0.2) {
          potentialComps.push({
            ...comp,
            similarity_score: score,
            match_reason: `${category} genre match with thematic similarity`
          });
        }
      });
    }
  });
  
  // Sort by similarity and return top matches
  return potentialComps
    .sort((a, b) => b.similarity_score - a.similarity_score)
    .slice(0, maxComps);
}

/**
 * Generate comp analysis for a single title
 */
function generateCompAnalysis(targetTitle, allTitles) {
  const internalComps = [];
  
  // Compare with all other titles
  allTitles.forEach(title => {
    if (title.title_id !== targetTitle.title_id) {
      const similarity = calculateSimilarity(targetTitle, title);
      
      if (similarity >= COMP_CONFIG.MIN_SIMILARITY_THRESHOLD) {
        internalComps.push({
          title_id: title.title_id,
          title_name_kr: title.title_name_kr,
          title_name_en: title.title_name_en,
          similarity_score: similarity,
          genres: title.genres,
          content_format: title.content_format,
          match_details: {
            genre_similarity: calculateGenreSimilarity(targetTitle.genres, title.genres),
            keyword_similarity: cosineSimilarity(targetTitle.keyword_summary, title.keyword_summary),
            adaptation_similarity: calculateAdaptationSimilarity(
              targetTitle.adaptation_analysis,
              title.adaptation_analysis
            )
          }
        });
      }
    }
  });
  
  // Sort by similarity and take top matches
  const topInternalComps = internalComps
    .sort((a, b) => b.similarity_score - a.similarity_score)
    .slice(0, COMP_CONFIG.MAX_COMPS_PER_TITLE);
  
  // Find external comps
  const externalComps = findExternalComps(targetTitle);
  
  return {
    target_title: {
      title_id: targetTitle.title_id,
      title_name_kr: targetTitle.title_name_kr,
      title_name_en: targetTitle.title_name_en,
      genres: targetTitle.genres,
      content_format: targetTitle.content_format,
      keywords: targetTitle.keyword_summary
    },
    internal_comps: topInternalComps,
    external_comps: externalComps,
    analysis_summary: {
      total_internal_comps: topInternalComps.length,
      total_external_comps: externalComps.length,
      avg_internal_similarity: topInternalComps.length > 0 
        ? topInternalComps.reduce((sum, comp) => sum + comp.similarity_score, 0) / topInternalComps.length
        : 0,
      top_matching_genres: [...new Set(topInternalComps.flatMap(comp => comp.genres))].slice(0, 5),
      adaptability_score: targetTitle.adaptation_analysis ? 
        Object.values(targetTitle.adaptation_analysis).reduce((sum, val) => sum + val, 0) : 0
    }
  };
}

/**
 * Main execution function
 */
async function main() {
  console.log('🎬 Starting comparable titles (comps) analysis for KStoryBridge...\n');
  
  try {
    // Load keyword extraction results
    const files = fs.readdirSync('./').filter(f => f.startsWith('keyword-extraction-results-'));
    if (files.length === 0) {
      console.error('❌ No keyword extraction results found. Run keyword-extractor.js first.');
      process.exit(1);
    }
    
    const latestFile = files.sort().reverse()[0];
    console.log(`📄 Using keyword data from: ${latestFile}`);
    
    const keywordData = JSON.parse(fs.readFileSync(latestFile, 'utf8'));
    const titles = keywordData.results;
    
    console.log(`📊 Analyzing comps for ${titles.length} titles...`);
    console.log(`🎯 Similarity threshold: ${COMP_CONFIG.MIN_SIMILARITY_THRESHOLD}`);
    console.log(`📈 Max comps per title: ${COMP_CONFIG.MAX_COMPS_PER_TITLE}\n`);
    
    // Process each title
    const compResults = [];
    const stats = {
      processed: 0,
      titles_with_internal_comps: 0,
      titles_with_external_comps: 0,
      total_comp_relationships: 0,
      avg_similarity: 0
    };
    
    titles.forEach((title, index) => {
      console.log(`🔄 Processing: ${title.title_name_kr} (${title.title_name_en || 'No English title'}) - ${index + 1}/${titles.length}`);
      
      const compAnalysis = generateCompAnalysis(title, titles);
      compResults.push(compAnalysis);
      
      // Update statistics
      stats.processed++;
      if (compAnalysis.internal_comps.length > 0) stats.titles_with_internal_comps++;
      if (compAnalysis.external_comps.length > 0) stats.titles_with_external_comps++;
      stats.total_comp_relationships += compAnalysis.internal_comps.length;
      stats.avg_similarity += compAnalysis.analysis_summary.avg_internal_similarity;
      
      console.log(`   └── Found ${compAnalysis.internal_comps.length} internal comps, ${compAnalysis.external_comps.length} external comps`);
      
      // Progress indicator
      if ((index + 1) % 25 === 0) {
        console.log(`📊 Progress: ${index + 1}/${titles.length} titles processed\n`);
      }
    });
    
    // Generate final output
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const outputPath = path.join(process.cwd(), `comp-analysis-results-${timestamp}.json`);
    
    const output = {
      metadata: {
        analysis_date: new Date().toISOString(),
        total_titles_analyzed: stats.processed,
        titles_with_internal_comps: stats.titles_with_internal_comps,
        titles_with_external_comps: stats.titles_with_external_comps,
        total_comp_relationships: stats.total_comp_relationships,
        average_similarity_score: stats.processed > 0 ? stats.avg_similarity / stats.processed : 0,
        configuration: COMP_CONFIG
      },
      external_comps_database: EXTERNAL_COMPS,
      results: compResults
    };
    
    fs.writeFileSync(outputPath, JSON.stringify(output, null, 2));
    
    // Generate summary report
    console.log('\n📈 COMP ANALYSIS SUMMARY');
    console.log('=' .repeat(50));
    console.log(`📚 Total titles analyzed: ${stats.processed}`);
    console.log(`🔗 Titles with internal comps: ${stats.titles_with_internal_comps} (${(stats.titles_with_internal_comps/stats.processed*100).toFixed(1)}%)`);
    console.log(`🎭 Titles with external comps: ${stats.titles_with_external_comps} (${(stats.titles_with_external_comps/stats.processed*100).toFixed(1)}%)`);
    console.log(`🤝 Total comp relationships: ${stats.total_comp_relationships}`);
    console.log(`📊 Average similarity score: ${(stats.avg_similarity/stats.processed).toFixed(3)}`);
    console.log(`💾 Results saved to: ${outputPath}`);
    
    // Show some sample comps
    const highSimilarityTitles = compResults
      .filter(r => r.internal_comps.length > 0)
      .sort((a, b) => b.analysis_summary.avg_internal_similarity - a.analysis_summary.avg_internal_similarity)
      .slice(0, 5);
    
    console.log('\n🏆 TOP TITLES WITH HIGHEST COMP SIMILARITY:');
    highSimilarityTitles.forEach((result, index) => {
      const title = result.target_title;
      const topComp = result.internal_comps[0];
      console.log(`   ${index + 1}. ${title.title_name_kr} (${title.title_name_en || 'No English title'})`);
      console.log(`      └── Best comp: ${topComp.title_name_kr} (${topComp.title_name_en || 'No English title'}) - ${(topComp.similarity_score * 100).toFixed(1)}% similarity`);
    });
    
    console.log('\n✨ Comp analysis completed successfully!');
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

export { generateCompAnalysis, calculateSimilarity, EXTERNAL_COMPS };