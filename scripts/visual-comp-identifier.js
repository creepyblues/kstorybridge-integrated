#!/usr/bin/env node

/**
 * Visual Adaptation Comps Identifier for KStoryBridge
 * 
 * This script identifies comparable titles specifically from successful
 * TV shows, films, anime, and animation - focusing on visual adaptations
 * rather than source material like novels, webtoons, or comics.
 * 
 * The goal is to help buyers understand what successful visual properties
 * each title could be compared to for adaptation purposes.
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Supabase configuration
const SUPABASE_URL = "https://dlrnrgcoguxlkkcitlpd.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRscm5yZ2NvZ3V4bGtrY2l0bHBkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE3OTIzMzQsImV4cCI6MjA2NzM2ODMzNH0.KWYF7TvoA0I3iyoIbyYIyTSlJcIyPH6yCfHueEEMIlA";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Comprehensive visual adaptation comps database
const VISUAL_COMPS_DATABASE = {
  // Romance TV/Film
  romance: [
    // Movies
    { title: "The Notebook", year: 2004, type: "movie", themes: ["love", "memory", "class_difference", "tragic_romance"], region: "Hollywood" },
    { title: "Pride and Prejudice", year: 2005, type: "movie", themes: ["period_romance", "class_difference", "misunderstanding", "witty_banter"], region: "Hollywood" },
    { title: "The Princess Bride", year: 1987, type: "movie", themes: ["fairy_tale", "adventure", "true_love", "comedy"], region: "Hollywood" },
    { title: "Titanic", year: 1997, type: "movie", themes: ["epic_romance", "class_difference", "tragedy", "historical"], region: "Hollywood" },
    { title: "When Harry Met Sally", year: 1989, type: "movie", themes: ["friends_to_lovers", "rom_com", "dialogue_heavy", "modern"], region: "Hollywood" },
    { title: "Crazy Rich Asians", year: 2018, type: "movie", themes: ["wealth_gap", "family_pressure", "cultural_clash", "comedy"], region: "Hollywood" },
    
    // TV Series
    { title: "Bridgerton", year: 2020, type: "tv_series", themes: ["period_romance", "society", "family", "steamy"], region: "Netflix" },
    { title: "The Crown", year: 2016, type: "tv_series", themes: ["royal_romance", "duty_vs_love", "historical", "political"], region: "Netflix" },
    { title: "Outlander", year: 2014, type: "tv_series", themes: ["time_travel", "historical", "passionate_love", "adventure"], region: "Starz" },
    { title: "Emily in Paris", year: 2020, type: "tv_series", themes: ["fish_out_of_water", "workplace_romance", "fashion", "culture_clash"], region: "Netflix" },
    { title: "Sex and the City", year: 1998, type: "tv_series", themes: ["modern_dating", "friendship", "career_women", "urban"], region: "HBO" },
    
    // K-Dramas
    { title: "Crash Landing on You", year: 2019, type: "k_drama", themes: ["cross_border", "forbidden_love", "culture_clash", "action"], region: "South Korea" },
    { title: "Business Proposal", year: 2022, type: "k_drama", themes: ["fake_relationship", "office_romance", "comedy", "contract"], region: "South Korea" },
    { title: "What's Wrong with Secretary Kim", year: 2018, type: "k_drama", themes: ["boss_employee", "workplace", "comedy", "misunderstanding"], region: "South Korea" },
    { title: "Goblin", year: 2016, type: "k_drama", themes: ["supernatural", "immortal", "reincarnation", "fantasy"], region: "South Korea" },
    { title: "Boys Over Flowers", year: 2009, type: "k_drama", themes: ["school", "rich_poor", "reverse_harem", "makeover"], region: "South Korea" },
    { title: "The Heirs", year: 2013, type: "k_drama", themes: ["school", "chaebol", "love_triangle", "class_difference"], region: "South Korea" },
    
    // Anime
    { title: "Your Name", year: 2016, type: "anime_movie", themes: ["body_swap", "supernatural", "time", "young_love"], region: "Japan" },
    { title: "Weathering With You", year: 2019, type: "anime_movie", themes: ["weather_powers", "sacrifice", "young_love", "urban"], region: "Japan" },
    { title: "Kimi ni Todoke", year: 2009, type: "anime_series", themes: ["shy_girl", "school", "misunderstanding", "pure_love"], region: "Japan" }
  ],
  
  // Fantasy TV/Film
  fantasy: [
    // Movies
    { title: "Harry Potter Series", year: 2001, type: "movie_series", themes: ["magic_school", "coming_of_age", "good_vs_evil", "friendship"], region: "Hollywood" },
    { title: "Lord of the Rings", year: 2001, type: "movie_series", themes: ["epic_fantasy", "quest", "friendship", "good_vs_evil"], region: "Hollywood" },
    { title: "The Chronicles of Narnia", year: 2005, type: "movie_series", themes: ["portal_fantasy", "children", "talking_animals", "prophecy"], region: "Hollywood" },
    { title: "Pan's Labyrinth", year: 2006, type: "movie", themes: ["dark_fantasy", "child_protagonist", "war", "imagination"], region: "Spain" },
    { title: "The Shape of Water", year: 2017, type: "movie", themes: ["creature_romance", "supernatural", "outcasts", "period"], region: "Hollywood" },
    
    // TV Series
    { title: "Game of Thrones", year: 2011, type: "tv_series", themes: ["political_intrigue", "dragons", "complex_characters", "war"], region: "HBO" },
    { title: "The Witcher", year: 2019, type: "tv_series", themes: ["monster_hunting", "destiny", "multiple_timelines", "magic"], region: "Netflix" },
    { title: "Stranger Things", year: 2016, type: "tv_series", themes: ["supernatural", "small_town", "friendship", "80s_nostalgia"], region: "Netflix" },
    { title: "The Umbrella Academy", year: 2019, type: "tv_series", themes: ["superpowers", "dysfunctional_family", "apocalypse", "time_travel"], region: "Netflix" },
    { title: "Shadow and Bone", year: 2021, type: "tv_series", themes: ["magic_system", "war", "chosen_one", "young_adult"], region: "Netflix" },
    
    // K-Dramas
    { title: "Hotel del Luna", year: 2019, type: "k_drama", themes: ["supernatural", "ghosts", "romance", "redemption"], region: "South Korea" },
    { title: "Guardian: The Lonely and Great God", year: 2016, type: "k_drama", themes: ["immortal", "grim_reaper", "fate", "modern_fantasy"], region: "South Korea" },
    { title: "W: Two Worlds", year: 2016, type: "k_drama", themes: ["webtoon_world", "parallel_dimensions", "romance", "thriller"], region: "South Korea" },
    { title: "My Love from the Star", year: 2013, type: "k_drama", themes: ["alien", "immortal", "celebrity", "romance"], region: "South Korea" },
    
    // Anime
    { title: "Attack on Titan", year: 2013, type: "anime_series", themes: ["giants", "survival", "war", "mystery"], region: "Japan" },
    { title: "Demon Slayer", year: 2019, type: "anime_series", themes: ["demons", "sword_fighting", "family", "training"], region: "Japan" },
    { title: "Spirited Away", year: 2001, type: "anime_movie", themes: ["spirit_world", "coming_of_age", "environmental", "family"], region: "Japan" },
    { title: "Princess Mononoke", year: 1997, type: "anime_movie", themes: ["nature_vs_industry", "war", "spirits", "environmental"], region: "Japan" }
  ],
  
  // Action/Thriller TV/Film
  action: [
    // Movies
    { title: "John Wick", year: 2014, type: "movie_series", themes: ["revenge", "assassin", "underworld", "stylized_action"], region: "Hollywood" },
    { title: "Mad Max: Fury Road", year: 2015, type: "movie", themes: ["post_apocalyptic", "chase", "strong_female", "survival"], region: "Hollywood" },
    { title: "The Matrix", year: 1999, type: "movie_series", themes: ["reality_vs_simulation", "chosen_one", "martial_arts", "philosophical"], region: "Hollywood" },
    { title: "Kill Bill", year: 2003, type: "movie_series", themes: ["revenge", "martial_arts", "strong_female", "stylized"], region: "Hollywood" },
    { title: "Mission Impossible", year: 1996, type: "movie_series", themes: ["spy", "heist", "team", "high_tech"], region: "Hollywood" },
    
    // TV Series
    { title: "24", year: 2001, type: "tv_series", themes: ["real_time", "counter_terrorism", "conspiracy", "ticking_clock"], region: "Fox" },
    { title: "Breaking Bad", year: 2008, type: "tv_series", themes: ["crime", "transformation", "family_man_to_criminal", "moral_decay"], region: "AMC" },
    { title: "Prison Break", year: 2005, type: "tv_series", themes: ["escape", "conspiracy", "brothers", "elaborate_plan"], region: "Fox" },
    { title: "Money Heist", year: 2017, type: "tv_series", themes: ["heist", "red_jumpsuit", "professor", "resistance"], region: "Spain" },
    { title: "The Boys", year: 2019, type: "tv_series", themes: ["corrupt_superheroes", "dark", "satire", "violence"], region: "Amazon" },
    
    // K-Content
    { title: "Squid Game", year: 2021, type: "k_series", themes: ["survival_game", "social_commentary", "debt", "childhood_games"], region: "South Korea" },
    { title: "My Name", year: 2021, type: "k_series", themes: ["revenge", "undercover", "crime_family", "strong_female"], region: "South Korea" },
    { title: "Kingdom", year: 2019, type: "k_series", themes: ["zombies", "historical", "political_intrigue", "survival"], region: "South Korea" },
    { title: "Train to Busan", year: 2016, type: "movie", themes: ["zombies", "confined_space", "sacrifice", "social_class"], region: "South Korea" },
    { title: "Oldboy", year: 2003, type: "movie", themes: ["revenge", "mystery", "psychological", "twist"], region: "South Korea" },
    
    // Anime
    { title: "Death Note", year: 2006, type: "anime_series", themes: ["supernatural", "cat_and_mouse", "morality", "genius"], region: "Japan" },
    { title: "Akira", year: 1988, type: "anime_movie", themes: ["cyberpunk", "psychic_powers", "dystopian", "motorcycle"], region: "Japan" },
    { title: "Ghost in the Shell", year: 1995, type: "anime_movie", themes: ["cyberpunk", "identity", "AI", "police"], region: "Japan" }
  ],
  
  // Comedy TV/Film
  comedy: [
    // Movies
    { title: "Mean Girls", year: 2004, type: "movie", themes: ["high_school", "popularity", "female_friendship", "coming_of_age"], region: "Hollywood" },
    { title: "Legally Blonde", year: 2001, type: "movie", themes: ["underestimated_female", "law_school", "pink", "empowerment"], region: "Hollywood" },
    { title: "The Hangover", year: 2009, type: "movie", themes: ["bachelor_party", "mystery", "friendship", "vegas"], region: "Hollywood" },
    { title: "Superbad", year: 2007, type: "movie", themes: ["coming_of_age", "friendship", "high_school", "raunchy"], region: "Hollywood" },
    
    // TV Series
    { title: "The Office", year: 2005, type: "tv_series", themes: ["workplace", "mockumentary", "awkward", "romance"], region: "NBC" },
    { title: "Friends", year: 1994, type: "tv_series", themes: ["friendship", "dating", "urban", "ensemble"], region: "NBC" },
    { title: "Brooklyn Nine-Nine", year: 2013, type: "tv_series", themes: ["police_comedy", "ensemble", "workplace", "diverse"], region: "NBC" },
    { title: "Parks and Recreation", year: 2009, type: "tv_series", themes: ["government", "optimism", "small_town", "workplace"], region: "NBC" },
    { title: "Schitt's Creek", year: 2015, type: "tv_series", themes: ["rich_to_poor", "family", "small_town", "LGBTQ"], region: "Canada" },
    
    // K-Dramas
    { title: "Welcome to Waikiki", year: 2018, type: "k_drama", themes: ["friendship", "guesthouse", "struggling_actors", "slapstick"], region: "South Korea" },
    { title: "Strong Girl Bong-soon", year: 2017, type: "k_drama", themes: ["superhuman_strength", "bodyguard", "comedy", "romance"], region: "South Korea" },
    { title: "Fight My Way", year: 2017, type: "k_drama", themes: ["underdogs", "friendship", "romance", "working_class"], region: "South Korea" },
    
    // Anime
    { title: "One Punch Man", year: 2015, type: "anime_series", themes: ["superhero_parody", "overpowered", "bald_hero", "satire"], region: "Japan" },
    { title: "Kaguya-sama: Love is War", year: 2019, type: "anime_series", themes: ["romantic_comedy", "mind_games", "school", "pride"], region: "Japan" }
  ],
  
  // Drama TV/Film
  drama: [
    // TV Series
    { title: "This Is Us", year: 2016, type: "tv_series", themes: ["family", "multi_generational", "emotional", "flashbacks"], region: "NBC" },
    { title: "The Crown", year: 2016, type: "tv_series", themes: ["royal_family", "historical", "duty", "political"], region: "Netflix" },
    { title: "Succession", year: 2018, type: "tv_series", themes: ["media_dynasty", "family_betrayal", "corporate", "dark_comedy"], region: "HBO" },
    { title: "Downton Abbey", year: 2010, type: "tv_series", themes: ["period_drama", "class_system", "servants_nobles", "historical"], region: "ITV" },
    
    // K-Dramas
    { title: "Sky Castle", year: 2018, type: "k_drama", themes: ["education_pressure", "elite_society", "family_ambition", "dark"], region: "South Korea" },
    { title: "Reply 1988", year: 2015, type: "k_drama", themes: ["nostalgia", "neighborhood", "friendship", "family"], region: "South Korea" },
    { title: "Misaeng", year: 2014, type: "k_drama", themes: ["office_life", "corporate_culture", "underdog", "realistic"], region: "South Korea" },
    { title: "Mr. Sunshine", year: 2018, type: "k_drama", themes: ["historical", "independence_movement", "love_triangle", "epic"], region: "South Korea" },
    
    // Movies
    { title: "Parasite", year: 2019, type: "movie", themes: ["class_divide", "dark_comedy", "social_commentary", "thriller"], region: "South Korea" },
    { title: "Moonlight", year: 2016, type: "movie", themes: ["coming_of_age", "identity", "LGBTQ", "three_acts"], region: "Hollywood" },
    { title: "Manchester by the Sea", year: 2016, type: "movie", themes: ["grief", "family_tragedy", "small_town", "emotional"], region: "Hollywood" }
  ],
  
  // Sci-Fi TV/Film
  scifi: [
    // TV Series
    { title: "Black Mirror", year: 2011, type: "tv_series", themes: ["technology", "dystopian", "anthology", "social_commentary"], region: "Netflix" },
    { title: "Westworld", year: 2016, type: "tv_series", themes: ["AI", "consciousness", "western", "philosophy"], region: "HBO" },
    { title: "Stranger Things", year: 2016, type: "tv_series", themes: ["alternate_dimension", "government_conspiracy", "kids", "80s"], region: "Netflix" },
    { title: "The Mandalorian", year: 2019, type: "tv_series", themes: ["space_western", "bounty_hunter", "found_family", "star_wars"], region: "Disney+" },
    
    // Movies
    { title: "Blade Runner 2049", year: 2017, type: "movie", themes: ["replicants", "identity", "dystopian_future", "philosophical"], region: "Hollywood" },
    { title: "Arrival", year: 2016, type: "movie", themes: ["alien_contact", "language", "time", "communication"], region: "Hollywood" },
    { title: "Ex Machina", year: 2014, type: "movie", themes: ["AI", "turing_test", "consciousness", "isolated_setting"], region: "Hollywood" },
    
    // Anime
    { title: "Ghost in the Shell: SAC", year: 2002, type: "anime_series", themes: ["cyberpunk", "police", "AI", "philosophy"], region: "Japan" },
    { title: "Cowboy Bebop", year: 1998, type: "anime_series", themes: ["space_bounty_hunters", "jazz", "episodic", "noir"], region: "Japan" }
  ],
  
  // Horror/Thriller TV/Film
  horror: [
    // TV Series
    { title: "The Walking Dead", year: 2010, type: "tv_series", themes: ["zombie_apocalypse", "survival", "group_dynamics", "human_nature"], region: "AMC" },
    { title: "American Horror Story", year: 2011, type: "tv_series", themes: ["anthology", "supernatural", "historical", "gothic"], region: "FX" },
    { title: "The Haunting of Hill House", year: 2018, type: "tv_series", themes: ["family_trauma", "ghosts", "psychological", "flashbacks"], region: "Netflix" },
    
    // Movies  
    { title: "Get Out", year: 2017, type: "movie", themes: ["racial_horror", "social_commentary", "psychological", "twist"], region: "Hollywood" },
    { title: "A Quiet Place", year: 2018, type: "movie", themes: ["silence", "family", "monsters", "post_apocalyptic"], region: "Hollywood" },
    
    // K-Content
    { title: "Kingdom", year: 2019, type: "k_series", themes: ["historical_zombies", "political_intrigue", "survival", "period"], region: "South Korea" },
    { title: "The Wailing", year: 2016, type: "movie", themes: ["supernatural_mystery", "village", "possession", "ambiguous"], region: "South Korea" },
    
    // Anime
    { title: "Another", year: 2012, type: "anime_series", themes: ["curse", "school", "mystery", "death"], region: "Japan" },
    { title: "Perfect Blue", year: 1997, type: "anime_movie", themes: ["psychological_horror", "identity", "fame", "reality_blur"], region: "Japan" }
  ],
  
  // Slice of Life TV/Film
  slice_of_life: [
    // TV Series
    { title: "Terrace House", year: 2012, type: "reality_tv", themes: ["real_life", "relationships", "japanese_culture", "slow_pace"], region: "Japan" },
    { title: "Queer Eye", year: 2018, type: "reality_tv", themes: ["makeover", "LGBTQ", "positivity", "lifestyle"], region: "Netflix" },
    
    // K-Dramas
    { title: "Hospital Playlist", year: 2020, type: "k_drama", themes: ["medical", "friendship", "music", "daily_life"], region: "South Korea" },
    { title: "Be Melodramatic", year: 2019, type: "k_drama", themes: ["female_friendship", "career", "modern_women", "realistic"], region: "South Korea" },
    
    // Anime
    { title: "March Comes in Like a Lion", year: 2016, type: "anime_series", themes: ["shogi", "found_family", "depression", "healing"], region: "Japan" },
    { title: "Barakamon", year: 2014, type: "anime_series", themes: ["calligraphy", "island_life", "artist", "healing"], region: "Japan" }
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
 * Normalize genres to primary categories for better matching
 */
function normalizeGenres(genres) {
  if (!genres || !Array.isArray(genres)) return [];
  
  const genreMap = {
    romance: ['romance', 'ROMANCE', 'Romance', 'ROM-COM', 'ROMANTIC', 'ROMANTICTHRILLER'],
    drama: ['drama', 'DRAMA', 'Drama', 'DRAMEDY', 'melodrama'],
    fantasy: ['fantasy', 'Fantasy', 'FANTASTICAL', 'orientalfantasy', 'SFfantasy', 'SUPERNATURAL'],
    comedy: ['comedy', 'Comedy', 'COMEDY', 'gag', 'gags', 'Gag', 'Gags', 'familycomedy', 'blackcomedy'],
    action: ['action', 'Action', 'ACTION', 'SF/ACTIONADVENTURE'],
    thriller: ['thriller', 'Thriller', 'THRILLER'],
    horror: ['horror', 'Horror'],
    scifi: ['SCI-FI', 'SFfantasy', 'SF/ACTIONADVENTURE'],
    slice_of_life: ['dailylife', 'Dailylife', 'DailyLife', 'daily', 'healing', 'Healing']
  };
  
  const normalized = new Set();
  
  genres.forEach(genre => {
    for (const [category, variants] of Object.entries(genreMap)) {
      if (variants.includes(genre)) {
        normalized.add(category);
        break;
      }
    }
  });
  
  return Array.from(normalized);
}

/**
 * Find visual adaptation comps for a title
 */
function findVisualComps(title, maxComps = 5) {
  const titleGenres = normalizeGenres(title.genres || []);
  const titleKeywords = title.keyword_summary || [];
  
  const potentialComps = [];
  
  // Check each visual comp category
  Object.entries(VISUAL_COMPS_DATABASE).forEach(([category, comps]) => {
    if (titleGenres.includes(category)) {
      comps.forEach(comp => {
        // Calculate theme similarity
        const themeSimilarity = jaccardSimilarity(titleKeywords, comp.themes);
        
        // Genre match bonus
        const genreMatch = titleGenres.includes(category) ? 0.4 : 0;
        
        // Regional bonus for Korean content
        const koreanContent = /[가-힣]/.test(title.title_name_kr);
        const regionBonus = (koreanContent && comp.region === "South Korea") ? 0.2 : 0;
        
        // Type preference (TV series and movies are preferred)
        const typeBonus = ['tv_series', 'movie', 'movie_series', 'k_drama', 'k_series'].includes(comp.type) ? 0.1 : 0;
        
        const totalScore = themeSimilarity * 0.5 + genreMatch + regionBonus + typeBonus;
        
        if (totalScore > 0.3) {
          potentialComps.push({
            ...comp,
            similarity_score: totalScore,
            match_category: category,
            match_reason: `${category} genre match ${regionBonus > 0 ? '+ Korean content match' : ''}`
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
 * Generate comprehensive comp list for all titles
 */
async function generateComprehensiveCompList() {
  console.log('🎬 Generating comprehensive TV/Film/Anime comp list for KStoryBridge titles...\n');
  
  try {
    // Load existing keyword data
    const files = fs.readdirSync('./').filter(f => f.startsWith('keyword-extraction-results-'));
    if (files.length === 0) {
      console.error('❌ No keyword extraction results found. Run keyword-extractor.js first.');
      process.exit(1);
    }
    
    const latestFile = files.sort().reverse()[0];
    console.log(`📄 Using keyword data from: ${latestFile}`);
    
    const keywordData = JSON.parse(fs.readFileSync(latestFile, 'utf8'));
    const titles = keywordData.results;
    
    console.log(`📊 Processing ${titles.length} titles for visual adaptation comps...`);
    console.log(`🎭 Focus: TV series, movies, K-dramas, anime only\n`);
    
    // Process each title
    const allComps = [];
    let processedCount = 0;
    let titlesWithComps = 0;
    
    titles.forEach((title, index) => {
      console.log(`🔄 Processing: ${title.title_name_kr} (${title.title_name_en || 'No English title'}) - ${index + 1}/${titles.length}`);
      
      // Find internal comps (other titles in database with similar themes)
      const internalComps = titles
        .filter(otherTitle => otherTitle.title_id !== title.title_id)
        .map(otherTitle => {
          const genreSim = jaccardSimilarity(
            normalizeGenres(title.genres), 
            normalizeGenres(otherTitle.genres)
          );
          const keywordSim = jaccardSimilarity(title.keyword_summary || [], otherTitle.keyword_summary || []);
          const similarity = (genreSim * 0.6) + (keywordSim * 0.4);
          
          return {
            title_kr: otherTitle.title_name_kr,
            title_en: otherTitle.title_name_en,
            similarity: similarity,
            genres: otherTitle.genres
          };
        })
        .filter(comp => comp.similarity > 0.3)
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, 5); // Top 5 internal comps
      
      // Find visual adaptation comps
      const visualComps = findVisualComps(title);
      
      const compData = {
        title_kr: title.title_name_kr,
        title_en: title.title_name_en || '',
        genres: title.genres || [],
        content_format: title.content_format,
        keywords: (title.keyword_summary || []).slice(0, 8), // Top keywords only
        internal_comps: internalComps,
        external_comps: visualComps,
        comp_count: {
          internal: internalComps.length,
          external: visualComps.length,
          total: internalComps.length + visualComps.length
        }
      };
      
      allComps.push(compData);
      processedCount++;
      
      if (visualComps.length > 0 || internalComps.length > 0) {
        titlesWithComps++;
      }
      
      console.log(`   └── Found ${internalComps.length} internal + ${visualComps.length} visual comps`);
      
      // Progress indicator
      if ((index + 1) % 25 === 0) {
        console.log(`📊 Progress: ${index + 1}/${titles.length} titles processed\n`);
      }
    });
    
    // Generate output
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const outputPath = path.join(process.cwd(), `comprehensive-comp-list-${timestamp}.json`);
    
    const output = {
      metadata: {
        generation_date: new Date().toISOString(),
        total_titles: processedCount,
        titles_with_comps: titlesWithComps,
        coverage_percentage: (titlesWithComps / processedCount * 100).toFixed(1),
        comp_focus: "TV series, movies, K-dramas, anime, animation only",
        visual_comps_database_size: Object.values(VISUAL_COMPS_DATABASE).flat().length
      },
      comp_results: allComps
    };
    
    fs.writeFileSync(outputPath, JSON.stringify(output, null, 2));
    
    // Generate readable table format
    const tableOutputPath = path.join(process.cwd(), `comprehensive-comp-table-${timestamp}.md`);
    let tableContent = [];
    
    tableContent.push('# KStoryBridge Comprehensive Comp List');
    tableContent.push('*Focus: TV Series, Movies, K-Dramas, Anime & Animation Only*');
    tableContent.push('');
    tableContent.push(`**Generated:** ${new Date().toLocaleDateString()}`);
    tableContent.push(`**Total Titles:** ${processedCount}`);
    tableContent.push(`**Titles with Comps:** ${titlesWithComps} (${(titlesWithComps / processedCount * 100).toFixed(1)}%)`);
    tableContent.push('');
    
    // Summary statistics
    const genreCounts = {};
    const topVisualComps = {};
    
    allComps.forEach(comp => {
      // Count genres
      comp.genres.forEach(genre => {
        genreCounts[genre] = (genreCounts[genre] || 0) + 1;
      });
      
      // Count visual comps
      comp.external_comps.forEach(extComp => {
        topVisualComps[extComp.title] = (topVisualComps[extComp.title] || 0) + 1;
      });
    });
    
    // Add statistics
    tableContent.push('## Top Genres');
    Object.entries(genreCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .forEach(([genre, count]) => {
        tableContent.push(`- **${genre}:** ${count} titles`);
      });
    
    tableContent.push('');
    tableContent.push('## Most Matched Visual Comps');
    Object.entries(topVisualComps)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 15)
      .forEach(([comp, count]) => {
        tableContent.push(`- **${comp}:** ${count} matches`);
      });
    
    tableContent.push('');
    tableContent.push('---');
    tableContent.push('');
    
    // Main table
    tableContent.push('## Complete Comp List');
    tableContent.push('');
    tableContent.push('| Title (Korean) | Title (English) | Genres | Internal Comps | External Comps (TV/Film/Anime) |');
    tableContent.push('|---|---|---|---|---|');
    
    allComps
      .sort((a, b) => b.comp_count.total - a.comp_count.total) // Sort by total comp count
      .forEach(comp => {
        const internalList = comp.internal_comps
          .slice(0, 3) // Top 3 only
          .map(ic => `${ic.title_kr}${ic.title_en ? ` (${ic.title_en})` : ''}`)
          .join('<br>');
        
        const externalList = comp.external_comps
          .slice(0, 3) // Top 3 only
          .map(ec => `**${ec.title}** (${ec.year}, ${ec.type.replace('_', ' ')})`)
          .join('<br>');
        
        tableContent.push([
          comp.title_kr,
          comp.title_en || 'N/A',
          comp.genres.slice(0, 3).join(', ') || 'None',
          internalList || 'None',
          externalList || 'None'
        ].join(' | '));
      });
    
    fs.writeFileSync(tableOutputPath, tableContent.join('\n'));
    
    // Summary
    console.log('\n✨ Comprehensive comp analysis completed!');
    console.log('=' .repeat(60));
    console.log(`📚 Total titles processed: ${processedCount}`);
    console.log(`🎭 Titles with visual comps: ${titlesWithComps} (${(titlesWithComps/processedCount*100).toFixed(1)}%)`);
    console.log(`🎬 Visual comps database: ${Object.values(VISUAL_COMPS_DATABASE).flat().length} properties`);
    console.log(`📊 Raw data: ${outputPath}`);
    console.log(`📋 Readable table: ${tableOutputPath}`);
    
    // Top findings
    const topCompTitles = allComps
      .filter(comp => comp.comp_count.total > 5)
      .sort((a, b) => b.comp_count.total - a.comp_count.total)
      .slice(0, 5);
    
    console.log('\n🏆 TOP 5 TITLES WITH MOST COMPS:');
    topCompTitles.forEach((comp, index) => {
      const nameDisplay = comp.title_en ? `${comp.title_kr} (${comp.title_en})` : comp.title_kr;
      console.log(`   ${index + 1}. ${nameDisplay} - ${comp.comp_count.total} total comps`);
      console.log(`      └── ${comp.comp_count.internal} internal + ${comp.comp_count.external} visual comps`);
    });
    
  } catch (error) {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  }
}

// Run the script
if (import.meta.url === `file://${process.argv[1]}`) {
  generateComprehensiveCompList();
}

export { VISUAL_COMPS_DATABASE, findVisualComps };