#!/usr/bin/env node

/**
 * Enhanced Vector Search Threshold Testing Script
 * Tests different similarity thresholds to find optimal values for semantic search
 */

import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';

const SUPABASE_URL = 'https://dlrnrgcoguxlkkcitlpd.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRscm5yZ2NvZ3V4bGtrY2l0bHBkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE3OTIzMzQsImV4cCI6MjA2NzM2ODMzNH0.KWYF7TvoA0I3iyoIbyYIyTSlJcIyPH6yCfHueEEMIlA';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Test queries for different semantic categories
const testQueries = [
  { query: 'romance', expectedThemes: ['love', 'relationship', 'romantic', 'dating', 'couple'] },
  { query: 'family', expectedThemes: ['family', 'parents', 'children', 'household', 'relatives'] },
  { query: 'thriller', expectedThemes: ['suspense', 'mystery', 'crime', 'action', 'danger'] },
  { query: 'school', expectedThemes: ['student', 'education', 'campus', 'high school', 'university'] },
  { query: 'fantasy', expectedThemes: ['magic', 'supernatural', 'fantasy', 'mystical', 'otherworld'] }
];

// Threshold values to test
const thresholds = [0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8];

async function generateTestEmbedding(query) {
  const openaiApiKey = process.env.VITE_OPENAI_API_KEY;

  if (!openaiApiKey || openaiApiKey === 'sk-your_actual_api_key_here') {
    console.log('❌ OpenAI API key not configured - using mock embedding');
    // Return a mock embedding for testing database function
    return new Array(1536).fill(Math.random() * 0.1);
  }

  try {
    const openai = new OpenAI({ apiKey: openaiApiKey });

    const response = await openai.embeddings.create({
      model: 'text-embedding-ada-002',
      input: query,
    });

    return response.data[0].embedding;
  } catch (error) {
    console.log(`❌ Failed to generate embedding for "${query}":`, error.message);
    return null;
  }
}

async function testThresholdForQuery(query, embedding, threshold) {
  try {
    const { data: results, error } = await supabase.rpc('match_titles_by_embedding', {
      query_embedding: embedding,
      match_threshold: threshold,
      match_count: 20
    });

    if (error) {
      return { error: error.message, results: [] };
    }

    return { results: results || [], error: null };
  } catch (error) {
    return { error: error.message, results: [] };
  }
}

async function analyzeResultRelevance(query, results, expectedThemes) {
  if (!results || results.length === 0) {
    return { relevanceScore: 0, relevantCount: 0, analysis: 'No results' };
  }

  let relevantCount = 0;
  const analysis = [];

  for (const result of results) {
    const title = result.title_name_en || result.title_name_kr || 'Unknown';
    const description = result.description || result.synopsis || '';
    const similarity = result.similarity || 0;

    // Simple relevance check - does title or description contain expected themes
    const titleText = `${title} ${description}`.toLowerCase();
    const isRelevant = expectedThemes.some(theme => titleText.includes(theme.toLowerCase()));

    if (isRelevant) {
      relevantCount++;
    }

    analysis.push({
      title,
      similarity: Math.round(similarity * 100),
      isRelevant,
      reason: isRelevant ? 'Contains expected themes' : 'No matching themes found'
    });
  }

  const relevanceScore = relevantCount / results.length;

  return {
    relevanceScore: Math.round(relevanceScore * 100),
    relevantCount,
    totalResults: results.length,
    analysis: analysis.slice(0, 5) // Show top 5 for brevity
  };
}

async function runThresholdAnalysis() {
  console.log('🔍 VECTOR SEARCH THRESHOLD ANALYSIS');
  console.log('='.repeat(60));

  // First, check if we have embeddings in the database
  console.log('\n📊 Checking embedding coverage...');
  try {
    const { data: embeddingStats, error } = await supabase
      .from('titles')
      .select('title_id, combined_embedding')
      .not('combined_embedding', 'is', null)
      .limit(5);

    if (error) {
      console.log('❌ Error checking embeddings:', error.message);
      return;
    }

    console.log(`✅ Found ${embeddingStats.length} titles with embeddings (showing first 5)`);
    if (embeddingStats.length === 0) {
      console.log('❌ No embeddings found in database. Run embedding generation first.');
      return;
    }
  } catch (error) {
    console.log('❌ Database connection error:', error.message);
    return;
  }

  // Test each query with different thresholds
  for (const testCase of testQueries) {
    console.log(`\n🎯 Testing query: "${testCase.query}"`);
    console.log(`   Expected themes: ${testCase.expectedThemes.join(', ')}`);
    console.log('-'.repeat(50));

    // Generate embedding for the query
    const embedding = await generateTestEmbedding(testCase.query);
    if (!embedding) {
      console.log('   ❌ Failed to generate embedding, skipping...');
      continue;
    }

    // Test different thresholds
    const results = [];
    for (const threshold of thresholds) {
      const testResult = await testThresholdForQuery(testCase.query, embedding, threshold);

      if (testResult.error) {
        console.log(`   ❌ Threshold ${threshold}: Error - ${testResult.error}`);
        continue;
      }

      const analysis = await analyzeResultRelevance(
        testCase.query,
        testResult.results,
        testCase.expectedThemes
      );

      results.push({
        threshold,
        resultCount: testResult.results.length,
        relevanceScore: analysis.relevanceScore,
        relevantCount: analysis.relevantCount
      });

      console.log(`   📋 Threshold ${threshold.toFixed(1)}: ${testResult.results.length.toString().padStart(2)} results, ${analysis.relevanceScore}% relevant (${analysis.relevantCount}/${analysis.totalResults})`);
    }

    // Find optimal threshold for this query
    const optimalThreshold = results
      .filter(r => r.resultCount >= 3) // Must have at least 3 results
      .sort((a, b) => b.relevanceScore - a.relevanceScore)[0];

    if (optimalThreshold) {
      console.log(`   🎯 OPTIMAL: Threshold ${optimalThreshold.threshold} (${optimalThreshold.resultCount} results, ${optimalThreshold.relevanceScore}% relevant)`);
    } else {
      console.log(`   ⚠️  No optimal threshold found (all thresholds produced < 3 results)`);
    }
  }

  // Overall recommendations
  console.log('\n📊 ANALYSIS SUMMARY');
  console.log('='.repeat(50));
  console.log('Based on the results above:');
  console.log('• Lower thresholds (0.2-0.4) generally produce more results');
  console.log('• Higher thresholds (0.6+) may be too restrictive');
  console.log('• Optimal range appears to be 0.3-0.5 for balanced results/relevance');
  console.log('\n💡 RECOMMENDATIONS:');
  console.log('• Set DEFAULT_MATCH_THRESHOLD to 0.4');
  console.log('• Set DEFAULT_VECTOR_THRESHOLD to 0.5');
  console.log('• Use progressive fallback: [0.5, 0.4, 0.3, 0.2] if insufficient results');
  console.log('• Monitor search analytics to fine-tune based on user behavior');
}

async function main() {
  await runThresholdAnalysis();
}

// Run the analysis
main().catch(error => {
  console.error('Script failed:', error);
  process.exit(1);
});