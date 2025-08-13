// Enhanced search utilities for TV/film producers with fuzzy search and industry-specific terms

// Keyword mapping for related terms - optimized for TV/film producers
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
  
  // Mood/tone descriptors for producers
  "funny": ["comedy", "humor", "comedic", "hilarious", "witty"],
  "humorous": ["comedy", "funny", "witty", "satirical"],
  "comedic": ["comedy", "funny", "humorous"],
  "dark": ["horror", "thriller", "mature", "gritty", "noir"],
  "mature": ["adult", "serious", "dark", "sophisticated"],
  "lighthearted": ["comedy", "wholesome", "fun", "upbeat"],
  "heartwarming": ["wholesome", "feel_good", "uplifting", "touching"],
  "feelgood": ["wholesome", "heartwarming", "uplifting", "inspiring"],
  "emotional": ["drama", "tearjerker", "moving", "touching"],
  "tearjerker": ["drama", "emotional", "sad", "heartbreaking"],
  "uplifting": ["inspirational", "motivational", "positive", "hopeful"],
  "inspiring": ["uplifting", "motivational", "empowering"],
  "motivational": ["inspiring", "uplifting", "empowering"],
  "gritty": ["dark", "realistic", "raw", "intense"],
  "intense": ["thriller", "suspenseful", "gripping", "dramatic"],
  "suspenseful": ["thriller", "mystery", "tension", "gripping"],
  "gripping": ["thriller", "suspenseful", "intense", "compelling"],
  
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
  
  // Producer-specific industry terms
  "binge": ["addictive", "compelling", "engaging", "bingeable"],
  "bingeable": ["addictive", "compelling", "engaging", "binge"],
  "viral": ["trending", "popular", "hit", "phenomenon"],
  "trending": ["viral", "popular", "hot", "buzz"],
  "blockbuster": ["hit", "successful", "popular", "commercial"],
  "hit": ["successful", "popular", "viral", "trending"],
  "commercial": ["marketable", "mainstream", "profitable", "sellable"],
  "marketable": ["commercial", "sellable", "profitable", "appealing"],
  "mainstream": ["popular", "commercial", "broad appeal", "mass market"],
  "niche": ["specialized", "targeted", "specific", "cult"],
  "cult": ["niche", "devoted", "loyal", "passionate"],
  "crossover": ["broad appeal", "universal", "diverse audience", "multi-demographic"],
  "awards": ["prestigious", "acclaimed", "recognized", "honored"],
  "acclaimed": ["awards", "prestigious", "critically acclaimed", "recognized"],
  "prestige": ["awards", "acclaimed", "prestigious", "high quality"],
  "franchise": ["series", "expandable", "sequel potential", "brand"],
  "adaptation": ["based on", "adapted from", "source material", "remake"],
  "remake": ["adaptation", "reboot", "reimagining", "updated"],
  "reboot": ["remake", "reimagining", "fresh take", "updated"],
  "sequel": ["continuation", "follow-up", "next chapter", "part two"],
  "prequel": ["backstory", "origin", "before", "earlier"],
  "spinoff": ["related", "connected", "universe", "expanded"],
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
  "bingeabel": ["bingeable"],
  "bingeble": ["bingeable"],
  "comercial": ["commercial"],
  "comercal": ["commercial"],
  "mainstrem": ["mainstream"],
  "franshise": ["franchise"],
  "adaptaton": ["adaptation"],
  "spinof": ["spinoff"],
  "prequal": ["prequel"],
  "sequal": ["sequel"],
};

// Producer search phrases - common sentences/phrases producers use
const PRODUCER_PHRASES: Record<string, string[]> = {
  "next big hit": ["viral", "blockbuster", "trending", "commercial"],
  "binge worthy": ["bingeable", "addictive", "compelling", "engaging"],
  "mass appeal": ["mainstream", "commercial", "broad appeal", "crossover"],
  "awards potential": ["prestige", "acclaimed", "awards", "prestigious"],
  "franchise potential": ["sequel", "series", "expandable", "franchise"],
  "broad demographic": ["crossover", "universal", "diverse audience", "family"],
  "cult following": ["niche", "devoted", "passionate", "loyal"],
  "water cooler": ["viral", "trending", "buzz", "phenomenon"],
  "zeitgeist": ["trending", "cultural", "relevant", "contemporary"],
  "must watch": ["compelling", "gripping", "addictive", "essential"],
  "four quadrant": ["universal", "broad appeal", "crossover", "mainstream"],
  "tentpole": ["blockbuster", "franchise", "major", "big budget"],
  "sleeper hit": ["unexpected", "surprise", "breakout", "hidden gem"],
  "crossover appeal": ["universal", "broad demographic", "diverse audience"],
  "awards darling": ["prestige", "acclaimed", "critically acclaimed", "recognized"],
  "guilty pleasure": ["addictive", "bingeable", "entertaining", "fun"],
  "cultural phenomenon": ["viral", "trending", "zeitgeist", "movement"],
  "streaming friendly": ["bingeable", "episodic", "serialized"],
  "appointment television": ["must watch", "event", "weekly", "scheduled"],
  "social media buzz": ["viral", "trending", "shareable", "memeable"],
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
 * Field types for different search strategies
 */
const FIELD_TYPES = {
  // Exact match fields - require precise matching
  exact: ['comps', 'title_name_en', 'title_name_kr', 'author', 'story_author', 'art_author', 'writer', 'illustrator'],
  // Fuzzy match fields - allow flexible matching
  fuzzy: ['tone', 'genre', 'audience', 'perfect_for', 'tags'],
  // Content fields - search in descriptions and content
  content: ['tagline', 'description', 'synopsis', 'pitch', 'note'],
  // Rights fields - exact matching for rights and ownership
  rights: ['rights', 'rights_owner', 'creator_id']
};

/**
 * Expand search terms using keyword mappings, fuzzy matching, and producer phrases
 */
export function expandSearchTerms(searchTerm: string): { 
  exact: string[], 
  fuzzy: string[], 
  phrases: string[] 
} {
  const normalizedTerm = searchTerm.toLowerCase().trim();
  const exactTerms = new Set<string>([normalizedTerm]);
  const fuzzyTerms = new Set<string>();
  const phraseTerms = new Set<string>();
  
  // Check for producer phrases first (multi-word matching)
  for (const [phrase, keywords] of Object.entries(PRODUCER_PHRASES)) {
    if (normalizedTerm.includes(phrase) || phrase.includes(normalizedTerm)) {
      keywords.forEach(keyword => phraseTerms.add(keyword));
      // Also add the phrase terms to fuzzy matching
      keywords.forEach(keyword => fuzzyTerms.add(keyword));
    }
  }
  
  // Check for exact keyword mappings
  if (KEYWORD_MAPPINGS[normalizedTerm]) {
    KEYWORD_MAPPINGS[normalizedTerm].forEach(term => fuzzyTerms.add(term));
  }
  
  // Check for spelling variations
  if (SPELLING_VARIATIONS[normalizedTerm]) {
    SPELLING_VARIATIONS[normalizedTerm].forEach(term => {
      exactTerms.add(term);
      // Also add mappings for the corrected spelling
      if (KEYWORD_MAPPINGS[term]) {
        KEYWORD_MAPPINGS[term].forEach(mapped => fuzzyTerms.add(mapped));
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
      fuzzyTerms.add(knownTerm);
      // Add mappings for fuzzy matches too
      if (KEYWORD_MAPPINGS[knownTerm]) {
        KEYWORD_MAPPINGS[knownTerm].forEach(mapped => fuzzyTerms.add(mapped));
      }
    }
  }
  
  return {
    exact: Array.from(exactTerms),
    fuzzy: Array.from(fuzzyTerms),
    phrases: Array.from(phraseTerms)
  };
}

/**
 * Enhanced search function with field-specific matching strategies for TV/film producers
 */
export function enhancedSearch<T extends Record<string, unknown>>(
  items: T[],
  searchQuery: string,
  searchFields: (keyof T)[]
): { exactMatches: T[]; expandedMatches: T[]; phraseMatches: T[]; } {
  if (!searchQuery.trim()) {
    return { exactMatches: items, expandedMatches: [], phraseMatches: [] };
  }
  
  // Handle multi-word queries for producer phrases
  const fullQuery = searchQuery.toLowerCase().trim();
  
  // Split search query into keywords for individual word matching
  const keywords = fullQuery.split(/\s+/);
  
  // Expand each keyword with different strategies
  const allExpandedTerms = keywords.flatMap(keyword => {
    const expanded = expandSearchTerms(keyword);
    return [...expanded.exact, ...expanded.fuzzy];
  });
  
  // Get phrase expansions for the full query
  const phraseExpansion = expandSearchTerms(fullQuery);
  
  const originalKeywords = new Set(keywords);
  const exactMatches = new Set<T>();
  const expandedMatches = new Set<T>();
  const phraseMatches = new Set<T>();
  
  for (const item of items) {
    let hasExactMatch = false;
    let hasExpandedMatch = false;
    let hasPhraseMatch = false;
    let exactMatchScore = 0;
    let fuzzyMatchScore = 0;
    let phraseMatchScore = 0;
    
    // Check each search field with field-specific strategies
    for (const field of searchFields) {
      const fieldValue = item[field];
      if (!fieldValue) continue;
      
      const fieldName = String(field);
      let searchableText = '';
      
      // Handle different field types
      if (Array.isArray(fieldValue)) {
        searchableText = fieldValue.join(' ').toLowerCase();
      } else if (typeof fieldValue === 'string') {
        searchableText = fieldValue.toLowerCase();
      } else {
        searchableText = String(fieldValue).toLowerCase();
      }
      
      // Determine search strategy based on field type
      const isExactField = FIELD_TYPES.exact.includes(fieldName);
      const isFuzzyField = FIELD_TYPES.fuzzy.includes(fieldName);
      const isContentField = FIELD_TYPES.content.includes(fieldName);
      
      // 1. Check for exact keyword matches (always applied)
      for (const keyword of keywords) {
        if (searchableText.includes(keyword)) {
          hasExactMatch = true;
          exactMatchScore += isExactField ? 3 : (isContentField ? 2 : 1);
        }
      }
      
      // 2. Check for fuzzy matches (primarily for tone, genre, audience fields)
      if (isFuzzyField || isContentField) {
        for (const expandedTerm of allExpandedTerms) {
          if (!originalKeywords.has(expandedTerm) && searchableText.includes(expandedTerm)) {
            hasExpandedMatch = true;
            fuzzyMatchScore += isFuzzyField ? 2 : 1;
          }
        }
      }
      
      // 3. Check for producer phrase matches (especially for content fields)
      if (isContentField || isFuzzyField) {
        for (const phraseTerm of phraseExpansion.phrases) {
          if (searchableText.includes(phraseTerm)) {
            hasPhraseMatch = true;
            phraseMatchScore += isContentField ? 3 : 2;
          }
        }
      }
      
      // 4. Special handling for 'comps' field - exact matching only
      if (fieldName === 'comps' && Array.isArray(fieldValue)) {
        for (const comp of fieldValue) {
          const compText = comp.toLowerCase();
          for (const keyword of keywords) {
            if (compText.includes(keyword)) {
              hasExactMatch = true;
              exactMatchScore += 5; // High score for comp matches
            }
          }
        }
      }
    }
    
    // Prioritize matches based on type and score
    if (hasExactMatch) {
      (item as Record<string, unknown>)._searchScore = exactMatchScore;
      exactMatches.add(item);
    } else if (hasPhraseMatch) {
      (item as Record<string, unknown>)._searchScore = phraseMatchScore;
      phraseMatches.add(item);
    } else if (hasExpandedMatch) {
      (item as Record<string, unknown>)._searchScore = fuzzyMatchScore;
      expandedMatches.add(item);
    }
  }
  
  // Sort each category by score (highest first)
  const sortByScore = (items: T[]) => 
    items.sort((a, b) => ((b as Record<string, unknown>)._searchScore as number || 0) - ((a as Record<string, unknown>)._searchScore as number || 0));
  
  return {
    exactMatches: sortByScore(Array.from(exactMatches)),
    expandedMatches: sortByScore(Array.from(expandedMatches)),
    phraseMatches: sortByScore(Array.from(phraseMatches))
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