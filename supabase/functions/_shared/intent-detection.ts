/**
 * Intent Detection Module for AI Chat
 *
 * Two-level intent classification:
 * - Level 1: title_search vs conversation
 * - Level 2: Specific intent types (comp_based, mandate_based, discovery, etc.)
 *
 * Uses pattern-based detection (fast path) with LLM fallback for ambiguous queries.
 */

// =====================================================================
// TYPE DEFINITIONS
// =====================================================================

export type Level1Intent = 'title_search' | 'conversation';

export type TitleSearchIntent =
  | 'comp_based'      // "Find titles like Squid Game meets Breaking Bad"
  | 'mandate_based'   // "Dark thriller for Netflix development"
  | 'discovery'       // "Show me popular webtoons"
  | 'information'     // "Tell me about The Dilettante"
  | 'comparison';     // "Compare Title A with Title B"

export type ConversationIntent =
  | 'greeting'        // "Hello", "Hi Jinu"
  | 'clarification'   // "What do you mean?"
  | 'follow_up_chat'  // "Thanks!", "That sounds interesting"
  | 'general_question'// "How does licensing work?"
  | 'off_topic';      // Non-Korean-content questions

export interface ExtractedEntities {
  compTitles?: string[];
  mandateText?: string;
  targetTitle?: string;
  searchQuery?: string;
}

export interface IntentDetectionResult {
  level1: Level1Intent;
  level2: TitleSearchIntent | ConversationIntent;
  confidence: number;
  searchEngine: 'comps' | 'mandate' | 'vector' | null;
  extractedEntities: ExtractedEntities;
  reasoning: string;
}

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

// =====================================================================
// PATTERN DEFINITIONS
// =====================================================================

const COMP_PATTERNS = {
  // "like X meets Y", "X combined with Y"
  meets: /(?:like|similar to)\s+["']?([^"']+?)["']?\s+(?:meets|combined with|mixed with|plus|and|x)\s+["']?([^"']+?)["']?(?:\s|$|,|\.)/i,

  // "mix of X and Y"
  mixOf: /mix\s+of\s+["']?([^"']+?)["']?\s+and\s+["']?([^"']+?)["']?/i,

  // "if X had a baby with Y"
  baby: /if\s+["']?([^"']+?)["']?\s+had\s+a\s+baby\s+with\s+["']?([^"']+?)["']?/i,

  // "something like X but more Y"
  likeBut: /(?:something|anything)\s+like\s+["']?([^"']+?)["']?\s+but\s+(?:more\s+)?(.+)/i,

  // "similar to X" (single comp)
  similarTo: /similar\s+to\s+["']?([^"']+?)["']?(?:\s|$|,|\.)/i,

  // "like X" at start or standalone
  likeX: /^(?:find\s+(?:me\s+)?)?(?:something\s+)?like\s+["']?([^"']+?)["']?(?:\s|$|,|\.)/i,

  // "X vibes" or "X energy" (require quoted title or known title pattern)
  // More restrictive: must be quoted OR a short phrase (1-3 words) before "vibes/energy"
  vibes: /["']([^"']+?)["']\s+(?:vibes?|energy)\b/i,
};

const MANDATE_PATTERNS = {
  // "looking for X for Netflix/HBO/etc"
  lookingFor: /looking\s+for\s+(.+?)\s+(?:for|to pitch to|suitable for)\s+(netflix|hbo|apple|disney|amazon|streaming|development|acquisition)/i,

  // "need X for development"
  needFor: /need\s+(.+?)\s+(?:for|suitable for)\s+(development|acquisition|our slate|the slate)/i,

  // "buyers are looking for X"
  buyersLooking: /buyers?\s+(?:are\s+)?looking\s+for\s+(.+)/i,

  // "mandate:" prefix
  mandatePrefix: /mandate\s*[:]\s*(.+)/i,

  // "development slate" or "acquisition pipeline"
  slateTerms: /(?:development|acquisition)\s+(?:slate|pipeline).*?[:]\s*(.+)/i,

  // "pitching to" or "pitch to"
  pitchTo: /(?:pitch(?:ing)?|present(?:ing)?)\s+to\s+(.+?)\s+(?:and|,|\.|\?|$)/i,
};

const DISCOVERY_PATTERNS = {
  // "show me popular/trending/top"
  showMe: /show\s+(?:me\s+)?(?:some\s+)?(?:popular|trending|top|best|new|recent|good)\s+(.+)/i,

  // "what's trending/popular"
  whatsTrending: /what(?:'s|s)?\s+(?:trending|popular|hot|new)\s+(?:in\s+)?(.+)?/i,

  // "recommend some/any"
  recommend: /recommend\s+(?:me\s+)?(?:some|any)\s+(.+)/i,

  // "find me some X"
  findMe: /find\s+(?:me\s+)?(?:some|any)\s+(.+)/i,

  // "explore X" or "browse X"
  explore: /(?:explore|browse)\s+(.+)/i,

  // "what are some good X"
  whatAreSome: /what\s+(?:are\s+)?some\s+(?:good\s+)?(.+)/i,

  // "any X recommendations"
  anyRecs: /any\s+(.+?)\s+recommendations?/i,

  // "looking for X" or "I'm looking for X" (generic content search)
  lookingFor: /(?:i(?:'m|m)?\s+)?looking\s+for\s+(?:some\s+)?(.+?)(?:\s*$)/i,

  // "I want X" or "want to find X"
  iWant: /(?:i\s+)?want\s+(?:to\s+(?:find|see|watch|read)\s+)?(?:some\s+)?(.+?)(?:\s*$)/i,

  // "I need X" (without platform context = discovery)
  iNeed: /(?:i\s+)?need\s+(?:some\s+)?(.+?)(?:\s*$)/i,

  // "searching for X"
  searchingFor: /(?:i(?:'m|m)?\s+)?searching\s+for\s+(.+?)(?:\s*$)/i,
};

const INFORMATION_PATTERNS = {
  // "tell me about X"
  tellMeAbout: /tell\s+me\s+(?:more\s+)?about\s+["']?([^"']+?)["']?(?:\s*$|\?|\.)/i,

  // "what is X about"
  whatIsAbout: /what\s+(?:is|'s)\s+["']?([^"']+?)["']?\s+about/i,

  // "synopsis of X"
  synopsis: /(?:synopsis|summary|plot)\s+(?:of\s+)?["']?([^"']+?)["']?/i,

  // "details about X"
  details: /(?:details?|info(?:rmation)?)\s+(?:about|on)\s+["']?([^"']+?)["']?/i,

  // "who wrote X" / "who created X"
  whoCreated: /who\s+(?:wrote|created|made|is the author of)\s+["']?([^"']+?)["']?/i,

  // "learn more about X"
  learnMore: /learn\s+more\s+about\s+["']?([^"']+?)["']?/i,
};

const COMPARISON_PATTERNS = {
  // "compare X and Y"
  compare: /compare\s+["']?([^"']+?)["']?\s+(?:and|with|to|vs\.?)\s+["']?([^"']+?)["']?/i,

  // "X vs Y" or "X versus Y"
  versus: /["']?([^"']+?)["']?\s+(?:vs\.?|versus)\s+["']?([^"']+?)["']?/i,

  // "difference between X and Y"
  difference: /(?:difference|differences)\s+between\s+["']?([^"']+?)["']?\s+and\s+["']?([^"']+?)["']?/i,

  // "X or Y" with "which" or "better"
  whichBetter: /(?:which|what)(?:'s|s)?\s+better.*?["']?([^"']+?)["']?\s+or\s+["']?([^"']+?)["']?/i,
};

const GREETING_PATTERNS = {
  simple: /^(?:hi|hello|hey|yo|안녕|안녕하세요|하이)(?:\s+(?:jinu|there|!|\.|\?)?)*$/i,
  withName: /^(?:hi|hello|hey)\s+(?:jinu|there)(?:!|\.|\?)*$/i,
  howAreYou: /^(?:how\s+are\s+you|how(?:'s|s)\s+it\s+going|what(?:'s|s)\s+up)(?:\s*[?!.])*$/i,
};

const CLARIFICATION_PATTERNS = {
  whatDoYouMean: /what\s+do\s+you\s+mean/i,
  canYouExplain: /can\s+you\s+(?:explain|clarify)/i,
  dontUnderstand: /(?:i\s+)?don(?:'t|t)\s+understand/i,
  whatsThat: /what(?:'s|s)?\s+that(?:\s+mean)?/i,
  couldYouElaborate: /could\s+you\s+(?:elaborate|explain)/i,
};

const GENERAL_QUESTION_PATTERNS = {
  howDoesWork: /how\s+(?:does|do)\s+(.+?)\s+work/i,
  whatIsA: /what(?:'s|s)?\s+(?:a|an)\s+(webtoon|manhwa|webnovel|k-drama|kdrama)/i,
  differenceBetweenGeneral: /(?:what(?:'s|s)?\s+the\s+)?difference\s+between\s+(?:a\s+)?(webtoon|manhwa|webnovel)/i,
  howCanI: /how\s+(?:can|do)\s+i\s+(?:license|acquire|option|buy|get rights)/i,
  whatAreThe: /what\s+are\s+the\s+(?:steps|process|requirements)\s+(?:for|to)/i,
  licensing: /(?:licensing|rights|acquisition)\s+(?:process|work|happen)/i,
};

const FOLLOW_UP_CHAT_PATTERNS = {
  thanks: /^(?:thanks|thank\s+you|thx|ty)(?:!|\.|\s|$)/i,
  interesting: /(?:that(?:'s|s)?|this\s+is)\s+(?:interesting|cool|great|awesome|helpful)/i,
  gotIt: /^(?:got\s+it|i\s+see|okay|ok|makes\s+sense|understood)(?:!|\.|\s|$)/i,
  perfect: /^(?:perfect|great|awesome|nice|cool)(?:!|\.|\s|$)/i,
  willCheck: /(?:i(?:'ll|ll)|will)\s+(?:check|look|read)\s+(?:it|that|them)/i,
};

const OFF_TOPIC_PATTERNS = {
  weather: /what(?:'s|s)?\s+the\s+weather/i,
  time: /what\s+time\s+is\s+it/i,
  math: /what(?:'s|s)?\s+\d+\s*[\+\-\*\/]\s*\d+/i,
  coding: /(?:write|create|code|program)\s+(?:me\s+)?(?:a|an)\s+(?:function|script|program|code)/i,
  unrelated: /(?:recipe|cook|bake|exercise|workout|diet|health)/i,
};

// =====================================================================
// HOLLYWOOD TITLE DETECTION
// =====================================================================

// Common Hollywood/global titles that users might reference as comps
const KNOWN_COMP_TITLES = new Set([
  // Recent hits
  'squid game', 'parasite', 'minari', 'pachinko', 'beef',
  'breaking bad', 'game of thrones', 'stranger things', 'the witcher',
  'wednesday', 'bridgerton', 'the crown', 'succession',
  'yellowjackets', 'severance', 'the white lotus', 'euphoria',
  'the bear', 'shogun', 'house of the dragon',

  // Classic references
  'lost', 'the walking dead', 'breaking bad', 'mad men',
  'the sopranos', 'the wire', 'friends', 'the office',

  // Movies
  'get out', 'us', 'nope', 'everything everywhere all at once',
  'the matrix', 'inception', 'interstellar', 'dune',
  'black panther', 'spider-man', 'avengers',

  // Anime/Asian content
  'attack on titan', 'demon slayer', 'jujutsu kaisen',
  'one piece', 'naruto', 'death note', 'fullmetal alchemist',
  'your name', 'spirited away', 'howl\'s moving castle',

  // Genre references
  'hunger games', 'divergent', 'maze runner', 'twilight',
  'harry potter', 'lord of the rings', 'star wars',
]);

function looksLikeHollywoodTitle(text: string): boolean {
  const normalized = text.toLowerCase().trim();

  // Reject common non-title phrases (false positive prevention)
  const nonTitlePhrases = [
    'i want', 'i need', 'i like', 'show me', 'find me', 'give me',
    'looking for', 'searching for', 'recommend', 'suggest',
    'something with', 'anything with', 'stories with', 'content with',
    'lighthearted', 'feel-good', 'feel good', 'dark', 'light',
  ];
  if (nonTitlePhrases.some(phrase => normalized.startsWith(phrase) || normalized.includes(phrase))) {
    return false;
  }

  // Check against known titles (exact match)
  if (KNOWN_COMP_TITLES.has(normalized)) return true;

  // Check for partial matches with known titles
  for (const title of KNOWN_COMP_TITLES) {
    if (normalized.includes(title) || title.includes(normalized)) {
      return true;
    }
  }

  // Heuristics for likely Hollywood titles (more conservative):
  // Must start with "the" or be a proper noun pattern (capitalized words)
  const words = normalized.split(/\s+/);

  // Single words are unlikely to be comp titles (too generic)
  if (words.length < 2) return false;

  // Too many words - probably a sentence, not a title
  if (words.length > 5) return false;

  // Must start with "the" to be considered a potential title
  // (e.g., "The Matrix", "The Bear", "The Crown")
  if (words[0] === 'the' && words.length >= 2 && words.length <= 4) {
    return true;
  }

  // Don't assume random 2-5 word phrases are titles
  // Only known titles or "the X" patterns pass
  return false;
}

// =====================================================================
// PATTERN MATCHING FUNCTIONS
// =====================================================================

function matchCompBased(query: string): { matched: boolean; entities: ExtractedEntities; confidence: number } {
  const lowerQuery = query.toLowerCase();

  // Check "meets" pattern first (highest priority)
  let match = query.match(COMP_PATTERNS.meets);
  if (match) {
    return {
      matched: true,
      entities: { compTitles: [match[1].trim(), match[2].trim()] },
      confidence: 0.95
    };
  }

  // Check "mix of" pattern
  match = query.match(COMP_PATTERNS.mixOf);
  if (match) {
    return {
      matched: true,
      entities: { compTitles: [match[1].trim(), match[2].trim()] },
      confidence: 0.95
    };
  }

  // Check "baby" pattern
  match = query.match(COMP_PATTERNS.baby);
  if (match) {
    return {
      matched: true,
      entities: { compTitles: [match[1].trim(), match[2].trim()] },
      confidence: 0.90
    };
  }

  // Check "like X but" pattern
  match = query.match(COMP_PATTERNS.likeBut);
  if (match && looksLikeHollywoodTitle(match[1])) {
    return {
      matched: true,
      entities: {
        compTitles: [match[1].trim()],
        searchQuery: match[2].trim() // refinement text
      },
      confidence: 0.88
    };
  }

  // Check "similar to X"
  match = query.match(COMP_PATTERNS.similarTo);
  if (match && looksLikeHollywoodTitle(match[1])) {
    return {
      matched: true,
      entities: { compTitles: [match[1].trim()] },
      confidence: 0.85
    };
  }

  // Check "like X" at start
  match = query.match(COMP_PATTERNS.likeX);
  if (match && looksLikeHollywoodTitle(match[1])) {
    return {
      matched: true,
      entities: { compTitles: [match[1].trim()] },
      confidence: 0.82
    };
  }

  // Check "X vibes"
  match = query.match(COMP_PATTERNS.vibes);
  if (match && looksLikeHollywoodTitle(match[1])) {
    return {
      matched: true,
      entities: { compTitles: [match[1].trim()] },
      confidence: 0.80
    };
  }

  return { matched: false, entities: {}, confidence: 0 };
}

function matchMandateBased(query: string): { matched: boolean; entities: ExtractedEntities; confidence: number } {
  // Check "looking for X for Netflix"
  let match = query.match(MANDATE_PATTERNS.lookingFor);
  if (match) {
    return {
      matched: true,
      entities: { mandateText: query }, // Use full query as mandate
      confidence: 0.92
    };
  }

  // Check "need X for development"
  match = query.match(MANDATE_PATTERNS.needFor);
  if (match) {
    return {
      matched: true,
      entities: { mandateText: query },
      confidence: 0.90
    };
  }

  // Check "buyers are looking for"
  match = query.match(MANDATE_PATTERNS.buyersLooking);
  if (match) {
    return {
      matched: true,
      entities: { mandateText: query },
      confidence: 0.92
    };
  }

  // Check "mandate:" prefix
  match = query.match(MANDATE_PATTERNS.mandatePrefix);
  if (match) {
    return {
      matched: true,
      entities: { mandateText: match[1].trim() },
      confidence: 0.95
    };
  }

  // Check "pitch to"
  match = query.match(MANDATE_PATTERNS.pitchTo);
  if (match) {
    return {
      matched: true,
      entities: { mandateText: query },
      confidence: 0.85
    };
  }

  // Check for business/development keywords
  const businessKeywords = [
    'development', 'acquisition', 'buyer', 'pitch', 'slate',
    'netflix', 'hbo', 'apple tv', 'disney', 'amazon', 'streaming service',
    'adaptation rights', 'option', 'license'
  ];

  const lowerQuery = query.toLowerCase();
  const businessKeywordCount = businessKeywords.filter(kw => lowerQuery.includes(kw)).length;

  if (businessKeywordCount >= 2) {
    return {
      matched: true,
      entities: { mandateText: query },
      confidence: 0.75 + (businessKeywordCount * 0.05)
    };
  }

  return { matched: false, entities: {}, confidence: 0 };
}

function matchDiscovery(query: string): { matched: boolean; entities: ExtractedEntities; confidence: number } {
  for (const [_name, pattern] of Object.entries(DISCOVERY_PATTERNS)) {
    const match = query.match(pattern);
    if (match) {
      return {
        matched: true,
        entities: { searchQuery: match[1]?.trim() || query },
        confidence: 0.85
      };
    }
  }

  return { matched: false, entities: {}, confidence: 0 };
}

function matchInformation(query: string): { matched: boolean; entities: ExtractedEntities; confidence: number } {
  for (const [_name, pattern] of Object.entries(INFORMATION_PATTERNS)) {
    const match = query.match(pattern);
    if (match) {
      return {
        matched: true,
        entities: { targetTitle: match[1]?.trim() },
        confidence: 0.90
      };
    }
  }

  return { matched: false, entities: {}, confidence: 0 };
}

function matchComparison(query: string): { matched: boolean; entities: ExtractedEntities; confidence: number } {
  for (const [_name, pattern] of Object.entries(COMPARISON_PATTERNS)) {
    const match = query.match(pattern);
    if (match) {
      return {
        matched: true,
        entities: {
          searchQuery: query,
          // Store compared titles in compTitles for now
          compTitles: [match[1]?.trim(), match[2]?.trim()].filter(Boolean) as string[]
        },
        confidence: 0.90
      };
    }
  }

  return { matched: false, entities: {}, confidence: 0 };
}

function matchGreeting(query: string): boolean {
  return Object.values(GREETING_PATTERNS).some(pattern => pattern.test(query));
}

function matchClarification(query: string): boolean {
  return Object.values(CLARIFICATION_PATTERNS).some(pattern => pattern.test(query));
}

function matchGeneralQuestion(query: string): boolean {
  return Object.values(GENERAL_QUESTION_PATTERNS).some(pattern => pattern.test(query));
}

function matchFollowUpChat(query: string): boolean {
  return Object.values(FOLLOW_UP_CHAT_PATTERNS).some(pattern => pattern.test(query));
}

function matchOffTopic(query: string): boolean {
  return Object.values(OFF_TOPIC_PATTERNS).some(pattern => pattern.test(query));
}

// =====================================================================
// CONTEXT ANALYSIS
// =====================================================================

function analyzeConversationContext(history: ChatMessage[]): {
  hasRecentSearch: boolean;
  recentTitles: string[];
  conversationTopic: 'korean_content' | 'business' | 'general' | 'unknown';
} {
  const recentMessages = history.slice(-6); // Last 6 messages
  const recentTitles: string[] = [];
  let hasRecentSearch = false;
  let koreanContentMentions = 0;
  let businessMentions = 0;

  for (const msg of recentMessages) {
    // Extract quoted titles
    const quotedTitles = msg.content.match(/"([^"]+)"/g);
    if (quotedTitles) {
      quotedTitles.forEach(qt => {
        const title = qt.replace(/"/g, '');
        if (title.length > 3 && !recentTitles.includes(title)) {
          recentTitles.push(title);
        }
      });
    }

    // Check for search indicators
    if (msg.role === 'assistant') {
      if (msg.content.includes('match') || msg.content.includes('found') || msg.content.includes('recommend')) {
        hasRecentSearch = true;
      }
    }

    // Count topic indicators
    const lowerContent = msg.content.toLowerCase();
    if (lowerContent.includes('webtoon') || lowerContent.includes('manhwa') || lowerContent.includes('k-drama') || lowerContent.includes('korean')) {
      koreanContentMentions++;
    }
    if (lowerContent.includes('development') || lowerContent.includes('acquisition') || lowerContent.includes('licensing') || lowerContent.includes('rights')) {
      businessMentions++;
    }
  }

  let conversationTopic: 'korean_content' | 'business' | 'general' | 'unknown' = 'unknown';
  if (koreanContentMentions >= 2) conversationTopic = 'korean_content';
  else if (businessMentions >= 2) conversationTopic = 'business';
  else if (history.length > 2) conversationTopic = 'general';

  return {
    hasRecentSearch,
    recentTitles: recentTitles.slice(0, 5),
    conversationTopic
  };
}

// =====================================================================
// MAIN DETECTION FUNCTION
// =====================================================================

/**
 * Detect user intent from query and conversation history.
 * Uses pattern-based detection with confidence scoring.
 *
 * @param query - The user's current query
 * @param conversationHistory - Previous messages in the conversation
 * @returns IntentDetectionResult with level1/level2 intent, confidence, and extracted entities
 */
export function detectIntent(
  query: string,
  conversationHistory: ChatMessage[] = []
): IntentDetectionResult {
  const trimmedQuery = query.trim();
  const context = analyzeConversationContext(conversationHistory);

  // ========== CONVERSATION INTENTS (check first - fast exit) ==========

  // Greeting
  if (matchGreeting(trimmedQuery)) {
    return {
      level1: 'conversation',
      level2: 'greeting',
      confidence: 0.95,
      searchEngine: null,
      extractedEntities: {},
      reasoning: 'Matched greeting pattern'
    };
  }

  // Follow-up chat (thanks, got it, etc.)
  if (matchFollowUpChat(trimmedQuery)) {
    return {
      level1: 'conversation',
      level2: 'follow_up_chat',
      confidence: 0.90,
      searchEngine: null,
      extractedEntities: {},
      reasoning: 'Matched follow-up chat pattern'
    };
  }

  // Clarification
  if (matchClarification(trimmedQuery)) {
    return {
      level1: 'conversation',
      level2: 'clarification',
      confidence: 0.90,
      searchEngine: null,
      extractedEntities: {},
      reasoning: 'Matched clarification pattern'
    };
  }

  // General question (how does licensing work, etc.)
  if (matchGeneralQuestion(trimmedQuery)) {
    return {
      level1: 'conversation',
      level2: 'general_question',
      confidence: 0.88,
      searchEngine: null,
      extractedEntities: {},
      reasoning: 'Matched general question pattern'
    };
  }

  // Off-topic
  if (matchOffTopic(trimmedQuery)) {
    return {
      level1: 'conversation',
      level2: 'off_topic',
      confidence: 0.85,
      searchEngine: null,
      extractedEntities: {},
      reasoning: 'Matched off-topic pattern'
    };
  }

  // ========== TITLE SEARCH INTENTS ==========

  // PRIORITY 1: Comp-based (highest value routing)
  const compResult = matchCompBased(trimmedQuery);
  if (compResult.matched && compResult.confidence >= 0.80) {
    return {
      level1: 'title_search',
      level2: 'comp_based',
      confidence: compResult.confidence,
      searchEngine: 'comps',
      extractedEntities: compResult.entities,
      reasoning: `Matched comp-based pattern with titles: ${compResult.entities.compTitles?.join(', ')}`
    };
  }

  // PRIORITY 2: Mandate-based (business intent)
  const mandateResult = matchMandateBased(trimmedQuery);
  if (mandateResult.matched && mandateResult.confidence >= 0.75) {
    return {
      level1: 'title_search',
      level2: 'mandate_based',
      confidence: mandateResult.confidence,
      searchEngine: 'mandate',
      extractedEntities: mandateResult.entities,
      reasoning: 'Matched mandate-based pattern with business keywords'
    };
  }

  // PRIORITY 3: Comparison (specific titles)
  const comparisonResult = matchComparison(trimmedQuery);
  if (comparisonResult.matched) {
    return {
      level1: 'title_search',
      level2: 'comparison',
      confidence: comparisonResult.confidence,
      searchEngine: 'vector',
      extractedEntities: comparisonResult.entities,
      reasoning: 'Matched comparison pattern'
    };
  }

  // PRIORITY 4: Information request (single title focus)
  const infoResult = matchInformation(trimmedQuery);
  if (infoResult.matched) {
    return {
      level1: 'title_search',
      level2: 'information',
      confidence: infoResult.confidence,
      searchEngine: 'vector',
      extractedEntities: infoResult.entities,
      reasoning: `Matched information pattern for title: ${infoResult.entities.targetTitle}`
    };
  }

  // PRIORITY 5: Discovery (browse/explore)
  const discoveryResult = matchDiscovery(trimmedQuery);
  if (discoveryResult.matched) {
    return {
      level1: 'title_search',
      level2: 'discovery',
      confidence: discoveryResult.confidence,
      searchEngine: 'vector',
      extractedEntities: discoveryResult.entities,
      reasoning: 'Matched discovery pattern'
    };
  }

  // ========== FALLBACK LOGIC ==========

  // If conversation has recent search context and query is short, might be follow-up
  if (context.hasRecentSearch && trimmedQuery.length < 50 && conversationHistory.length >= 2) {
    // Check if it could be a follow-up about recent titles
    const lowerQuery = trimmedQuery.toLowerCase();
    const followUpIndicators = ['more', 'another', 'similar', 'also', 'what about', 'how about', 'the first', 'the second', 'that one'];

    if (followUpIndicators.some(ind => lowerQuery.includes(ind))) {
      return {
        level1: 'title_search',
        level2: 'discovery', // Treat as discovery for follow-ups
        confidence: 0.70,
        searchEngine: 'vector',
        extractedEntities: {
          searchQuery: trimmedQuery,
          compTitles: context.recentTitles.slice(0, 2) // Include recent titles for context
        },
        reasoning: 'Follow-up query in search context'
      };
    }
  }

  // Default: Assume discovery intent for queries that look like content requests
  const contentKeywords = [
    'webtoon', 'manhwa', 'webnovel', 'drama', 'k-drama', 'korean',
    'romance', 'action', 'thriller', 'fantasy', 'horror', 'comedy',
    'story', 'series', 'title', 'content'
  ];

  const lowerQuery = trimmedQuery.toLowerCase();
  const hasContentKeyword = contentKeywords.some(kw => lowerQuery.includes(kw));

  if (hasContentKeyword || trimmedQuery.length > 20) {
    return {
      level1: 'title_search',
      level2: 'discovery',
      confidence: hasContentKeyword ? 0.70 : 0.55,
      searchEngine: 'vector',
      extractedEntities: { searchQuery: trimmedQuery },
      reasoning: hasContentKeyword
        ? 'Contains content keywords, assuming discovery'
        : 'Longer query, defaulting to discovery search'
    };
  }

  // Very short, ambiguous query - default to conversation
  return {
    level1: 'conversation',
    level2: 'general_question',
    confidence: 0.50,
    searchEngine: null,
    extractedEntities: {},
    reasoning: 'Short ambiguous query, defaulting to conversation'
  };
}

/**
 * Get a human-readable description of the detected intent
 */
export function getIntentDescription(result: IntentDetectionResult): string {
  const engineDesc = result.searchEngine
    ? ` → routing to ${result.searchEngine} engine`
    : ' → no search needed';

  return `[${result.level1}/${result.level2}] (${Math.round(result.confidence * 100)}% confidence)${engineDesc}`;
}
