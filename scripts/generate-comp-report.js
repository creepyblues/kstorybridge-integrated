#!/usr/bin/env node

/**
 * Generate Human-Readable Comp Analysis Reports
 * 
 * This script creates formatted reports from the comp analysis results
 * for easy review by buyers and stakeholders.
 */

import fs from 'fs';
import path from 'path';

/**
 * Format similarity score as percentage
 */
function formatSimilarity(score) {
  return `${(score * 100).toFixed(1)}%`;
}

/**
 * Generate detailed comp report for a single title
 */
function generateTitleReport(compData) {
  const { target_title, internal_comps, external_comps, analysis_summary } = compData;
  
  let report = [];
  report.push(`# ${target_title.title_name_kr} ${target_title.title_name_en ? `(${target_title.title_name_en})` : ''}`);
  report.push('');
  
  // Basic info
  report.push('## Title Information');
  report.push(`**Genres:** ${target_title.genres?.join(', ') || 'None specified'}`);
  report.push(`**Content Format:** ${target_title.content_format || 'Not specified'}`);
  report.push(`**Key Themes:** ${target_title.keywords?.slice(0, 10).join(', ') || 'None identified'}`);
  report.push(`**Adaptability Score:** ${analysis_summary.adaptability_score}/10`);
  report.push('');
  
  // Analysis summary
  report.push('## Comparable Analysis Summary');
  report.push(`- **Internal Comps Found:** ${analysis_summary.total_internal_comps}`);
  report.push(`- **External Comps Found:** ${analysis_summary.total_external_comps}`);
  report.push(`- **Average Similarity:** ${formatSimilarity(analysis_summary.avg_internal_similarity)}`);
  report.push(`- **Top Matching Genres:** ${analysis_summary.top_matching_genres?.join(', ') || 'None'}`);
  report.push('');
  
  // Internal comps (database titles)
  if (internal_comps.length > 0) {
    report.push('## Similar Titles in Database');
    report.push('');
    internal_comps.forEach((comp, index) => {
      const nameDisplay = comp.title_name_en ? `${comp.title_name_kr} (${comp.title_name_en})` : comp.title_name_kr;
      report.push(`### ${index + 1}. ${nameDisplay}`);
      report.push(`**Similarity:** ${formatSimilarity(comp.similarity_score)}`);
      report.push(`**Genres:** ${comp.genres?.join(', ') || 'None'}`);
      report.push(`**Format:** ${comp.content_format || 'Not specified'}`);
      
      // Match details
      const details = comp.match_details;
      if (details) {
        report.push('**Match Breakdown:**');
        report.push(`- Genre Similarity: ${formatSimilarity(details.genre_similarity)}`);
        report.push(`- Keyword Similarity: ${formatSimilarity(details.keyword_similarity)}`);
        report.push(`- Adaptation Potential: ${formatSimilarity(details.adaptation_similarity)}`);
      }
      report.push('');
    });
  }
  
  // External comps (known successful properties)
  if (external_comps.length > 0) {
    report.push('## Market Comparables (Successful Properties)');
    report.push('');
    external_comps.forEach((comp, index) => {
      report.push(`### ${index + 1}. ${comp.title} (${comp.year})`);
      report.push(`**Type:** ${comp.type.charAt(0).toUpperCase() + comp.type.slice(1)}`);
      report.push(`**Market Similarity:** ${formatSimilarity(comp.similarity_score)}`);
      report.push(`**Thematic Match:** ${comp.themes.join(', ')}`);
      report.push(`**Why it's a comp:** ${comp.match_reason}`);
      report.push('');
    });
  }
  
  return report.join('\n');
}

/**
 * Generate executive summary report
 */
function generateExecutiveSummary(allComps, metadata) {
  let report = [];
  report.push('# KStoryBridge Comp Analysis - Executive Summary');
  report.push('');
  report.push(`**Analysis Date:** ${new Date(metadata.analysis_date).toLocaleDateString()}`);
  report.push(`**Total Titles Analyzed:** ${metadata.total_titles_analyzed}`);
  report.push('');
  
  // Key metrics
  report.push('## Key Metrics');
  report.push(`- **Coverage:** ${metadata.titles_with_internal_comps}/${metadata.total_titles_analyzed} titles have internal comps (${(metadata.titles_with_internal_comps/metadata.total_titles_analyzed*100).toFixed(1)}%)`);
  report.push(`- **External Comp Coverage:** ${metadata.titles_with_external_comps}/${metadata.total_titles_analyzed} titles have market comps (${(metadata.titles_with_external_comps/metadata.total_titles_analyzed*100).toFixed(1)}%)`);
  report.push(`- **Total Relationships:** ${metadata.total_comp_relationships} internal comp relationships identified`);
  report.push(`- **Average Similarity:** ${formatSimilarity(metadata.average_similarity_score)}`);
  report.push('');
  
  // Top performing titles (highest similarity)
  const topTitles = allComps
    .filter(comp => comp.analysis_summary.avg_internal_similarity > 0)
    .sort((a, b) => b.analysis_summary.avg_internal_similarity - a.analysis_summary.avg_internal_similarity)
    .slice(0, 10);
  
  report.push('## Top 10 Most Comparable Titles');
  report.push('*(Titles with highest average similarity to other content)*');
  report.push('');
  topTitles.forEach((comp, index) => {
    const title = comp.target_title;
    const nameDisplay = title.title_name_en ? `${title.title_name_kr} (${title.title_name_en})` : title.title_name_kr;
    report.push(`${index + 1}. **${nameDisplay}** - ${formatSimilarity(comp.analysis_summary.avg_internal_similarity)} avg similarity`);
    report.push(`   - Genres: ${title.genres?.join(', ') || 'None'}`);
    report.push(`   - ${comp.analysis_summary.total_internal_comps} internal comps, ${comp.analysis_summary.total_external_comps} market comps`);
  });
  report.push('');
  
  // Genre distribution analysis
  const genreComps = {};
  allComps.forEach(comp => {
    const genres = comp.target_title.genres || [];
    genres.forEach(genre => {
      if (!genreComps[genre]) genreComps[genre] = { count: 0, avgSimilarity: 0, totalSim: 0 };
      genreComps[genre].count++;
      genreComps[genre].totalSim += comp.analysis_summary.avg_internal_similarity;
      genreComps[genre].avgSimilarity = genreComps[genre].totalSim / genreComps[genre].count;
    });
  });
  
  const topGenres = Object.entries(genreComps)
    .sort(([,a], [,b]) => b.count - a.count)
    .slice(0, 10);
  
  report.push('## Genre Analysis');
  report.push('');
  topGenres.forEach(([genre, data]) => {
    report.push(`- **${genre}:** ${data.count} titles, ${formatSimilarity(data.avgSimilarity)} avg similarity`);
  });
  report.push('');
  
  // Adaptation potential insights
  const adaptationScores = allComps.map(comp => comp.analysis_summary.adaptability_score);
  const avgAdaptation = adaptationScores.reduce((sum, score) => sum + score, 0) / adaptationScores.length;
  const highAdaptation = allComps.filter(comp => comp.analysis_summary.adaptability_score > avgAdaptation);
  
  report.push('## Adaptation Potential Insights');
  report.push(`- **Average Adaptability Score:** ${avgAdaptation.toFixed(1)}/10`);
  report.push(`- **High Adaptation Potential:** ${highAdaptation.length} titles (${(highAdaptation.length/allComps.length*100).toFixed(1)}%)`);
  report.push('');
  
  // External comp insights
  const externalCompsByType = {};
  allComps.forEach(comp => {
    comp.external_comps?.forEach(extComp => {
      if (!externalCompsByType[extComp.type]) externalCompsByType[extComp.type] = 0;
      externalCompsByType[extComp.type]++;
    });
  });
  
  report.push('## Market Comparable Insights');
  Object.entries(externalCompsByType).forEach(([type, count]) => {
    report.push(`- **${type.charAt(0).toUpperCase() + type.slice(1)}:** ${count} matches`);
  });
  report.push('');
  
  return report.join('\n');
}

/**
 * Main execution
 */
async function main() {
  console.log('📊 Generating comp analysis reports...\n');
  
  try {
    // Find the latest comp analysis results
    const files = fs.readdirSync('./').filter(f => f.startsWith('comp-analysis-results-'));
    if (files.length === 0) {
      console.error('❌ No comp analysis results found. Run comp-identifier.js first.');
      process.exit(1);
    }
    
    const latestFile = files.sort().reverse()[0];
    console.log(`📄 Using comp data from: ${latestFile}`);
    
    const compData = JSON.parse(fs.readFileSync(latestFile, 'utf8'));
    const allComps = compData.results;
    const metadata = compData.metadata;
    
    // Create reports directory
    const reportsDir = './comp-reports';
    if (!fs.existsSync(reportsDir)) {
      fs.mkdirSync(reportsDir);
    }
    
    console.log('📝 Generating executive summary...');
    const executiveSummary = generateExecutiveSummary(allComps, metadata);
    fs.writeFileSync(path.join(reportsDir, 'executive-summary.md'), executiveSummary);
    
    console.log('📋 Generating individual title reports...');
    const titleReportsDir = path.join(reportsDir, 'individual-titles');
    if (!fs.existsSync(titleReportsDir)) {
      fs.mkdirSync(titleReportsDir);
    }
    
    let reportsGenerated = 0;
    
    // Generate top 25 detailed reports (most interesting titles)
    const topTitles = allComps
      .filter(comp => comp.analysis_summary.avg_internal_similarity > 0.5)
      .sort((a, b) => b.analysis_summary.avg_internal_similarity - a.analysis_summary.avg_internal_similarity)
      .slice(0, 25);
    
    topTitles.forEach((compData, index) => {
      const title = compData.target_title;
      const filename = `${title.title_name_kr.replace(/[^\w가-힣]/g, '_')}_comp_report.md`;
      const report = generateTitleReport(compData);
      
      fs.writeFileSync(path.join(titleReportsDir, filename), report);
      reportsGenerated++;
      
      if ((index + 1) % 5 === 0) {
        console.log(`   Generated ${index + 1}/${topTitles.length} detailed reports...`);
      }
    });
    
    // Generate high-level overview for all titles
    console.log('📈 Generating master comp database...');
    let masterReport = [];
    masterReport.push('# KStoryBridge Comp Database - All Titles');
    masterReport.push('');
    masterReport.push('| Title (Korean) | Title (English) | Genres | Best Internal Comp | Similarity | External Comps |');
    masterReport.push('|---|---|---|---|---|---|');
    
    allComps.forEach(comp => {
      const title = comp.target_title;
      const bestComp = comp.internal_comps[0];
      const bestCompName = bestComp ? 
        (bestComp.title_name_en ? `${bestComp.title_name_kr} (${bestComp.title_name_en})` : bestComp.title_name_kr) :
        'None';
      const bestSimilarity = bestComp ? formatSimilarity(bestComp.similarity_score) : 'N/A';
      const externalCount = comp.external_comps?.length || 0;
      
      masterReport.push([
        title.title_name_kr,
        title.title_name_en || 'N/A',
        title.genres?.join(', ') || 'None',
        bestCompName,
        bestSimilarity,
        externalCount > 0 ? `${externalCount} matches` : 'None'
      ].join(' | '));
    });
    
    fs.writeFileSync(path.join(reportsDir, 'master-comp-database.md'), masterReport.join('\n'));
    
    // Summary
    console.log('\n✨ Report generation completed!');
    console.log('=' .repeat(50));
    console.log(`📁 Reports directory: ${reportsDir}/`);
    console.log(`📊 Executive summary: executive-summary.md`);
    console.log(`🗃️  Master database: master-comp-database.md`);
    console.log(`📋 Detailed reports: individual-titles/ (${reportsGenerated} reports)`);
    
    console.log('\n📈 Key Findings:');
    console.log(`- ${metadata.titles_with_internal_comps} titles have internal comps`);
    console.log(`- ${metadata.titles_with_external_comps} titles have market comps`);
    console.log(`- ${formatSimilarity(metadata.average_similarity_score)} average similarity`);
    console.log(`- ${topTitles.length} high-similarity titles identified for detailed analysis`);
    
  } catch (error) {
    console.error('❌ Error generating reports:', error);
    process.exit(1);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}