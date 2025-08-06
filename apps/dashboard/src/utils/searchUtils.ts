// Enhanced search utilities for multi-keyword and related term matching

// Keyword mapping for related terms
const KEYWORD_MAPPINGS: Record<string, string[]> = {
  // Genre combinations
  "romantasy": ["romance", "fantasy"],
  "romcom": ["romance", "comedy"], 
  "romfan": ["romance", "fantasy"],
  "scifi": ["sci_fi", "science_fiction"],
  "sciencefiction": ["sci_fi", "science", "fiction"],
  "sliceoflife": ["slice_of_life", "daily", "life"],
  "sol": ["slice_of_life"],
  "bl": ["boys_love", "yaoi", "romance"],
  "gl": ["girls_love", "yuri", "romance"],
  "yaoi": ["boys_love", "bl", "romance"],
  "yuri": ["girls_love", "gl", "romance"],
  "isekai": ["fantasy", "adventure", "reincarnation"],
  "cultivation": ["fantasy", "martial_arts", "adventure"],
  "litrpg": ["fantasy", "game", "adventure"],
  "dystopian": ["sci_fi", "thriller", "drama"],
  "cyberpunk": ["sci_fi", "thriller", "futuristic"],
  "steampunk": ["fantasy", "historical", "adventure"],
  "paranormal": ["supernatural", "fantasy", "mystery"],
  "supernatural": ["paranormal", "fantasy", "horror"],
  "psychological": ["thriller", "horror", "mystery"],
  "wholesome": ["slice_of_life", "comedy", "heartwarming"],
  "fluffy": ["romance", "comedy", "wholesome"],
  "angsty": ["drama", "tragedy", "emotional"],
  "enemies2lovers": ["romance", "drama"],
  "enemiestolovers": ["romance", "drama"],
  "slowburn": ["romance", "drama"],
  "instalove": ["romance"],
  "harem": ["romance", "comedy"],
  "reverse_harem": ["romance", "comedy"],
  "otome": ["romance", "game"],
  "villainess": ["romance", "comedy", "isekai"],
  
  // Content format variations
  "webtoon": ["manhwa", "comic", "webcomic"],
  "manhwa": ["webtoon", "comic", "korean"],
  "manhua": ["comic", "chinese"],  
  "manga": ["comic", "japanese"],
  "webnovel": ["novel", "web_novel", "online"],
  "lightnovel": ["novel", "light_novel", "ln"],
  "ln": ["light_novel", "novel"],
  
  // Mood/tone descriptors
  "funny": ["comedy", "humor", "comedic"],
  "humorous": ["comedy", "funny"],
  "comedic": ["comedy", "funny"],
  "dark": ["horror", "thriller", "mature"],
  "mature": ["adult", "serious", "dark"],
  "lighthearted": ["comedy", "wholesome", "fun"],
  "heartwarming": ["wholesome", "feel_good", "uplifting"],
  "feelgood": ["wholesome", "heartwarming", "uplifting"],
  "emotional": ["drama", "tearjerker", "moving"],
  "tearjerker": ["drama", "emotional", "sad"],
  "uplifting": ["inspirational", "motivational", "positive"],
  "inspiring": ["uplifting", "motivational"],
  "motivational": ["inspiring", "uplifting"],
  
  // Age/demographic
  "teen": ["young_adult", "ya", "teenage"],
  "ya": ["young_adult", "teen"],
  "youngadult": ["teen", "ya"],
  "adult": ["mature", "grown_up"],
  "kids": ["children", "family", "young"],
  "children": ["kids", "family", "young"],
  "family": ["all_ages", "wholesome"],
  
  // Korean specific terms
  "korean": ["korea", "k-content", "hallyu"],
  "kdrama": ["korean", "drama", "tv"],
  "kpop": ["korean", "music", "idol"],
  "chaebol": ["korean", "business", "rich"],
  "historical_korean": ["historical", "korean", "traditional"],
  "modern_korean": ["contemporary", "korean", "modern"],
};

// Common misspellings and variations
const SPELLING_VARIATIONS: Record<string, string[]> = {
  "fantacy": ["fantasy"],
  "fantasie": ["fantasy"], 
  "romanse": ["romance"],
  "romence": ["romance"],
  "mistry": ["mystery"],
  "mistery": ["mystery"],
  "thriler": ["thriller"],
  "horor": ["horror"],
  "commedy": ["comedy"],
  "comidy": ["comedy"],
  "acton": ["action"],
  "sifi": ["sci_fi"],
  "syfy": ["sci_fi"],
};

/**
 * Calculate simple string similarity (Jaccard similarity for character bigrams)
 */
function calculateSimilarity(str1: string, str2: string): number {
  if (str1 === str2) return 1;
  
  const getBigrams = (str: string): Set<string> => {
    const bigrams = new Set<string>();
    for (let i = 0; i < str.length - 1; i++) {
      bigrams.add(str.substring(i, i + 2));
    }
    return bigrams;
  };
  
  const bigrams1 = getBigrams(str1.toLowerCase());
  const bigrams2 = getBigrams(str2.toLowerCase());
  
  const intersection = new Set([...bigrams1].filter(x => bigrams2.has(x)));
  const union = new Set([...bigrams1, ...bigrams2]);
  
  return intersection.size / union.size;
}

/**
 * Expand search terms using keyword mappings and fuzzy matching
 */
export function expandSearchTerms(searchTerm: string): string[] {
  const normalizedTerm = searchTerm.toLowerCase().trim();
  const expandedTerms = new Set<string>([normalizedTerm]);
  
  // Check for exact keyword mappings
  if (KEYWORD_MAPPINGS[normalizedTerm]) {
    KEYWORD_MAPPINGS[normalizedTerm].forEach(term => expandedTerms.add(term));
  }
  
  // Check for spelling variations
  if (SPELLING_VARIATIONS[normalizedTerm]) {
    SPELLING_VARIATIONS[normalizedTerm].forEach(term => {
      expandedTerms.add(term);
      // Also add mappings for the corrected spelling
      if (KEYWORD_MAPPINGS[term]) {
        KEYWORD_MAPPINGS[term].forEach(mapped => expandedTerms.add(mapped));
      }
    });
  }
  
  // Fuzzy matching against known keywords (similarity > 0.7)
  const allKnownTerms = [
    ...Object.keys(KEYWORD_MAPPINGS),
    ...Object.values(KEYWORD_MAPPINGS).flat(),
    ...Object.keys(SPELLING_VARIATIONS),
    ...Object.values(SPELLING_VARIATIONS).flat()
  ];
  
  for (const knownTerm of allKnownTerms) {
    const similarity = calculateSimilarity(normalizedTerm, knownTerm);
    if (similarity > 0.7 && similarity < 1) {
      expandedTerms.add(knownTerm);
      // Add mappings for fuzzy matches too
      if (KEYWORD_MAPPINGS[knownTerm]) {
        KEYWORD_MAPPINGS[knownTerm].forEach(mapped => expandedTerms.add(mapped));
      }
    }
  }
  
  return Array.from(expandedTerms);
}

/**
 * Enhanced search function that handles multiple keywords and related terms
 */
export function enhancedSearch<T extends Record<string, any>>(
  items: T[],
  searchQuery: string,
  searchFields: (keyof T)[]
): { exactMatches: T[]; expandedMatches: T[]; } {
  if (!searchQuery.trim()) {
    return { exactMatches: items, expandedMatches: [] };
  }
  
  // Split search query into keywords
  const keywords = searchQuery.toLowerCase().trim().split(/\s+/);
  
  // Expand each keyword
  const allExpandedTerms = keywords.flatMap(keyword => expandSearchTerms(keyword));
  const originalKeywords = new Set(keywords);
  
  const exactMatches = new Set<T>();
  const expandedMatches = new Set<T>();
  
  for (const item of items) {
    let hasExactMatch = false;
    let hasExpandedMatch = false;
    
    // Check each search field
    for (const field of searchFields) {
      const fieldValue = item[field];
      if (!fieldValue) continue;
      
      let searchableText = '';
      
      // Handle different field types
      if (Array.isArray(fieldValue)) {
        searchableText = fieldValue.join(' ').toLowerCase();
      } else if (typeof fieldValue === 'string') {
        searchableText = fieldValue.toLowerCase();
      } else {
        searchableText = String(fieldValue).toLowerCase();
      }
      
      // Check for exact keyword matches (original search terms)
      for (const keyword of keywords) {
        if (searchableText.includes(keyword)) {
          hasExactMatch = true;
          break;
        }
      }
      
      // Check for expanded term matches
      for (const expandedTerm of allExpandedTerms) {
        if (!originalKeywords.has(expandedTerm) && searchableText.includes(expandedTerm)) {
          hasExpandedMatch = true;
        }
      }
    }
    
    if (hasExactMatch) {
      exactMatches.add(item);
    } else if (hasExpandedMatch) {
      expandedMatches.add(item);
    }
  }
  
  return {
    exactMatches: Array.from(exactMatches),
    expandedMatches: Array.from(expandedMatches)
  };
}

/**
 * Get search fields for Title objects
 */
export function getTitleSearchFields(): string[] {
  return [
    'title_name_en',
    'title_name_kr', 
    'author',
    'story_author',
    'art_author', 
    'writer',
    'illustrator',
    'rights',
    'rights_owner',
    'tagline',
    'description',
    'synopsis',
    'note',
    'perfect_for',
    'comps',
    'tone',
    'audience',
    'genre',
    'tags',
    'content_format'
  ];
}